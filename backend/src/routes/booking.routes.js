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
  getBookings,
  getBookingById,
  createBooking,
  cancelBooking
} = require("../controllers/booking.controller");
const { idParam, createBookingBody, bookingQuery } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ query: bookingQuery }),
  getBookings
);
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  requireResourceAccess({
    model: "booking",
    include: { asset: true, employee: true },
    getOwnerEmployeeId: (r) => r.employeeId,
    getDepartmentId: (r) => r.asset?.departmentId || r.employee?.departmentId
  }),
  getBookingById
);
router.post(
  "/",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ body: createBookingBody }),
  enforceSelfAsOwner("employeeId"),
  assertBodyEmployeeInScope("employeeId"),
  assertBodyAssetInScope("assetId"),
  createBooking
);
router.patch(
  "/:id/cancel",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  cancelBooking
);

module.exports = router;
