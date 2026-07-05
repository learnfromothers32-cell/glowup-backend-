import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  MessageSquare,
  Sparkles,
  Zap,
  Home,
  Calendar,
  User,
  Trophy,
  Settings,
  LogOut,
  ChevronRight,
  Check,
  Bookmark,
  HelpCircle,
  Radio,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearchModal from "../../../features/consumer/components/GlobalSearchModal";
import { useAuth } from "../../../context/authUtils";
import { useNotifications } from "../../../hooks/useNotifications";

// ─── Helper ─────────────────────────────────────────────
const notifIconMap: Record<string, string> = {
  booking: "📅",
  stylist: "✂️",
  badge: "🏆",
  promo: "🎁",
  reminder: "⏰",
  live: "🔴",
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

const navLinks = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/live", label: "Live", icon: Radio },
  { to: "/app/my-bookings", label: "Bookings", icon: Calendar },
  { to: "/app/waitlist", label: "Waitlist", icon: Clock },
  { to: "/app/rewards", label: "Rewards", icon: Trophy },
];

const profileMenuItems = [
  { key: "profile", to: "/app/profile", label: "My Profile", icon: User },
  { key: "favorites", to: "/app/favorites", label: "Favorites", icon: Bookmark },
  { key: "settings", to: "/app/settings", label: "Settings", icon: Settings },
  { key: "help", to: "/app/settings", label: "Help & Support", icon: HelpCircle },
];

