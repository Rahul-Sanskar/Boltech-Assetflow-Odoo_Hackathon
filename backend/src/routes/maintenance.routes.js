const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  enforceSelfAsOwner,
  assertBodyEmployeeInScope,
  assertBodyAssetInScope,
  requireResourceAccess
} = require("../middleware/ownership");
const {
  getMaintenanceRequests,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance
} = require("../controllers/maintenance.controller");
const {
  idParam,
  createMaintenanceBody,
  updateMaintenanceBody,
  maintenanceQuery
} = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ query: maintenanceQuery }),
  getMaintenanceRequests
);
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  requireResourceAccess({
    model: "maintenanceRequest",
    include: { asset: true, requestedBy: true },
    getOwnerEmployeeId: (r) => r.requestedById,
    getDepartmentId: (r) => r.asset?.departmentId || r.requestedBy?.departmentId
  }),
  getMaintenanceById
);
router.post(
  "/",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ body: createMaintenanceBody }),
  enforceSelfAsOwner("requestedById"),
  assertBodyEmployeeInScope("requestedById"),
  assertBodyAssetInScope("assetId"),
  createMaintenance
);
router.patch(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam, body: updateMaintenanceBody }),
  updateMaintenance
);

module.exports = router;
