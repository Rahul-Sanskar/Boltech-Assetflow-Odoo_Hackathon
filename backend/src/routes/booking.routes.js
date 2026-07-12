const express = require("express");
const { getBookings, getBookingById, createBooking, cancelBooking } = require("../controllers/booking.controller");
const router = express.Router();

router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.patch("/:id/cancel", cancelBooking);

module.exports = router;
