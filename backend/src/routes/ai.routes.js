const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const {
  maintenance,
  dashboard,
  audit,
  booking,
  description,
  chat,
} = require("../controllers/ai.controller");

const router = express.Router();

// All AI endpoints require a valid token; admins/managers/employees may use them.
router.use(authenticate);
router.use(authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"));

router.post("/maintenance", maintenance);
router.post("/dashboard", dashboard);
router.post("/audit", audit);
router.post("/booking", booking);
router.post("/description", description);
router.post("/chat", chat);

module.exports = router;
