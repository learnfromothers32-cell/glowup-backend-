import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getMyStylistProfile, addMyService } from "../../api/stylists";
import { useTheme } from "../../context/ThemeContext";
import { getStylistBookings } from "../../api/bookings";
import { getStylistReviews } from "../../api/reviews";
import { getLocationString } from "@/utils/location";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Skeleton } from "../../components/ui/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Calendar, DollarSign, Users, Star, Plus, Image, Settings,
  ChevronRight, BadgeCheck, Loader2, Clock, AlertCircle, RefreshCw,
  BarChart3, Scissors, Package, TrendingUp, CheckCircle2, XCircle,
  RefreshCcw, CalendarDays, Activity, MessageSquare, Sparkles,
} from "lucide-react";

interface DashboardBooking {
  id: string; clientId: string; client: string; service: string;
  price?: number; date: string; dateObj: Date; time: string;
  status: string; endTime?: string;
}

interface WeeklyEarning { day: string; fullDay: string; amount: number; count: number; }

function adaptBooking(b: any): DashboardBooking {
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);
  return {
    id: b._id, clientId: b.clientId?._id || b.clientId,
    client: b.clientId?.name || "Client", service: b.serviceId?.name || "Service",
    price: b.totalPrice, date: start.toDateString(), dateObj: start,
    time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: b.status, endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'gray' }> = {
  confirmed: { label: "Confirmed", variant: "info" },
  "in-progress": { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "error" },
  pending: { label: "Pending", variant: "gray" },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening";
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStartOfWeek(d: Date): Date {
  const date = new Date(d); const day = date.getDay();
  date.setDate(date.getDate() - day); date.setHours(0,0,0,0); return date;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now"; if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StylistDashboard() {
  const navigate = useNavigate();
  const { resolved } = useTheme();
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
      setQuickAdding(true); setAddServiceError(null);
      await addMyService({ name: newServiceName.trim(), price: Number(newServicePrice) || 0, duration: Number(newServiceDuration) || 30 });
      setNewServiceName(""); setNewServicePrice(""); setNewServiceDuration("");
    } catch (err: any) {
      setAddServiceError(err?.response?.data?.message || "Failed to add service");
    } finally { setQuickAdding(false); }
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);
      let profile;
      try {
        profile = await getMyStylistProfile(); setStylist(profile);
      } catch (err2: any) {
        if (err2?.response?.status === 404) {
          navigate("/stylist/onboarding", { replace: true }); return;
        }
        throw err2;
      }
      const bookings = await getStylistBookings(); setRawBookings(bookings);
      const reviewsData = await getStylistReviews(profile.id); setReviews(reviewsData || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load dashboard");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bookings = useMemo(() => rawBookings.map(adaptBooking), [rawBookings]);
  const todayBookings = useMemo(() => bookings.filter(b => b.date === new Date().toDateString() && b.status !== "cancelled"), [bookings]);
  const completedBookings = useMemo(() => bookings.filter(b => b.status === "completed"), [bookings]);
  const totalRevenue = useMemo(() => completedBookings.reduce((sum, b) => sum + (b.price || 0), 0), [completedBookings]);
  const uniqueClientCount = useMemo(() => new Set(bookings.map(b => b.clientId)).size, [bookings]);
  const avgRating = stylist?.rating || 0;
  const reviewCount = reviews.length;
  const pendingCount = useMemo(() => bookings.filter(b => b.status === "pending" || b.status === "confirmed").length, [bookings]);

  const weeklyEarnings: WeeklyEarning[] = useMemo(() => {
    const weekStart = getStartOfWeek(new Date());
    return DAY_NAMES.map((fullDay, i) => {
      const dayDate = new Date(weekStart); dayDate.setDate(dayDate.getDate() + i);
      const dayBookings = completedBookings.filter(b => isSameDay(b.dateObj, dayDate));
      return { day: SHORT_DAYS[i], fullDay, amount: dayBookings.reduce((s, b) => s + (b.price || 0), 0), count: dayBookings.length };
    });
  }, [completedBookings]);
  const totalWeeklyRevenue = weeklyEarnings.reduce((s, d) => s + d.amount, 0);
  const weekTotalBookings = weeklyEarnings.reduce((s, d) => s + d.count, 0);

  const chartColors = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 skeleton-pulse" />
            <Skeleton className="h-4 w-48 skeleton-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-xl skeleton-pulse" />
            <Skeleton className="h-9 w-24 rounded-xl skeleton-pulse" />
            <Skeleton className="h-9 w-9 rounded-xl skeleton-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl skeleton-pulse" />
              <Skeleton className="h-7 w-3/4 skeleton-pulse" />
              <Skeleton className="h-4 w-1/2 skeleton-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-5 w-40 skeleton-pulse" />
              </div>
              <div className="p-5 sm:p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/40">
                    <Skeleton className="h-10 w-14 skeleton-pulse" />
                    <Skeleton className="h-10 w-10 rounded-full skeleton-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32 skeleton-pulse" />
                      <Skeleton className="h-3 w-24 skeleton-pulse" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full skeleton-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-5 w-28 skeleton-pulse" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/40">
                      <Skeleton className="h-10 w-10 rounded-xl skeleton-pulse" />
                      <Skeleton className="h-3 w-16 skeleton-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stylist) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <AlertCircle size={28} className="text-error" />
          </div>
          <div>
            <h2 className="text-h3 text-text-primary mb-1">Connection Error</h2>
            <p className="text-body-sm text-text-secondary">{error}</p>
          </div>
          <Button onClick={() => fetchData()} loading={loading}>
            <RefreshCw size={14} /> Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-h2 font-display text-text-primary">{getGreeting()}, {stylist?.name?.split(" ")[0] || "Stylist"}</h1>
            {stylist?.isVerified && <BadgeCheck size={18} className="text-stylist-500" />}
          </div>
          <p className="text-body-sm text-text-secondary mt-0.5">
            {formatDate(new Date())} &middot; {stylist?.location ? getLocationString(stylist.location) : "Accra, Ghana"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCcw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="ghost" size="sm" icon onClick={() => navigate("/stylist/settings")}>
            <Settings size={16} />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Bookings", value: todayBookings.length, sub: `${todayBookings.filter(b => b.status === "confirmed" || b.status === "in-progress").length} active`, icon: CalendarDays, color: "bg-stylist-500" },
          { label: "Total Revenue", value: `₵${totalRevenue.toLocaleString()}`, sub: `${completedBookings.length} completed`, icon: DollarSign, color: "bg-success" },
          { label: "Total Clients", value: uniqueClientCount, sub: `${bookings.length} total bookings`, icon: Users, color: "bg-stylist-500" },
          { label: "Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", sub: reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet", icon: Star, color: "bg-stylist-500" },
        ].map(({ label, value, sub, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover padding="md" className="overflow-hidden">
              <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shadow-sm mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-xl sm:text-h2 font-bold text-stylist-500 truncate">{value}</p>
              <p className="text-body-sm text-text-secondary mt-0.5">{label}</p>
              <p className="text-caption text-text-muted mt-0.5">{sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Schedule + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card padding="none">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-stylist-500" />
                  <h2 className="text-h4 text-text-primary">Today's Schedule</h2>
                  {todayBookings.length > 0 && (
                    <Badge variant="brand">{todayBookings.length} {todayBookings.length === 1 ? "booking" : "bookings"}</Badge>
                  )}
                </div>
                <Link to="/stylist/bookings" className="text-body-sm font-semibold text-stylist-500 hover:text-stylist-600 flex items-center gap-1">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {todayBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-3">
                    <Calendar size={24} className="text-text-muted" />
                  </div>
                  <p className="text-body-sm font-semibold text-text-primary mb-1">No bookings today</p>
                  <p className="text-caption text-text-muted mb-4">Your day is clear. Enjoy the free time!</p>
                  <Button variant="secondary" size="sm" onClick={() => navigate("/stylist/analytics")}>
                    <TrendingUp size={13} /> View Analytics
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayBookings.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()).map((booking) => (
                    <div key={booking.id} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/40 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all cursor-pointer" onClick={() => navigate("/stylist/bookings")}>
                      <div className="text-center min-w-[52px]">
                        <p className="text-body-sm font-bold text-text-primary">{booking.time}</p>
                        {booking.endTime && <p className="text-caption text-text-muted">-{booking.endTime}</p>}
                      </div>
                      <div className="w-0.5 h-10 rounded-full bg-gray-100 dark:bg-gray-700" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Avatar name={booking.client} size="sm" />
                          <p className="text-body-sm font-semibold text-text-primary truncate">{booking.client}</p>
                        </div>
                        <p className="text-caption text-text-muted mt-0.5 ml-10 truncate">
                          {booking.service}{booking.price ? ` · ₵${booking.price}` : ""}
                        </p>
                      </div>
                      <Badge variant={statusConfig[booking.status]?.variant || "gray"}>
                        {statusConfig[booking.status]?.label || booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card padding="none">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
              <h2 className="text-h4 text-text-primary">Quick Actions</h2>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Bookings", icon: Calendar, to: "/stylist/bookings", color: "bg-stylist-500" },
                  { label: "Services", icon: Package, to: "/stylist/services", color: "bg-stylist-600" },
                  { label: "Portfolio", icon: Image, to: "/stylist/portfolio", color: "bg-stylist-500" },
                  { label: "Analytics", icon: BarChart3, to: "/stylist/analytics", color: "bg-stylist-400" },
                  { label: "Profile", icon: Activity, to: "/stylist/profile", color: "bg-gray-500" },
                ].map(({ label, icon: Icon, to, color }) => (
                  <Link key={label} to={to} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/40 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all group">
                    <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:shadow transition-all`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <span className="text-caption font-semibold text-text-primary">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Add Service */}
            <div className="border-t border-gray-100 dark:border-gray-700/40 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Plus size={14} className="text-success" />
                <h3 className="text-body-sm font-semibold text-text-primary">Quick Add Service</h3>
              </div>
              <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Service name..." className="input-field text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="Price" className="input-field text-sm pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-muted">GH₵</span>
                </div>
                <div className="relative">
                  <input type="number" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} placeholder="Duration" className="input-field text-sm pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-text-muted">min</span>
                </div>
              </div>
              {addServiceError && <p className="text-caption text-error">{addServiceError}</p>}
              <Button onClick={handleQuickAddService} disabled={quickAdding || !newServiceName.trim()} loading={quickAdding} className="w-full" size="sm">
                <Plus size={13} /> Add Service
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Earnings Chart + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card padding="none">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-success" />
                  <h2 className="text-h4 text-text-primary">This Week's Earnings</h2>
                </div>
                <div className="text-right">
                  <p className="text-h2 font-bold text-text-primary">₵{totalWeeklyRevenue.toLocaleString()}</p>
                  <p className="text-caption text-text-muted">{weekTotalBookings} bookings</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {weeklyEarnings.every(d => d.amount === 0) ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-stylist-50 dark:bg-stylist-950/20 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={24} className="text-stylist-300" />
                  </div>
                  <p className="text-body-sm font-semibold text-text-primary mb-1">No earnings this week yet</p>
                  <p className="text-caption text-text-muted">Complete bookings to start earning!</p>
                </div>
              ) : (
                <div className="h-52 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyEarnings} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolved === 'dark' ? '#27272a' : '#f0f0f0'} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: resolved === 'dark' ? '#71717a' : '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: resolved === 'dark' ? '#71717a' : '#9ca3af' }} tickFormatter={(v) => `₵${v}`} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: resolved === 'dark' ? "1px solid #3f3f46" : "1px solid #e5e7eb", backgroundColor: resolved === 'dark' ? '#18181b' : '#fff', color: resolved === 'dark' ? '#fafafa' : '#1a1a2e', boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "12px" }}
                        formatter={(value) => [`₵${value}`, "Earnings"]}
                        labelFormatter={(label) => weeklyEarnings.find(d => d.day === label)?.fullDay || label}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={28}>
                        {weeklyEarnings.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.amount > 0 ? chartColors[index % chartColors.length] : (resolved === 'dark' ? '#27272a' : '#f3f4f6')} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card padding="none">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-stylist-500" />
                  <h2 className="text-h4 text-text-primary">Reviews</h2>
                  {reviewCount > 0 && <Badge variant="warning">{reviewCount}</Badge>}
                </div>
                <Link to="/stylist/profile" className="text-body-sm font-semibold text-stylist-500 hover:text-stylist-600 flex items-center gap-1">
                  See all <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={24} className="text-text-muted" />
                  </div>
                  <p className="text-body-sm font-semibold text-text-primary mb-1">No reviews yet</p>
                  <p className="text-caption text-text-muted">Reviews appear after bookings</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {reviews.slice(0, 5).map((rev: any) => (
                    <div key={rev._id} className="p-3 rounded-2xl border border-gray-100 dark:border-gray-700/40 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar name={rev.clientId?.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-caption font-semibold text-text-primary truncate">{rev.clientId?.name || "Anonymous"}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star size={9} fill="#d4a76a" stroke="#d4a76a" />
                          <span className="text-[11px] font-bold text-text-primary">{rev.rating}</span>
                        </div>
                      </div>
                      {rev.comment && <p className="text-caption text-text-secondary leading-relaxed line-clamp-2">&ldquo;{rev.comment}&rdquo;</p>}
                      <p className="text-caption text-text-muted mt-1">{getRelativeTime(rev.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-caption text-text-muted">
        <div className="flex items-center gap-3">
          {pendingCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stylist-500" />{pendingCount} pending</span>}
          {reviewCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-stylist-500" />{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>}
        </div>
        <button onClick={() => fetchData(true)} disabled={refreshing} className="flex items-center gap-1 hover:text-text-primary transition-colors">
          <RefreshCcw size={11} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
    </div>
  );
}
