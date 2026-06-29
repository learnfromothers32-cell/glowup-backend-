import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, type NotificationItem } from '../../api/notifications';

const notifIconMap: Record<string, string> = {
  booking: "📅",
  stylist: "✂️",
  badge: "🏆",
  promo: "🎁",
  reminder: "⏰",
  waitlist: "🔔",
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (p: number) => {
    setLoading(true);
    try {
      const data = await getNotifications(p, 20);
      setNotifications(data.notifications);
      setTotalPages(data.pagination.pages);
      setPage(data.pagination.page);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(1); }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try { await markAsRead(id); } catch { fetchNotifications(page); }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await markAllAsRead(); } catch { fetchNotifications(page); }
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    try { await deleteNotification(id); } catch { fetchNotifications(page); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-300 hover:bg-gray-200 rounded-xl transition-colors">
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/40">
              <div className="w-8 h-8 rounded-full skeleton-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 skeleton-pulse rounded" />
                <div className="h-3 w-1/4 skeleton-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={40} className="mx-auto mb-4 text-text-muted dark:text-text-dark-muted" />
          <p className="text-text-muted dark:text-text-dark-muted text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${!n.read ? 'bg-blue-50/40 border-blue-100' : 'bg-white dark:bg-surface-dark-secondary border-gray-100 dark:border-gray-700/40'}`}>
              <span className="text-xl mt-0.5">{notifIconMap[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-semibold text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>{n.message}</p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button onClick={() => handleMarkRead(n._id)}
                    className="p-1.5 rounded-xl text-text-muted dark:text-text-dark-muted hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Check size={14} />
                  </button>
                )}
                <button onClick={() => handleDelete(n._id)}
                  className="p-1.5 rounded-xl text-text-muted dark:text-text-dark-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => fetchNotifications(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary">Previous</button>
          <span className="text-sm text-text-secondary dark:text-text-dark-secondary">Page {page} of {totalPages}</span>
          <button onClick={() => fetchNotifications(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary">Next</button>
        </div>
      )}
    </motion.div>
  );
}
