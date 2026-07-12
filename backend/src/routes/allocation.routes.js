const express = require("express");
const { getAllocations, getAllocationById, allocateAsset, returnAsset } = require("../controllers/allocation.controller");
const router = express.Router();

router.get("/", getAllocations);
router.get("/:id", getAllocationById);
router.post("/", allocateAsset);
router.patch("/:id/return", returnAsset);

module.exports = router;
