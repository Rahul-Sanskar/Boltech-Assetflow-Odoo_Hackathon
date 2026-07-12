const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AssetFlow Backend API is running. Access endpoints via /api." });
});

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

module.exports = app;
