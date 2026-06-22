import { MapPin, Clock, Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "../../../hooks/useFavorites";
import { useGamification } from "../../../hooks/useGamification";
import type { Stylist } from "@/domain/stylist/stylist.types";

interface StylistCardStylist extends Stylist {
  nextAvailable?: string;
}

interface StylistCardProps {
  stylist: StylistCardStylist;
  onBook: () => void;
}

export default function StylistCard({ stylist, onBook }: StylistCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addPoints, incrementAction } = useGamification();

  const handleCardClick = () => {
    if (stylist.isLive) {
      navigate(`/app/live/${stylist.id}`);
    } else {
      navigate(`/app/stylist/${stylist.id}`);
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasFavorite = isFavorite(stylist.id);
    toggleFavorite(stylist);
    if (!wasFavorite) {
      addPoints(5);
      incrementAction("favorites");
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group rounded-2xl bg-white border border-gray-100 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer dark:bg-surface-dark-secondary dark:border-gray-700/40"
    >
      {/* Image block */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {stylist.image ? (
          <img
            src={stylist.image}
            alt={stylist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
            <span className="text-2xl font-bold text-gray-300 dark:text-gray-600">{stylist.name?.[0]}</span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-800 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
            <Star size={11} className="text-amber-500 fill-amber-500" />
            {stylist.rating}
          </span>
          {stylist.isLive && (
            <span className="flex items-center gap-1 bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              Live
            </span>
          )}
        </div>

        {/* Favorite heart button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition dark:bg-gray-900/60 dark:hover:bg-gray-800"
        >
          <Heart
            size={16}
            className={
              isFavorite(stylist.id)
                ? "fill-red-500 text-red-500"
                : "text-gray-700"
            }
          />
        </button>

        {/* Distance pill */}
        {stylist.distance && (
          <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
            {stylist.distance}
          </div>
        )}
      </div>

      {/* Details section */}
      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="text-base font-semibold text-text-primary dark:text-text-dark-primary leading-tight">
            {stylist.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">
            <MapPin size={12} />
            {typeof stylist.location === "string"
              ? stylist.location
              : stylist.location?.area || "Location"}
          </p>
        </div>

        {stylist.nextAvailable ? (
          <div className="flex items-center gap-1 text-xs text-success font-medium">
            <Clock size={12} />
            {stylist.nextAvailable}
          </div>
        ) : (
          <div className="text-xs text-text-muted dark:text-text-dark-muted">Check availability</div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-text-primary dark:text-text-dark-primary">
            {stylist.price}
          </span>
          <button
            onClick={handleBookClick}
            className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
          >
            Book now
          </button>
        </div>
      </div>
    </div>
  );
}
