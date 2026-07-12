const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  res.json({ message: "Login endpoint stub" });
});

router.post("/signup", (req, res) => {
  res.json({ message: "Signup endpoint stub" });
});

module.exports = router;
