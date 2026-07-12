const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { ASSET_STATUS, assertTransition } = require("../constants/assetStates");
const { writeActivityLog } = require("./activity.service");

/**
 * Update asset fields. Status changes must follow allowed lifecycle transitions.
 * Allocation/maintenance/transfer workflows own most status flips; this path
 * covers admin lifecycle actions (retire, dispose, reserve, recover from lost).
 */
async function updateAsset({ assetId, patch, actorUserId }) {
  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  const data = {};
  if (patch.name) data.name = patch.name;
  if (patch.condition) data.condition = patch.condition;
  if (patch.location !== undefined) data.location = patch.location;
  if (patch.photo !== undefined) data.photo = patch.photo;
  if (patch.isBookable !== undefined) data.isBookable = patch.isBookable;
  if (patch.departmentId) data.departmentId = Number(patch.departmentId);
  if (patch.categoryId) data.categoryId = Number(patch.categoryId);

  if (patch.status) {
    try {
      assertTransition(asset.status, patch.status);
    } catch (err) {
      throw new AppError(err.message, err.statusCode || 400);
    }

    // Workflow-owned transitions — reject free-form status flips
    if (patch.status === ASSET_STATUS.ALLOCATED) {
      throw new AppError("Use the allocation or transfer workflow to set Allocated", 400);
    }
    if (patch.status === ASSET_STATUS.UNDER_MAINTENANCE) {
      throw new AppError("Use maintenance approval to set Under Maintenance", 400);
    }
    if (patch.status === ASSET_STATUS.LOST) {
      throw new AppError("Assets become Lost only via audit Missing results", 400);
    }
    if (patch.status === ASSET_STATUS.DISPOSED && asset.status !== ASSET_STATUS.RETIRED) {
      throw new AppError("Only retired assets can be disposed", 400);
    }

    data.status = patch.status;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.asset.update({
      where: { id: asset.id },
      data
    });

    if (patch.status && patch.status !== asset.status) {
      await writeActivityLog(tx, {
        userId: actorUserId,
        action: "ASSET_STATUS_CHANGE",
        entity: "Asset",
        entityId: updated.id,
        details: `Status changed from ${asset.status} to ${patch.status}`
      });
    }

    return updated;
  });
}

/**
 * When an audit item is marked Missing, transition the asset to Lost.
 * When an audit cycle is Closed, cascade all Missing items → Lost.
 */
async function markAssetLostFromAudit({ assetId, actorUserId, tx: externalTx }) {
  const run = async (tx) => {
    const asset = await tx.asset.findUnique({ where: { id: Number(assetId) } });
    if (!asset) return null;
    if (asset.status === ASSET_STATUS.LOST || asset.status === ASSET_STATUS.DISPOSED) {
      return asset;
    }

    const updated = await tx.asset.update({
      where: { id: asset.id },
      data: { status: ASSET_STATUS.LOST }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "AUDIT_MISSING",
      entity: "Asset",
      entityId: updated.id,
      details: "Asset marked Lost due to audit Missing result"
    });

    return updated;
  };

  if (externalTx) return run(externalTx);
  return prisma.$transaction(run);
}

async function closeAuditCycle({ cycleId, actorUserId }) {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: Number(cycleId) },
    include: { items: true }
  });

  if (!cycle) {
    throw new AppError("Audit cycle not found", 404);
  }

  const pending = cycle.items.filter((item) => !item.result);
  if (pending.length > 0) {
    throw new AppError(
      `Cannot close audit cycle: ${pending.length} item(s) still missing a result`,
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.auditCycle.update({
      where: { id: cycle.id },
      data: { status: "Closed" }
    });

    const missingItems = cycle.items.filter(
      (item) => item.result && String(item.result).toLowerCase() === "missing"
    );

    for (const item of missingItems) {
      await markAssetLostFromAudit({
        assetId: item.assetId,
        actorUserId,
        tx
      });
    }

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "AUDIT_CLOSE",
      entity: "AuditCycle",
      entityId: updated.id,
      details: `Closed audit cycle; ${missingItems.length} asset(s) marked Lost`
    });

    return updated;
  });
}

module.exports = {
  updateAsset,
  markAssetLostFromAudit,
  closeAuditCycle
};
