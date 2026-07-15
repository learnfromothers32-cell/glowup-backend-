import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logger } from "../../utils/logger";
import IntentBar from "../../features/consumer/components/IntentBar";
import RecommendedSection from "../../features/consumer/components/RecommendedSection";
import BookingModal from "../../features/consumer/components/BookingModal";
import FilterBar, { type Filters } from "../../features/consumer/components/FilterBar";
import RecentlyViewed from "../../features/consumer/components/RecentlyViewed";
import FavoritesSection from "../../features/consumer/components/FavoritesSection";
import TrendingPreview from "../../features/consumer/components/TrendingPreview";
import BeautyTips from "../../features/consumer/components/BeautyTips";
import { getStylists } from "../../api/stylists";
import { getMyBookings } from "../../api/bookings";
import { getQueueStatus } from "../../api/queue";
import type { Stylist } from "@/domain/stylist/stylist.types";
import { useRecentlyViewed } from "../../hooks/useRecentlyViewed";
import { useFavorites } from "../../hooks/useFavorites";
import { useAuth } from "../../context/authUtils";
import AuthModal from "../../features/consumer/components/AuthModal";
import { haversineDistance } from "../../utils/distance";
import { Clock, Sparkles, MapPin, ArrowRight, Zap, Hourglass, MoveRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";

import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

const ConsumerMap = lazy(() => import("../../features/consumer/components/ConsumerMap"));

interface UpcomingBooking {
  queuePosition: number;
  estimatedWaitMinutes: number;
  stylistName?: string;
  serviceName?: string;
  startTime?: string;
  stylistImage?: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: "", priceMax: 500, distanceMax: 0, ratingMin: 0, sortBy: "rating",
  });
  const [bookingStylist, setBookingStylist] = useState<Stylist | null>(null);
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
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const fetchData = useCallback(async () => {
    try {
      const { stylists } = await getStylists();
      setAllStylists(stylists);
      if (isAuthenticated) {
        const bookings = await getMyBookings();
        const upcoming = bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending');
        if (upcoming) {
          const stylistId = upcoming.stylistId && typeof upcoming.stylistId === 'object' ? upcoming.stylistId._id : upcoming.stylistId;
          const clientId = upcoming.clientId && typeof upcoming.clientId === 'object' ? upcoming.clientId._id : upcoming.clientId;
          const stylistName = upcoming.stylistId && typeof upcoming.stylistId === 'object' ? upcoming.stylistId.name : '';
          const serviceName = upcoming.serviceId && typeof upcoming.serviceId === 'object' ? upcoming.serviceId.name : '';
          const stylistImage = upcoming.stylistId && typeof upcoming.stylistId === 'object' ? upcoming.stylistId.image : '';
          try {
            const queueData = await getQueueStatus(stylistId);
            const myEntry = queueData?.queue?.entries?.find((e: any) => e.userId === clientId);
            setNextBooking({
              queuePosition: myEntry?.position || 1,
              estimatedWaitMinutes: myEntry?.estimatedWaitMins ?? myEntry?.estimatedServiceMins ?? queueData?.queue?.predictedWaitMins ?? 15,
              stylistName,
              serviceName,
              startTime: upcoming.startTime,
              stylistImage,
            });
          } catch {
            setNextBooking({ queuePosition: 1, estimatedWaitMinutes: 15, stylistName, serviceName, startTime: upcoming.startTime, stylistImage });
          }
        }
      }
    } catch (err) {
      logger.error("Home data fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let isTabVisible = true;

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(async () => {
        if (!isTabVisible) return;
        try {
          const { stylists } = await getStylists();
          setAllStylists(stylists);
        } catch {}
      }, 30000);
    };

    const onVisibility = () => {
      isTabVisible = document.visibilityState === "visible";
      if (isTabVisible) startPolling();
    };

    document.addEventListener("visibilitychange", onVisibility);
    startPolling();
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    const socket = io(getSocketUrl("") || undefined, {
      reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });
    const refresh = async () => {
      try {
        const { stylists } = await getStylists();
        setAllStylists(stylists);
        setLoading(false);
      } catch {}
    };
    socket.on("stylist:location-updated", (data: { stylistId: string; location: { area: string; lat: number; lng: number } }) => {
      setAllStylists(prev => prev.some(s => s.id === data.stylistId)
        ? prev.map(s => s.id === data.stylistId ? { ...s, location: data.location } : s)
        : prev
      );
    });
    return () => {
      socket.off("stylist:location-updated");
      if (socket.connected) socket.disconnect();
    };
  }, []);

  const filteredStylists = useMemo(() => {
    let result = [...allStylists];
    if (activeCategory) {
      result = result.filter(s => s.category?.toLowerCase() === activeCategory.toLowerCase());
    }
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      result = result.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(term);
        const categoryMatch = s.category?.toLowerCase().includes(term) ?? false;
        const locationMatch = s.location.area.toLowerCase().includes(term);
        const serviceMatch = s.services?.some(svc => {
          const svcName = typeof svc === "string" ? svc : svc.name;
          return svcName?.toLowerCase().includes(term);
        });
        return nameMatch || categoryMatch || locationMatch || serviceMatch;
      });
    }
    result = result.filter(s => {
      const raw = (s.price || "").replace(/[^0-9.]/g, "");
      const priceNum = parseFloat(raw);
      if (isNaN(priceNum)) return true;
      return priceNum <= filters.priceMax;
    });
    let userLat: number | null = null;
    let userLng: number | null = null;
    try {
      const saved = localStorage.getItem("glowup_user_location");
      if (saved) { const parsed = JSON.parse(saved); userLat = parsed.lat; userLng = parsed.lng; }
    } catch {}
    const hasUserLoc = userLat !== null && userLng !== null;
    if (filters.distanceMax > 0 && hasUserLoc) {
      result = result.filter(s => {
        const slat = s.location?.lat; const slng = s.location?.lng;
        if (!slat || !slng) return true;
        return haversineDistance(userLat!, userLng!, slat, slng) <= filters.distanceMax;
      });
    }
    result = result.filter(s => (s.rating ?? 0) >= filters.ratingMin);
    switch (filters.sortBy) {
      case "rating": result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "distance":
        if (hasUserLoc) {
          result.sort((a, b) => {
            const al = a.location; const bl = b.location;
            const da = al?.lat && al?.lng ? haversineDistance(userLat!, userLng!, al.lat, al.lng) : Infinity;
            const db = bl?.lat && bl?.lng ? haversineDistance(userLat!, userLng!, bl.lat, bl.lng) : Infinity;
            return da - db;
          });
        }
        break;
      case "priceAsc":
        result.sort((a, b) => { const pa = parseFloat((a.price || "").replace(/[^0-9.]/g, "")); const pb = parseFloat((b.price || "").replace(/[^0-9.]/g, "")); return (isNaN(pa) ? Infinity : pa) - (isNaN(pb) ? Infinity : pb); });
        break;
      case "priceDesc":
        result.sort((a, b) => { const pa = parseFloat((a.price || "").replace(/[^0-9.]/g, "")); const pb = parseFloat((b.price || "").replace(/[^0-9.]/g, "")); return (isNaN(pb) ? Infinity : pb) - (isNaN(pa) ? Infinity : pa); });
        break;
    }
    return result;
  }, [allStylists, filters, activeCategory]);

  const handleBook = (stylist: Stylist) => {
    if (!isAuthenticated) { setPendingStylist(stylist); setShowAuthModal(true); }
    else setBookingStylist(stylist);
  };

  const handleAuthSuccess = () => { if (pendingStylist) { setBookingStylist(pendingStylist); setPendingStylist(null); } };
  const handleBookingSuccess = () => { toast({ title: "Booking confirmed!", type: "success" }); setBookingStylist(null); };
  const handleSelectStylistFromMap = (stylist: Stylist) => { addToRecentlyViewed(stylist); handleBook(stylist); };
  const handleBookFromRecommendation = (stylist: Stylist) => { addToRecentlyViewed(stylist); handleBook(stylist); };
  const handleFavoriteStylistClick = (stylist: Stylist) => { handleBook(stylist); };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-4 pt-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <IntentBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={handleIntentSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <FilterBar onFilterChange={setFilters} initialFilters={filters} resultCount={filteredStylists.length} />

      <div>
        <h2 className="text-h4 font-display text-text-primary mb-3">Nearby stylists</h2>
        <Suspense fallback={<div className="h-[420px] rounded-2xl bg-gray-100 dark:bg-surface-dark-secondary flex items-center justify-center"><Loader2 size={24} className="animate-spin text-gray-400" /></div>}>
          <ConsumerMap stylists={filteredStylists} onSelectStylist={handleSelectStylistFromMap} />
        </Suspense>
      </div>

      {nextBooking && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-rose-600 dark:from-brand-600 dark:via-brand-700 dark:to-rose-800 shadow-xl shadow-brand-200/60 dark:shadow-brand-900/40">
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute top-1/2 right-0 w-24 h-24 rounded-full bg-rose-400/10 blur-3xl" />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Avatar with ring */}
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/25 shadow-lg">
                  {nextBooking.stylistImage ? (
                    <img src={nextBooking.stylistImage} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-white drop-shadow-sm">{nextBooking.stylistName?.[0] || 'Q'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                      Live Queue
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[28px] h-[18px] px-1.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-black text-white tabular-nums border border-white/15">
                      #{nextBooking.queuePosition}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-1 leading-tight drop-shadow-sm">
                    {nextBooking.stylistName || 'Your appointment'}
                  </h3>
                  {nextBooking.serviceName && (
                    <p className="text-sm text-white/70 mt-0.5 font-medium">{nextBooking.serviceName}</p>
                  )}

                  {/* Wait time + time */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                      <Hourglass size={11} className="text-white/60" />
                      <span className="text-[11px] font-semibold text-white/90">
                        ~{nextBooking.estimatedWaitMinutes} min
                      </span>
                    </div>
                    {nextBooking.startTime && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                        <Clock size={11} className="text-white/60" />
                        <span className="text-[11px] font-semibold text-white/90">
                          {new Date(nextBooking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-full bg-white/15 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(8, 100 - (nextBooking.queuePosition - 1) * 15)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-white/90 via-white/70 to-white/50"
                      />
                    </div>
                    <span className="text-xs font-bold text-white/90 tabular-nums shrink-0 flex items-center gap-1">
                      <Zap size={11} className="text-amber-300" />
                      {nextBooking.queuePosition === 1 ? 'Next up' : `${nextBooking.queuePosition - 1} ahead`}
                    </span>
                  </div>
                </div>
              </div>

              {/* View queue link */}
              <Link
                to="/app/queue"
                className="mt-4 flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/18 backdrop-blur-sm transition-all group border border-white/12"
              >
                <span className="text-xs font-semibold text-white/80 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center">
                    <MoveRight size={10} className="text-white/60" />
                  </span>
                  View full queue details
                </span>
                <ArrowRight size={14} className="text-white/50 group-hover:translate-x-1 group-hover:text-white/80 transition-all" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <TrendingPreview />
      <RecentlyViewed stylists={recent} />
      <FavoritesSection favorites={favorites} onFavoriteClick={handleFavoriteStylistClick} />
      <RecommendedSection stylists={filteredStylists} onBook={handleBookFromRecommendation} onFavorite={toggleFavorite} isFavorited={isFavorite} />
      <BeautyTips />

      {bookingStylist && (
        <BookingModal stylist={bookingStylist} onClose={() => setBookingStylist(null)} onSuccess={handleBookingSuccess} />
      )}

      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
