import api, { handleApiError } from './api.config';

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  message?: string;
  data: {
    notifications: Notification[];
    total?: number;
    page?: number;
    pages?: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

/**
 * Get user's notifications
 */
export const getNotifications = async (page = 1, limit = 20): Promise<NotificationsResponse> => {
  try {
    const response = await api.get<NotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Get notifications error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  try {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Get unread count error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark as read error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  try {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Mark all as read error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Delete notification error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  } catch (error) {
    console.error('Clear all notifications error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Register FCM/Expo push token
 */
export const registerFcmToken = async (token: string, platform: string = 'android') => {
  try {
    const response = await api.post('/notifications/fcm-token', { token, platform });
    return response.data;
  } catch (error) {
    console.error('Register FCM token error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get notification preferences from backend
 */
export const getNotificationPreferences = async () => {
  try {
    const response = await api.get('/notifications/preferences');
    return response.data;
  } catch (error) {
    console.error('Get notification preferences error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update notification preferences on backend
 */
export const updateNotificationPreferences = async (preferences: {
  pushEnabled: boolean;
  order: { id: string; enabled: boolean }[];
  promo: { id: string; enabled: boolean }[];
  social: { id: string; enabled: boolean }[];
}) => {
  try {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  } catch (error) {
    console.error('Update notification preferences error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Unregister FCM/Expo push token
 */
export const unregisterFcmToken = async (token: string) => {
  try {
    const response = await api.delete('/notifications/fcm-token', { data: { token } });
    return response.data;
  } catch (error) {
    console.error('Unregister FCM token error:', error);
    handleApiError(error);
    throw error;
  }
};
