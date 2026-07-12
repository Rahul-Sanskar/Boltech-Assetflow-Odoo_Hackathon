const prisma = require("../config/db");

exports.getMaintenanceRequests = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        requestedBy: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: Number(req.params.id) },
      include: { asset: true, requestedBy: true, technician: true }
    });

    if (!request) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const { assetId, requestedById, description, priority, photo } = req.body;

    if (!assetId || !requestedById || !description) {
      return res.status(400).json({ error: "assetId, requestedById and description are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.create({
        data: {
          assetId: Number(assetId),
          requestedById: Number(requestedById),
          description,
          priority: priority || "Medium",
          photo: photo || null
        }
      });

      await tx.asset.update({
        where: { id: Number(assetId) },
        data: { status: "Under Maintenance" }
      });

      return request;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { status, technicianId, resolvedDate } = req.body;
    const data = {};

    if (status) data.status = status;
    if (technicianId) data.technicianId = Number(technicianId);
    if (resolvedDate) data.resolvedDate = new Date(resolvedDate);

    if (status === "Resolved") {
      data.resolvedDate = new Date();

      const request = await prisma.maintenanceRequest.findUnique({
        where: { id: Number(req.params.id) }
      });

      if (request) {
        await prisma.asset.update({
          where: { id: request.assetId },
          data: { status: "Available" }
        });
      }
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
