const prisma = require("../config/db");
const AppError = require("../utils/AppError");
const { NON_BOOKABLE, BOOKING_STATUS } = require("../constants/assetStates");
const { writeActivityLog, createNotification } = require("./activity.service");

/**
 * Create a booking with overlap detection.
 * Touching boundaries are allowed (end == next start).
 * Overlaps return 409.
 */
async function createBooking({ assetId, employeeId, startTime, endTime, actorUserId }) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!(start < end)) {
    throw new AppError("startTime must be before endTime", 400);
  }

  const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
  if (!asset) {
    throw new AppError("Asset not found", 404);
  }

  if (!asset.isBookable) {
    throw new AppError("Asset is not bookable", 400);
  }

  if (NON_BOOKABLE.has(asset.status)) {
    throw new AppError(`Cannot book asset with status "${asset.status}"`, 400);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: Number(employeeId) },
    include: { user: { select: { id: true } } }
  });
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    const conflict = await tx.booking.findFirst({
      where: {
        assetId: Number(assetId),
        status: { not: BOOKING_STATUS.CANCELLED },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });

    if (conflict) {
      throw new AppError("Time slot conflicts with an existing booking", 409);
    }

    const booking = await tx.booking.create({
      data: {
        assetId: Number(assetId),
        employeeId: Number(employeeId),
        startTime: start,
        endTime: end,
        status: BOOKING_STATUS.UPCOMING
      }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "BOOKING_CREATE",
      entity: "Booking",
      entityId: booking.id,
      details: `Booking created for asset ${assetId}`
    });

    if (employee.user?.id) {
      await createNotification(tx, {
        userId: employee.user.id,
        type: "Booking Confirmed",
        message: `Booking confirmed for asset "${asset.name}"`
      });
    }

    return booking;
  });
}

async function cancelBooking({ bookingId, actorUserId }) {
  const booking = await prisma.booking.findUnique({
    where: { id: Number(bookingId) },
    include: { employee: { include: { user: { select: { id: true } } } }, asset: true }
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new AppError("Booking already cancelled", 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: { status: BOOKING_STATUS.CANCELLED }
    });

    await writeActivityLog(tx, {
      userId: actorUserId,
      action: "BOOKING_CANCEL",
      entity: "Booking",
      entityId: updated.id,
      details: `Booking ${booking.id} cancelled`
    });

    if (booking.employee?.user?.id) {
      await createNotification(tx, {
        userId: booking.employee.user.id,
        type: "Booking Cancelled",
        message: `Booking for asset "${booking.asset.name}" was cancelled`
      });
    }

    return updated;
  });
}

module.exports = {
  createBooking,
  cancelBooking
};
