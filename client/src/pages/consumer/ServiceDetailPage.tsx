// src/pages/consumer/components/ServiceDetailPage.tsx
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Star,
  MapPin,
  BadgeCheck,
  ChevronRight,
  Scissors,
  CheckCircle,
  Shield,
  MessageSquare,
  Share2,
  Heart,
  Camera,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { getLocationString } from "@/utils/location";
import { getStylistById } from "@/api/stylists";
import BookingModal from "@/features/consumer/components/BookingModal";
import type { Stylist } from "@/domain/stylist/stylist.types";

interface ReviewItem {
  user: string;
  rating: number;
  comment: string;
  date: string;
}
interface StepItem {
  step: string;
  title: string;
  desc: string;
}
interface ServiceDisplay {
  _id?: string;
  name: string;
  price: string;
  duration: string;
  category?: string;
  popular?: boolean;
}

function StarRow({ rating, count, small }: { rating: number; count?: number; small?: boolean }) {
  return (
    <span className={`inline-flex items-center ${small ? "gap-0.5" : "gap-1"}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={small ? 10 : 13}
          fill={i <= Math.round(rating) ? "currentColor" : "none"}
          className={i <= Math.round(rating) ? "text-gold-400" : "text-warm-300 dark:text-gray-600"}
          strokeWidth={1.5}
        />
      ))}
      {count !== undefined && (
        <span className={`ml-0.5 ${small ? "text-[11px]" : "text-xs"} text-text-secondary dark:text-text-dark-secondary`}>
          ({count})
        </span>
      )}
    </span>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
        accent
          ? "border border-brand-500 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
          : "border border-warm-200 dark:border-gray-700 bg-transparent text-text-secondary dark:text-text-dark-secondary"
      }`}
    >
      {children}
    </span>
  );
}

function HeroGallery({ gallery, serviceName }: { gallery: string[]; serviceName: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-dark dark:bg-black">
      <AnimatePresence mode="wait">
        <motion.img
          key={activeIdx}
          src={gallery[activeIdx]}
          alt={serviceName}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full h-full object-cover block"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {gallery.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`rounded-full border-none cursor-pointer transition-all duration-300 p-0 ${
              i === activeIdx ? "w-5 h-1.5 bg-white dark:bg-white" : "w-1.5 h-1.5 bg-white/40 dark:bg-white/40"
            }`}
          />
        ))}
      </div>
      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/35 backdrop-blur-md rounded-full px-2.5 py-1">
        <Camera size={12} color="white" />
        <span className="text-[11px] text-white font-display">{gallery.length} photos</span>
      </div>
    </div>
  );
}

function ProcessSteps({ steps }: { steps: StepItem[] }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex gap-[18px] relative"
        >
          <div className="flex flex-col items-center shrink-0">
            <div className="w-9 h-9 rounded-full border-[1.5px] border-brand-500 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{step.step}</span>
            </div>
            {i < steps.length - 1 && <div className="w-px flex-1 min-h-[20px] bg-warm-200 dark:bg-gray-700 my-1.5" />}
          </div>
          <div className={`pb-5 pt-1.5 ${i === steps.length - 1 ? "pb-0" : ""}`}>
            <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary leading-tight">{step.title}</p>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1 leading-relaxed">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const initials = review.user.split(" ").map((w) => w[0]).join("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warm-100 dark:bg-gray-800 rounded-2xl p-[18px_20px] border border-warm-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-warm-100 dark:bg-brand-900/30 border-[1.5px] border-brand-500 dark:border-brand-500 flex items-center justify-center font-semibold text-[13px] text-brand-600 dark:text-brand-400">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">{review.user}</p>
            <p className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{review.date}</p>
          </div>
        </div>
        <StarRow rating={review.rating} small />
      </div>
      <p className="text-[13px] text-text-secondary dark:text-text-dark-secondary leading-relaxed italic">
        &ldquo;{review.comment}&rdquo;
      </p>
    </motion.div>
  );
}

function RelatedServiceRow({ svc, stylistId }: { svc: ServiceDisplay; stylistId: string }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const serviceId = svc._id || svc.name.toLowerCase().replace(/\s+/g, "-");
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/app/stylist/${stylistId}/service/${serviceId}`)}
      className={`flex items-center justify-between p-[14px_16px] rounded-2xl cursor-pointer transition-all duration-200 ${
        hovered
          ? "border border-brand-500 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/30"
          : "border border-warm-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${hovered ? "bg-brand-500/15 dark:bg-brand-900/20" : "bg-warm-100 dark:bg-gray-800"}`}>
          <Scissors size={15} className={hovered ? "text-brand-500" : "text-text-secondary"} />
        </div>
        <div>
          <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">{svc.name}</p>
          {svc.duration && <p className="text-[11.5px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{svc.duration}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">{svc.price}</span>
        <ChevronRight size={15} className={hovered ? "text-brand-500" : "text-text-secondary"} />
      </div>
    </div>
  );
}

