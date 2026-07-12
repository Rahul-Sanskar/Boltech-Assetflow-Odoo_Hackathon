const express = require("express");
const { getAuditCycles, getAuditCycleById, createAuditCycle, assignAuditor, addAuditItem, updateAuditItem, updateAuditCycle } = require("../controllers/audit.controller");
const router = express.Router();

router.get("/", getAuditCycles);
router.get("/:id", getAuditCycleById);
router.post("/", createAuditCycle);
router.patch("/:id", updateAuditCycle);
router.post("/:id/assign", assignAuditor);
router.post("/:id/items", addAuditItem);
router.patch("/:id/items/:itemId", updateAuditItem);

module.exports = router;
