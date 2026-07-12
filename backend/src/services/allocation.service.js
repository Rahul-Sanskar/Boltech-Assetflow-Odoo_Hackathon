const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const {
  ASSET_STATUS,
  ALLOCATION_STATUS,
  NON_ALLOCATABLE
} = require("../constants/assetStates");
const { writeActivityLog, createNotification } = require("./activity.service");

async function findActiveAllocation(tx, assetId) {
  return tx.allocation.findFirst({
    where: { assetId: Number(assetId), status: ALLOCATION_STATUS.ALLOCATED }
  });
}

/**
 * Allocate an available asset to an employee.
 * Enforces one active allocation per asset (409 on conflict).
 */
async function allocateAsset({ assetId, employeeId, expectedReturn, actorUserId }) {
  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (asset.status !== ASSET_STATUS.AVAILABLE || NON_ALLOCATABLE.has(asset.status)) {
    if (asset.status === ASSET_STATUS.ALLOCATED) {
      throw new AppError("Asset is already allocated", 409);
    }
    throw new AppError("Asset is not available for allocation", 400);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: Number(employeeId) },
    include: { user: { select: { id: true } } }
  });
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    const locked = await tx.asset.findUnique({ where: { id: Number(assetId) } });
    if (!locked || locked.status !== ASSET_STATUS.AVAILABLE) {
      if (locked && locked.status === ASSET_STATUS.ALLOCATED) {
        throw new AppError("Asset is already allocated", 409);
      }
      throw new AppError("Asset is not available for allocation", 400);
    }

    const existing = await findActiveAllocation(tx, assetId);
    if (existing) {
      throw new AppError("Asset is already allocated", 409);
    }

    const allocation = await tx.allocation.create({
      data: {
        assetId: Number(assetId),
        employeeId: Number(employeeId),
        expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
        status: ALLOCATION_STATUS.ALLOCATED
      }
    });

    await tx.asset.update({
      where: { id: Number(assetId) },
      data: { status: ASSET_STATUS.ALLOCATED, employeeId: Number(employeeId) }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "ALLOCATE",
      entity: "Allocation",
      entityId: allocation.id,
      details: `Asset ${assetId} allocated to employee ${employeeId}`
    });

    if (employee.user?.id) {
      await createNotification(tx, {
        userId: employee.user.id,
        type: "Asset Assigned",
        message: `Asset "${locked.name}" has been allocated to you`
      });
    }

    return allocation;
  });
}

/**
 * Return an active allocation. Preserves history (soft-close only).
 * If the asset is under maintenance, custody is cleared but status stays Under Maintenance.
 */
async function returnAsset({ allocationId, returnNotes, actorUserId }) {
  const allocation = await prisma.allocation.findUnique({
    where: { id: Number(allocationId) },
    include: { asset: true, employee: { include: { user: { select: { id: true } } } } }
  });

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  if (allocation.status !== ALLOCATION_STATUS.ALLOCATED) {
    throw new AppError("Allocation already returned", 400);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.allocation.findUnique({
      where: { id: allocation.id },
      include: { asset: true }
    });

    if (!current || current.status !== ALLOCATION_STATUS.ALLOCATED) {
      throw new AppError("Allocation already returned", 400);
    }

    const updated = await tx.allocation.update({
      where: { id: current.id },
      data: {
        status: ALLOCATION_STATUS.RETURNED,
        returnedDate: new Date(),
        returnNotes: returnNotes || null
      }
    });

    const underMaintenance = current.asset.status === ASSET_STATUS.UNDER_MAINTENANCE;
    await tx.asset.update({
      where: { id: current.assetId },
      data: {
        status: underMaintenance ? ASSET_STATUS.UNDER_MAINTENANCE : ASSET_STATUS.AVAILABLE,
        employeeId: null
      }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "RETURN",
      entity: "Allocation",
      entityId: updated.id,
      details: `Asset ${current.assetId} returned`
    });

    return updated;
  });
}

module.exports = {
  allocateAsset,
  returnAsset,
  findActiveAllocation
};
