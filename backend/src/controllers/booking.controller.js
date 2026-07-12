const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { bookingListScope, isAdmin, isManager } = require("../utils/scope");

exports.getBookings = asyncHandler(async (req, res) => {
  const { status, assetId } = req.query;
  const where = { ...bookingListScope(req.user) };

  if (status) where.status = status;
  if (assetId) where.assetId = Number(assetId);

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      asset: { select: { id: true, name: true, assetTag: true } },
      employee: { select: { id: true, name: true } }
    },
    orderBy: { startTime: "asc" }
  });

  return sendSuccess(res, { message: "Bookings retrieved", data: bookings });
});

exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(req.params.id) },
    include: { asset: true, employee: true }
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  return sendSuccess(res, { message: "Booking retrieved", data: booking });
});

exports.createBooking = asyncHandler(async (req, res) => {
  const { assetId, employeeId, startTime, endTime } = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset || !asset.isBookable) {
    throw new AppError("Asset is not bookable", 400);
  }

  if (isManager(req.user) && asset.departmentId !== req.user.departmentId && !asset.isBookable) {
    throw new AppError("Asset is outside your department scope", 403);
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      assetId: Number(assetId),
      status: { not: "Cancelled" },
      startTime: { lt: new Date(endTime) },
      endTime: { gt: new Date(startTime) }
    }
  });

  if (conflict) {
    throw new AppError("Time slot conflicts with an existing booking", 409);
  }

  const booking = await prisma.booking.create({
    data: {
      assetId: Number(assetId),
      employeeId: Number(employeeId),
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Booking created", data: booking });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(req.params.id) },
    include: { employee: true, asset: true }
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (!isAdmin(req.user)) {
    if (isManager(req.user)) {
      const inScope =
        booking.employee.departmentId === req.user.departmentId ||
        booking.asset.departmentId === req.user.departmentId;
      if (!inScope) {
        throw new AppError("Booking is outside your department scope", 403);
      }
    } else if (booking.employeeId !== req.user.employeeId) {
      throw new AppError("You can only cancel your own bookings", 403);
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "Cancelled" }
  });

  return sendSuccess(res, { message: "Booking cancelled", data: updated });
});
