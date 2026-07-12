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

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Current bookings for the requested room that overlap the requested slot.
  const currentBookings = await prisma.booking.findMany({
    where: {
      assetId: Number(assetId),
      status: { not: "Cancelled" },
      startTime: { lt: end },
      endTime: { gt: start }
    },
    orderBy: { startTime: "asc" }
  });

  const conflict = currentBookings.length > 0;

  if (conflict) {
    // Available rooms: bookable assets in the same department with no overlap.
    const busyAssetIds = (
      await prisma.booking.findMany({
        where: {
          status: { not: "Cancelled" },
          startTime: { lt: end },
          endTime: { gt: start }
        },
        select: { assetId: true }
      })
    ).map((b) => b.assetId);

    const alternativeRooms = await prisma.asset.findMany({
      where: {
        isBookable: true,
        departmentId: asset.departmentId,
        id: { notIn: busyAssetIds }
      },
      select: { id: true, name: true, assetTag: true, location: true }
    });

    // Alternative timings: try shifting the slot forward by 1h up to 4h.
    const alternativeTimings = [];
    for (let shift = 1; shift <= 4; shift++) {
      const s = new Date(start.getTime() + shift * 60 * 60 * 1000);
      const e = new Date(end.getTime() + shift * 60 * 60 * 1000);
      const clash = await prisma.booking.findFirst({
        where: {
          assetId: Number(assetId),
          status: { not: "Cancelled" },
          startTime: { lt: e },
          endTime: { gt: s }
        }
      });
      if (!clash) {
        alternativeTimings.push({
          startTime: s.toISOString(),
          endTime: e.toISOString()
        });
      }
    }

    // Recommendation: prefer an alternative room, else an alternative timing.
    let recommendation;
    if (alternativeRooms.length > 0) {
      recommendation = {
        type: "alternativeRoom",
        assetId: alternativeRooms[0].id,
        message: `Room "${alternativeRooms[0].name}" is available at your requested time.`
      };
    } else if (alternativeTimings.length > 0) {
      recommendation = {
        type: "alternativeTiming",
        startTime: alternativeTimings[0].startTime,
        endTime: alternativeTimings[0].endTime,
        message: "Your requested room is free at the suggested alternative time."
      };
    } else {
      recommendation = {
        type: "none",
        message: "No alternative rooms or timings found for this request."
      };
    }

    return sendSuccess(res, {
      statusCode: 409,
      message: "Requested slot is unavailable",
      data: {
        requestedRoom: { id: asset.id, name: asset.name },
        conflict: true,
        currentBookings,
        alternativeRooms,
        alternativeTimings,
        recommendation
      }
    });
  }

  const booking = await prisma.booking.create({
    data: {
      assetId: Number(assetId),
      employeeId: Number(employeeId),
      startTime: start,
      endTime: end
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
