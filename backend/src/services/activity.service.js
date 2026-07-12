/**
 * Best-effort activity log + notification helpers used inside workflows.
 * Failures should not be silent when called inside a transaction — callers
 * pass the transaction client so writes participate in the same atomic unit.
 */

async function writeActivityLog(tx, { userId, action, entity, entityId, details }) {
  if (!userId) return null;
  return tx.activityLog.create({
    data: {
      userId: Number(userId),
      action,
      entity,
      entityId: Number(entityId),
      details: details || null
    }
  });
}

async function createNotification(tx, { userId, type, message }) {
  if (!userId) return null;
  return tx.notification.create({
    data: {
      userId: Number(userId),
      type,
      message
    }
  });
}

module.exports = {
  writeActivityLog,
  createNotification
};
