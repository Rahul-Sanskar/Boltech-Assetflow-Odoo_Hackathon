const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getNotifications, markAsRead, markAllAsRead, createNotification, getActivityLogs } = require("../controllers/notification.controller");
const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.post("/", createNotification);
router.get("/activity-logs", getActivityLogs);

module.exports = router;
