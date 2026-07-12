/**
 * Phase 2 workflow integrity regression checks.
 * Creates temporary assets, exercises workflows, asserts invariants, then cleans up.
 *
 * Usage: node scripts/phase2-verify.js
 */
require("dotenv").config();
const prisma = require("../src/config/db");
const allocationService = require("../src/services/allocation.service");
const transferService = require("../src/services/transfer.service");
const maintenanceService = require("../src/services/maintenance.service");
const bookingService = require("../src/services/booking.service");
const assetService = require("../src/services/asset.service");

const results = [];
let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed += 1;
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, err) {
  failed += 1;
  const detail = err?.message || String(err);
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name} — ${detail}`);
}

async function expectError(fn, statusCode) {
  try {
    await fn();
    throw new Error("Expected error was not thrown");
  } catch (err) {
    if (err.message === "Expected error was not thrown") throw err;
    if (statusCode && err.statusCode !== statusCode) {
      throw new Error(`Expected status ${statusCode}, got ${err.statusCode}: ${err.message}`);
    }
    return err;
  }
}

async function dashboardCounts(departmentId) {
  const where = { departmentId };
  const [available, allocated, underMaintenance] = await Promise.all([
    prisma.asset.count({ where: { ...where, status: "Available" } }),
    prisma.asset.count({ where: { ...where, status: "Allocated" } }),
    prisma.asset.count({ where: { ...where, status: "Under Maintenance" } })
  ]);
  return { available, allocated, underMaintenance };
}

async function main() {
  console.log("\nPhase 2 — Core Workflow Integrity\n");

  const dept = await prisma.department.findFirst();
  const category = await prisma.category.findFirst();
  const employees = await prisma.employee.findMany({ take: 2, orderBy: { id: "asc" } });
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!dept || !category || employees.length < 2 || !adminUser) {
    throw new Error("Seed data incomplete — run npm run seed first");
  }

  const [empA, empB] = employees;
  const tag = `P2-${Date.now()}`;
  const cleanupAssetIds = [];

  async function makeAsset(overrides = {}) {
    const asset = await prisma.asset.create({
      data: {
        name: `Phase2 Test ${tag}`,
        assetTag: `${tag}-${cleanupAssetIds.length + 1}`,
        status: "Available",
        departmentId: dept.id,
        categoryId: category.id,
        isBookable: true,
        ...overrides
      }
    });
    cleanupAssetIds.push(asset.id);
    return asset;
  }

  try {
    // ── Scenario 1: Register → Allocate → Return ──────────────────────────
    console.log("1) Register → Allocate → Return");
    {
      const asset = await makeAsset();
      const before = await dashboardCounts(dept.id);

      const allocation = await allocationService.allocateAsset({
        assetId: asset.id,
        employeeId: empA.id,
        actorUserId: adminUser.id
      });

      const afterAlloc = await prisma.asset.findUnique({ where: { id: asset.id } });
      if (afterAlloc.status !== "Allocated" || afterAlloc.employeeId !== empA.id) {
        throw new Error("Asset not Allocated after allocate");
      }
      ok("Allocate sets Allocated + holder");

      const mid = await dashboardCounts(dept.id);
      if (mid.allocated !== before.allocated + 1 || mid.available !== before.available - 1) {
        throw new Error(`Dashboard mismatch after allocate: ${JSON.stringify({ before, mid })}`);
      }
      ok("Dashboard: allocated +1 / available -1");

      await expectError(
        () =>
          allocationService.allocateAsset({
            assetId: asset.id,
            employeeId: empB.id,
            actorUserId: adminUser.id
          }),
        409
      );
      ok("Duplicate allocate returns 409");

      await allocationService.returnAsset({
        allocationId: allocation.id,
        returnNotes: "ok",
        actorUserId: adminUser.id
      });

      const afterReturn = await prisma.asset.findUnique({ where: { id: asset.id } });
      const closed = await prisma.allocation.findUnique({ where: { id: allocation.id } });
      if (afterReturn.status !== "Available" || afterReturn.employeeId !== null) {
        throw new Error("Asset not Available after return");
      }
      if (closed.status !== "Returned" || !closed.returnedDate) {
        throw new Error("Allocation history not preserved correctly");
      }
      ok("Return closes allocation and restores Available");

      const after = await dashboardCounts(dept.id);
      if (after.available !== before.available || after.allocated !== before.allocated) {
        throw new Error(`Dashboard not restored after return: ${JSON.stringify({ before, after })}`);
      }
      ok("Dashboard restored after return");
    }

    // ── Scenario 2: Allocate → Transfer ───────────────────────────────────
    console.log("\n2) Allocate → Transfer (close old / create new)");
    {
      const asset = await makeAsset();
      const allocation = await allocationService.allocateAsset({
        assetId: asset.id,
        employeeId: empA.id,
        actorUserId: adminUser.id
      });

      const transfer = await transferService.createTransfer({
        assetId: asset.id,
        requestedById: empB.id
      });

      await transferService.approveTransfer({
        transferId: transfer.id,
        actorUserId: adminUser.id
      });

      const oldAlloc = await prisma.allocation.findUnique({ where: { id: allocation.id } });
      const active = await prisma.allocation.findMany({
        where: { assetId: asset.id, status: "Allocated" }
      });
      const updatedAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
      const updatedTransfer = await prisma.transferRequest.findUnique({ where: { id: transfer.id } });

      if (oldAlloc.status !== "Returned") throw new Error("Old allocation not closed");
      if (active.length !== 1) throw new Error(`Expected 1 active allocation, got ${active.length}`);
      if (active[0].employeeId !== empB.id) throw new Error("New allocation holder incorrect");
      if (updatedAsset.employeeId !== empB.id) throw new Error("Asset ownership not updated");
      if (updatedTransfer.status !== "Approved") throw new Error("Transfer not Approved");
      ok("Transfer closes old allocation, creates new, updates ownership");

      await expectError(
        () =>
          transferService.approveTransfer({
            transferId: transfer.id,
            actorUserId: adminUser.id
          }),
        400
      );
      ok("Re-approving transfer rejected");

      // Lost asset cannot be transferred
      const lostAsset = await makeAsset({ status: "Lost" });
      await expectError(
        () =>
          transferService.createTransfer({
            assetId: lostAsset.id,
            requestedById: empA.id
          }),
        400
      );
      ok("Cannot transfer Lost asset");
    }

    // ── Scenario 3: Allocate → Maintenance → Resolve ──────────────────────
    console.log("\n3) Allocate → Maintenance → Resolve (custody preserved)");
    {
      const asset = await makeAsset();
      await allocationService.allocateAsset({
        assetId: asset.id,
        employeeId: empA.id,
        actorUserId: adminUser.id
      });

      const beforeMaint = await dashboardCounts(dept.id);

      const request = await maintenanceService.createMaintenance({
        assetId: asset.id,
        requestedById: empA.id,
        description: "Screen flicker",
        actorUserId: adminUser.id
      });

      const stillAllocated = await prisma.asset.findUnique({ where: { id: asset.id } });
      if (stillAllocated.status !== "Allocated") {
        throw new Error("Create maintenance must not change asset status");
      }
      if (request.status !== "Pending") throw new Error("Request should be Pending");
      ok("Create maintenance leaves asset Allocated / request Pending");

      await maintenanceService.updateMaintenance({
        requestId: request.id,
        status: "Approved",
        actorUserId: adminUser.id
      });

      const under = await prisma.asset.findUnique({ where: { id: asset.id } });
      if (under.status !== "Under Maintenance") throw new Error("Approve should set Under Maintenance");
      if (under.employeeId !== empA.id) throw new Error("Approval overwrote custody");
      ok("Approve → Under Maintenance, custody preserved");

      const mid = await dashboardCounts(dept.id);
      if (mid.underMaintenance !== beforeMaint.underMaintenance + 1) {
        throw new Error("Maintenance dashboard count did not increase");
      }
      ok("Dashboard: maintenance count +1");

      await maintenanceService.updateMaintenance({
        requestId: request.id,
        status: "Resolved",
        actorUserId: adminUser.id
      });

      const restored = await prisma.asset.findUnique({ where: { id: asset.id } });
      const active = await prisma.allocation.findFirst({
        where: { assetId: asset.id, status: "Allocated" }
      });
      if (restored.status !== "Allocated") throw new Error("Should restore Allocated when custody exists");
      if (restored.employeeId !== empA.id) throw new Error("Custody lost on resolve");
      if (!active) throw new Error("Active allocation missing after resolve");
      ok("Resolve with active allocation → Allocated");

      await expectError(
        () =>
          maintenanceService.updateMaintenance({
            requestId: request.id,
            status: "Approved",
            actorUserId: adminUser.id
          }),
        400
      );
      ok("Resolve already-resolved rejected");

      // Resolve without allocation → Available
      const asset2 = await makeAsset();
      const req2 = await maintenanceService.createMaintenance({
        assetId: asset2.id,
        requestedById: empA.id,
        description: "No custody case",
        actorUserId: adminUser.id
      });
      await maintenanceService.updateMaintenance({
        requestId: req2.id,
        status: "Approved",
        actorUserId: adminUser.id
      });
      await maintenanceService.updateMaintenance({
        requestId: req2.id,
        status: "Resolved",
        actorUserId: adminUser.id
      });
      const a2 = await prisma.asset.findUnique({ where: { id: asset2.id } });
      if (a2.status !== "Available") throw new Error("Resolve without allocation should → Available");
      ok("Resolve without allocation → Available");
    }

    // ── Scenario 4: Booking overlap ───────────────────────────────────────
    console.log("\n4) Booking overlap / adjacent / blocked statuses");
    {
      const asset = await makeAsset({ isBookable: true });
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      const s1 = new Date(day.getTime() + 9 * 3600000);
      const e1 = new Date(day.getTime() + 10 * 3600000);
      const s2 = new Date(day.getTime() + 10 * 3600000);
      const e2 = new Date(day.getTime() + 11 * 3600000);
      const sOverlap = new Date(day.getTime() + 9.5 * 3600000);

      await bookingService.createBooking({
        assetId: asset.id,
        employeeId: empA.id,
        startTime: s1.toISOString(),
        endTime: e1.toISOString(),
        actorUserId: adminUser.id
      });
      ok("First booking created");

      await bookingService.createBooking({
        assetId: asset.id,
        employeeId: empB.id,
        startTime: s2.toISOString(),
        endTime: e2.toISOString(),
        actorUserId: adminUser.id
      });
      ok("Adjacent booking (touching boundary) accepted");

      await expectError(
        () =>
          bookingService.createBooking({
            assetId: asset.id,
            employeeId: empA.id,
            startTime: sOverlap.toISOString(),
            endTime: e2.toISOString(),
            actorUserId: adminUser.id
          }),
        409
      );
      ok("Overlapping booking rejected with 409");

      const retired = await makeAsset({ status: "Retired", isBookable: true });
      await expectError(
        () =>
          bookingService.createBooking({
            assetId: retired.id,
            employeeId: empA.id,
            startTime: new Date(day.getTime() + 12 * 3600000).toISOString(),
            endTime: new Date(day.getTime() + 13 * 3600000).toISOString(),
            actorUserId: adminUser.id
          }),
        400
      );
      ok("Cannot book Retired asset");
    }

    // ── Scenario 5: Lifecycle transitions ─────────────────────────────────
    console.log("\n5) Asset lifecycle transitions");
    {
      const asset = await makeAsset();
      await assetService.updateAsset({
        assetId: asset.id,
        patch: { status: "Retired" },
        actorUserId: adminUser.id
      });
      ok("Available → Retired");

      await assetService.updateAsset({
        assetId: asset.id,
        patch: { status: "Disposed" },
        actorUserId: adminUser.id
      });
      ok("Retired → Disposed");

      await expectError(
        () =>
          assetService.updateAsset({
            assetId: asset.id,
            patch: { status: "Available" },
            actorUserId: adminUser.id
          }),
        400
      );
      ok("Disposed → Available rejected");

      const reserved = await makeAsset();
      await assetService.updateAsset({
        assetId: reserved.id,
        patch: { status: "Reserved" },
        actorUserId: adminUser.id
      });
      await assetService.updateAsset({
        assetId: reserved.id,
        patch: { status: "Available" },
        actorUserId: adminUser.id
      });
      ok("Available → Reserved → Available");

      await expectError(
        () =>
          allocationService.allocateAsset({
            assetId: asset.id,
            employeeId: empA.id,
            actorUserId: adminUser.id
          }),
        400
      );
      ok("Cannot allocate Disposed asset");
    }

    // ── Scenario 6: No duplicate active allocations / orphans ─────────────
    console.log("\n6) Consistency invariants");
    {
      const duplicates = await prisma.$queryRaw`
        SELECT "assetId", COUNT(*)::int AS cnt
        FROM "Allocation"
        WHERE status = 'Allocated'
        GROUP BY "assetId"
        HAVING COUNT(*) > 1
      `;
      if (duplicates.length > 0) {
        throw new Error(`Duplicate active allocations: ${JSON.stringify(duplicates)}`);
      }
      ok("No duplicate active allocations in DB");

      const orphans = await prisma.$queryRaw`
        SELECT a.id
        FROM "Asset" a
        WHERE a.status = 'Allocated'
          AND NOT EXISTS (
            SELECT 1 FROM "Allocation" al
            WHERE al."assetId" = a.id AND al.status = 'Allocated'
          )
      `;
      if (orphans.length > 0) {
        throw new Error(`Orphan Allocated assets without active allocation: ${JSON.stringify(orphans)}`);
      }
      ok("No Allocated assets without active allocation");
    }
  } catch (err) {
    fail("Unhandled scenario failure", err);
  } finally {
    // Cleanup temporary test data (children first)
    if (cleanupAssetIds.length) {
      const allocations = await prisma.allocation.findMany({
        where: { assetId: { in: cleanupAssetIds } },
        select: { id: true }
      });
      const transfers = await prisma.transferRequest.findMany({
        where: { assetId: { in: cleanupAssetIds } },
        select: { id: true }
      });
      const maintenance = await prisma.maintenanceRequest.findMany({
        where: { assetId: { in: cleanupAssetIds } },
        select: { id: true }
      });
      const bookings = await prisma.booking.findMany({
        where: { assetId: { in: cleanupAssetIds } },
        select: { id: true }
      });

      const logFilters = [
        { entity: "Asset", entityId: { in: cleanupAssetIds } },
        { entity: "Allocation", entityId: { in: allocations.map((a) => a.id) } },
        { entity: "TransferRequest", entityId: { in: transfers.map((t) => t.id) } },
        { entity: "MaintenanceRequest", entityId: { in: maintenance.map((m) => m.id) } },
        { entity: "Booking", entityId: { in: bookings.map((b) => b.id) } }
      ].filter((f) => !f.entityId.in || f.entityId.in.length > 0);

      if (logFilters.length) {
        await prisma.activityLog.deleteMany({ where: { OR: logFilters } });
      }

      await prisma.booking.deleteMany({ where: { assetId: { in: cleanupAssetIds } } });
      await prisma.maintenanceRequest.deleteMany({ where: { assetId: { in: cleanupAssetIds } } });
      await prisma.transferRequest.deleteMany({ where: { assetId: { in: cleanupAssetIds } } });
      await prisma.allocation.deleteMany({ where: { assetId: { in: cleanupAssetIds } } });
      await prisma.asset.deleteMany({ where: { id: { in: cleanupAssetIds } } });
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
