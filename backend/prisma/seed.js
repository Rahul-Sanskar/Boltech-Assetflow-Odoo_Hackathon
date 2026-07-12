require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AssetFlow demo data...");

  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditAssignment.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // Create initial departments
  const it = await prisma.department.create({ data: { name: "IT" } });
  const hr = await prisma.department.create({ data: { name: "HR" } });
  const facilities = await prisma.department.create({
    data: { name: "Facilities", parentId: it.id }
  });

  // Create initial categories
  const laptops = await prisma.category.create({ data: { name: "Laptops" } });
  const monitors = await prisma.category.create({ data: { name: "Monitors" } });
  const rooms = await prisma.category.create({
    data: { name: "Meeting Rooms", customFields: JSON.stringify({ capacity: true }) }
  });

  // Create initial users with hashed passwords
  const adminPassword = await bcrypt.hash("adminpassword", 10);
  const managerPassword = await bcrypt.hash("managerpassword", 10);
  const employeePassword = await bcrypt.hash("employeepassword", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      name: "Manager User",
      email: "manager@example.com",
      password: managerPassword,
      role: "MANAGER",
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      name: "Employee User",
      email: "employee@example.com",
      password: employeePassword,
      role: "EMPLOYEE",
    },
  });
// Duplicate employee user creation removed.

  const employee2User = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "alex@example.com",
      password: employeePassword,
      role: "EMPLOYEE"
    }
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      departmentId: it.id,
      userId: adminUser.id
    }
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      name: "Manager User",
      email: "manager@example.com",
      departmentId: hr.id,
      userId: managerUser.id
    }
  });

  const normalEmployee = await prisma.employee.create({
    data: {
      name: "Employee User",
      email: "employee@example.com",
      departmentId: it.id,
      userId: employeeUser.id
    }
  });

  const alexEmployee = await prisma.employee.create({
    data: {
      name: "Alex Rivera",
      email: "alex@example.com",
      departmentId: it.id,
      userId: employee2User.id
    }
  });

  await prisma.department.update({
    where: { id: it.id },
    data: { headId: adminEmployee.id }
  });

  await prisma.department.update({
    where: { id: hr.id },
    data: { headId: managerEmployee.id }
  });

  await prisma.department.update({
    where: { id: facilities.id },
    data: { headId: alexEmployee.id }
  });

  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  const inFourteenDays = new Date(now.getTime() + 14 * 24 * 3600 * 1000);

  // Available laptop
  const availableLaptop = await prisma.asset.create({
    data: {
      name: "MacBook Pro 16",
      assetTag: "AF-0001",
      serialNumber: "SN12345",
      status: "Available",
      condition: "Good",
      location: "Office Room 101",
      acquisitionDate: new Date("2024-01-15"),
      acquisitionCost: 2500,
      departmentId: it.id,
      categoryId: laptops.id
    }
  });

  // Allocated monitor to employee
  const allocatedMonitor = await prisma.asset.create({
    data: {
      name: "Dell UltraSharp 27",
      assetTag: "AF-0002",
      serialNumber: "SN54321",
      status: "Allocated",
      condition: "Good",
      location: "Office Room 102",
      acquisitionDate: new Date("2023-06-01"),
      acquisitionCost: 600,
      departmentId: it.id,
      categoryId: monitors.id,
      employeeId: normalEmployee.id
    }
  });

  // Allocated laptop to alex (transfer demo source)
  const transferLaptop = await prisma.asset.create({
    data: {
      name: "ThinkPad T14",
      assetTag: "AF-0003",
      serialNumber: "SN98765",
      status: "Allocated",
      condition: "Fair",
      location: "Office Room 103",
      acquisitionDate: new Date("2022-09-10"),
      acquisitionCost: 1200,
      departmentId: it.id,
      categoryId: laptops.id,
      employeeId: alexEmployee.id
    }
  });

  // Bookable meeting room
  const meetingRoom = await prisma.asset.create({
    data: {
      name: "Conference Room B2",
      assetTag: "AF-ROOM-B2",
      status: "Available",
      condition: "Good",
      location: "Floor 2",
      isBookable: true,
      departmentId: facilities.id,
      categoryId: rooms.id,
      acquisitionCost: 0
    }
  });

  // Under maintenance asset with pending/approved style demo
  const maintenanceAsset = await prisma.asset.create({
    data: {
      name: "HP EliteBook 840",
      assetTag: "AF-0004",
      serialNumber: "SN84001",
      status: "Under Maintenance",
      condition: "Fair",
      location: "IT Workshop",
      acquisitionCost: 1100,
      departmentId: it.id,
      categoryId: laptops.id,
      employeeId: normalEmployee.id
    }
  });

  // Retired asset for lifecycle demos
  await prisma.asset.create({
    data: {
      name: "Old Dell Latitude",
      assetTag: "AF-0005",
      serialNumber: "SNOLD01",
      status: "Retired",
      condition: "Poor",
      location: "Storage",
      acquisitionCost: 400,
      departmentId: hr.id,
      categoryId: laptops.id
    }
  });

  const monitorAllocation = await prisma.allocation.create({
    data: {
      assetId: allocatedMonitor.id,
      employeeId: normalEmployee.id,
      expectedReturn: inFourteenDays,
      status: "Allocated"
    }
  });

  const alexAllocation = await prisma.allocation.create({
    data: {
      assetId: transferLaptop.id,
      employeeId: alexEmployee.id,
      expectedReturn: inSevenDays,
      status: "Allocated"
    }
  });

  const maintenanceAllocation = await prisma.allocation.create({
    data: {
      assetId: maintenanceAsset.id,
      employeeId: normalEmployee.id,
      expectedReturn: inFourteenDays,
      status: "Allocated"
    }
  });

  // Historical returned allocation
  await prisma.allocation.create({
    data: {
      assetId: availableLaptop.id,
      employeeId: alexEmployee.id,
      allocatedDate: new Date(now.getTime() - 30 * 24 * 3600 * 1000),
      returnedDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      returnNotes: "Returned in good condition",
      status: "Returned"
    }
  });

  await prisma.transferRequest.create({
    data: {
      assetId: transferLaptop.id,
      requestedById: normalEmployee.id,
      status: "Requested"
    }
  });

  // Past rejected transfer for history
  await prisma.transferRequest.create({
    data: {
      assetId: allocatedMonitor.id,
      requestedById: alexEmployee.id,
      status: "Rejected",
      rejectedReason: "Monitor required for current project"
    }
  });

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const bookingStart = new Date(day.getTime() + 10 * 3600 * 1000);
  const bookingEnd = new Date(day.getTime() + 11 * 3600 * 1000);
  const booking2Start = new Date(day.getTime() + 14 * 3600 * 1000);
  const booking2End = new Date(day.getTime() + 15 * 3600 * 1000);

  const primaryBooking = await prisma.booking.create({
    data: {
      assetId: meetingRoom.id,
      employeeId: normalEmployee.id,
      startTime: bookingStart,
      endTime: bookingEnd,
      status: "Upcoming"
    }
  });

  await prisma.booking.create({
    data: {
      assetId: meetingRoom.id,
      employeeId: managerEmployee.id,
      startTime: booking2Start,
      endTime: booking2End,
      status: "Upcoming"
    }
  });

  await prisma.booking.create({
    data: {
      assetId: meetingRoom.id,
      employeeId: alexEmployee.id,
      startTime: new Date(day.getTime() - 24 * 3600 * 1000 + 9 * 3600 * 1000),
      endTime: new Date(day.getTime() - 24 * 3600 * 1000 + 10 * 3600 * 1000),
      status: "Cancelled"
    }
  });

  const approvedMaintenance = await prisma.maintenanceRequest.create({
    data: {
      assetId: maintenanceAsset.id,
      requestedById: normalEmployee.id,
      description: "Battery not charging; intermittent power loss",
      priority: "High",
      status: "Approved",
      technicianId: adminUser.id
    }
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: allocatedMonitor.id,
      requestedById: normalEmployee.id,
      description: "Screen flicker at high brightness",
      priority: "Medium",
      status: "Pending"
    }
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: availableLaptop.id,
      requestedById: alexEmployee.id,
      description: "Keyboard key sticking (resolved)",
      priority: "Low",
      status: "Resolved",
      technicianId: adminUser.id,
      resolvedDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000)
    }
  });

  const auditCycle = await prisma.auditCycle.create({
    data: {
      name: "Q3 IT Inventory Audit",
      scope: "Department",
      departmentId: it.id,
      location: "Building A",
      startDate: now,
      endDate: inFourteenDays,
      status: "Open"
    }
  });

  await prisma.auditAssignment.create({
    data: {
      auditCycleId: auditCycle.id,
      auditorId: managerUser.id
    }
  });

  await prisma.auditAssignment.create({
    data: {
      auditCycleId: auditCycle.id,
      auditorId: adminUser.id
    }
  });

  await prisma.auditItem.createMany({
    data: [
      { auditCycleId: auditCycle.id, assetId: availableLaptop.id, result: "Verified", notes: "On shelf" },
      { auditCycleId: auditCycle.id, assetId: allocatedMonitor.id, result: "Verified", notes: "At desk" },
      { auditCycleId: auditCycle.id, assetId: transferLaptop.id, result: null, notes: null },
      { auditCycleId: auditCycle.id, assetId: maintenanceAsset.id, result: "Damaged", notes: "In workshop" }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: employeeUser.id,
        type: "Asset Assigned",
        message: `Asset "${allocatedMonitor.name}" has been allocated to you`
      },
      {
        userId: employeeUser.id,
        type: "Booking Confirmed",
        message: `Booking confirmed for asset "${meetingRoom.name}"`
      },
      {
        userId: employee2User.id,
        type: "Transfer Requested",
        message: `A transfer was requested for asset "${transferLaptop.name}"`
      },
      {
        userId: managerUser.id,
        type: "Maintenance Pending",
        message: "A new maintenance request awaits review"
      },
      {
        userId: adminUser.id,
        type: "Audit Reminder",
        message: `Audit cycle "${auditCycle.name}" is open`
      }
    ]
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "ALLOCATE",
        entity: "Allocation",
        entityId: monitorAllocation.id,
        details: `Asset ${allocatedMonitor.id} allocated to employee ${normalEmployee.id}`
      },
      {
        userId: adminUser.id,
        action: "ALLOCATE",
        entity: "Allocation",
        entityId: alexAllocation.id,
        details: `Asset ${transferLaptop.id} allocated to employee ${alexEmployee.id}`
      },
      {
        userId: adminUser.id,
        action: "MAINTENANCE_APPROVE",
        entity: "MaintenanceRequest",
        entityId: approvedMaintenance.id,
        details: `Asset ${maintenanceAsset.id} set to Under Maintenance`
      },
      {
        userId: employeeUser.id,
        action: "BOOKING_CREATE",
        entity: "Booking",
        entityId: primaryBooking.id,
        details: `Booking created for asset ${meetingRoom.id}`
      }
    ]
  });

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log("  admin@example.com / adminpassword (ADMIN)");
  console.log("  manager@example.com / managerpassword (MANAGER)");
  console.log("  employee@example.com / employeepassword (EMPLOYEE)");
  console.log("  alex@example.com / employeepassword (EMPLOYEE)");
  console.log(
    `Assets: available=${availableLaptop.assetTag}, allocated=${allocatedMonitor.assetTag}, ` +
      `transfer=${transferLaptop.assetTag}, bookable=${meetingRoom.assetTag}, ` +
      `maintenance=${maintenanceAsset.assetTag}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
