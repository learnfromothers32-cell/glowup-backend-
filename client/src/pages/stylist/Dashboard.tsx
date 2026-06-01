import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getMyStylistProfile, addMyService } from "../../api/stylists";
import { getStylistBookings } from "../../api/bookings";
import api from "../../api/axios";
import { getLocationString } from "@/utils/location";

import {
  Calendar, DollarSign, Users, Star, MapPin, Plus,
  Image, Radio, Settings, ChevronRight, BadgeCheck,
  Loader2, Clock, AlertCircle, RefreshCw, BarChart3,
  Menu, Scissors, Package, Video, LogOut,
  TrendingUp, CreditCard, CheckCircle2, XCircle,
  RefreshCcw, UserCircle, CalendarDays, Activity,
  MoreHorizontal,
  MessageSquare
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface DashboardBooking {
  id: string;
  clientId: string;
  client: string;
  clientAvatar?: string;
  service: string;
  serviceId?: string;
  price?: number;
  date: string;
  dateObj: Date;
  time: string;
  status: string;
  endTime?: string;
}

interface DashboardReview {
  id: string;
  user: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface WeeklyEarning {
  day: string;
  fullDay: string;
  amount: number;
  count: number;
}

function adaptBooking(b: any): DashboardBooking {
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);
  return {
    id: b._id,
    clientId: b.clientId?._id || b.clientId,
    client: b.clientId?.name || "Client",
    clientAvatar: b.clientId?.avatar,
    service: b.serviceId?.name || "Service",
    serviceId: b.serviceId?._id || b.serviceId,
    price: b.totalPrice,
    date: start.toDateString(),
    dateObj: start,
    time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: b.status,
    endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

function getStatusColor(status: string): string {
  switch (status) {
    case "confirmed": return "bg-blue-100 text-blue-700 border-blue-200";
    case "in-progress": return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "cancelled": return "bg-red-100 text-red-700 border-red-200";
    case "pending": return "bg-gray-100 text-gray-700 border-gray-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "confirmed": return CheckCircle2;
    case "in-progress": return Activity;
    case "completed": return BadgeCheck;
    case "cancelled": return XCircle;
    default: return Clock;
  }
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Stylist Dashboard Component ────────────────────────
export default function StylistDashboard() {
  const navigate = useNavigate();
  const [stylist, setStylist] = useState<any>(null);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [addServiceError, setAddServiceError] = useState<string | null>(null);

  const handleQuickAddService = async () => {
    if (!newServiceName.trim()) return;
    try {
      setQuickAdding(true);
      setAddServiceError(null);
      await addMyService({
        name: newServiceName.trim(),
        price: Number(newServicePrice) || 0,
        duration: Number(newServiceDuration) || 30,
      });
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceDuration("");
    } catch (err: any) {
      setAddServiceError(err?.response?.data?.message || "Failed to add service");
    } finally {
      setQuickAdding(false);
    }
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const profile = await getMyStylistProfile();
      setStylist(profile);

      const bookings = await getStylistBookings();
      setRawBookings(bookings);

      const reviewsRes = await api.get(`/reviews/stylist/${profile.id}`);
      setReviews(reviewsRes.data.data.reviews || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load dashboard";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived Data ──
  const bookings = useMemo(() =>
    rawBookings.map(adaptBooking), [rawBookings]
  );

  const todayBookings = useMemo(() =>
    bookings.filter(b => b.date === new Date().toDateString() && b.status !== "cancelled"),
    [bookings]
  );

  const upcomingBookings = useMemo(() =>
    bookings
      .filter(b => b.dateObj >= new Date() && b.status !== "cancelled")
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()),
    [bookings]
  );

  const completedBookings = useMemo(() =>
    bookings.filter(b => b.status === "completed"),
    [bookings]
  );

  const totalRevenue = useMemo(() =>
    completedBookings.reduce((sum, b) => sum + (b.price || 0), 0),
    [completedBookings]
  );

  const uniqueClientCount = useMemo(() => {
    const ids = new Set(bookings.map(b => b.clientId));
    return ids.size;
  }, [bookings]);

  const avgRating = stylist?.rating || 0;
  const reviewCount = reviews.length;

  // Weekly earnings from completed bookings
  const weeklyEarnings: WeeklyEarning[] = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const days: WeeklyEarning[] = DAY_NAMES.map((fullDay, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);
      const dayBookings = completedBookings.filter(b => {
        const bDate = new Date(b.dateObj);
        return isSameDay(bDate, dayDate);
      });
      const amount = dayBookings.reduce((s, b) => s + (b.price || 0), 0);
      return { day: SHORT_DAYS[i], fullDay, amount, count: dayBookings.length };
    });

    return days;
  }, [completedBookings]);

  const totalWeeklyRevenue = useMemo(() =>
    weeklyEarnings.reduce((s, d) => s + d.amount, 0),
    [weeklyEarnings]
  );

  const weekTotalBookings = useMemo(() =>
    weeklyEarnings.reduce((s, d) => s + d.count, 0),
    [weeklyEarnings]
  );

  const pendingCount = useMemo(() =>
    bookings.filter(b => b.status === "pending" || b.status === "confirmed").length,
    [bookings]
  );

  const lastUpdated = useMemo(() => getRelativeTime(new Date().toISOString()), []);

  // ── Renderers ──

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
            <Scissors size={22} className="text-white" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-40 bg-gray-200 rounded-full animate-pulse mx-auto" />
            <div className="h-2 w-24 bg-gray-100 rounded-full animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !stylist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Connection Error</h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* ═══ Top Navigation Bar ═══ */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand + Greeting */}
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <Scissors size={16} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400">{getGreeting()},</p>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-gray-900">{stylist?.name || "Stylist"}</h1>
                  {stylist?.isVerified && <BadgeCheck size={13} className="text-blue-500" />}
                </div>
              </div>
            </div>

            {/* Center: Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Bookings", icon: Calendar, to: "/stylist/bookings" },
                { label: "Services", icon: Package, to: "/stylist/services" },
                { label: "Portfolio", icon: Image, to: "/stylist/portfolio" },
                { label: "Analytics", icon: BarChart3, to: "/stylist/analytics" },
              ].map(({ label, icon: Icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  <Icon size={13} />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <RefreshCcw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => navigate("/stylist/live")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-red-200 transition-all"
              >
                <Radio size={12} className="animate-pulse" />
                Go Live
              </button>
              <button
                onClick={() => navigate("/stylist/profile")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                <Settings size={15} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-16">

        {/* ── Greeting Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {getGreeting()}, {stylist?.name?.split(" ")[0] || "Stylist"}!
                  </h2>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-white/70 text-sm">
                  {formatDate(new Date())} &middot; {stylist?.location ? getLocationString(stylist.location) : "Accra, Ghana"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-white/60">Today</p>
                  <p className="text-lg font-bold">{todayBookings.length}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-white/60">This Week</p>
                  <p className="text-lg font-bold">₵{totalWeeklyRevenue.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => navigate("/stylist/live")}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <Radio size={14} className="animate-pulse" />
                  Go Live
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            {
              label: "Today's Bookings",
              value: todayBookings.length,
              sub: `${todayBookings.filter(b => b.status === "confirmed" || b.status === "in-progress").length} active`,
              icon: CalendarDays,
              gradient: "from-blue-500 to-cyan-500",
              shadow: "shadow-blue-200"
            },
            {
              label: "Total Revenue",
              value: `₵${totalRevenue.toLocaleString()}`,
              sub: `${completedBookings.length} completed`,
              icon: DollarSign,
              gradient: "from-emerald-500 to-teal-500",
              shadow: "shadow-emerald-200"
            },
            {
              label: "Total Clients",
              value: uniqueClientCount,
              sub: `${bookings.length} total bookings`,
              icon: Users,
              gradient: "from-violet-500 to-purple-500",
              shadow: "shadow-violet-200"
            },
            {
              label: "Rating",
              value: avgRating > 0 ? avgRating.toFixed(1) : "—",
              sub: reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet",
              icon: Star,
              gradient: "from-amber-500 to-orange-500",
              shadow: "shadow-amber-200"
            },
          ].map(({ label, value, sub, icon: Icon, gradient, shadow }) => (
            <div
              key={label}
              className="relative bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm ${shadow}`}>
                <Icon size={17} className="text-white" />
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Two-Column: Schedule + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-indigo-500" />
                  <h2 className="text-base font-bold text-gray-900">Today's Schedule</h2>
                  {todayBookings.length > 0 && (
                    <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {todayBookings.length} {todayBookings.length === 1 ? "booking" : "bookings"}
                    </span>
                  )}
                </div>
                <Link
                  to="/stylist/bookings"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View All
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {todayBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No bookings today</p>
                  <p className="text-xs text-gray-400 mb-4">Your day is clear. Enjoy the free time!</p>
                  <Link
                    to="/stylist/analytics"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <TrendingUp size={13} />
                    View Analytics
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayBookings
                    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                    .map((booking) => {
                      const StatusIcon = getStatusIcon(booking.status);
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50/80 hover:border-gray-100 transition-all cursor-pointer group"
                          onClick={() => navigate(`/stylist/bookings`)}
                        >
                          {/* Time column */}
                          <div className="text-center min-w-[48px]">
                            <p className="text-sm font-bold text-gray-900">{booking.time}</p>
                            {booking.endTime && (
                              <p className="text-[10px] text-gray-400">-{booking.endTime}</p>
                            )}
                          </div>

                          {/* Divider line */}
                          <div className="w-0.5 h-10 rounded-full bg-gray-100 group-hover:bg-indigo-200 transition-colors" />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 flex-shrink-0">
                                {booking.client.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </div>
                              <p className="text-sm font-semibold text-gray-900 truncate">{booking.client}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 ml-9 truncate">
                              {booking.service}
                              {booking.price ? ` · ₵${booking.price}` : ""}
                            </p>
                          </div>

                          {/* Status */}
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(booking.status)}`}>
                            <StatusIcon size={10} />
                            {booking.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Menu size={16} className="text-gray-400" />
                <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Bookings", icon: Calendar, to: "/stylist/bookings", gradient: "from-blue-500 to-cyan-500" },
                  { label: "Services", icon: Package, to: "/stylist/services", gradient: "from-emerald-500 to-teal-500" },
                  { label: "Portfolio", icon: Image, to: "/stylist/portfolio", gradient: "from-violet-500 to-purple-500" },
                  { label: "Analytics", icon: BarChart3, to: "/stylist/analytics", gradient: "from-amber-500 to-orange-500" },
                  { label: "Live", icon: Radio, to: "/stylist/live", gradient: "from-red-500 to-rose-500" },
                  { label: "Profile", icon: UserCircle, to: "/stylist/profile", gradient: "from-gray-500 to-slate-500" },
                ].map(({ label, icon: Icon, to, gradient }) => (
                  <Link
                    key={label}
                    to={to}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Add Service */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-emerald-500" />
                <h2 className="text-base font-bold text-gray-900">Quick Add Service</h2>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              <input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Service name..."
                className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm text-gray-900 outline-none focus:border-emerald-200 focus:bg-white transition-all placeholder-gray-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="Price"
                    className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm text-gray-900 outline-none focus:border-emerald-200 focus:bg-white transition-all placeholder-gray-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">GH₵</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="Duration"
                    className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-sm text-gray-900 outline-none focus:border-emerald-200 focus:bg-white transition-all placeholder-gray-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                </div>
              </div>
              {addServiceError && (
                <p className="text-xs text-red-500">{addServiceError}</p>
              )}
              <button
                onClick={handleQuickAddService}
                disabled={quickAdding || !newServiceName.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {quickAdding ? (
                  <><Loader2 size={13} className="animate-spin" /> Adding...</>
                ) : (
                  <><Plus size={13} /> Add Service</>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Earnings Chart + Reviews ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Weekly Earnings Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <h2 className="text-base font-bold text-gray-900">This Week's Earnings</h2>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">₵{totalWeeklyRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">{weekTotalBookings} bookings this week</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {weeklyEarnings.every(d => d.amount === 0) ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={24} className="text-amber-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No earnings this week yet</p>
                  <p className="text-xs text-gray-400">Complete bookings to start earning!</p>
                </div>
              ) : (
                <div className="h-52 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyEarnings} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        tickFormatter={(v) => `₵${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                          fontSize: "12px"
                        }}
                        formatter={(value: number) => [`₵${value}`, "Earnings"]}
                        labelFormatter={(label) => {
                          const day = weeklyEarnings.find(d => d.day === label);
                          return day?.fullDay || label;
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[6, 6, 0, 0]}
                        barSize={28}
                      >
                        {weeklyEarnings.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.amount > 0
                              ? ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"][index]
                              : "#f3f4f6"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Reviews */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 sm:p-6 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <h2 className="text-base font-bold text-gray-900">Reviews</h2>
                  {reviewCount > 0 && (
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                      {reviewCount}
                    </span>
                  )}
                </div>
                <Link
                  to="/stylist/profile"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  See all
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No reviews yet</p>
                  <p className="text-xs text-gray-400">Reviews appear after bookings</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                  {reviews.slice(0, 5).map((rev: any) => (
                    <div
                      key={rev._id}
                      className="p-3 rounded-xl border border-gray-50 hover:bg-gray-50/50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-[10px] font-bold text-amber-600 flex-shrink-0">
                          {rev.clientId?.name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {rev.clientId?.name || "Anonymous"}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star size={9} fill="#f59e0b" stroke="#f59e0b" />
                          <span className="text-[11px] font-bold text-gray-700">{rev.rating}</span>
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {getRelativeTime(rev.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Footer Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {pendingCount} pending
              </span>
            )}
            {reviewCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {reviewCount > 0 ? "1+ new review" : "0 new reviews"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>Last updated {lastUpdated}</span>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-all"
            >
              <RefreshCcw size={11} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
