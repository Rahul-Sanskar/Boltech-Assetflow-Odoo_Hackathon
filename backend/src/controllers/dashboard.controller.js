const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { isAdmin, isManager, isEmployee } = require("../utils/scope");

exports.getDashboard = asyncHandler(async (req, res) => {
  if (isEmployee(req.user)) {
    const employeeId = req.user.employeeId;
    const [
      myAllocations,
      myBookings,
      myMaintenance,
      myTransfers,
      recentAllocations,
      recentMaintenance
    ] = await Promise.all([
      prisma.allocation.count({ where: { employeeId, status: "Allocated" } }),
      prisma.booking.count({ where: { employeeId, status: "Upcoming" } }),
      prisma.maintenanceRequest.count({ where: { requestedById: employeeId, status: "Pending" } }),
      prisma.transferRequest.count({ where: { requestedById: employeeId, status: "Requested" } }),
      prisma.allocation.findMany({
        where: { employeeId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          asset: { select: { name: true, assetTag: true } },
          employee: { select: { name: true } }
        }
      }),
      prisma.maintenanceRequest.findMany({
        where: { requestedById: employeeId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          asset: { select: { name: true, assetTag: true } },
          requestedBy: { select: { name: true } }
        }
      })
    ]);

    return sendSuccess(res, {
      message: "Personal dashboard retrieved",
      data: {
        stats: {
          myAllocations,
          myBookings,
          myMaintenance,
          myTransfers
        },
        recentAllocations,
        recentMaintenance
      }
    });
  }

  const deptId = isManager(req.user) ? req.user.departmentId : null;
  const assetWhere = deptId ? { departmentId: deptId } : {};
  const employeeWhere = deptId ? { departmentId: deptId } : {};
  const maintenanceWhere = deptId
    ? {
        OR: [
          { asset: { departmentId: deptId } },
          { requestedBy: { departmentId: deptId } }
        ]
      }
    : {};
  const bookingWhere = deptId
    ? {
        OR: [
          { asset: { departmentId: deptId } },
          { employee: { departmentId: deptId } }
        ],
        status: "Upcoming"
      }
    : { status: "Upcoming" };

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
    prisma.asset.count({ where: assetWhere }),
    prisma.asset.count({ where: { ...assetWhere, status: "Available" } }),
    prisma.asset.count({ where: { ...assetWhere, status: "Allocated" } }),
    prisma.asset.count({ where: { ...assetWhere, status: "Under Maintenance" } }),
    prisma.employee.count({ where: employeeWhere }),
    deptId
      ? prisma.department.count({ where: { id: deptId } })
      : prisma.department.count(),
    prisma.maintenanceRequest.count({ where: { ...maintenanceWhere, status: "Pending" } }),
    prisma.booking.count({ where: bookingWhere }),
    prisma.allocation.findMany({
      where: deptId
        ? {
            OR: [
              { employee: { departmentId: deptId } },
              { asset: { departmentId: deptId } }
            ]
          }
        : {},
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { name: true, assetTag: true } },
        employee: { select: { name: true } }
      }
    }),
    prisma.maintenanceRequest.findMany({
      where: maintenanceWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { name: true, assetTag: true } },
        requestedBy: { select: { name: true } }
      }
    })
  ]);

  return sendSuccess(res, {
    message: isAdmin(req.user) ? "Organization dashboard retrieved" : "Department dashboard retrieved",
    data: {
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
    }
  });
});
