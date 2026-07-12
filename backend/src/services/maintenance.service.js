const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const {
  ASSET_STATUS,
  MAINTENANCE_STATUS,
  NON_MAINTAINABLE
} = require("../constants/assetStates");
const { writeActivityLog, createNotification } = require("./activity.service");
const { findActiveAllocation } = require("./allocation.service");

const TERMINAL_STATUSES = new Set([
  MAINTENANCE_STATUS.RESOLVED,
  MAINTENANCE_STATUS.REJECTED
]);

/**
 * Allowed maintenance request status transitions.
 * Asset state flips only on Approved (→ Under Maintenance) and Resolved (→ Allocated|Available).
 */
const MAINTENANCE_TRANSITIONS = {
  [MAINTENANCE_STATUS.PENDING]: [
    MAINTENANCE_STATUS.APPROVED,
    MAINTENANCE_STATUS.REJECTED
  ],
  [MAINTENANCE_STATUS.APPROVED]: [
    MAINTENANCE_STATUS.IN_PROGRESS,
    MAINTENANCE_STATUS.RESOLVED,
    MAINTENANCE_STATUS.REJECTED
  ],
  [MAINTENANCE_STATUS.IN_PROGRESS]: [MAINTENANCE_STATUS.RESOLVED],
  [MAINTENANCE_STATUS.RESOLVED]: [],
  [MAINTENANCE_STATUS.REJECTED]: []
};

/**
 * Create a pending maintenance request. Does NOT change asset state until approval.
 */
async function createMaintenance({
  assetId,
  requestedById,
  description,
  priority,
  photo,
  actorUserId
}) {
  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (NON_MAINTAINABLE.has(asset.status)) {
    throw new AppError(`Cannot raise maintenance for asset with status "${asset.status}"`, 400);
  }

  if (asset.status === ASSET_STATUS.UNDER_MAINTENANCE) {
    throw new AppError("Asset is already under maintenance", 409);
  }

  const requester = await prisma.employee.findUnique({
    where: { id: Number(requestedById) }
  });
  if (!requester) {
    throw new AppError("Requester employee not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: {
        assetId: Number(assetId),
        requestedById: Number(requestedById),
        description,
        priority: priority || "Medium",
        photo: photo || null,
        status: MAINTENANCE_STATUS.PENDING
      }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "MAINTENANCE_CREATE",
      entity: "MaintenanceRequest",
      entityId: request.id,
      details: `Maintenance request raised for asset ${assetId}`
    });

    return request;
  });
}

/**
 * Update maintenance lifecycle. Approval and resolution are transactional and custody-aware.
 */
async function updateMaintenance({
  requestId,
  status,
  technicianId,
  resolvedDate,
  actorUserId
}) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: Number(requestId) },
    include: {
      asset: true,
      requestedBy: { include: { user: { select: { id: true } } } }
    }
  });

  if (!request) {
    throw new AppError("Maintenance request not found", 404);
  }

  if (status) {
    if (TERMINAL_STATUSES.has(request.status)) {
      throw new AppError(`Maintenance request already ${request.status.toLowerCase()}`, 400);
    }

    const allowed = MAINTENANCE_TRANSITIONS[request.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Invalid maintenance status transition from "${request.status}" to "${status}"`,
        400
      );
    }
  }

  // Approval: Pending → Approved, asset → Under Maintenance (preserve employeeId)
  if (status === MAINTENANCE_STATUS.APPROVED) {
    return prisma.$transaction(async (tx) => {
      if (NON_MAINTAINABLE.has(request.asset.status)) {
        throw new AppError(
          `Cannot approve maintenance for asset with status "${request.asset.status}"`,
          400
        );
      }

      if (request.asset.status === ASSET_STATUS.UNDER_MAINTENANCE) {
        throw new AppError("Asset is already under maintenance", 409);
      }

      const updated = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: MAINTENANCE_STATUS.APPROVED,
          ...(technicianId != null ? { technicianId: Number(technicianId) } : {})
        }
      });

      // Preserve custody (employeeId) while flipping asset into maintenance
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: ASSET_STATUS.UNDER_MAINTENANCE }
      });

      await writeActivityLog(tx, {
        userId: actorUserId,
        action: "MAINTENANCE_APPROVE",
        entity: "MaintenanceRequest",
        entityId: updated.id,
        details: `Asset ${request.assetId} set to Under Maintenance`
      });

      if (request.requestedBy?.user?.id) {
        await createNotification(tx, {
          userId: request.requestedBy.user.id,
          type: "Maintenance Approved",
          message: `Maintenance request for asset "${request.asset.name}" was approved`
        });
      }

      return updated;
    });
  }

  // Resolution: restore Allocated if active allocation exists, else Available
  if (status === MAINTENANCE_STATUS.RESOLVED) {
    return prisma.$transaction(async (tx) => {
      const activeAllocation = await findActiveAllocation(tx, request.assetId);

      const updated = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: {
          status: MAINTENANCE_STATUS.RESOLVED,
          resolvedDate: resolvedDate ? new Date(resolvedDate) : new Date(),
          ...(technicianId != null ? { technicianId: Number(technicianId) } : {})
        }
      });

      const restoreStatus = activeAllocation
        ? ASSET_STATUS.ALLOCATED
        : ASSET_STATUS.AVAILABLE;

      // Do not overwrite employeeId — restore only status based on custody
      await tx.asset.update({
        where: { id: request.assetId },
        data: {
          status: restoreStatus,
          ...(activeAllocation
            ? { employeeId: activeAllocation.employeeId }
            : { employeeId: null })
        }
      });

      await writeActivityLog(tx, {
        userId: actorUserId,
        action: "MAINTENANCE_RESOLVE",
        entity: "MaintenanceRequest",
        entityId: updated.id,
        details: `Asset ${request.assetId} restored to ${restoreStatus}`
      });

      if (request.requestedBy?.user?.id) {
        await createNotification(tx, {
          userId: request.requestedBy.user.id,
          type: "Maintenance Resolved",
          message: `Maintenance request for asset "${request.asset.name}" was resolved`
        });
      }

      return updated;
    });
  }

  // Rejection or intermediate updates (In Progress / technician assign)
  if (status === MAINTENANCE_STATUS.REJECTED) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id: request.id },
        data: { status: MAINTENANCE_STATUS.REJECTED }
      });

      await writeActivityLog(tx, {
        userId: actorUserId,
        action: "MAINTENANCE_REJECT",
        entity: "MaintenanceRequest",
        entityId: updated.id,
        details: `Maintenance request ${request.id} rejected`
      });

      if (request.requestedBy?.user?.id) {
        await createNotification(tx, {
          userId: request.requestedBy.user.id,
          type: "Maintenance Rejected",
          message: `Maintenance request for asset "${request.asset.name}" was rejected`
        });
      }

      return updated;
    });
  }

  const data = {};
  if (status) data.status = status;
  if (technicianId !== undefined) {
    data.technicianId = technicianId == null ? null : Number(technicianId);
  }
  if (resolvedDate) data.resolvedDate = new Date(resolvedDate);

  return prisma.maintenanceRequest.update({
    where: { id: request.id },
    data
  });
}

module.exports = {
  createMaintenance,
  updateMaintenance
};
