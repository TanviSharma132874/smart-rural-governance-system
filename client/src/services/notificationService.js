import apiClient from "../api/apiClient";

const notificationService = {
  /**
   * Fetches a paginated list of notifications.
   * @param {Object} params - Query parameters (page, limit, type).
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get("/notifications", { params });
    return {
      notifications: response.data.data || [],
      pagination: response.data.pagination || null,
    };
  },

  /**
   * Fetches the count of unread private notifications.
   */
  async getUnreadCount() {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data.data.unreadCount;
  },

  /**
   * Marks a specific notification as read.
   * @param {string} notificationId - The ID of the notification.
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data.data.notification;
  },

  /**
   * Marks all private notifications for the user as read.
   */
  async markAllAsRead() {
    const response = await apiClient.patch("/notifications/read-all");
    return response.data;
  },

  /**
   * Deletes a specific notification.
   * @param {string} notificationId - The ID of the notification.
   */
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
