const asyncHandler = require("../utils/asyncHandler");
const sendSuccess = require("../utils/apiResponse");
const AppError = require("../utils/AppError");
const notificationService = require("../services/notificationService");

/**
 * Derives room names from the authenticated user context.
 * Replicated from socket logic to ensure consistency and prevent spoofing.
 */
const deriveUserRooms = (user = {}) => {
  const rooms = [];
  if (user.id) rooms.push(`user:${user.id}`);
  if (user.role) rooms.push(`role:${user.role}`);
  if (user.department) rooms.push(`department:${user.department}`);
  if (user.state) rooms.push(`state:${user.state}`);
  if (user.district) rooms.push(`district:${user.district}`);
  if (user.jurisdictionType) rooms.push(`jurisdiction:${user.jurisdictionType}`);
  if (user.village) rooms.push(`village:${user.village}`);
  if (user.municipality) rooms.push(`municipality:${user.municipality}`);
  return rooms;
};

/**
 * Fetches notifications for the authenticated user.
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const rooms = deriveUserRooms(req.user);
  const result = await notificationService.getNotifications(req.user, rooms, req.query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Notifications fetched successfully",
    pagination: result.pagination,
    data: result.notifications,
  });
});

/**
 * Fetches the count of unread private notifications.
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);

  sendSuccess(res, {
    statusCode: 200,
    message: "Unread count fetched successfully",
    data: { unreadCount: count },
  });
});

/**
 * Marks a specific notification as read.
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);

  if (!notification) {
    throw new AppError("Notification not found or access denied", 404);
  }

  sendSuccess(res, {
    statusCode: 200,
    message: "Notification marked as read",
    data: { notification },
  });
});

/**
 * Marks all notifications for the user as read.
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);

  sendSuccess(res, {
    statusCode: 200,
    message: "All notifications marked as read",
  });
});

/**
 * Deletes a specific notification.
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(req.params.id, req.user.id);

  if (!notification) {
    throw new AppError("Notification not found or access denied", 404);
  }

  sendSuccess(res, {
    statusCode: 200,
    message: "Notification deleted successfully",
  });
});

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
