// src/pages/consumer/components/ServiceDetailPage.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

/* ─── Types (unchanged) ─────────────────────────────── */
interface StepItem {
  step: string;
  title: string;
  desc: string;
}
interface ReviewItem {
  user: string;
  rating: number;
  comment: string;
  date: string;
}
interface ServiceItem {
  name: string;
  price: string;
  duration: string;
  category?: string;
  popular?: boolean;
  description?: string;
  image?: string;
  gallery?: string[];
  whatsIncluded?: StepItem[];
}
interface StylistItem {
  id: string;
  name: string;
  title?: string;
  image: string;
  location: string;
  rating: number;
  isVerified?: boolean;
  totalReviews: number;
  reviews: ReviewItem[];
  services: { name: string; price: string; duration: string }[];
}



/* ─── Mock Data (unchanged) ──────────────────────────── */
const MOCK_SERVICE: ServiceItem = {
  name: "Balayage & Toning",
  price: "$165",
  duration: "3 hrs",
  category: "Color",
  popular: true,
  description:
    "A hand-painted highlighting technique that creates a natural sun-kissed gradient. Unlike traditional foil highlights, balayage delivers a softer, more dimensional result with less maintenance — regrowth is gradual and seamlessly blends into your base colour.",
  image:
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80",
  gallery: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=900&q=80",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=900&q=80",
  ],
  whatsIncluded: [
    {
      step: "01",
      title: "Consultation",
      desc: "In-depth hair analysis and colour goal mapping",
    },
    {
      step: "02",
      title: "Shampoo & Prep",
      desc: "Deep cleansing and strand prep treatment",
    },
    {
      step: "03",
      title: "Hand-Painted Colour",
      desc: "Freehand balayage with custom toning",
    },
    {
      step: "04",
      title: "Processing & Toning",
      desc: "Toner applied for the perfect cool or warm finish",
    },
    {
      step: "05",
      title: "Blow-Dry & Style",
      desc: "Finished and styled to show off your new colour",
    },
  ],
};

const MOCK_STYLIST: StylistItem = {
  id: "s1",
  name: "Amara Osei",
  title: "Colour Specialist",
  image:
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
  location: "East Legon, Accra",
  rating: 4.9,
  isVerified: true,
  totalReviews: 84,
  reviews: [
    {
      user: "Efua M.",
      rating: 5,
      comment:
        "Amara is an absolute genius with colour. My balayage turned out better than the inspiration photo. She really takes her time to understand what you want.",
      date: "2 weeks ago",
    },
    {
      user: "Nana K.",
      rating: 5,
      comment:
        "Professional, warm, and incredibly skilled. My hair has never looked so healthy and vibrant. Highly recommend for any colour work.",
      date: "1 month ago",
    },
    {
      user: "Abena F.",
      rating: 5,
      comment:
        "Finally found my permanent stylist! The results speak for themselves — everyone keeps asking where I had my hair done.",
      date: "6 weeks ago",
    },
  ],
  services: [
    { name: "Full Highlights", price: "$130", duration: "2.5 hrs" },
    { name: "Keratin Treatment", price: "$200", duration: "3.5 hrs" },
    { name: "Brazilian Blowout", price: "$180", duration: "2.5 hrs" },
    { name: "Toner Refresh", price: "$60", duration: "45 min" },
  ],
};

/* ─── Sub‑components (unchanged except minor responsive adjustments) ──── */

function StarRow({
  rating,
  count,
  small,
}: {
  rating: number;
  count?: number;
  small?: boolean;
}) {
  return (
    <span className={`inline-flex items-center ${small ? "gap-0.5" : "gap-1"}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={small ? 10 : 13}
          fill={i <= Math.round(rating) ? "currentColor" : "none"}
          className={i <= Math.round(rating) ? "text-amber-500" : "text-warm-300 dark:text-gray-600"}
          strokeWidth={1.5}
        />
      ))}
      {count !== undefined && (
        <span
          className={`ml-0.5 ${small ? "text-[11px]" : "text-xs"} text-text-secondary dark:text-text-dark-secondary`}
        >
          ({count})
        </span>
      )}
    </span>
  );
}

function Tag({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
        uppercase tracking-wider
        ${
          accent
            ? "border border-amber-500 dark:border-amber-500 bg-warm-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            : "border border-warm-200 dark:border-gray-700 bg-transparent text-text-secondary dark:text-text-dark-secondary"
        }
      `}
    >
      {children}
    </span>
  );
}

