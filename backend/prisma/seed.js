require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
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
  const facilities = await prisma.department.create({ data: { name: "Facilities" } });

  // Create initial categories
  const laptops = await prisma.category.create({ data: { name: "Laptops" } });
  const monitors = await prisma.category.create({ data: { name: "Monitors" } });

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

  await prisma.department.update({
    where: { id: it.id },
    data: { headId: adminEmployee.id }
  });

  await prisma.department.update({
    where: { id: hr.id },
    data: { headId: managerEmployee.id }
  });

  const asset1 = await prisma.asset.create({
    data: {
      name: "MacBook Pro 16",
      assetTag: "AF-0001",
      serialNumber: "SN12345",
      status: "Available",
      condition: "Good",
      location: "Office Room 101",
      acquisitionCost: 2500,
      departmentId: it.id,
      categoryId: laptops.id
    }
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: "Dell UltraSharp 27",
      assetTag: "AF-0002",
      serialNumber: "SN54321",
      status: "Available",
      condition: "Good",
      location: "Office Room 102",
      acquisitionCost: 600,
      departmentId: it.id,
      categoryId: monitors.id
    }
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: "ThinkPad T14",
      assetTag: "AF-0003",
      serialNumber: "SN98765",
      status: "Available",
      condition: "Fair",
      location: "Office Room 103",
      acquisitionCost: 1200,
      departmentId: hr.id,
      categoryId: laptops.id
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
