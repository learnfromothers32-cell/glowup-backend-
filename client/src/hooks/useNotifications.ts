import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  type NotificationItem,
} from '../api/notifications';
import { useAuth } from '../context/authUtils';
import { onNewNotification, offNewNotification } from '../services/socket';

const POLL_INTERVAL = 30000;

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifData, count] = await Promise.all([
        getNotifications(1, 20),
        getUnreadCount(),
      ]);
      setNotifications(notifData.notifications);
      setUnreadCount(count);
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchData();

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    const handler = (data: NotificationItem) => {
      setNotifications(prev => [data, ...prev]);
      if (!data.read) setUnreadCount(prev => prev + 1);
    };
    onNewNotification(handler);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      offNewNotification(handler);
    };
  }, [isAuthenticated, fetchData]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await apiMarkAsRead(id);
    } catch {
      fetchData();
    }
  }, [fetchData]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await apiMarkAllAsRead();
    } catch {
      fetchData();
    }
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