// ─── Component ──────────────────────────────────────────
export default function ConsumerNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const { user, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
        setExpandedNotifId(null);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard shortcut: Cmd/Ctrl + K to open search ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Lock body scroll when mobile menu is open ──
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
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
    <>
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .nav-animate { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Main Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full">
        {/* Glassmorphism backdrop */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 dark:bg-surface-dark-secondary/85 dark:border-0" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-2 lg:gap-4">
            {/* ─── LEFT: Logo + Nav ───────────────────────── */}
            <div className="flex items-center gap-1 min-w-0">
              <button
                onClick={() => { navigate("/app"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-2 shrink-0 mr-2 lg:mr-4 group"
              >
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:inline">
                  GlowUp
                </span>
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 xl:gap-2">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isActive(to)
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/60"
                      }
                    `}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="hidden lg:inline">{label}</span>
                  </Link>
                ))}

                {/* Vibe Match CTA */}
                <Link
                  to="/app/vibe-match"
                  className={`
                    ml-1 lg:ml-2 flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${
                      isActive("/app/vibe-match")
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                        : "bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md shadow-brand-500/10"
                    }
                  `}
                >
                  <Zap size={15} className="text-amber-400 shrink-0" />
                  <span className="hidden lg:inline">Vibe Match</span>
                </Link>
              </nav>
            </div>

            {/* ─── CENTER: Search (desktop) ───────────────── */}
            <div className="hidden md:flex flex-1 justify-center">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="group relative w-full max-w-sm lg:max-w-md xl:max-w-lg flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-200/80 dark:border-gray-700/80 text-sm text-gray-400 dark:text-text-dark-muted text-left transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-surface-dark-secondary hover:shadow-sm dark:hover:shadow-sm dark:hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 dark:focus:border-brand-500"
              >
                <Search
                  size={16}
                  className="text-gray-400 dark:text-text-dark-muted group-hover:text-gray-500 dark:group-hover:text-text-dark-secondary transition-colors shrink-0"
                />
                <span className="flex-1 truncate">Search stylists, services…</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-[11px] font-medium text-gray-400 dark:text-text-dark-muted shadow-sm shrink-0">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            {/* ─── RIGHT: Actions ─────────────────────────── */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Mobile search */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:hover:bg-surface-dark-tertiary"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* ── Messages ──────────────────────────────── */}
              <Link
                to="/app/messages"
                className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Messages"
              >
                <MessageSquare size={20} />
              </Link>

              {/* ── Notifications ──────────────────────────── */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen((v) => !v);
                    setProfileMenuOpen(false);
                  }}
                    className={`
                      relative p-2.5 rounded-xl transition-all duration-200
                      ${
                        notificationsOpen
                          ? "text-gray-900 bg-gray-100 dark:text-gray-100 dark:bg-gray-800"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                      }
                    `}
                    aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-4.5 h-4.5 min-w-[18px] rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="fixed sm:absolute inset-x-0 sm:inset-x-auto top-16 sm:top-full sm:mt-2 w-full sm:w-[380px] sm:right-0 bg-white rounded-2xl shadow-xl shadow-gray-900/8 border border-gray-200/80 overflow-hidden dark:bg-surface-dark-secondary dark:border-gray-700/80 dark:shadow-2xl dark:shadow-black/40"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/80">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <Check size={12} />
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification list */}
                      <div className="max-h-80 overflow-y-auto overscroll-contain">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <Bell
                              size={32}
                              className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
                            />
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              You're all caught up!
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              className={`
                                border-b border-gray-50 last:border-0 dark:border-gray-800/60
                                ${!n.read ? "bg-brand-50/40 dark:bg-brand-950/20" : ""}
                              `}
                            >
                              <button
                                onClick={() => handleNotificationClick(n._id)}
                                className="w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <span className="text-lg mt-0.5 shrink-0">
                                  {notifIconMap[n.type] || "🔔"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm leading-snug ${
                                      !n.read
                                        ? "text-gray-900 font-medium dark:text-gray-100"
                                        : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  >
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                                    {formatRelativeTime(n.createdAt)}
                                  </p>
                                </div>
                                {!n.read && (
                                  <span className="mt-2 w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                )}
                                <ChevronRight
                                  size={14}
                                  className={`mt-1.5 shrink-0 transition-transform duration-200 dark:text-gray-600 ${
                                    expandedNotifId === n._id
                                      ? "rotate-90 text-gray-600"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>

                              {expandedNotifId === n._id && (
                                <div className="px-5 pb-3 pt-0 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                                  <p className="leading-relaxed">{n.message}</p>
                                  <button
                                    onClick={() => handleNotificationNavigate(n.link)}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
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

                      {/* Footer */}
                      <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-700/80">
                        <Link
                          to="/app/notifications"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── User Avatar + Dropdown ────────────────── */}
              <div ref={profileRef} className="relative ml-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen((v) => !v);
                    setNotificationsOpen(false);
                  }}
                  className={`
                    flex items-center gap-2 p-1 rounded-xl transition-all duration-200
                    ${profileMenuOpen ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
                  `}
                  aria-label="Profile menu"
                >
                  {user?.avatar && !avatarError ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-gray-900" onError={() => setAvatarError(true)} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm dark:ring-gray-900">
                      {initials}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-900/8 border border-gray-200/80 overflow-hidden dark:bg-surface-dark-secondary dark:border-gray-700/80 dark:shadow-2xl dark:shadow-black/40"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/80">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {user?.name || "User Name"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
                          {user?.email || "user@email.com"}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {profileMenuItems.map(({ key, to, label, icon: Icon }) => (
                          <Link
                            key={key}
                            to={to}
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-800/50"
                          >
                            <Icon size={16} className="text-gray-400 dark:text-gray-500" />
                            {label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1.5 dark:border-gray-700/80">
                        <button
                          onClick={async () => {
                            setProfileMenuOpen(false);
                            await logout();
                            navigate("/");
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Mobile hamburger (morphing bars) ──────── */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden relative w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all ml-1 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Menu"
              >
                <div className="relative w-5 h-5">
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute inset-x-0 top-0.5 h-[2px] rounded-full bg-current origin-center block"
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-x-0 top-[9px] h-[2px] rounded-full bg-current block"
                  />
                  <motion.span
                    animate={mobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute inset-x-0 bottom-0.5 h-[2px] rounded-full bg-current origin-center block"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu (Full-screen overlay) ────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel */}
            <motion.nav
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl md:hidden overflow-y-auto dark:bg-surface-dark dark:shadow-black/60"
            >
              {/* Close + Logo */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-0"
              >
                <Link to="/app" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                    GlowUp
                  </span>
                </Link>
              </motion.div>

              {/* User card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.25 }}
                className="px-5 py-4 border-b border-gray-100 dark:border-0"
              >
                <div className="flex items-center gap-3">
                  {user?.avatar && !avatarError ? (
                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" onError={() => setAvatarError(true)} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user?.name || "User Name"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email || "user@email.com"}</p>
                  </div>
                </div>
              </motion.div>

              {/* Vibe Match CTA */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16, duration: 0.25 }}
                className="px-5 pt-4 pb-2"
              >
                <Link
                  to="/app/vibe-match"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold shadow-md hover:bg-brand-600 transition"
                >
                  <Zap size={16} className="text-amber-400" />
                  Vibe Match
                </Link>
              </motion.div>

              {/* Nav links */}
              <div className="px-3 py-3">
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18, duration: 0.25 }}
                  className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Navigate
                </motion.p>
                {navLinks.map(({ to, label, icon: Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5
                        ${
                          isActive(to)
                            ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                        }
                      `}
                    >
                      <Icon
                        size={18}
                        className={
                          isActive(to) ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                        }
                      />
                      {label}
                      {isActive(to) && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Account links */}
              <div className="px-3 py-3 border-t border-gray-100 dark:border-0">
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.38, duration: 0.25 }}
                  className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  Account
                </motion.p>
                {profileMenuItems.map(({ key, to, label, icon: Icon }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all mb-0.5 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                    >
                      <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                      {label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.52, duration: 0.25 }}
                >
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      navigate("/");
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all mt-1 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>


    </>
  );
}
