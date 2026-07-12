const prisma = require("../config/db");

exports.getAssets = async (req, res) => {
  try {
    const { status, departmentId, categoryId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (departmentId) where.departmentId = Number(departmentId);
    if (categoryId) where.categoryId = Number(categoryId);

    const assets = await prisma.asset.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } }
      }
    });
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        department: true,
        category: true,
        employee: true,
        allocations: { include: { employee: true } },
        maintenanceRequests: true,
        bookings: true,
        auditItems: true
      }
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const { name, assetTag, serialNumber, condition, location, acquisitionDate, acquisitionCost, photo, isBookable, departmentId, categoryId } = req.body;

    if (!name || !assetTag || !departmentId || !categoryId) {
      return res.status(400).json({ error: "Name, assetTag, departmentId and categoryId are required" });
    }

    const asset = await prisma.asset.create({
      data: {
        name,
        assetTag,
        serialNumber: serialNumber || null,
        condition: condition || "Good",
        location: location || null,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionCost: acquisitionCost ? Number(acquisitionCost) : null,
        photo: photo || null,
        isBookable: isBookable || false,
        departmentId: Number(departmentId),
        categoryId: Number(categoryId)
      }
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { name, status, condition, location, photo, isBookable, departmentId, categoryId } = req.body;
    const data = {};

    if (name) data.name = name;
    if (status) data.status = status;
    if (condition) data.condition = condition;
    if (location !== undefined) data.location = location;
    if (photo !== undefined) data.photo = photo;
    if (isBookable !== undefined) data.isBookable = isBookable;
    if (departmentId) data.departmentId = Number(departmentId);
    if (categoryId) data.categoryId = Number(categoryId);

    const asset = await prisma.asset.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    await prisma.asset.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
