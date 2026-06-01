import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import StylistCard from "../components/StylistCard";

export default function LiveStylists() {
  const navigate = useNavigate();
  const [liveStylists, setLiveStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStylists().then((data) => {
      const live = data.filter((s) => s.isLive);
      setLiveStylists(live);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-400">
          Loading live stylists...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔴 Live Stylists</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {liveStylists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No stylists are live right now. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {liveStylists.map((stylist) => (
            <StylistCard key={stylist.id} stylist={stylist} onBook={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
