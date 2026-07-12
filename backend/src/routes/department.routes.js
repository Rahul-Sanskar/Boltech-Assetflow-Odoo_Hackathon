const express = require("express");
const { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } = require("../controllers/department.controller");
const router = express.Router();

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);
router.patch("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;
