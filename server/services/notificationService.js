const Notification = require("../models/Notification");
const { emitRealtimeEvent } = require("../sockets");
const logger = require("../utils/logger");

/**
 * Default TTL for notifications is 30 days.
 */
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates a private notification for a specific user.
 */
const createPrivateNotification = async (payload) => {
  const expiresAt = payload.expiresAt || new Date(Date.now() + DEFAULT_TTL_MS);
  const notification = await Notification.create({
    ...payload,
    targetRoom: null, // Ensure targetRoom is null for private notifications
    expiresAt,
  });

  // Emit real-time event
  try {
    emitRealtimeEvent(`user:${payload.recipient}`, "notification:new", {
      notificationId: notification._id,
      type: notification.type,
      action: notification.action,
      priority: notification.priority,
    });
  } catch (error) {
    logger.error("Failed to emit real-time private notification event", {
      error: error.message,
      recipient: payload.recipient,
    });
  }

  return notification;
};

/**
 * Creates a notification targeted at a specific room (broadcast).
 */
const createRoomNotification = async (payload) => {
  const expiresAt = payload.expiresAt || new Date(Date.now() + DEFAULT_TTL_MS);
  const notification = await Notification.create({
    ...payload,
    recipient: null, // Ensure recipient is null for room-based notifications
    expiresAt,
  });

  // Emit real-time event
  try {
    emitRealtimeEvent(payload.targetRoom, "notification:new", {
      notificationId: notification._id,
      type: notification.type,
      action: notification.action,
      priority: notification.priority,
    });
  } catch (error) {
    logger.error("Failed to emit real-time room notification event", {
      error: error.message,
      targetRoom: payload.targetRoom,
    });
  }

  return notification;
};

/**
 * Marks a specific notification as read.
 */
const markRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true } },
    { new: true }
  );
};

/**
 * Marks all private notifications for a user as read.
 */
const markAllRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
};

/**
 * Gets the count of unread notifications for a user.
 * Note: Broadcast (room-based) notifications are not tracked via the 'read' boolean
 * and are handled by client-side timestamp comparisons or excluded from the count.
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    read: false,
  });
};

/**
 * Retrieves a paginated list of notifications for a user.
 * Combines both private notifications and relevant room-based notifications.
 */
const getNotifications = async (user, rooms = [], filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const query = {
    $or: [
      { recipient: user.id },
      { targetRoom: { $in: rooms } }
    ]
  };

  if (filters.type) {
    query.type = filters.type;
  }

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
    }
  };
};

/**
 * Deletes a specific notification.
 * Scoped to the recipient to ensure users can only delete their own notifications.
 */
const deleteNotification = async (notificationId, userId) => {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });
};

module.exports = {
  createPrivateNotification,
  createRoomNotification,
  markRead,
  markAllRead,
  getUnreadCount,
  getNotifications,
  deleteNotification,
};
