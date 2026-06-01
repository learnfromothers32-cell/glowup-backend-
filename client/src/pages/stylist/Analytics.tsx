import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Eye, TrendingUp, Users, Star, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getStylistBookings } from "../../api/bookings";
import api from "../../api/axios";
import { getMyStylistProfile } from "../../api/stylists";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

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
        const res = await api.get(`/reviews/stylist/${profile.id}`);
        setReviews(res.data.data.reviews);
      } catch {
        setReviews([]);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const totalRevenue = bookings.filter((b) => b.status === "completed").reduce((sum, b: any) => sum + (b.totalPrice || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const conversionRate = totalBookings ? Math.round((completedBookings / totalBookings) * 100) : 0;

  // Monthly bookings chart
  const monthMap: Record<string, number> = {};
  bookings.forEach((b: any) => {
    const d = new Date(b.startTime);
    const key = d.toLocaleString("default", { month: "short" });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const monthlyBookings = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Analytics
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Bookings", value: totalBookings, icon: Calendar, color: "bg-blue-50 text-blue-600" },
          { label: "Completed", value: completedBookings, icon: TrendingUp, color: "bg-green-50 text-green-600" },
          { label: "Revenue", value: `GH₵${totalRevenue}`, icon: Eye, color: "bg-purple-50 text-purple-600" },
          { label: "Avg Rating", value: `${avgRating} ★`, icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "Conversion", value: `${conversionRate}%`, icon: Users, color: "bg-rose-50 text-rose-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-4"
            style={{ boxShadow: T.shadowCard }}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Monthly Bookings Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Monthly Bookings</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyBookings}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0B1A33" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-50">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                  {(r.user || "A")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{r.user || "Anonymous"}</p>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                      <span className="text-xs font-bold">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
