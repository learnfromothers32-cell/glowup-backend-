// src/pages/consumer/components/SearchResultsPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  ArrowLeft,
  MapPin,
  Star,
  Users,
  BadgeCheck,
} from "lucide-react";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const service = searchParams.get("service") || "";
  const navigate = useNavigate();

  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStylists()
      .then(setStylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    // Filter by service category (if provided)
    let result = stylists;
    if (service) {
      result = result.filter(
        (s) => s.category?.toLowerCase() === service.toLowerCase(),
      );
    }
    // Further filter by text query (if provided)
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const categoryMatch = s.category?.toLowerCase().includes(q);
        const locationMatch = s.location.area.toLowerCase().includes(q);
        const serviceMatch = s.services?.some((svc) =>
          (typeof svc === "string" ? svc : svc.name).toLowerCase().includes(q),
        );
        return nameMatch || categoryMatch || locationMatch || serviceMatch;
      });
    }
    return result;
  }, [stylists, query, service]);

  // Determine a title based on what's being searched
  const title = query
    ? `Results for "${query}"`
    : service
      ? `${service} Stylists`
      : "Search";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              defaultValue={query}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const newQuery = (e.target as HTMLInputElement).value.trim();
                  if (newQuery) {
                    // Update URL with the new text query, keep service if present
                    const params = new URLSearchParams();
                    params.set("q", newQuery);
                    if (service) params.set("service", service);
                    navigate(`/app/search?${params.toString()}`);
                  }
                }
              }}
              placeholder="Search stylists, services..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-100 border border-gray-200 focus:bg-white focus:border-gray-300 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} stylist{filtered.length !== 1 && "s"} found
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">
              No stylists found
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Try a different search term or browse all categories.
            </p>
            <button
              onClick={() => navigate("/app")}
              className="mt-4 text-indigo-600 underline text-sm"
            >
              Browse all stylists
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((stylist, i) => (
              <motion.div
                key={stylist.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/app/stylist/${stylist.id}`}
                  className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {stylist.image ? (
                      <img
                        src={stylist.image}
                        alt={stylist.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-300">
                        {stylist.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                    {stylist.isLive && (
                      <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />{" "}
                        LIVE
                      </span>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
                      <span className="text-xs font-bold text-white">
                        {stylist.rating}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {stylist.name}
                      </p>
                      {stylist.isVerified && (
                        <BadgeCheck size={13} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <MapPin size={9} />
                      {getLocationString(stylist.location)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stylist.services?.slice(0, 3).map((svc, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-gray-50 text-[10px] text-gray-500"
                        >
                          {typeof svc === "string" ? svc : svc.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold text-center hover:bg-gray-800 transition">
                      View Profile
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
