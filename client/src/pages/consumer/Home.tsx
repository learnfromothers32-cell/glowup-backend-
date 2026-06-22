import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logger } from "../../utils/logger";
import IntentBar from "../../features/consumer/components/IntentBar";
import LiveStrip from "../../features/consumer/components/LiveStrip";
import RecommendedSection from "../../features/consumer/components/RecommendedSection";
import BookingModal from "../../features/consumer/components/BookingModal";
import ConsumerMap from "../../features/consumer/components/ConsumerMap";
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
import { io } from "socket.io-client";
import { getSocketUrl } from "../../services/socket";
import { Clock, ChevronRight, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

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
    search: "", priceMax: 500, distanceMax: 0, ratingMin: 0, liveOnly: false, sortBy: "rating",
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
      const data = await getStylists();
      setAllStylists(data);
      if (isAuthenticated) {
        const bookings = await getMyBookings();
        const upcoming = bookings.find((b: any) => b.status === 'confirmed' || b.status === 'pending');
        if (upcoming) {
          const stylistId = typeof upcoming.stylistId === 'object' ? upcoming.stylistId._id : upcoming.stylistId;
          const clientId = typeof upcoming.clientId === 'object' ? upcoming.clientId._id : upcoming.clientId;
          const stylistName = typeof upcoming.stylistId === 'object' ? upcoming.stylistId.name : '';
          const serviceName = typeof upcoming.serviceId === 'object' ? upcoming.serviceId.name : '';
          const stylistImage = typeof upcoming.stylistId === 'object' ? upcoming.stylistId.image : '';
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
    const interval = setInterval(async () => {
      try { const data = await getStylists(); setAllStylists(data); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = io(getSocketUrl("") || undefined, {
      reconnection: true, reconnectionAttempts: 5, reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });
    const refresh = async () => {
      try { const data = await getStylists(); setAllStylists(data); setLoading(false); } catch {}
    };
    socket.on("live:stylist-online", refresh);
    socket.on("live:stylist-offline", refresh);
    socket.on("stylist:location-updated", (data: { stylistId: string; location: { area: string; lat: number; lng: number } }) => {
      setAllStylists(prev => prev.some(s => s.id === data.stylistId)
        ? prev.map(s => s.id === data.stylistId ? { ...s, location: data.location } : s)
        : prev
      );
    });
    return () => { socket.removeAllListeners(); if (socket.connected) socket.disconnect(); };
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
    const haversineKm = (slat: number, slng: number) => {
      const R = 6371;
      const dLat = ((slat - userLat!) * Math.PI) / 180;
      const dLng = ((slng - userLng!) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat! * Math.PI) / 180) * Math.cos((slat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    if (filters.distanceMax > 0 && hasUserLoc) {
      result = result.filter(s => {
        const slat = s.location?.lat; const slng = s.location?.lng;
        if (!slat || !slng) return true;
        return haversineKm(slat, slng) <= filters.distanceMax;
      });
    }
    result = result.filter(s => (s.rating ?? 0) >= filters.ratingMin);
    if (filters.liveOnly) result = result.filter(s => s.isLive);
    switch (filters.sortBy) {
      case "rating": result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "distance":
        if (hasUserLoc) {
          result.sort((a, b) => {
            const al = a.location; const bl = b.location;
            const da = al?.lat && al?.lng ? haversineKm(al.lat, al.lng) : Infinity;
            const db = bl?.lat && bl?.lng ? haversineKm(bl.lat, bl.lng) : Infinity;
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

  const liveStylists = useMemo(() => filteredStylists.filter(s => s.isLive), [filteredStylists]);

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
    <div className="space-y-5 pb-6 pt-0">
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
        <ConsumerMap stylists={filteredStylists} onSelectStylist={handleSelectStylistFromMap} />
      </div>

      <LiveStrip liveStylists={liveStylists} />

      {nextBooking && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 dark:from-brand-600 dark:to-brand-900 shadow-lg shadow-brand-200/50 dark:shadow-brand-900/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
            <div className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                  {nextBooking.stylistImage ? (
                    <img src={nextBooking.stylistImage} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <span className="text-xl font-black text-white">{nextBooking.stylistName?.[0] || 'Q'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Queue
                    </span>
                    <Badge variant="gray" className="!bg-white/20 !text-white !border-white/20 !backdrop-blur-sm text-[10px] font-bold">
                      #{nextBooking.queuePosition}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1 leading-tight">
                    {nextBooking.stylistName || 'Your appointment'}
                  </h3>
                  {nextBooking.serviceName && (
                    <p className="text-sm text-white/70 mt-0.5">{nextBooking.serviceName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-white/60" />
                      <span className="text-xs font-semibold text-white/80">
                        ~{nextBooking.estimatedWaitMinutes} min wait
                      </span>
                    </div>
                    {nextBooking.startTime && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-white/60" />
                        <span className="text-xs text-white/60">
                          {new Date(nextBooking.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(8, 100 - (nextBooking.queuePosition - 1) * 15)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-white/90 to-white/60"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white/80 tabular-nums shrink-0">
                      {nextBooking.queuePosition === 1 ? 'Next up' : `${nextBooking.queuePosition - 1} ahead`}
                    </span>
                  </div>
                </div>
              </div>
              <Link to="/app/queue" className="mt-3 flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all group border border-white/10">
                <span className="text-xs font-semibold text-white/80">View full queue details</span>
                <ArrowRight size={14} className="text-white/60 group-hover:translate-x-0.5 transition-transform" />
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
