/**
 * Phase 3 — Database & infrastructure verification.
 *
 * Checks:
 *  - Required environment variables
 *  - Database connectivity
 *  - Migration status / schema drift
 *  - Seed coverage (demo data present)
 *  - Key database constraints / indexes
 *  - Application module load + health path
 *
 * Usage: npm run verify:phase3
 */
require("dotenv").config();

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const results = [];
let passed = 0;
let failed = 0;

function ok(name, detail = "") {
  passed += 1;
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  failed += 1;
  results.push({ name, ok: false, detail });
  console.log(`  ✗ ${name} — ${detail}`);
}

function run(cmd) {
  return execSync(cmd, {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

async function main() {
  console.log("\nPhase 3 — Database & Infrastructure Stabilization\n");

  // ── 1. Environment ──────────────────────────────────────────────────────
  console.log("1) Environment configuration");
  const examplePath = path.join(__dirname, "..", ".env.example");
  if (fs.existsSync(examplePath)) {
    ok(".env.example exists");
  } else {
    fail(".env.example exists", "file missing");
  }

  const required = ["DATABASE_URL", "JWT_SECRET"];
  for (const key of required) {
    if (process.env[key] && String(process.env[key]).trim() !== "") {
      ok(`${key} is set`);
    } else {
      fail(`${key} is set`, "missing or empty");
    }
  }

  if (process.env.JWT_SECRET === "supersecretkey") {
    fail("JWT_SECRET is not the insecure legacy default", "still using supersecretkey");
  } else if (process.env.JWT_SECRET) {
    ok("JWT_SECRET is not the insecure legacy default");
  }

  try {
    const { getConfig } = require("../src/config/env");
    const cfg = getConfig();
    ok("env config loads", `PORT=${cfg.port}, NODE_ENV=${cfg.nodeEnv}`);
  } catch (err) {
    fail("env config loads", err.message);
  }

  // ── 2. Database connection ──────────────────────────────────────────────
  console.log("\n2) Database connection");
  let prisma;
  try {
    prisma = require("../src/config/db");
    await prisma.$queryRaw`SELECT 1`;
    ok("Database accepts connections");
  } catch (err) {
    fail("Database accepts connections", err.message);
    console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
    process.exitCode = 1;
    return;
  }

  // ── 3. Migrations & schema drift ────────────────────────────────────────
  console.log("\n3) Migrations & schema consistency");
  try {
    const status = run("npx prisma migrate status");
    if (/Database schema is up to date/i.test(status) || /No pending migrations/i.test(status)) {
      ok("prisma migrate status — no pending migrations");
    } else if (/following migration|have not yet been applied/i.test(status)) {
      fail("prisma migrate status — no pending migrations", status.trim().slice(0, 200));
    } else {
      ok("prisma migrate status ran", status.trim().split("\n").slice(-2).join(" "));
    }
  } catch (err) {
    const msg = err.stderr || err.stdout || err.message;
    fail("prisma migrate status", String(msg).slice(0, 300));
  }

  try {
    // Compare the live database to schema.prisma (does NOT use a destructive shadow DB).
    // Extra DB-only constraints (partial unique / CHECKs) appear as DROP statements — ignore those.
    const drift = run(
      `npx prisma migrate diff --from-url "${process.env.DATABASE_URL}" --to-schema-datamodel prisma/schema.prisma --script`
    );
    const trimmed = (drift || "").trim();
    if (!trimmed) {
      ok("No schema drift (database ↔ schema.prisma)");
    } else {
      const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
      const meaningful = lines.filter((l) => {
        if (l.startsWith("--")) return false;
        // Intentional DB-only constraints from baseline migration (not modeled in Prisma)
        if (/Allocation_one_active_per_asset_uidx/i.test(l)) return false;
        if (/Booking_time_range_check/i.test(l)) return false;
        if (/AuditCycle_date_range_check/i.test(l)) return false;
        if (/^DROP (INDEX|CONSTRAINT)/i.test(l) && /one_active_per_asset|time_range_check|date_range_check/i.test(l)) {
          return false;
        }
        return true;
      });

      // Also ignore DROP INDEX/CONSTRAINT blocks that only target our intentional extras
      const filtered = [];
      for (let i = 0; i < meaningful.length; i += 1) {
        const line = meaningful[i];
        if (
          /^DROP (INDEX|CONSTRAINT)/i.test(line) &&
          /one_active_per_asset|time_range_check|date_range_check/i.test(line)
        ) {
          continue;
        }
        filtered.push(line);
      }

      if (filtered.length === 0) {
        ok("No schema drift (database ↔ schema.prisma)", "ignoring intentional DB-only constraints");
      } else {
        fail("No schema drift (database ↔ schema.prisma)", filtered.join(" ").slice(0, 240));
      }
    }
  } catch (err) {
    const msg = String(err.stderr || err.message || "");
    fail("Schema drift check", msg.slice(0, 300));
  }

  // Confirm baseline migration folder exists
  const migDir = path.join(__dirname, "..", "prisma", "migrations");
  const migrations = fs
    .readdirSync(migDir)
    .filter((d) => fs.statSync(path.join(migDir, d)).isDirectory());
  if (migrations.length >= 1) {
    ok("Migration folders present", migrations.join(", "));
  } else {
    fail("Migration folders present", "none found");
  }

  // ── 4. Required tables ──────────────────────────────────────────────────
  console.log("\n4) Schema tables present");
  const tables = [
    "User",
    "Department",
    "Category",
    "Employee",
    "Asset",
    "Allocation",
    "TransferRequest",
    "Booking",
    "MaintenanceRequest",
    "AuditCycle",
    "AuditAssignment",
    "AuditItem",
    "Notification",
    "ActivityLog"
  ];
  try {
    const rows = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `;
    const names = new Set(rows.map((r) => r.tablename));
    const missing = tables.filter((t) => !names.has(t));
    if (missing.length === 0) {
      ok("All expected tables exist", `${tables.length} tables`);
    } else {
      fail("All expected tables exist", `missing: ${missing.join(", ")}`);
    }
  } catch (err) {
    fail("All expected tables exist", err.message);
  }

  // ── 5. Constraints / indexes ────────────────────────────────────────────
  console.log("\n5) Database constraints");
  try {
    const idx = await prisma.$queryRaw`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'Allocation_one_active_per_asset_uidx'
    `;
    if (idx.length > 0) {
      ok("Partial unique index: one active allocation per asset");
    } else {
      fail("Partial unique index: one active allocation per asset", "index missing");
    }
  } catch (err) {
    fail("Partial unique index: one active allocation per asset", err.message);
  }

  try {
    const uq = await prisma.$queryRaw`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'AuditAssignment_auditCycleId_auditorId_key',
          'AuditItem_auditCycleId_assetId_key'
        )
    `;
    if (uq.length >= 2) {
      ok("Audit join uniqueness constraints present");
    } else {
      fail("Audit join uniqueness constraints present", `found ${uq.length}/2`);
    }
  } catch (err) {
    fail("Audit join uniqueness constraints present", err.message);
  }

  try {
    const checks = await prisma.$queryRaw`
      SELECT conname FROM pg_constraint
      WHERE conname IN ('Booking_time_range_check', 'AuditCycle_date_range_check')
    `;
    if (checks.length >= 2) {
      ok("CHECK constraints on booking/audit date ranges");
    } else {
      fail("CHECK constraints on booking/audit date ranges", `found ${checks.length}/2`);
    }
  } catch (err) {
    fail("CHECK constraints on booking/audit date ranges", err.message);
  }

  // ── 6. Seed coverage ────────────────────────────────────────────────────
  console.log("\n6) Seed / demo data coverage");
  try {
    const counts = {
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      categories: await prisma.category.count(),
      employees: await prisma.employee.count(),
      assets: await prisma.asset.count(),
      allocations: await prisma.allocation.count(),
      transfers: await prisma.transferRequest.count(),
      bookings: await prisma.booking.count(),
      maintenance: await prisma.maintenanceRequest.count(),
      audits: await prisma.auditCycle.count(),
      notifications: await prisma.notification.count(),
      activityLogs: await prisma.activityLog.count()
    };

    // After phase2 regression, notification counts may grow; require baseline coverage only.
    const expectations = [
      ["users", 4],
      ["departments", 3],
      ["categories", 3],
      ["employees", 4],
      ["assets", 5],
      ["allocations", 1],
      ["transfers", 1],
      ["bookings", 1],
      ["maintenance", 1],
      ["audits", 1],
      ["notifications", 1],
      ["activityLogs", 1]
    ];

    let seedOk = true;
    for (const [key, min] of expectations) {
      if (counts[key] >= min) {
        ok(`Seed has ${key}`, `count=${counts[key]}`);
      } else {
        fail(`Seed has ${key}`, `count=${counts[key]}, expected >= ${min}`);
        seedOk = false;
      }
    }

    if (!seedOk) {
      console.log("  hint: run `npx prisma db seed`");
    }
  } catch (err) {
    fail("Seed coverage queries", err.message);
  }

  // ── 7. Application startup surface ──────────────────────────────────────
  console.log("\n7) Application modules");
  try {
    require("../src/app");
    ok("Express app module loads");
  } catch (err) {
    fail("Express app module loads", err.message);
  }

  try {
    const readme = path.join(__dirname, "..", "README.md");
    if (fs.existsSync(readme) && fs.readFileSync(readme, "utf8").includes("migrate deploy")) {
      ok("Backend README documents setup");
    } else {
      fail("Backend README documents setup", "README missing or incomplete");
    }
  } catch (err) {
    fail("Backend README documents setup", err.message);
  }

  // ── Report ──────────────────────────────────────────────────────────────
  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    console.log("Phase 3 verification FAILED.");
    process.exitCode = 1;
  } else {
    console.log("Phase 3 verification PASSED.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  try {
    const prisma = require("../src/config/db");
    await prisma.$disconnect();
  } catch (_) {
    /* ignore */
  }
});
