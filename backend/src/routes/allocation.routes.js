const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { requireResourceAccess } = require("../middleware/ownership");
const {
  getAllocations,
  getAllocationById,
  allocateAsset,
  returnAsset
} = require("../controllers/allocation.controller");
const { idParam, allocateBody, returnBody } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getAllocations);
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  requireResourceAccess({
    model: "allocation",
    include: { asset: true, employee: true },
    getOwnerEmployeeId: (r) => r.employeeId,
    getDepartmentId: (r) => r.asset?.departmentId || r.employee?.departmentId
  }),
  getAllocationById
);
router.post("/", authorizeRoles("ADMIN", "MANAGER"), validate({ body: allocateBody }), allocateAsset);
router.patch(
  "/:id/return",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam, body: returnBody }),
  returnAsset
);

module.exports = router;
