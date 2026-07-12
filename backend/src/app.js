const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
const requestLogger = require("./middleware/requestLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { sendSuccess } = require("./utils/response");

const prisma = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ success: true, message: "Backend and database are fully connected" });
  } catch (error) {
    const detail =
      process.env.NODE_ENV === "production"
        ? "Database unavailable"
        : error.message;
    return res.status(500).json({ success: false, message: "Database connection failed", error: detail });
  }
});

app.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "AssetFlow Backend API is running. Access endpoints via /api.",
    data: null
  });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
