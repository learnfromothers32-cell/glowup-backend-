import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  Sparkles,
  Zap,
  Home,
  Calendar,
  User,
  Menu,
  X,
  Trophy,
  Settings,
  LogOut,
  ChevronRight,
  Check,
  Bookmark,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearchModal from "../../../features/consumer/components/GlobalSearchModal";
import { useAuth } from "../../../context/authUtils";

// ─── Types ──────────────────────────────────────────────
interface Notification {
  id: number;
  text: string;
  read: boolean;
  link: string;
  time: string;
  icon: "booking" | "stylist" | "badge" | "promo";
}

// ─── Helper ─────────────────────────────────────────────
const notifIconMap = {
  booking: "📅",
  stylist: "✂️",
  badge: "🏆",
  promo: "🎁",
};

const navLinks = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/my-bookings", label: "Bookings", icon: Calendar },
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
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      text: "Your booking with Ama is confirmed!",
      read: false,
      link: "/app/my-bookings",
      time: "2 min ago",
      icon: "booking",
    },
    {
      id: 2,
      text: "New stylist added: Braids Hub",
      read: false,
      link: "/app/stylist/9",
      time: "1 hour ago",
      icon: "stylist",
    },
    {
      id: 3,
      text: "You earned a new badge: First Step",
      read: true,
      link: "/app/rewards",
      time: "Yesterday",
      icon: "badge",
    },
    {
      id: 4,
      text: "20% off your next booking this weekend!",
      read: true,
      link: "/app",
      time: "2 days ago",
      icon: "promo",
    },
  ]);

  const { user, logout } = useAuth();
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
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

  const markAsRead = (id: number, link: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setNotificationsOpen(false);
    navigate(link);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* ── Main Header ─────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50">
        {/* Glassmorphism backdrop */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 dark:bg-gray-950/85 dark:border-gray-800/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* ─── LEFT: Logo + Nav ───────────────────────── */}
            <div className="flex items-center gap-1">
              <Link
                to="/app"
                className="flex items-center gap-2 shrink-0 mr-4 group"
              >
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-indigo-500 dark:to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:inline">
                  GlowUp
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-0.5">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isActive(to)
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/60"
                      }
                    `}
                  >
                    <Icon size={16} />
                    {label}
                    {isActive(to) && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute inset-0 bg-gray-100 rounded-lg -z-10 dark:bg-gray-800"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                ))}

                {/* Vibe Match CTA */}
                <Link
                  to="/app/vibe-match"
                  className={`
                    ml-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                    ${
                      isActive("/app/vibe-match")
                        ? "bg-gray-900 text-white shadow-md shadow-gray-900/20 dark:bg-indigo-600 dark:shadow-indigo-900/30"
                        : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md shadow-gray-900/10 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-indigo-900/20"
                    }
                  `}
                >
                  <Zap size={15} className="text-amber-400" />
                  Vibe Match
                </Link>
              </nav>
            </div>

            {/* ─── CENTER: Search (desktop) ───────────────── */}
            <div className="hidden md:flex flex-1 max-w-sm mx-4">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-sm text-gray-400 text-left transition-all duration-200 hover:border-gray-300 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 dark:bg-gray-800/60 dark:border-gray-700/80 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800/80 dark:focus:border-gray-500 dark:focus:ring-gray-300/10"
              >
                <Search
                  size={16}
                  className="text-gray-400 group-hover:text-gray-500 transition-colors"
                />
                <span className="flex-1">Search stylists, services…</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-400 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
            </div>

            {/* ─── RIGHT: Actions ─────────────────────────── */}
            <div className="flex items-center gap-1">
              {/* Mobile search */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Search"
              >
                <Search size={20} />
              </button>

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
                      className="fixed sm:absolute inset-x-0 sm:inset-x-auto top-16 sm:top-full sm:mt-2 w-full sm:w-[380px] sm:right-0 bg-white rounded-2xl shadow-xl shadow-gray-900/8 border border-gray-200/80 overflow-hidden dark:bg-[#1a1a2e] dark:border-gray-700/80 dark:shadow-2xl dark:shadow-black/40"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/80">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
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
                          notifications.map((n, i) => (
                            <button
                              key={n.id}
                              onClick={() => markAsRead(n.id, n.link)}
                              className={`
                                w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0 dark:hover:bg-gray-800/50 dark:border-gray-800/60
                                ${!n.read ? "bg-blue-50/40 dark:bg-blue-900/20" : ""}
                              `}
                            >
                              <span className="text-lg mt-0.5 shrink-0">
                                {notifIconMap[n.icon]}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm leading-snug ${
                                    !n.read
                                      ? "text-gray-900 font-medium dark:text-gray-100"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {n.text}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                                  {n.time}
                                </p>
                              </div>
                              {!n.read && (
                                <span className="mt-2 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <ChevronRight
                                size={14}
                                className="mt-1.5 text-gray-300 shrink-0 dark:text-gray-600"
                              />
                            </button>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm dark:from-indigo-500 dark:to-violet-600 dark:ring-gray-900">
                    {initials}
                  </div>
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-900/8 border border-gray-200/80 overflow-hidden dark:bg-[#1a1a2e] dark:border-gray-700/80 dark:shadow-2xl dark:shadow-black/40"
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

              {/* ── Mobile hamburger ───────────────────────── */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all ml-1 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X size={20} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel */}
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl md:hidden overflow-y-auto dark:bg-[#12121e] dark:shadow-black/60"
            >
              {/* Close + Logo */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 dark:from-indigo-500 dark:to-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                    GlowUp
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User card */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 dark:from-indigo-600 dark:to-violet-600 text-white flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user?.name || "User Name"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email || "user@email.com"}</p>
                  </div>
                </div>
              </div>

              {/* Vibe Match CTA */}
              <div className="px-5 pt-4 pb-2">
                <Link
                  to="/app/vibe-match"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-md hover:bg-gray-800 transition dark:bg-indigo-600 dark:hover:bg-indigo-500"
                >
                  <Zap size={16} className="text-amber-400" />
                  Vibe Match
                </Link>
              </div>

              {/* Nav links */}
              <div className="px-3 py-3">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Navigate
                </p>
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
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
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-indigo-400" />
                    )}
                  </Link>
                ))}
              </div>

              {/* Account links */}
              <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Account
                </p>
                {profileMenuItems.map(({ key, to, label, icon: Icon }) => (
                  <Link
                    key={key}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all mb-0.5 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                  >
                    <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                    {label}
                  </Link>
                ))}
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
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
