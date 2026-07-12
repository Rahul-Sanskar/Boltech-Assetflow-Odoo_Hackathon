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
  getTransfers,
  getTransferById,
  createTransfer,
  approveTransfer,
  rejectTransfer
} = require("../controllers/transfer.controller");
const { idParam, createTransferBody, rejectTransferBody } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getTransfers);
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  requireResourceAccess({
    model: "transferRequest",
    include: { asset: true, requestedBy: true },
    getOwnerEmployeeId: (r) => r.requestedById,
    getDepartmentId: (r) => r.asset?.departmentId || r.requestedBy?.departmentId
  }),
  getTransferById
);
router.post(
  "/",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ body: createTransferBody }),
  enforceSelfAsOwner("requestedById"),
  assertBodyEmployeeInScope("requestedById"),
  assertBodyAssetInScope("assetId"),
  createTransfer
);
router.patch(
  "/:id/approve",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam }),
  approveTransfer
);
router.patch(
  "/:id/reject",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ params: idParam, body: rejectTransferBody }),
  rejectTransfer
);

module.exports = router;
