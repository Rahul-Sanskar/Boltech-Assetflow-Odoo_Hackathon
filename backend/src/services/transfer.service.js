const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const {
  ASSET_STATUS,
  ALLOCATION_STATUS,
  TRANSFER_STATUS,
  NON_TRANSFERABLE
} = require("../constants/assetStates");
const { writeActivityLog, createNotification } = require("./activity.service");
const { findActiveAllocation } = require("./allocation.service");

/**
 * Create a transfer request for an allocated asset.
 */
async function createTransfer({ assetId, requestedById }) {
  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (NON_TRANSFERABLE.has(asset.status)) {
    throw new AppError(`Cannot transfer asset with status "${asset.status}"`, 400);
  }

  if (asset.status !== ASSET_STATUS.ALLOCATED && asset.status !== ASSET_STATUS.UNDER_MAINTENANCE) {
    throw new AppError("Only allocated assets can be transferred", 400);
  }

  const active = await prisma.allocation.findFirst({
    where: { assetId: Number(assetId), status: ALLOCATION_STATUS.ALLOCATED }
  });
  if (!active) {
    throw new AppError("Asset has no active allocation to transfer", 400);
  }

  if (active.employeeId === Number(requestedById)) {
    throw new AppError("Asset is already allocated to this employee", 400);
  }

  const requester = await prisma.employee.findUnique({ where: { id: Number(requestedById) } });
  if (!requester) {
    throw new AppError("Requester employee not found", 404);
  }

  return prisma.transferRequest.create({
    data: {
      assetId: Number(assetId),
      requestedById: Number(requestedById),
      status: TRANSFER_STATUS.REQUESTED
    }
  });
}

/**
 * Approve transfer inside a single transaction:
 * validate → close old allocation → create new → update ownership → update transfer → log/notify
 */
async function approveTransfer({ transferId, actorUserId }) {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: Number(transferId) },
    include: {
      asset: true,
      requestedBy: { include: { user: { select: { id: true } } } }
    }
  });

  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }

  if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
    throw new AppError("Transfer not found or already processed", 400);
  }

  if (NON_TRANSFERABLE.has(transfer.asset.status)) {
    throw new AppError(`Cannot transfer asset with status "${transfer.asset.status}"`, 400);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.transferRequest.findUnique({
      where: { id: transfer.id },
      include: { asset: true, requestedBy: { include: { user: { select: { id: true } } } } }
    });

    if (!current || current.status !== TRANSFER_STATUS.REQUESTED) {
      throw new AppError("Transfer not found or already processed", 400);
    }

    if (NON_TRANSFERABLE.has(current.asset.status)) {
      throw new AppError(`Cannot transfer asset with status "${current.asset.status}"`, 400);
    }

    const activeAllocation = await findActiveAllocation(tx, current.assetId);
    if (!activeAllocation) {
      throw new AppError("No active allocation found for this asset", 400);
    }

    if (activeAllocation.employeeId === current.requestedById) {
      throw new AppError("Asset is already allocated to the requester", 400);
    }

    // Close previous allocation (preserve history)
    await tx.allocation.update({
      where: { id: activeAllocation.id },
      data: {
        status: ALLOCATION_STATUS.RETURNED,
        returnedDate: new Date(),
        returnNotes: `Closed by transfer #${current.id}`
      }
    });

    // Create new allocation for requester
    const newAllocation = await tx.allocation.create({
      data: {
        assetId: current.assetId,
        employeeId: current.requestedById,
        status: ALLOCATION_STATUS.ALLOCATED
      }
    });

    // Update asset ownership — preserve Under Maintenance if applicable
    const nextStatus =
      current.asset.status === ASSET_STATUS.UNDER_MAINTENANCE
        ? ASSET_STATUS.UNDER_MAINTENANCE
        : ASSET_STATUS.ALLOCATED;

    await tx.asset.update({
      where: { id: current.assetId },
      data: {
        employeeId: current.requestedById,
        status: nextStatus
      }
    });

    const updated = await tx.transferRequest.update({
      where: { id: current.id },
      data: { status: TRANSFER_STATUS.APPROVED, approvedDate: new Date() }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "TRANSFER_APPROVE",
      entity: "TransferRequest",
      entityId: updated.id,
      details: `Asset ${current.assetId} transferred to employee ${current.requestedById}; allocation ${newAllocation.id} created`
    });

    // Notify previous holder and new holder when they have linked users
    const previousHolder = await tx.employee.findUnique({
      where: { id: activeAllocation.employeeId },
      include: { user: { select: { id: true } } }
    });

    if (previousHolder?.user?.id) {
      await createNotification(tx, {
        userId: previousHolder.user.id,
        type: "Transfer Approved",
        message: `Asset "${current.asset.name}" has been transferred away from you`
      });
    }

    if (current.requestedBy?.user?.id) {
      await createNotification(tx, {
        userId: current.requestedBy.user.id,
        type: "Transfer Approved",
        message: `Asset "${current.asset.name}" has been transferred to you`
      });
    }

    return updated;
  });
}

async function rejectTransfer({ transferId, rejectedReason, actorUserId }) {
  const transfer = await prisma.transferRequest.findUnique({
    where: { id: Number(transferId) },
    include: { requestedBy: { include: { user: { select: { id: true } } } }, asset: true }
  });

  if (!transfer) {
    throw new AppError("Transfer request not found", 404);
  }

  if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
    throw new AppError("Transfer already processed", 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transferRequest.update({
      where: { id: transfer.id },
      data: {
        status: TRANSFER_STATUS.REJECTED,
        rejectedReason: rejectedReason || null
      }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "TRANSFER_REJECT",
      entity: "TransferRequest",
      entityId: updated.id,
      details: rejectedReason || "Transfer rejected"
    });

    if (transfer.requestedBy?.user?.id) {
      await createNotification(tx, {
        userId: transfer.requestedBy.user.id,
        type: "Transfer Rejected",
        message: `Transfer request for asset "${transfer.asset.name}" was rejected`
      });
    }

    return updated;
  });
}

module.exports = {
  createTransfer,
  approveTransfer,
  rejectTransfer
};
