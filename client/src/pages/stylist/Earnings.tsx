import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, DollarSign, TrendingUp, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { getStylistBookings } from "../../api/bookings";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

export default function StylistEarnings() {
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);

  useEffect(() => {
    getStylistBookings()
      .then((bookings) => {
        const completed = bookings.filter(
          (b: any) => b.status === "completed" && b.totalPrice
        );

        const total = completed.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        setTotalEarnings(total);

        // Build weekly data
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekMap: Record<string, number> = {};
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());

        days.forEach((d) => (weekMap[d] = 0));

        completed.forEach((b: any) => {
          const d = new Date(b.startTime);
          if (d >= weekStart && d <= now) {
            weekMap[days[d.getDay()]] += b.totalPrice || 0;
          }
        });

        setWeeklyData(days.map((day) => ({ day, amount: weekMap[day] })));
        setThisWeek(Object.values(weekMap).reduce((a, b) => a + b, 0));

        // Build monthly data
        const monthMap: Record<string, number> = {};
        completed.forEach((b: any) => {
          const d = new Date(b.startTime);
          const key = d.toLocaleString("default", { month: "short" });
          monthMap[key] = (monthMap[key] || 0) + (b.totalPrice || 0);
        });
        setMonthlyData(
          Object.entries(monthMap).map(([month, amount]) => ({ month, amount }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Earnings
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Earnings", value: `GH₵ ${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
          { label: "This Week", value: `GH₵ ${thisWeek.toLocaleString()}`, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
          { label: "This Month", value: `GH₵ ${monthlyData.reduce((a, { amount }) => a + amount, 0).toLocaleString()}`, icon: CalendarDays, color: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
            style={{ boxShadow: T.shadowCard }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Weekly Earnings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#c45d3e" radius={[8, 8, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#0B1A33" strokeWidth={2} dot={{ fill: "#0B1A33", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
