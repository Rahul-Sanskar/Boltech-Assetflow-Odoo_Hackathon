const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { allocationListScope, isAdmin, isManager } = require("../utils/scope");
const allocationService = require("../services/allocation.service");

exports.getAllocations = asyncHandler(async (req, res) => {
  const allocations = await prisma.allocation.findMany({
    where: allocationListScope(req.user),
    include: {
      asset: {
        include: {
          category: { select: { id: true, name: true } }
        }
      },
      employee: { select: { id: true, name: true } }
    }
  });

  return sendSuccess(res, { message: "Allocations retrieved", data: allocations });
});

exports.getAllocationById = asyncHandler(async (req, res) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, employee: true }
  });

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  return sendSuccess(res, { message: "Allocation retrieved", data: allocation });
});

exports.allocateAsset = asyncHandler(async (req, res) => {
  const { assetId, employeeId, expectedReturn } = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (isManager(req.user) && asset.departmentId !== req.user.departmentId) {
    throw new AppError("Asset is outside your department scope", 403);
  }

  const employee = await prisma.employee.findUnique({ where: { id: Number(employeeId) } });
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  if (isManager(req.user) && employee.departmentId !== req.user.departmentId) {
    throw new AppError("Employee is outside your department scope", 403);
  }

  const result = await allocationService.allocateAsset({
    assetId,
    employeeId,
    expectedReturn,
    actorUserId: req.user.id
  });

  return sendSuccess(res, { statusCode: 201, message: "Asset allocated", data: result });
});

exports.returnAsset = asyncHandler(async (req, res) => {
  const { returnNotes } = req.body;

  const allocation = await prisma.allocation.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, employee: true }
  });

  if (!allocation) {
    throw new AppError("Allocation not found", 404);
  }

  if (!isAdmin(req.user)) {
    if (isManager(req.user)) {
      const inScope =
        allocation.employee.departmentId === req.user.departmentId ||
        allocation.asset.departmentId === req.user.departmentId;
      if (!inScope) {
        throw new AppError("Allocation is outside your department scope", 403);
      }
    } else if (allocation.employeeId !== req.user.employeeId) {
      throw new AppError("You can only return your own allocations", 403);
    }
  }

  const result = await allocationService.returnAsset({
    allocationId: allocation.id,
    returnNotes,
    actorUserId: req.user.id
  });

  return sendSuccess(res, { message: "Asset returned", data: result });
});
