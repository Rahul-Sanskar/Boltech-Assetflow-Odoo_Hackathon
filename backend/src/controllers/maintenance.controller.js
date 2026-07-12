const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { maintenanceListScope, isManager } = require("../utils/scope");

exports.getMaintenanceRequests = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const where = { ...maintenanceListScope(req.user) };

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      requestedBy: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return sendSuccess(res, { message: "Maintenance requests retrieved", data: requests });
});

exports.getMaintenanceById = asyncHandler(async (req, res) => {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, requestedBy: true, technician: true }
  });

  if (!request) {
    throw new AppError("Maintenance request not found", 404);
  }

  return sendSuccess(res, { message: "Maintenance request retrieved", data: request });
});

exports.createMaintenance = asyncHandler(async (req, res) => {
  const { assetId, requestedById, description, priority, photo } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: {
        assetId: Number(assetId),
        requestedById: Number(requestedById),
        description,
        priority: priority || "Medium",
        photo: photo || null
      }
    });

    await tx.asset.update({
      where: { id: Number(assetId) },
      data: { status: "Under Maintenance" }
    });

    return request;
  });

  return sendSuccess(res, { statusCode: 201, message: "Maintenance request created", data: result });
});

exports.updateMaintenance = asyncHandler(async (req, res) => {
  const { status, technicianId, resolvedDate } = req.body;
  const data = {};

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, requestedBy: true }
  });

  if (!request) {
    throw new AppError("Maintenance request not found", 404);
  }

  if (isManager(req.user)) {
    const inScope =
      request.asset.departmentId === req.user.departmentId ||
      request.requestedBy.departmentId === req.user.departmentId;
    if (!inScope) {
      throw new AppError("Maintenance request is outside your department scope", 403);
    }
  }

  if (status) data.status = status;
  if (technicianId) data.technicianId = Number(technicianId);
  if (resolvedDate) data.resolvedDate = new Date(resolvedDate);

  if (status === "Resolved") {
    data.resolvedDate = new Date();
    await prisma.asset.update({
      where: { id: request.assetId },
      data: { status: "Available" }
    });
  }

  const updated = await prisma.maintenanceRequest.update({
    where: { id: request.id },
    data
  });

  return sendSuccess(res, { message: "Maintenance request updated", data: updated });
});
