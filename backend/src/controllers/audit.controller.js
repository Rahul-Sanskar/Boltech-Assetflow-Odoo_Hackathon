const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { auditListScope, isAdmin, isManager } = require("../utils/scope");
const assetService = require("../services/asset.service");

exports.getAuditCycles = asyncHandler(async (req, res) => {
  const cycles = await prisma.auditCycle.findMany({
    where: auditListScope(req.user),
    include: {
      department: { select: { id: true, name: true } },
      assignments: { include: { auditor: { select: { id: true, name: true } } } },
      _count: { select: { items: true } }
    },
    orderBy: { startDate: "desc" }
  });

  return sendSuccess(res, { message: "Audit cycles retrieved", data: cycles });
});

exports.getAuditCycleById = asyncHandler(async (req, res) => {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      department: true,
      assignments: { include: { auditor: { select: { id: true, name: true } } } },
      items: { include: { asset: true } }
    }
  });

  if (!cycle) {
    throw new AppError("Audit cycle not found", 404);
  }

  if (!isAdmin(req.user)) {
    const assigned = cycle.assignments.some((a) => a.auditorId === req.user.id);
    const inDept = cycle.departmentId === req.user.departmentId || cycle.departmentId == null;
    if (isManager(req.user) && !assigned && !inDept) {
      throw new AppError("Audit cycle is outside your scope", 403);
    }
    if (!isManager(req.user) && !assigned) {
      throw new AppError("You are not assigned to this audit cycle", 403);
    }
  }

  return sendSuccess(res, { message: "Audit cycle retrieved", data: cycle });
});

exports.createAuditCycle = asyncHandler(async (req, res) => {
  const { name, scope, departmentId, location, startDate, endDate } = req.body;

  const cycle = await prisma.auditCycle.create({
    data: {
      name,
      scope,
      departmentId: departmentId ? Number(departmentId) : null,
      location: location || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Audit cycle created", data: cycle });
});

exports.assignAuditor = asyncHandler(async (req, res) => {
  const { auditorId } = req.body;
  const auditCycleId = Number(req.params.id);

  const assignment = await prisma.auditAssignment.create({
    data: {
      auditCycleId,
      auditorId: Number(auditorId)
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Auditor assigned", data: assignment });
});

exports.addAuditItem = asyncHandler(async (req, res) => {
  const { assetId, result, notes } = req.body;
  const auditCycleId = Number(req.params.id);

  const item = await prisma.auditItem.create({
    data: {
      auditCycleId,
      assetId: Number(assetId),
      result: result || null,
      notes: notes || null
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Audit item added", data: item });
});

exports.updateAuditItem = asyncHandler(async (req, res) => {
  const { result, notes } = req.body;

  const existing = await prisma.auditItem.findUnique({
    where: { id: Number(req.params.itemId) }
  });

  if (!existing) {
    throw new AppError("Audit item not found", 404);
  }

  const item = await prisma.auditItem.update({
    where: { id: existing.id },
    data: {
      result: result || undefined,
      notes: notes !== undefined ? notes : undefined
    }
  });

  // Immediate Missing → Lost (also cascaded again on cycle close for consistency)
  if (result && String(result).toLowerCase() === "missing") {
    await assetService.markAssetLostFromAudit({
      assetId: item.assetId,
      actorUserId: req.user.id
    });
  }

  return sendSuccess(res, { message: "Audit item updated", data: item });
});

exports.updateAuditCycle = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });

    if (status === "Closed") {
      const items = await tx.auditItem.findMany({
        where: { auditCycleId: Number(req.params.id) }
      });

      const missingAssetIds = items
        .filter((item) => item.result === "Missing")
        .map((item) => item.assetId);

      if (missingAssetIds.length > 0) {
        await tx.asset.updateMany({
          where: { id: { in: missingAssetIds } },
          data: { status: "Lost" }
        });
      }

      const damagedAssetIds = items
        .filter((item) => item.result === "Damaged")
        .map((item) => item.assetId);

      if (damagedAssetIds.length > 0) {
        await tx.asset.updateMany({
          where: { id: { in: damagedAssetIds } },
          data: { condition: "Damaged" }
        });
      }
    }

    return cycle;
  });

  return sendSuccess(res, { message: "Audit cycle updated", data: result });
});
