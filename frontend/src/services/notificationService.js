import api from './apiClient';

const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications() {
    const response = await api.get('/notifications/');
    return response.data;
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id) {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread_count/');
    return response.data;
  }
};

export default notificationService;
