const prisma = require("../config/db");

exports.getAssetsByDepartment = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { assets: true } }
      }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssetsByCategory = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { assets: true } }
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssetsByStatus = async (req, res) => {
  try {
    const statuses = ["Available", "Allocated", "Under Maintenance", "Retired", "Lost"];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.asset.count({ where: { status } })
      }))
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaintenanceSummary = async (req, res) => {
  try {
    const statuses = ["Pending", "In Progress", "Resolved"];
    const result = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await prisma.maintenanceRequest.count({ where: { status } })
      }))
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
