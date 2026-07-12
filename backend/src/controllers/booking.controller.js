const prisma = require("../config/db");

exports.getBookings = async (req, res) => {
  try {
    const { status, assetId } = req.query;
    const where = {};

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
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: Number(req.params.id) },
      include: { asset: true, employee: true }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { assetId, employeeId, startTime, endTime } = req.body;

    if (!assetId || !employeeId || !startTime || !endTime) {
      return res.status(400).json({ error: "assetId, employeeId, startTime and endTime are required" });
    }

    const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
    if (!asset || !asset.isBookable) {
      return res.status(400).json({ error: "Asset is not bookable" });
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
      return res.status(409).json({ error: "Time slot conflicts with an existing booking" });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId: Number(assetId),
        employeeId: Number(employeeId),
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: Number(req.params.id) },
      data: { status: "Cancelled" }
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
