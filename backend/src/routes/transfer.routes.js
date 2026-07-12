const express = require("express");
const { getTransfers, getTransferById, createTransfer, approveTransfer, rejectTransfer } = require("../controllers/transfer.controller");
const router = express.Router();

router.get("/", getTransfers);
router.get("/:id", getTransferById);
router.post("/", createTransfer);
router.patch("/:id/approve", approveTransfer);
router.patch("/:id/reject", rejectTransfer);

module.exports = router;
