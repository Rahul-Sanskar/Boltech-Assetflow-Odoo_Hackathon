const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Departments endpoint stub" });
});

module.exports = router;
