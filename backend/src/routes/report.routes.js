const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const {
  getAssetsByDepartment,
  getAssetsByCategory,
  getAssetsByStatus,
  getMaintenanceSummary
} = require("../controllers/report.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("ADMIN", "MANAGER"));

router.get("/assets-by-department", getAssetsByDepartment);
router.get("/assets-by-category", getAssetsByCategory);
router.get("/assets-by-status", getAssetsByStatus);
router.get("/maintenance-summary", getMaintenanceSummary);

module.exports = router;
