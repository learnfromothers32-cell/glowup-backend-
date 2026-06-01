import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, ArrowLeft } from "lucide-react";
import { useFavorites } from "../../../hooks/useFavorites";
import { getStylists } from "../../../api/stylists";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { getLocationString } from "@/utils/location";

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStylists().then((all) => {
      // Only show stylists that are in favorites
      const favIds = new Set(favorites.map((s) => s.id));
      const matched = all.filter((s) => favIds.has(s.id));
      setStylists(matched);
      setLoading(false);
    });
  }, [favorites]);

  const handleRemove = (stylistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(stylistId);
    setStylists((prev) => prev.filter((s) => s.id !== stylistId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-400">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Favorites</h1>
          <p className="text-sm text-gray-500">
            {stylists.length} saved stylist{stylists.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {stylists.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Heart size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            No favorites yet
          </h3>
          <p className="text-gray-500 mt-1">
            Tap the heart icon on any stylist card to save them here.
          </p>
          <Link
            to="/app"
            className="inline-block mt-6 px-4 py-2 bg-gray-900 text-white rounded-full text-sm"
          >
            Browse stylists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer"
              onClick={() => navigate(`/app/stylist/${stylist.id}`)}
            >
              {/* Image */}
              <div className="relative aspect-[4/3]">
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={(e) => handleRemove(stylist.id, e)}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition"
                  aria-label="Remove from favorites"
                >
                  <Heart size={16} className="fill-red-500 text-red-500" />
                </button>
                {stylist.isLive && (
                  <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    LIVE
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900">{stylist.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{stylist.rating}</span>
                  <span className="mx-0.5">·</span>
                  <MapPin size={12} />
                  <span>{getLocationString(stylist.location)}</span>
                  {stylist.distance && <span>· {stylist.distance}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {stylist.price}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/stylist/${stylist.id}`);
                    }}
                    className="px-3 py-1 text-xs bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
