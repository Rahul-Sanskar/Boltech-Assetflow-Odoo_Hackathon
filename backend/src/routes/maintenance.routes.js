const express = require("express");
const { getMaintenanceRequests, getMaintenanceById, createMaintenance, updateMaintenance } = require("../controllers/maintenance.controller");
const router = express.Router();

router.get("/", getMaintenanceRequests);
router.get("/:id", getMaintenanceById);
router.post("/", createMaintenance);
router.patch("/:id", updateMaintenance);

module.exports = router;
