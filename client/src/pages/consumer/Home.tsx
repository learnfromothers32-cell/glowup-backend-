import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import IntentBar from "../../features/consumer/components/IntentBar";
import LiveStrip from "../../features/consumer/components/LiveStrip";
import RecommendedSection from "../../features/consumer/components/RecommendedSection";
import BookingModal from "../../features/consumer/components/BookingModal";
import ConsumerMap from "../../features/consumer/components/ConsumerMap";
import FilterBar, {
  type Filters,
} from "../../features/consumer/components/FilterBar";
import RecentlyViewed from "../../features/consumer/components/RecentlyViewed";
import FavoritesSection from "../../features/consumer/components/FavoritesSection";
import TrendingPreview from "../../features/consumer/components/TrendingPreview";
import BeautyTips from "../../features/consumer/components/BeautyTips";
import { getStylists } from "../../api/stylists";
import { getMyBookings } from "../../api/bookings";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../context/authUtils";
import AuthModal from "../../features/consumer/components/AuthModal";
import { Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface UpcomingBooking {
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priceMax: 500,
    distanceMax: 0,
    ratingMin: 0,
    liveOnly: false,
    sortBy: "rating",
  });
  const [bookingStylist, setBookingStylist] = useState<Stylist | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingStylist, setPendingStylist] = useState<Stylist | null>(null);
  const [nextBooking, setNextBooking] = useState<UpcomingBooking | null>(null);

  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleIntentSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query }));
  };

  const { recent, addToRecentlyViewed } = useRecentlyViewed();
  const { favorites } = useFavorites();

  const fetchData = useCallback(async () => {
    try {
      const data = await getStylists();
      setAllStylists(data);

      if (isAuthenticated) {
        const bookings = await getMyBookings();
        const upcoming = bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending');
        if (upcoming) {
          setNextBooking({
            queuePosition: upcoming.queuePosition || 1,
            estimatedWaitMinutes: upcoming.estimatedWaitMinutes || 15
          });
        }
      }
    } catch (err) {
      console.error("Home data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStylists = useMemo(() => {
    let result = [...allStylists];

    if (activeCategory) {
      result = result.filter(
        (s) => s.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      result = result.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(term);
        const categoryMatch = s.category?.toLowerCase().includes(term) ?? false;
        const locationMatch = s.location.area.toLowerCase().includes(term);
        const serviceMatch = s.services?.some((svc) => {
          const svcName = typeof svc === "string" ? svc : svc.name;
          return svcName?.toLowerCase().includes(term);
        });
        return nameMatch || categoryMatch || locationMatch || serviceMatch;
      });
    }

    result = result.filter((s) => {
      const raw = (s.price || "").replace("₵", "").replace(/[^0-9.]/g, "");
      const priceNum = parseFloat(raw);
      if (isNaN(priceNum)) return true;
      return priceNum <= filters.priceMax;
    });

    if (filters.distanceMax > 0) {
      result = result.filter((s) => {
        const distStr = (s.distance || "").toString();
        const distNum = parseFloat(distStr.split(" ")[0]);
        if (isNaN(distNum)) return true;
        return distNum <= filters.distanceMax;
      });
    }

    result = result.filter((s) => (s.rating ?? 0) >= filters.ratingMin);

    if (filters.liveOnly) result = result.filter((s) => s.isLive);

    switch (filters.sortBy) {
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "distance":
        result.sort((a, b) => {
          const da = parseFloat((a.distance || "0").split(" ")[0]);
          const db = parseFloat((b.distance || "0").split(" ")[0]);
          return da - db;
        });
        break;
      case "priceAsc":
        result.sort((a, b) => {
          const pa = parseFloat(
            (a.price || "").replace("₵", "").replace(/[^0-9.]/g, "")
          );
          const pb = parseFloat(
            (b.price || "").replace("₵", "").replace(/[^0-9.]/g, "")
          );
          return (isNaN(pa) ? Infinity : pa) - (isNaN(pb) ? Infinity : pb);
        });
        break;
      case "priceDesc":
        result.sort((a, b) => {
          const pa = parseFloat(
            (a.price || "").replace("₵", "").replace(/[^0-9.]/g, "")
          );
          const pb = parseFloat(
            (b.price || "").replace("₵", "").replace(/[^0-9.]/g, "")
          );
          return (isNaN(pb) ? Infinity : pb) - (isNaN(pa) ? Infinity : pa);
        });
        break;
    }

    return result;
  }, [allStylists, filters, activeCategory]);

  const handleBook = (stylist: Stylist) => {
    if (!isAuthenticated) {
      setPendingStylist(stylist);
      setShowAuthModal(true);
    } else {
      setBookingStylist(stylist);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingStylist) {
      setBookingStylist(pendingStylist);
      setPendingStylist(null);
    }
  };

  const handleBookingSuccess = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    setBookingStylist(null);
  };

  const handleSelectStylistFromMap = (stylist: Stylist) => {
    addToRecentlyViewed(stylist);
    handleBook(stylist);
  };

  const handleBookFromRecommendation = (stylist: Stylist) => {
    addToRecentlyViewed(stylist);
    handleBook(stylist);
  };

  const handleRecentStylistClick = (stylist: Stylist) => {
    addToRecentlyViewed(stylist);
    handleBook(stylist);
  };

  const handleFavoriteStylistClick = (stylist: Stylist) => {
    handleBook(stylist);
  };

  const liveStylists = useMemo(
    () => filteredStylists.filter((s) => s.isLive),
    [filteredStylists]
  );

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-gray-400">Loading GlowUp...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 pb-4 pt-0">
      <IntentBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={handleIntentSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <FilterBar
        onFilterChange={setFilters}
        initialFilters={filters}
        resultCount={filteredStylists.length}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Nearby stylists
        </h2>
        <ConsumerMap
          stylists={filteredStylists}
          onSelectStylist={handleSelectStylistFromMap}
        />
      </div>

      <LiveStrip liveStylists={liveStylists} />

      {nextBooking && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-amber-200/80 shadow-sm"
        >
          <div className="h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />
          <div className="p-4">
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    You're in queue
                  </h4>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tabular-nums">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    #{nextBooking.queuePosition}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Estimated wait{" "}
                  <span className="font-semibold text-gray-700">
                    {nextBooking.estimatedWaitMinutes} min
                  </span>
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: nextBooking.estimatedWaitMinutes * 60,
                        ease: "linear",
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                    />
                  </div>
                </div>
              </div>
              <Link
                to="/app/queue"
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
              >
                View
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <TrendingPreview />
      <RecentlyViewed stylists={recent} onSelect={handleRecentStylistClick} />
      <FavoritesSection
        favorites={favorites}
        onSelect={handleFavoriteStylistClick}
      />
      <RecommendedSection
        stylists={filteredStylists}
        onBook={handleBookFromRecommendation}
      />

      <BeautyTips />

      {bookingStylist && (
        <BookingModal
          stylist={bookingStylist}
          onClose={() => setBookingStylist(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {showSuccessToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm">
          ✅ Booking confirmed!
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}