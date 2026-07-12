const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { isAdmin, isManager } = require("../utils/scope");

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });

  return sendSuccess(res, { message: "Notifications retrieved", data: notifications });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const existing = await prisma.notification.findUnique({
    where: { id: Number(req.params.id) }
  });

  if (!existing) {
    throw new AppError("Notification not found", 404);
  }

  if (existing.userId !== req.user.id && !isAdmin(req.user)) {
    throw new AppError("You can only update your own notifications", 403);
  }

  const notification = await prisma.notification.update({
    where: { id: existing.id },
    data: { isRead: true }
  });

  return sendSuccess(res, { message: "Notification marked as read", data: notification });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true }
  });

  return sendSuccess(res, { message: "All notifications marked as read", data: null });
});

exports.createNotification = asyncHandler(async (req, res) => {
  const { userId, type, message } = req.body;

  const notification = await prisma.notification.create({
    data: {
      userId: Number(userId),
      type,
      message
    }
  });

  return sendSuccess(res, { statusCode: 201, message: "Notification created", data: notification });
});

exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { entity, userId } = req.query;
  const where = {};

  if (entity) where.entity = entity;

  if (isAdmin(req.user)) {
    if (userId) where.userId = Number(userId);
  } else if (isManager(req.user)) {
    where.user = { employee: { departmentId: req.user.departmentId } };
    if (userId) where.userId = Number(userId);
  } else {
    where.userId = req.user.id;
  }

  const logs = await prisma.activityLog.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return sendSuccess(res, { message: "Activity logs retrieved", data: logs });
});
