import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, TrendingUp, Users, Star, Calendar } from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getStylistBookings } from "../../api/bookings";
import { getStylistReviews } from "../../api/reviews";
import { getMyStylistProfile } from "../../api/stylists";
import { Skeleton } from "../../components/ui/Skeleton";

export default function StylistAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stylist, setStylist] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getMyStylistProfile(),
      getStylistBookings(),
    ]).then(async ([profile, bks]) => {
      setStylist(profile);
      setBookings(bks);
      try {
        const reviewsData = await getStylistReviews(profile.id);
        setReviews(reviewsData);
      } catch {
        setReviews([]);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-48 skeleton-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-4 space-y-3">
              <Skeleton className="h-9 w-9 rounded-2xl skeleton-pulse" />
              <Skeleton className="h-6 w-3/4 skeleton-pulse" />
              <Skeleton className="h-4 w-1/2 skeleton-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-6">
          <Skeleton className="h-5 w-40 skeleton-pulse mb-4" />
          <Skeleton className="h-64 w-full skeleton-pulse rounded-2xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-6">
          <Skeleton className="h-5 w-32 skeleton-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/40">
                <Skeleton className="h-8 w-8 rounded-full skeleton-pulse" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32 skeleton-pulse" />
                  <Skeleton className="h-3 w-24 skeleton-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((sum, b: any) => sum + (b.totalPrice || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const conversionRate = totalBookings ? Math.round((completedBookings / totalBookings) * 100) : 0;

  const monthMap: Record<string, number> = {};
  bookings.forEach((b: any) => {
    const d = new Date(b.startTime);
    const key = d.toLocaleString("default", { month: "short" });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const monthlyBookings = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
        Analytics
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Bookings", value: totalBookings, icon: Calendar, color: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" },
          { label: "Completed", value: completedBookings, icon: TrendingUp, color: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400" },
          { label: "Revenue", value: `GH₵${totalRevenue}`, icon: Eye, color: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400" },
          { label: "Avg Rating", value: `${avgRating} ★`, icon: Star, color: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" },
          { label: "Conversion", value: `${conversionRate}%`, icon: Users, color: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-4 shadow-card overflow-hidden"
          >
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <p className="mt-2 text-lg sm:text-xl font-bold text-stylist-500 truncate">{value}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-4 sm:p-6 shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Monthly Bookings</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyBookings}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#be123c" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 p-4 sm:p-6 shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Recent Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl border border-gray-50 dark:border-gray-700/30">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
                  {(r.user || "A")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{r.user || "Anonymous"}</p>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                      <span className="text-xs font-bold text-text-primary">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
