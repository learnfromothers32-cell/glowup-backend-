import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Star, Phone, Mail } from "lucide-react";
import { getStylistBookings } from "../../api/bookings";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  canvas: "#FFFFFF",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

export default function StylistClients() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStylistBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate clients by clientId
  const clientsMap = new Map<string, any>();
  bookings.forEach((b: any) => {
    const cid = b.clientId?._id || b.clientId;
    if (!cid) return;
    if (!clientsMap.has(cid)) {
      clientsMap.set(cid, {
        id: cid,
        name: b.clientId?.name || "Unknown Client",
        email: b.clientId?.email || "",
        phone: b.clientId?.phone || "",
        image: b.clientId?.image || "",
        totalBookings: 0,
        lastVisit: "",
      });
    }
    const entry = clientsMap.get(cid)!;
    entry.totalBookings++;
    const visitDate = new Date(b.startTime);
    if (!entry.lastVisit || visitDate > new Date(entry.lastVisit)) {
      entry.lastVisit = visitDate.toISOString();
    }
  });

  const clients = Array.from(clientsMap.values()).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
          My Clients
        </h1>
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-400">No clients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
              style={{ boxShadow: T.shadowCard }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {client.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-400">{client.totalBookings} booking{client.totalBookings !== 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                {client.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={12} /> {client.email}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={12} /> {client.phone}
                  </div>
                )}
              </div>

              {client.lastVisit && (
                <p className="mt-3 text-[10px] text-gray-400">
                  Last visit: {new Date(client.lastVisit).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
