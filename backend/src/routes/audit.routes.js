const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Audit cycles endpoint stub" });
});

module.exports = router;
