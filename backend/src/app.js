const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
const requestLogger = require("./middleware/requestLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { sendSuccess } = require("./utils/response");

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

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
