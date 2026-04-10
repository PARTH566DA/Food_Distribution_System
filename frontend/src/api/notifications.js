import { authHeader } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const call = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }

  if (!data.success) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data;
};

export const fetchNotifications = async () => {
  const feed = await call('/notifications');
  return {
    items: Array.isArray(feed?.items) ? feed.items : [],
    unreadCount: Number(feed?.unreadCount || 0),
  };
};

export const markNotificationRead = async (notificationId) => {
  await call(`/notifications/${notificationId}/read`, { method: 'PATCH' });
};

export const markAllNotificationsRead = async () => {
  await call('/notifications/read-all', { method: 'PATCH' });
};
