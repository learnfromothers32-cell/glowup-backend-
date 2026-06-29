import api from './axios';

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'booking' | 'stylist' | 'badge' | 'promo' | 'reminder' | 'waitlist';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export async function getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationsResponse['data']> {
  const { data } = await api.get<NotificationsResponse>('/notifications', {
    params: { page, limit, unread: unreadOnly || undefined },
  });
  return data.data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return data.data.count;
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
