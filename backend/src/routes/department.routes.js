const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require("../controllers/department.controller");
const { idParam, createDepartmentBody, updateDepartmentBody } = require("../validators/schemas");

const router = express.Router();

router.get("/", getDepartments);

router.use(authenticate);
router.get("/:id", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), validate({ params: idParam }), getDepartmentById);
router.post("/", authorizeRoles("ADMIN"), validate({ body: createDepartmentBody }), createDepartment);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: updateDepartmentBody }),
  updateDepartment
);
router.delete("/:id", authorizeRoles("ADMIN"), validate({ params: idParam }), deleteDepartment);

module.exports = router;
