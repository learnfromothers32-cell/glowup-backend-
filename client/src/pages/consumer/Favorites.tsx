import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, ArrowLeft } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { mapToUIStylist } from "@/domain/stylist/stylist.adapter";
import { getLocationString } from "@/utils/location";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="p-3 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, removeFavorite, loading } = useFavorites();
  const [stylists, setStylists] = useState<Stylist[] | null>(null);

  const displayStylists = stylists ?? favorites.map(mapToUIStylist);

  const handleRemove = (stylistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavorite(stylistId);
    setStylists((prev) => (prev ?? favorites.map(mapToUIStylist)).filter((s) => s.id !== stylistId));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 rounded-full">
            <ArrowLeft size={20} className="text-text-muted dark:text-text-dark-muted" />
          </div>
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-24 mt-1" />
          </div>
        </div>
        <FavoritesSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition"
        >
          <ArrowLeft size={20} className="text-text-primary dark:text-text-dark-primary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary">Favorites</h1>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
            {displayStylists.length} saved stylist{displayStylists.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {displayStylists.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-gray-50 dark:bg-surface-dark-tertiary rounded-full flex items-center justify-center mb-4">
            <Heart size={24} className="text-text-muted dark:text-text-dark-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary dark:text-text-dark-primary">
            No favorites yet
          </h3>
          <p className="text-text-secondary dark:text-text-dark-secondary mt-1">
            Tap the heart icon on any stylist card to save them here.
          </p>
          <Link
            to="/app"
            className="inline-block mt-6 px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-full text-sm"
          >
            Browse stylists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayStylists.map((stylist) => (
            <div
              key={stylist.id}
              className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer"
              onClick={() => navigate(`/app/stylist/${stylist.id}`)}
            >
              <div className="relative aspect-[4/3]">
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={(e) => handleRemove(stylist.id, e)}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white dark:hover:bg-surface-dark-secondary transition"
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

              <div className="p-3">
                <h3 className="font-semibold text-text-primary dark:text-text-dark-primary">{stylist.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary dark:text-text-dark-secondary">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{stylist.rating}</span>
                  <span className="mx-0.5">·</span>
                  <MapPin size={12} />
                  <span>{getLocationString(stylist.location)}</span>
                  {stylist.distance && <span>· {stylist.distance}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-text-primary dark:text-text-dark-primary">
                    {stylist.price}
                  </span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/stylist/${stylist.id}`);
                    }}
                    variant="primary"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
