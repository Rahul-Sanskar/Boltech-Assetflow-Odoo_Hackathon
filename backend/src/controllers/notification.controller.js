const prisma = require("../config/db");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: Number(req.params.id) },
      data: { isRead: true }
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { userId, type, message } = req.body;

    if (!userId || !type || !message) {
      return res.status(400).json({ error: "userId, type and message are required" });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: Number(userId),
        type,
        message
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const { entity, userId } = req.query;
    const where = {};

    if (entity) where.entity = entity;
    if (userId) where.userId = Number(userId);

    const logs = await prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
