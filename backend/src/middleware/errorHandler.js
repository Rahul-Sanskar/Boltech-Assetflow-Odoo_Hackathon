const { Prisma } = require("@prisma/client");
const AppError = require("../utils/AppError");
const { sendError } = require("../utils/response");

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = Array.isArray(err.errors) ? err.errors : [];

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this unique value already exists";
      errors = [{ field: Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "unknown", message }];
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Related record not found or cannot be deleted due to existing references";
    } else {
      statusCode = 400;
      message = "Database request failed";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided";
  }

  if (!(err instanceof AppError) && statusCode === 500) {
    message = "Internal Server Error";
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500 && err.message) {
    // Keep operational detail only in non-production logs, never in response body for unknowns
    console.error("[error]", err);
  } else if (statusCode >= 500) {
    console.error("[error]", message);
  }

  return sendError(res, { statusCode, message, errors });
};

module.exports = { errorHandler, notFoundHandler };
