const prisma = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      underMaintenance,
      totalEmployees,
      totalDepartments,
      pendingMaintenance,
      activeBookings,
      recentAllocations,
      recentMaintenance
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "Available" } }),
      prisma.asset.count({ where: { status: "Allocated" } }),
      prisma.asset.count({ where: { status: "Under Maintenance" } }),
      prisma.employee.count(),
      prisma.department.count(),
      prisma.maintenanceRequest.count({ where: { status: "Pending" } }),
      prisma.booking.count({ where: { status: "Upcoming" } }),
      prisma.allocation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          asset: { select: { name: true, assetTag: true } },
          employee: { select: { name: true } }
        }
      }),
      prisma.maintenanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          asset: { select: { name: true, assetTag: true } },
          requestedBy: { select: { name: true } }
        }
      })
    ]);

    res.json({
      stats: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        underMaintenance,
        totalEmployees,
        totalDepartments,
        pendingMaintenance,
        activeBookings
      },
      recentAllocations,
      recentMaintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
