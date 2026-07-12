const prisma = require("../config/db");

exports.getAllocations = async (req, res) => {
  try {
    const allocations = await prisma.allocation.findMany({
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        employee: { select: { id: true, name: true } }
      }
    });
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllocationById = async (req, res) => {
  try {
    const allocation = await prisma.allocation.findUnique({
      where: { id: Number(req.params.id) },
      include: { asset: true, employee: true }
    });

    if (!allocation) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.allocateAsset = async (req, res) => {
  try {
    const { assetId, employeeId, expectedReturn } = req.body;

    if (!assetId || !employeeId) {
      return res.status(400).json({ error: "assetId and employeeId are required" });
    }

    const asset = await prisma.asset.findUnique({ where: { id: Number(assetId) } });
    if (!asset || asset.status !== "Available") {
      return res.status(400).json({ error: "Asset is not available for allocation" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.create({
        data: {
          assetId: Number(assetId),
          employeeId: Number(employeeId),
          expectedReturn: expectedReturn ? new Date(expectedReturn) : null
        }
      });

      await tx.asset.update({
        where: { id: Number(assetId) },
        data: { status: "Allocated", employeeId: Number(employeeId) }
      });

      return allocation;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const { returnNotes } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!allocation || allocation.status !== "Allocated") {
      return res.status(400).json({ error: "Allocation not found or already returned" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          status: "Returned",
          returnedDate: new Date(),
          returnNotes: returnNotes || null
        }
      });

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: "Available", employeeId: null }
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
