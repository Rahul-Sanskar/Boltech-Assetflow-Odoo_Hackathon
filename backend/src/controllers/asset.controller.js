const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { assetListScope, isAdmin, isManager } = require("../utils/scope");
const assetService = require("../services/asset.service");

exports.getAssets = asyncHandler(async (req, res) => {
  const { status, departmentId, categoryId } = req.query;
  const where = { ...assetListScope(req.user) };

  if (status) where.status = status;
  if (categoryId) where.categoryId = Number(categoryId);

  if (departmentId) {
    const requestedDept = Number(departmentId);
    if (!isAdmin(req.user) && requestedDept !== req.user.departmentId) {
      throw new AppError("You cannot query assets outside your department", 403);
    }
    where.departmentId = requestedDept;
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } }
    }
  });

  return sendSuccess(res, { message: "Assets retrieved", data: assets });
});

exports.getAssetById = asyncHandler(async (req, res) => {
  const asset = await prisma.asset.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      department: true,
      category: true,
      employee: true,
      allocations: { include: { employee: true } },
      maintenanceRequests: true,
      bookings: true,
      auditItems: true
    }
  });

  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (!isAdmin(req.user)) {
    const inDept = asset.departmentId === req.user.departmentId;
    const isHolder = asset.employeeId === req.user.employeeId;
    if (isManager(req.user) && !inDept) {
      throw new AppError("Asset is outside your department scope", 403);
    }
    if (!isManager(req.user) && !inDept && !isHolder) {
      throw new AppError("You do not have access to this asset", 403);
    }
  }

  return sendSuccess(res, { message: "Asset retrieved", data: asset });
});

exports.createAsset = asyncHandler(async (req, res) => {
  const {
    name,
    assetTag,
    serialNumber,
    condition,
    location,
    acquisitionDate,
    acquisitionCost,
    photo,
    isBookable,
    departmentId,
    categoryId
  } = req.body;

  const asset = await prisma.asset.create({
    data: {
      name,
      assetTag,
      serialNumber: serialNumber || null,
      condition: condition || "Good",
      location: location || null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
      acquisitionCost: acquisitionCost != null ? Number(acquisitionCost) : null,
      photo: photo || null,
      isBookable: isBookable || false,
      departmentId: Number(departmentId),
      categoryId: Number(categoryId)
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Asset created", data: asset });
});

exports.updateAsset = asyncHandler(async (req, res) => {
  const { name, status, condition, location, photo, isBookable, departmentId, categoryId } = req.body;

  const asset = await assetService.updateAsset({
    assetId: Number(req.params.id),
    patch: { name, status, condition, location, photo, isBookable, departmentId, categoryId },
    actorUserId: req.user.id
  });

  return sendSuccess(res, { message: "Asset updated", data: asset });
});

exports.deleteAsset = asyncHandler(async (req, res) => {
  await prisma.asset.delete({
    where: { id: Number(req.params.id) }
  });

  return sendSuccess(res, { message: "Asset deleted successfully", data: null });
});