function BookingSidebar({ service, stylist, onBook }: { service: ServiceDisplay; stylist: Stylist; onBook?: () => void }) {
  const [liked, setLiked] = useState(false);
  const reviewCount = stylist.reviewCount || 0;
  return (
    <div className="sticky top-6 flex flex-col gap-3.5">
      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 overflow-hidden shadow-card">
        <div className="p-5 pb-0">
          <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-secondary dark:text-text-dark-secondary mb-3">Your Specialist</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img src={stylist.image || ""} alt={stylist.name} className="w-14 h-14 rounded-full object-cover border-2 border-warm-100 dark:border-gray-700" />
              {stylist.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-brand-500 dark:bg-brand-500 border-2 border-white dark:border-surface-dark flex items-center justify-center">
                  <BadgeCheck size={10} color="white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg text-text-primary dark:text-text-dark-primary leading-tight">{stylist.name}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">{stylist.category || "Stylist"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Star, label: "Rating", val: stylist.rating },
              { icon: MessageSquare, label: "Reviews", val: reviewCount },
              { icon: MapPin, label: "Location", val: stylist.location?.area || "Accra" },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="bg-warm-100 dark:bg-gray-800 rounded-xl p-[10px_8px] text-center">
                <Icon size={13} className="mx-auto mb-1 text-brand-500" />
                <p className="font-bold text-sm text-text-primary dark:text-text-dark-primary">{val}</p>
                <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="h-px bg-warm-200 dark:bg-gray-700" />
        <div className="px-5 py-4">
          <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-secondary dark:text-text-dark-secondary mb-3">Price Breakdown</p>
          {[
            { label: service.name, price: service.price },
            { label: "Service fee", price: "GHC 0" },
          ].map(({ label, price }) => (
            <div key={label} className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-text-secondary dark:text-text-dark-secondary">{label}</span>
              <span className="text-[13px] font-semibold text-text-primary dark:text-text-dark-primary">{price}</span>
            </div>
          ))}
          <div className="h-px bg-warm-200 dark:bg-gray-700 my-2.5" />
          <div className="flex justify-between items-baseline">
            <span className="text-base text-text-primary dark:text-text-dark-primary font-medium">Total</span>
            <span className="text-[26px] font-semibold text-text-primary dark:text-text-dark-primary">{service.price}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={11} className="text-text-secondary" />
            <span className="text-[11px] text-text-secondary dark:text-text-dark-secondary">{service.duration} · Free cancellation up to 24h</span>
          </div>
        </div>
        <div className="px-5 pb-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBook}
            className="w-full py-[15px] rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-semibold text-sm tracking-[0.01em] flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Calendar size={16} />
            Book Appointment
          </motion.button>
          <div className="flex gap-2 mt-2.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLiked(!liked)}
              className={`flex-1 py-[11px] rounded-xl font-medium text-[13px] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                liked
                  ? "border border-brand-500 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                  : "border border-warm-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary"
              }`}
            >
              <Heart size={14} className={liked ? "text-brand-500 fill-brand-500" : ""} />
              {liked ? "Saved" : "Save"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-[11px] rounded-xl border border-warm-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary font-medium text-[13px] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <Share2 size={14} />
              Share
            </motion.button>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-4 flex flex-col gap-2.5">
        {[
          { icon: Shield, label: "Secure & verified booking" },
          { icon: CheckCircle, label: "Free cancellation within 24h" },
          { icon: Award, label: "Satisfaction guaranteed" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={14} className="text-success" />
            <span className="text-xs text-text-secondary dark:text-text-dark-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
      <div className="max-w-[1140px] mx-auto px-4 md:px-8 pt-7 pb-20">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-warm-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-12 w-96 bg-warm-200 dark:bg-gray-700 rounded-lg" />
          <div className="aspect-video rounded-2xl bg-warm-200 dark:bg-gray-700" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-warm-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-3/4 bg-warm-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const { stylistId, serviceId } = useParams<{ stylistId: string; serviceId: string }>();
  const navigate = useNavigate();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [service, setService] = useState<ServiceDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (!stylistId || !serviceId) return;
    let alive = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const found = await getStylistById(stylistId);
        if (!alive) return;

        const rawServices = (found.services || [])
          .filter((s): s is Exclude<typeof s, string> => typeof s !== "string")
          .map((s) => ({
            _id: s._id,
            name: s.name,
            price: s.price,
            duration: s.duration || "",
            category: s.category || "General",
            popular: s.popular || false,
          }));

        const matched = rawServices.find(
          (s) => s._id === serviceId || s.name.toLowerCase().replace(/\s+/g, "-") === serviceId,
        );

        if (!alive) return;
        setStylist(found);
        setService(matched || rawServices[0] || null);
        setLoading(false);
      } catch {
        if (alive) {
          setLoading(false);
          setError(true);
        }
      }
    };
    fetchData();
    return () => { alive = false; };
  }, [stylistId, serviceId]);

  useEffect(() => {
    if (!stylist?.reviews?.length) return;
    const mapped = stylist.reviews.map((r) => ({
      user: r.user || "Customer",
      rating: r.rating,
      comment: r.comment || "",
      date: typeof r.date === "string" ? r.date : "",
    }));
    setReviews(mapped);
  }, [stylist?.reviews]);

  const handleBookingSuccess = useCallback(() => {
    setBookingOpen(false);
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !stylist) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-surface-dark flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Scissors size={48} className="mx-auto mb-4 text-warm-300" />
          <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-2">Unable to load service</h2>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">The stylist or service could not be found. Please try again.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-surface-dark flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Scissors size={48} className="mx-auto mb-4 text-warm-300" />
          <h2 className="text-xl font-semibold text-text-primary dark:text-text-dark-primary mb-2">Service not found</h2>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">This service is no longer listed or has been removed.</p>
          <button
            onClick={() => navigate(`/app/stylist/${stylistId}`)}
            className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm cursor-pointer"
          >
            View Stylist
          </button>
        </div>
      </div>
    );
  }

  const extraServices: ServiceDisplay[] = (stylist.services || [])
    .filter((s): s is Exclude<typeof s, string> => typeof s !== "string")
    .filter((s) => s.name !== service.name)
    .map((s) => ({
      _id: s._id,
      name: s.name,
      price: s.price,
      duration: s.duration || "",
      category: s.category || "General",
      popular: s.popular || false,
    }));

  const locationStr = typeof stylist.location === "string"
    ? stylist.location
    : stylist.location?.area || "Accra";

  return (
    <>
      <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
        <motion.div
          initial={false}
          animate={{ background: scrolled ? "rgba(250,250,248,0.92)" : "transparent" }}
          className={`sticky top-0 z-[100] transition-all duration-300 ${
            scrolled ? "border-b border-warm-200 dark:border-gray-700 backdrop-blur-xl" : "border-b border-transparent"
          }`}
        >
          <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-white dark:bg-surface-dark-secondary border border-warm-200 dark:border-gray-700 rounded-full px-3 md:px-4 py-2 text-[13px] font-medium text-text-secondary dark:text-text-dark-secondary cursor-pointer"
            >
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Back to Stylist</span>
            </button>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">Stylists</span>
              <ChevronRight size={11} className="text-text-secondary" />
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">{stylist.name}</span>
              <ChevronRight size={11} className="text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary dark:text-text-dark-primary">{service.name}</span>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 bg-white dark:bg-surface-dark-secondary border border-warm-200 dark:border-gray-700 rounded-full px-3 md:px-3.5 py-2 text-[13px] font-medium text-text-secondary dark:text-text-dark-secondary cursor-pointer">
                <Share2 size={13} /> <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="max-w-[1140px] mx-auto px-4 md:px-8 pt-7 pb-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-2.5">
              {service.category && <Tag accent>{service.category}</Tag>}
              {service.popular && (
                <Tag>
                  <Sparkles size={10} /> Most popular
                </Tag>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-[52px] font-light text-text-primary dark:text-text-dark-primary leading-tight tracking-[-0.01em]">
              {service.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-3">
              <StarRow rating={stylist.rating} count={stylist.reviewCount || 0} />
              <span className="hidden md:inline text-warm-200 dark:text-gray-500">·</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-secondary dark:text-text-dark-secondary">
                <Clock size={13} /> {service.duration}
              </span>
              <span className="hidden md:inline text-warm-200 dark:text-gray-500">·</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-secondary dark:text-text-dark-secondary">
                <MapPin size={13} /> {getLocationString(locationStr)}
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="flex flex-col gap-7">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-dark dark:bg-black">
                  <img
                    src={stylist.image || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80"}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-5 md:p-8"
              >
                <h2 className="text-2xl md:text-[26px] font-normal text-text-primary dark:text-text-dark-primary mb-3.5">
                  About this service
                </h2>
                <p className="text-sm md:text-[14.5px] text-text-secondary dark:text-text-dark-secondary leading-[1.8]">
                  {service.name} — {service.duration} at {service.price}. Book this service with {stylist.name} for a professional experience.
                </p>
              </motion.div>

              {reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-5 md:p-8"
                >
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="text-2xl md:text-[26px] font-normal text-text-primary dark:text-text-dark-primary">Reviews</h2>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-[40px] font-medium text-text-primary dark:text-text-dark-primary leading-none">
                          {stylist.rating}
                        </span>
                        <div>
                          <StarRow rating={stylist.rating} />
                          <p className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-1">{reviews.length} reviews</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {reviews.slice(0, 3).map((rev, i) => (
                      <ReviewCard key={i} review={rev} />
                    ))}
                  </div>
                </motion.div>
              )}

              {extraServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-5 md:p-8"
                >
                  <h2 className="text-2xl md:text-[26px] font-normal text-text-primary dark:text-text-dark-primary mb-5">
                    More from {stylist.name}
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {extraServices.map((svc, i) => (
                      <RelatedServiceRow key={i} svc={svc} stylistId={stylistId!} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <BookingSidebar service={service} stylist={stylist} onBook={() => setBookingOpen(true)} />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {bookingOpen && (
          <BookingModal
            key="bm"
            stylist={stylist}
            preSelectedService={{ name: service.name, price: service.price }}
            onClose={() => setBookingOpen(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
