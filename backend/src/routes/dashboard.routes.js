const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const { getDashboard } = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticate);
router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getDashboard);

module.exports = router;
