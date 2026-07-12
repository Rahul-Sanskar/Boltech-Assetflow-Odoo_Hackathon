const express = require("express");
const authenticate = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  getActivityLogs
} = require("../controllers/notification.controller");
const { idParam, createNotificationBody, activityLogQuery } = require("../validators/schemas");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), getNotifications);
router.get(
  "/activity-logs",
  authorizeRoles("ADMIN", "MANAGER"),
  validate({ query: activityLogQuery }),
  getActivityLogs
);
router.patch("/read-all", authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"), markAllAsRead);
router.patch(
  "/:id/read",
  authorizeRoles("ADMIN", "MANAGER", "EMPLOYEE"),
  validate({ params: idParam }),
  markAsRead
);
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate({ body: createNotificationBody }),
  createNotification
);

module.exports = router;
