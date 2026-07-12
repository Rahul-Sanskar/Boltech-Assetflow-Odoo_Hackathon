const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { userListScope } = require("../utils/scope");

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    include: {
      department: true
    }
  }
};

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: userListScope(req.user),
    select: userSelect
  });

  return sendSuccess(res, { message: "Users retrieved", data: users });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: userSelect
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sendSuccess(res, { message: "User retrieved", data: user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { role, status, name } = req.body;
  const data = {};

  if (role) data.role = role;
  if (status) data.status = status;
  if (name) data.name = name;

  const updatedUser = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true
    }
  });

  return sendSuccess(res, { message: "User updated", data: updatedUser });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.delete({
    where: { id: Number(req.params.id) }
  });

  return sendSuccess(res, { message: "User deleted successfully", data: null });
});
