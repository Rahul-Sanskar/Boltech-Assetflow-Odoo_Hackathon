const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { departmentListScope } = require("../utils/scope");

exports.getDepartments = asyncHandler(async (req, res) => {
  const departments = await prisma.department.findMany({
    where: departmentListScope(req.user),
    include: {
      head: true,
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      _count: { select: { employees: true, assets: true } }
    }
  });

  return sendSuccess(res, { message: "Departments retrieved", data: departments });
});

exports.getDepartmentById = asyncHandler(async (req, res) => {
  const department = await prisma.department.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      head: true,
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
      employees: true,
      assets: true
    }
  });

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  const { isAdmin, isManager, isEmployee } = require("../utils/scope");
  if (!isAdmin(req.user)) {
    if ((isManager(req.user) || isEmployee(req.user)) && department.id !== req.user.departmentId) {
      throw new AppError("Department is outside your scope", 403);
    }
  }

  return sendSuccess(res, { message: "Department retrieved", data: department });
});

exports.createDepartment = asyncHandler(async (req, res) => {
  const { name, parentId, headId } = req.body;

  const department = await prisma.department.create({
    data: {
      name,
      parentId: parentId ? Number(parentId) : null,
      headId: headId ? Number(headId) : null
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Department created", data: department });
});

exports.updateDepartment = asyncHandler(async (req, res) => {
  const { name, status, parentId, headId } = req.body;
  const data = {};

  if (name) data.name = name;
  if (status) data.status = status;
  if (parentId !== undefined) data.parentId = parentId ? Number(parentId) : null;
  if (headId !== undefined) data.headId = headId ? Number(headId) : null;

  const department = await prisma.department.update({
    where: { id: Number(req.params.id) },
    data
  });

  return sendSuccess(res, { message: "Department updated", data: department });
});

exports.deleteDepartment = asyncHandler(async (req, res) => {
  await prisma.department.delete({
    where: { id: Number(req.params.id) }
  });

  return sendSuccess(res, { message: "Department deleted successfully", data: null });
});
