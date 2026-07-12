const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { employeeListScope } = require("../utils/scope");

exports.getEmployees = asyncHandler(async (req, res) => {
  const employees = await prisma.employee.findMany({
    where: employeeListScope(req.user),
    include: {
      department: { select: { id: true, name: true } },
      user: { select: { id: true, role: true, status: true } },
      _count: { select: { allocations: true, bookings: true } }
    }
  });

  return sendSuccess(res, { message: "Employees retrieved", data: employees });
});

exports.getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      department: true,
      user: { select: { id: true, role: true, status: true } },
      allocations: { include: { asset: true } },
      bookings: { include: { asset: true } }
    }
  });

  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  return sendSuccess(res, { message: "Employee retrieved", data: employee });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const { name, email, departmentId, userId } = req.body;

  const employee = await prisma.employee.create({
    data: {
      name,
      email,
      departmentId: Number(departmentId),
      userId: userId ? Number(userId) : null
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Employee created", data: employee });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const { name, email, status, departmentId } = req.body;
  const data = {};

  if (name) data.name = name;
  if (email) data.email = email;
  if (status) data.status = status;
  if (departmentId) data.departmentId = Number(departmentId);

  const employee = await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data
  });

  return sendSuccess(res, { message: "Employee updated", data: employee });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  await prisma.employee.delete({
    where: { id: Number(req.params.id) }
  });

  return sendSuccess(res, { message: "Employee deleted successfully", data: null });
});
