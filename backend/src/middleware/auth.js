const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { getConfig } = require("../config/env");

/**
 * Verifies Bearer JWT and attaches authenticated user context to req.user:
 * { id, role, name, email, employeeId, departmentId }
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new AppError("No token provided", 401));
    }

    if (!authHeader.startsWith("Bearer ")) {
      return next(new AppError("Malformed Authorization header. Expected: Bearer <token>", 401));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new AppError("No token provided", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getConfig().jwtSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token has expired", 401));
      }
      return next(new AppError("Invalid token", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { employee: true }
    });

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    if (user.status && user.status !== "Active") {
      return next(new AppError("User account is inactive", 401));
    }

    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      employeeId: user.employee ? user.employee.id : null,
      departmentId: user.employee ? user.employee.departmentId : null
    };

    next();
  } catch (error) {
    next(error);
  }
};

/** Alias for existing imports */
const authMiddleware = authenticate;

module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.authMiddleware = authMiddleware;
