const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { isAdmin } = require("../utils/scope");

exports.getAssetsByDepartment = asyncHandler(async (req, res) => {
  const where = isAdmin(req.user) ? {} : { id: req.user.departmentId };

  const departments = await prisma.department.findMany({
    where,
    select: {
      id: true,
      name: true,
      _count: { select: { assets: true } }
    }
  });

  return sendSuccess(res, { message: "Assets by department report", data: departments });
});

exports.getAssetsByCategory = asyncHandler(async (req, res) => {
  const assetWhere = isAdmin(req.user) ? {} : { departmentId: req.user.departmentId };

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      assets: {
        where: assetWhere,
        select: { id: true }
      }
    }
  });

  const data = categories.map((category) => ({
    id: category.id,
    name: category.name,
    _count: { assets: category.assets.length }
  }));

  return sendSuccess(res, { message: "Assets by category report", data: data });
});

exports.getAssetsByStatus = asyncHandler(async (req, res) => {
  const statuses = ["Available", "Allocated", "Under Maintenance", "Retired", "Lost"];
  const deptFilter = isAdmin(req.user) ? {} : { departmentId: req.user.departmentId };

  const result = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.asset.count({ where: { status, ...deptFilter } })
    }))
  );

  return sendSuccess(res, { message: "Assets by status report", data: result });
});

exports.getMaintenanceSummary = asyncHandler(async (req, res) => {
  const statuses = ["Pending", "In Progress", "Resolved"];
  const scopeFilter = isAdmin(req.user)
    ? {}
    : {
        OR: [
          { requestedBy: { departmentId: req.user.departmentId } },
          { asset: { departmentId: req.user.departmentId } }
        ]
      };

  const result = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.maintenanceRequest.count({
        where: { status, ...scopeFilter }
      })
    }))
  );

  return sendSuccess(res, { message: "Maintenance summary report", data: result });
});
