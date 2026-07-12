const prisma = require("../config/db");

exports.getTransfers = async (req, res) => {
  try {
    const transfers = await prisma.transferRequest.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        requestedBy: { select: { id: true, name: true } }
      }
    });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTransferById = async (req, res) => {
  try {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: Number(req.params.id) },
      include: { asset: true, requestedBy: true }
    });

    if (!transfer) {
      return res.status(404).json({ error: "Transfer request not found" });
    }

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { assetId, requestedById } = req.body;

    if (!assetId || !requestedById) {
      return res.status(400).json({ error: "assetId and requestedById are required" });
    }

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId: Number(assetId),
        requestedById: Number(requestedById)
      }
    });

    res.status(201).json(transfer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveTransfer = async (req, res) => {
  try {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!transfer || transfer.status !== "Requested") {
      return res.status(400).json({ error: "Transfer not found or already processed" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transferRequest.update({
        where: { id: transfer.id },
        data: { status: "Approved", approvedDate: new Date() }
      });

      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { employeeId: transfer.requestedById, status: "Allocated" }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectTransfer = async (req, res) => {
  try {
    const { rejectedReason } = req.body;

    const updated = await prisma.transferRequest.update({
      where: { id: Number(req.params.id) },
      data: {
        status: "Rejected",
        rejectedReason: rejectedReason || null
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
