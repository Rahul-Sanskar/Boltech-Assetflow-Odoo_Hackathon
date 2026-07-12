const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { requireSelfEmployeeOrElevated } = require("../middleware/ownership");
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require("../controllers/employee.controller");
const { idParam, createEmployeeBody, updateEmployeeBody } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getEmployees);
router.get(
  "/:id",
  validate({ params: idParam }),
  requireSelfEmployeeOrElevated,
  getEmployeeById
);
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate({ body: createEmployeeBody }),
  createEmployee
);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate({ params: idParam, body: updateEmployeeBody }),
  updateEmployee
);
router.delete("/:id", authorizeRoles("ADMIN"), validate({ params: idParam }), deleteEmployee);

module.exports = router;
