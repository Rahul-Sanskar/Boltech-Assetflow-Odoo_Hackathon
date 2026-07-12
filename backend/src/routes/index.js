const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");
const categoryRoutes = require("./category.routes");
const employeeRoutes = require("./employee.routes");
const assetRoutes = require("./asset.routes");
const allocationRoutes = require("./allocation.routes");
const bookingRoutes = require("./booking.routes");
const maintenanceRoutes = require("./maintenance.routes");
const auditRoutes = require("./audit.routes");
const reportRoutes = require("./report.routes");
const notificationRoutes = require("./notification.routes");
const transferRoutes = require("./transfer.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/categories", categoryRoutes);
router.use("/employees", employeeRoutes);
router.use("/assets", assetRoutes);
router.use("/allocations", allocationRoutes);
router.use("/bookings", bookingRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/audits", auditRoutes);
router.use("/reports", reportRoutes);
router.use("/notifications", notificationRoutes);
router.use("/transfers", transferRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