function HeroGallery({
  gallery,
  serviceName,
}: {
  gallery: string[];
  serviceName: string;
}) {
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
            className={`
              rounded-full border-none cursor-pointer transition-all duration-300 p-0
              ${i === activeIdx ? "w-5 h-1.5 bg-white dark:bg-white" : "w-1.5 h-1.5 bg-white/40 dark:bg-white/40"}
            `}
          />
        ))}
      </div>

      <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/35 backdrop-blur-md rounded-full px-2.5 py-1">
        <Camera size={12} color="white" />
        <span className="text-[11px] text-white font-['Plus_Jakarta_Sans']">
          {gallery.length} photos
        </span>
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
            <div className="w-9 h-9 rounded-full border-[1.5px] border-amber-500 dark:border-amber-500 bg-warm-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {step.step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 min-h-[20px] bg-warm-200 dark:bg-gray-700 my-1.5" />
            )}
          </div>
          <div
            className={`pb-5 pt-1.5 ${i === steps.length - 1 ? "pb-0" : ""}`}
          >
            <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary leading-tight">
              {step.title}
            </p>
            <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1 leading-relaxed">
              {step.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const initials = review.user
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warm-100 dark:bg-gray-800 rounded-2xl p-[18px_20px] border border-warm-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-warm-100 dark:bg-amber-900/30 border-[1.5px] border-amber-500 dark:border-amber-500 flex items-center justify-center font-semibold text-[13px] text-amber-600 dark:text-amber-400">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">
              {review.user}
            </p>
            <p className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-0.5">
              {review.date}
            </p>
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

function RelatedServiceRow({
  svc,
}: {
  svc: { name: string; price: string; duration: string };
  stylistId: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        flex items-center justify-between p-[14px_16px] rounded-2xl cursor-pointer
        transition-all duration-200
        ${
          hovered
            ? "border border-amber-500 dark:border-amber-500 bg-warm-100 dark:bg-amber-900/30"
            : "border border-warm-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className={`
            w-9 h-9 rounded-xl flex items-center justify-center transition-all
            ${hovered ? "bg-amber-500/15 dark:bg-amber-900/20" : "bg-warm-100 dark:bg-gray-800"}
          `}
        >
          <Scissors size={15} className={hovered ? "text-amber-500" : "text-text-secondary"} />
        </div>
        <div>
          <p className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">
            {svc.name}
          </p>
          {svc.duration && (
            <p className="text-[11.5px] text-text-secondary dark:text-text-dark-secondary mt-0.5">
              {svc.duration}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm text-text-primary dark:text-text-dark-primary">
          {svc.price}
        </span>
        <ChevronRight size={15} className={hovered ? "text-amber-500" : "text-text-secondary"} />
      </div>
    </div>
  );
}

function BookingSidebar({
  service,
  stylist,
  onBook,
}: {
  service: ServiceItem;
  stylist: StylistItem;
  onBook?: () => void;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="sticky top-6 flex flex-col gap-3.5">
      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 overflow-hidden shadow-card">
        <div className="p-5 pb-0">
          <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-secondary dark:text-text-dark-secondary mb-3">
            Your Specialist
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={stylist.image}
                alt={stylist.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-warm-100 dark:border-gray-700"
              />
              {stylist.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-blue-700 dark:bg-blue-700 border-2 border-white dark:border-surface-dark flex items-center justify-center">
                  <BadgeCheck size={10} color="white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg text-text-primary dark:text-text-dark-primary leading-tight">
                {stylist.name}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {stylist.title}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Star, label: "Rating", val: stylist.rating },
              {
                icon: MessageSquare,
                label: "Reviews",
                val: stylist.totalReviews,
              },
              { icon: MapPin, label: "Location", val: "Accra" },
            ].map(({ icon: Icon, label, val }) => (
              <div
                key={label}
                className="bg-warm-100 dark:bg-gray-800 rounded-xl p-[10px_8px] text-center"
              >
                <Icon size={13} className="mx-auto mb-1 text-amber-500" />
                <p className="font-bold text-sm text-text-primary dark:text-text-dark-primary">
                  {val}
                </p>
                <p className="text-[10px] text-text-secondary dark:text-text-dark-secondary mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-warm-200 dark:bg-gray-700" />

        <div className="px-5 py-4">
          <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-secondary dark:text-text-dark-secondary mb-3">
            Price Breakdown
          </p>
          {[
            { label: service.name, price: service.price },
            { label: "Service fee", price: "GHC 0" },
          ].map(({ label, price }) => (
            <div key={label} className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-text-secondary dark:text-text-dark-secondary">
                {label}
              </span>
              <span className="text-[13px] font-semibold text-text-primary dark:text-text-dark-primary">
                {price}
              </span>
            </div>
          ))}
          <div className="h-px bg-warm-200 dark:bg-gray-700 my-2.5" />
          <div className="flex justify-between items-baseline">
            <span className="text-base text-text-primary dark:text-text-dark-primary font-medium">
              Total
            </span>
            <span className="text-[26px] font-semibold text-text-primary dark:text-text-dark-primary">
              {service.price}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={11} className="text-text-secondary" />
            <span className="text-[11px] text-text-secondary dark:text-text-dark-secondary">
              {service.duration} · Free cancellation up to 24h
            </span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBook}
            className="w-full py-[15px] rounded-xl bg-text-primary dark:bg-white text-white dark:text-gray-900 font-semibold text-sm tracking-[0.01em] flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            <Calendar size={16} />
            Book Appointment
          </motion.button>
          <div className="flex gap-2 mt-2.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLiked(!liked)}
              className={`
                flex-1 py-[11px] rounded-xl font-medium text-[13px]
                flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer
                ${
                  liked
                    ? "border border-amber-500 dark:border-amber-500 bg-warm-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    : "border border-warm-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary text-text-secondary dark:text-text-dark-secondary"
                }
              `}
            >
              <Heart size={14} className={liked ? "text-amber-500 fill-amber-500" : ""} />
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
            <span className="text-xs text-text-secondary dark:text-text-dark-secondary">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page (responsive) ─────────────────────────── */
export default function ServiceDetailPage() {
  const navigate = useNavigate();
  const service = MOCK_SERVICE;
  const stylist = MOCK_STYLIST;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
        {/* Topbar */}
        <motion.div
          initial={false}
          animate={{
            background: scrolled ? "rgba(250,250,248,0.92)" : "transparent",
          }}
          className={`
            sticky top-0 z-[100] transition-all duration-300
            ${
              scrolled
                ? "border-b border-warm-200 dark:border-gray-700 backdrop-blur-xl"
                : "border-b border-transparent"
            }
          `}
        >
          <div className="max-w-[1140px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-white dark:bg-surface-dark-secondary border border-warm-200 dark:border-gray-700 rounded-full px-3 md:px-4 py-2 text-[13px] font-medium text-text-secondary dark:text-text-dark-secondary cursor-pointer"
            >
              <ArrowLeft size={14} />{" "}
              <span className="hidden sm:inline">Back to Stylist</span>
            </button>

            {/* Breadcrumb – hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">Stylists</span>
              <ChevronRight size={11} className="text-text-secondary" />
              <span className="text-xs text-text-secondary dark:text-text-dark-secondary">{stylist.name}</span>
              <ChevronRight size={11} className="text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary dark:text-text-dark-primary">
                {service.name}
              </span>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 bg-white dark:bg-surface-dark-secondary border border-warm-200 dark:border-gray-700 rounded-full px-3 md:px-3.5 py-2 text-[13px] font-medium text-text-secondary dark:text-text-dark-secondary cursor-pointer">
                <Share2 size={13} />{" "}
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Page Body */}
        <div className="max-w-[1140px] mx-auto px-4 md:px-8 pt-7 pb-20">
          {/* meta header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Tag accent>{service.category}</Tag>
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
              <StarRow rating={stylist.rating} count={stylist.totalReviews} />
              <span className="hidden md:inline text-warm-200 dark:text-gray-500">·</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-secondary dark:text-text-dark-secondary">
                <Clock size={13} /> {service.duration}
              </span>
              <span className="hidden md:inline text-warm-200 dark:text-gray-500">·</span>
              <span className="flex items-center gap-1.5 text-[13px] text-text-secondary dark:text-text-dark-secondary">
                <MapPin size={13} /> {getLocationString(stylist.location)}
              </span>
            </div>
          </motion.div>

          {/* Two‑column layout – stacks on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-7">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <HeroGallery
                  gallery={service.gallery!}
                  serviceName={service.name}
                />
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
                  {service.description}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-5 md:p-8"
              >
                <h2 className="text-2xl md:text-[26px] font-normal text-text-primary dark:text-text-dark-primary mb-6">
                  What's included
                </h2>
                <ProcessSteps steps={service.whatsIncluded || []} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-warm-200 dark:border-gray-700 p-5 md:p-8"
              >
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-2xl md:text-[26px] font-normal text-text-primary dark:text-text-dark-primary">
                    Reviews
                  </h2>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl md:text-[40px] font-medium text-text-primary dark:text-text-dark-primary leading-none">
                        {stylist.rating}
                      </span>
                      <div>
                        <StarRow rating={stylist.rating} />
                        <p className="text-[11px] text-text-secondary dark:text-text-dark-secondary mt-1">
                          {stylist.totalReviews} reviews
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {stylist.reviews.map((rev, i) => (
                    <ReviewCard key={i} review={rev} />
                  ))}
                </div>
                <button className="mt-4 w-full py-3 rounded-xl border border-warm-200 dark:border-gray-700 bg-transparent text-[13px] font-semibold text-text-secondary dark:text-text-dark-secondary cursor-pointer flex items-center justify-center gap-1.5">
                  <MessageSquare size={14} />
                  View all {stylist.totalReviews} reviews
                  <ChevronRight size={14} />
                </button>
              </motion.div>

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
                  {stylist.services.map((svc, i) => (
                    <RelatedServiceRow
                      key={i}
                      svc={svc}
                      stylistId={stylist.id}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN – Sticky Sidebar (appears after content on mobile) */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BookingSidebar service={service} stylist={stylist} onBook={() => navigate(`/app/stylist/${stylist.id}`)} />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
