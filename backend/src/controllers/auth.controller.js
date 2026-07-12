const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, departmentId } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("User already exists with this email", 400);
  }

  const dept = await prisma.department.findUnique({
    where: { id: Number(departmentId) }
  });
  if (!dept) {
    throw new AppError("Department not found", 404);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE"
      }
    });

    const employee = await tx.employee.create({
      data: {
        name,
        email,
        departmentId: Number(departmentId),
        userId: user.id
      }
    });

    return { user, employee };
  });

  const token = jwt.sign({ id: result.user.id, role: result.user.role }, JWT_SECRET, {
    expiresIn: "24h"
  });

  const { password: _, ...userWithoutPassword } = result.user;

  return sendSuccess(res, {
    statusCode: 201,
    message: "Signup successful",
    data: {
      user: userWithoutPassword,
      employee: result.employee,
      token
    }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true }
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "24h"
  });

  const { password: _, ...userWithoutPassword } = user;

  return sendSuccess(res, {
    message: "Login successful",
    data: {
      user: userWithoutPassword,
      token
    }
  });
});
