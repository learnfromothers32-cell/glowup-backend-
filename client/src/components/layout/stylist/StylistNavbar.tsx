import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  MessageSquare,
  CalendarDays,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/authUtils";
import { useNotifications } from "../../../hooks/useNotifications";
import { getUnreadConversationsCount } from "../../../api/conversations";

const notifIconMap: Record<string, string> = {
  booking: "📅",
  stylist: "✂️",
  badge: "🏆",
  promo: "🎁",
  reminder: "⏰",
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

interface StylistNavbarProps {
  onMenuToggle?: () => void;
}

export default function StylistNavbar({ onMenuToggle }: StylistNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
        setExpandedNotifId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await getUnreadConversationsCount();
        setUnreadMessages(count);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate("/");
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setExpandedNotifId((prev) => (prev === id ? null : id));
  };

  const handleNotificationNavigate = (link: string) => {
    setNotificationsOpen(false);
    setExpandedNotifId(null);
    navigate(link);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/92 dark:bg-surface-dark-secondary/92 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 h-14 sm:h-16">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
          >
            <Menu size={18} className="sm:size-[20px] text-gray-900 dark:text-text-dark-primary" />
          </button>

          <button
            onClick={() => navigate("/stylist/dashboard")}
            className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-text-dark-primary"
          >
            GlowUp
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate("/app")}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/20 transition-colors"
          >
            <ExternalLink size={16} />
            Client App
          </button>

          <button
            onClick={() => navigate("/stylist/bookings")}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
          >
            <CalendarDays size={16} />
            Bookings
          </button>

          <button
            onClick={() => navigate("/stylist/messages")}
            className="relative p-2 rounded-lg text-gray-500 dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
          >
            <MessageSquare size={18} />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 text-[10px] bg-black dark:bg-stylist-500 text-white rounded-full px-1 leading-tight min-w-[16px] text-center">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotificationsOpen((v) => !v);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-lg text-gray-500 dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 text-[10px] bg-red-500 text-white rounded-full px-1 leading-tight min-w-[16px] text-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="fixed sm:absolute inset-x-0 sm:inset-x-auto top-16 sm:top-full sm:mt-2 w-full sm:w-[380px] sm:right-0 bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-text-dark-primary">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-gray-500 dark:text-text-dark-secondary hover:text-gray-900 dark:hover:text-text-dark-primary transition-colors flex items-center gap-1"
                      >
                        <Check size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto overscroll-contain">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell size={32} className="mx-auto mb-3 text-gray-300 dark:text-text-dark-muted" />
                        <p className="text-sm text-gray-400 dark:text-text-dark-secondary">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`border-b border-gray-50 dark:border-gray-700/60 last:border-0 ${
                            !n.read ? "bg-stylist-50/40 dark:bg-stylist-950/20" : ""
                          }`}
                        >
                          <button
                            onClick={() => handleNotificationClick(n._id)}
                            className="w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
                          >
                            <span className="text-lg mt-0.5 shrink-0">
                              {notifIconMap[n.type] || "🔔"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${
                                !n.read
                                  ? "text-gray-900 font-medium dark:text-text-dark-primary"
                                  : "text-gray-600 dark:text-text-dark-secondary"
                              }`}>
                                {n.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-text-dark-muted mt-1">
                                {formatRelativeTime(n.createdAt)}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="mt-2 w-2 h-2 rounded-full bg-stylist-500 shrink-0" />
                            )}
                            <ChevronRight
                              size={14}
                              className={`mt-1.5 shrink-0 transition-transform duration-200 dark:text-text-dark-muted ${
                                expandedNotifId === n._id
                                  ? "rotate-90 text-gray-600"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>

                          {expandedNotifId === n._id && (
                            <div className="px-5 pb-3 pt-0 text-sm space-y-2">
                              <p className="leading-relaxed text-gray-500 dark:text-text-dark-secondary">{n.message}</p>
                              <button
                                onClick={() => handleNotificationNavigate(n.link)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-stylist-600 hover:text-stylist-700 dark:text-stylist-400 dark:hover:text-stylist-300 transition-colors"
                              >
                                View details
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-text-dark-secondary">
                      {notifications.length > 0 ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}` : 'No notifications'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 dark:from-brand-500 dark:to-brand-700 text-white flex items-center justify-center text-[10px] font-bold">
                  {initials}
                </div>
              )}
              <ChevronDown size={14} className="text-gray-400 dark:text-text-dark-muted" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-surface-dark-secondary rounded-xl shadow-xl border border-gray-200/80 dark:border-gray-700/80 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-text-dark-primary">
                    {user?.name || "Stylist"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-text-dark-muted mt-0.5">{user?.email || ""}</p>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/stylist/profile"); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors"
                  >
                    <User size={16} className="text-gray-400 dark:text-text-dark-muted" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/stylist/settings"); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors"
                  >
                    <Settings size={16} className="text-gray-400 dark:text-text-dark-muted" />
                    Settings
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/app"); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Browse as Client
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
