import axios from "./axios";

const NOTIFICATION_API_BASE = "/api/v1/notifications";

export const notificationApi = {
  /**
   * Get all notifications for the authenticated user
   */
  getAll: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.isRead !== undefined) {
      params.append("isRead", options.isRead);
    }
    if (options.limit) {
      params.append("limit", options.limit);
    }
    if (options.offset) {
      params.append("offset", options.offset);
    }
    // Add cache-busting timestamp to ensure fresh data
    params.append("_t", Date.now());

    const queryString = params.toString();
    const url = queryString
      ? `${NOTIFICATION_API_BASE}?${queryString}`
      : `${NOTIFICATION_API_BASE}?_t=${Date.now()}`;

    const response = await axios.get(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    const response = await axios.get(`${NOTIFICATION_API_BASE}/unread-count?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id) => {
    const response = await axios.patch(`${NOTIFICATION_API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await axios.patch(NOTIFICATION_API_BASE);
    return response.data;
  },

  /**
   * Delete notification
   */
  delete: async (id) => {
    const response = await axios.delete(`${NOTIFICATION_API_BASE}/${id}`);
    return response.data;
  },

  /**
   * Delete all read notifications
   */
  deleteAllRead: async () => {
    const response = await axios.delete(NOTIFICATION_API_BASE);
    return response.data;
  },
};

export const NOTIFICATION_TYPE = {
  MAINTENANCE_REQUEST: "MAINTENANCE_REQUEST",
  MAINTENANCE_MESSAGE: "MAINTENANCE_MESSAGE",
};

