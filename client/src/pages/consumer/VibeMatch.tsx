import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, ArrowLeft, Star,
  Check, Clock, MapPin, RotateCcw, ChevronRight,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocationString } from "@/utils/location";
import CameraCapture from "../../features/vibe-match/components/CameraCapture";
import { HAIRSTYLES, getHairstyleById } from "../../features/vibe-match/data/hairstyles";

interface Option {
  value: string;
  label: string;
  description?: string;
  emoji?: string;
}

interface Question {
  id: string;
  text: string;
  subtitle: string;
  options: Option[];
  multiSelect?: boolean;
}

interface ServiceRec {
  name: string;
  reason: string;
  price: string;
  duration: string;
  match: number;
}

interface StylistRec {
  id: number;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  priceRange: string;
  specialties: string[];
  matchScore: number;
}

const questions: Question[] = [
  {
    id: "vibe",
    text: "What's your vibe?",
    subtitle: "Choose the energy you want to bring",
    options: [
      { value: "bold", label: "Bold & Edgy", emoji: "🔥", description: "Stand out, make a statement" },
      { value: "natural", label: "Natural & Effortless", emoji: "🌿", description: "Enhanced natural beauty" },
      { value: "elegant", label: "Elegant & Glam", emoji: "✨", description: "Polished and refined" },
      { value: "playful", label: "Playful & Creative", emoji: "🎨", description: "Fun, expressive, colorful" },
      { value: "professional", label: "Clean & Professional", emoji: "💼", description: "Sharp, put-together" },
    ],
  },
  {
    id: "hairType",
    text: "What's your hair type?",
    subtitle: "Helps us match you with the right specialist",
    options: [
      { value: "straight", label: "Straight", emoji: "〰️", description: "Type 1 — Falls flat naturally" },
      { value: "wavy", label: "Wavy", emoji: "🌊", description: "Type 2 — Soft S-patterns" },
      { value: "curly", label: "Curly", emoji: "🌀", description: "Type 3 — Defined curls" },
      { value: "coily", label: "Coily / Kinky", emoji: "🪢", description: "Type 4 — Tight coils & zig-zags" },
      { value: "protective", label: "Protective Style", emoji: "🧶", description: "Braids, twists, locs, weaves" },
    ],
  },
  {
    id: "faceShape",
    text: "What's your face shape?",
    subtitle: "Don't worry — you can select 'Not sure'",
    options: [
      { value: "oval", label: "Oval", emoji: "🥚", description: "Balanced proportions, slightly longer" },
      { value: "round", label: "Round", emoji: "⭕", description: "Width and length are similar" },
      { value: "square", label: "Square", emoji: "⬜", description: "Strong jawline, angular" },
      { value: "heart", label: "Heart", emoji: "🔻", description: "Wider forehead, pointed chin" },
      { value: "diamond", label: "Diamond", emoji: "💎", description: "Wide cheekbones, narrow forehead/jaw" },
      { value: "notSure", label: "Not Sure", emoji: "🤷", description: "That's totally fine!" },
    ],
  },
  {
    id: "occasion",
    text: "What's the occasion?",
    subtitle: "This helps us fine-tune recommendations",
    options: [
      { value: "daily", label: "Everyday Look", emoji: "☀️", description: "Low-maintenance daily style" },
      { value: "event", label: "Special Event", emoji: "🎉", description: "Wedding, party, celebration" },
      { value: "date", label: "Date Night", emoji: "💕", description: "Look your absolute best" },
      { value: "work", label: "Work / Office", emoji: "🏢", description: "Professional and polished" },
      { value: "photo", label: "Photoshoot", emoji: "📸", description: "Camera-ready glamour" },
      { value: "vacation", label: "Vacation / Trip", emoji: "✈️", description: "Ready for adventure" },
    ],
  },
  {
    id: "budget",
    text: "What's your budget range?",
    subtitle: "We'll show stylists within your range",
    options: [
      { value: "budget", label: "Budget-Friendly", emoji: "💰", description: "$30 – $80" },
      { value: "mid", label: "Mid-Range", emoji: "💎", description: "$80 – $200" },
      { value: "premium", label: "Premium", emoji: "👑", description: "$200+" },
      { value: "flexible", label: "Flexible", emoji: "🤷", description: "Show me everything" },
    ],
  },
];

function generateRecommendations(
  answers: Record<string, string>,
  selectedHairstyleId?: string,
): { services: ServiceRec[]; stylists: StylistRec[] } {
  const services: ServiceRec[] = [];
  const stylists: StylistRec[] = [];

  const vibe = answers.vibe || "professional";

  const vibeServices: Record<string, ServiceRec[]> = {
    bold: [
      { name: "Fashion Color & Balayage", reason: "Bold color that turns heads", price: "$150 – $300", duration: "2-3 hrs", match: 97 },
      { name: "Creative Cut & Style", reason: "Asymmetrical, undercut, or textured pixie", price: "$80 – $150", duration: "1 hr", match: 92 },
    ],
    natural: [
      { name: "Natural Hair Treatment", reason: "Deep conditioning that enhances your texture", price: "$60 – $120", duration: "1.5 hrs", match: 95 },
      { name: "Twist-Out / Wash & Go", reason: "Defined curls, effortless finish", price: "$40 – $80", duration: "1 hr", match: 91 },
    ],
    elegant: [
      { name: "Silk Press & Deep Conditioning", reason: "Sleek, shiny, and glamorous", price: "$80 – $150", duration: "1.5 hrs", match: 96 },
      { name: "Updo / Special Event Styling", reason: "Red-carpet ready", price: "$100 – $250", duration: "2 hrs", match: 93 },
    ],
    playful: [
      { name: "Braids with Accessories", reason: "Beads, cuffs, and colorful wraps", price: "$80 – $200", duration: "2-4 hrs", match: 94 },
      { name: "Colored Extensions / Wigs", reason: "Temporary fun without commitment", price: "$100 – $300", duration: "2 hrs", match: 89 },
    ],
    professional: [
      { name: "Classic Cut & Blowout", reason: "Timeless and polished", price: "$50 – $100", duration: "1 hr", match: 96 },
      { name: "Keratin Smoothing Treatment", reason: "Low-maintenance, always put-together", price: "$150 – $350", duration: "2 hrs", match: 90 },
    ],
  };

  services.push(...(vibeServices[vibe] || vibeServices.professional));

  const hairType = answers.hairType;

  const hairTypeServices: Record<string, ServiceRec[]> = {
    straight: [
      { name: "Blowout & Smoothing", reason: "Enhances your natural straight texture", price: "$40 – $80", duration: "45 min", match: 94 },
    ],
    wavy: [
      { name: "Beach Wave Styling", reason: "Defined, effortless waves", price: "$50 – $100", duration: "1 hr", match: 93 },
    ],
    curly: [
      { name: "DevaCut / Curl Shaping", reason: "Designed specifically for curly hair", price: "$70 – $140", duration: "1.5 hrs", match: 96 },
    ],
    coily: [
      { name: "Coil Defining & Moisture Treatment", reason: "Hydration and definition for tight coils", price: "$60 – $130", duration: "1.5 hrs", match: 95 },
    ],
    protective: [
      { name: "Knotless Braids", reason: "Protective style with natural finish", price: "$100 – $250", duration: "3-5 hrs", match: 97 },
      { name: "Goddess Locs Installation", reason: "Stylish and low-maintenance protective style", price: "$150 – $350", duration: "4-6 hrs", match: 94 },
    ],
  };

  if (hairType && hairTypeServices[hairType]) {
    services.push(...hairTypeServices[hairType]);
  }

  if (answers.faceShape === "round") {
    services.push({ name: "Long Layers / Face-Framing", reason: "Elongates and balances round faces", price: "$60 – $120", duration: "1 hr", match: 88 });
  } else if (answers.faceShape === "square") {
    services.push({ name: "Soft Layers & Texture", reason: "Softens angular features beautifully", price: "$60 – $120", duration: "1 hr", match: 87 });
  } else if (answers.faceShape === "heart") {
    services.push({ name: "Chin-Length Bob / Side-Swept Bangs", reason: "Balances a wider forehead", price: "$50 – $100", duration: "1 hr", match: 86 });
  }

  if (answers.occasion === "event" || answers.occasion === "date") {
    services.push({ name: "Glam Makeup + Hair Combo", reason: "Complete look for your special occasion", price: "$200 – $400", duration: "2-3 hrs", match: 91 });
  } else if (answers.occasion === "photo") {
    services.push({ name: "Camera-Ready Styling", reason: "Photogenic volume and dimension", price: "$100 – $250", duration: "1.5 hrs", match: 90 });
  }

  const allStylists: StylistRec[] = [
    { id: 1, name: "Ama Beauty Studio", category: "Hair & Color", image: "https://i.pravatar.cc/150?img=5", rating: 4.9, reviewCount: 127, location: "East Legon", priceRange: "$60 – $300", specialties: ["Balayage", "Silk Press", "Cuts"], matchScore: 97 },
    { id: 2, name: "Nana Braids Palace", category: "Braids & Locs", image: "https://i.pravatar.cc/150?img=10", rating: 4.8, reviewCount: 89, location: "Osu", priceRange: "$80 – $250", specialties: ["Knotless Braids", "Goddess Locs", "Cornrows"], matchScore: 94 },
    { id: 3, name: "Elite Barber Co.", category: "Barber & Fades", image: "https://i.pravatar.cc/150?img=15", rating: 4.7, reviewCount: 203, location: "Cantonments", priceRange: "$30 – $80", specialties: ["Fades", "Line-ups", "Beard Care"], matchScore: 88 },
    { id: 4, name: "Glow Nails & Beauty", category: "Nails & Lashes", image: "https://i.pravatar.cc/150?img=20", rating: 4.9, reviewCount: 156, location: "Labone", priceRange: "$40 – $200", specialties: ["Gel Nails", "Nail Art", "Lash Extensions"], matchScore: 92 },
    { id: 5, name: "Kofi's Chair", category: "Natural Hair", image: "https://i.pravatar.cc/150?img=25", rating: 4.8, reviewCount: 67, location: "Dzorwulu", priceRange: "$50 – $150", specialties: ["Twist-Outs", "Deep Conditioning", "Protective Styles"], matchScore: 91 },
    { id: 6, name: "Luxe Studio Accra", category: "Premium Styling", image: "https://i.pravatar.cc/150?img=30", rating: 5.0, reviewCount: 42, location: "Airport Residential", priceRange: "$150 – $500", specialties: ["Bridal", "Editorial", "Color"], matchScore: 89 },
  ];

  let filtered = [...allStylists];

  if (hairType === "protective") {
    filtered = filtered.map((s) => (s.id === 2 ? { ...s, matchScore: 99 } : s));
  }
  if (hairType === "curly" || hairType === "coily") {
    filtered = filtered.map((s) => (s.id === 5 ? { ...s, matchScore: 98 } : s));
  }
  if (hairType === "straight" || hairType === "wavy") {
    filtered = filtered.map((s) => (s.id === 1 ? { ...s, matchScore: 98 } : s));
  }
  if (vibe === "bold") {
    filtered = filtered.map((s) => (s.id === 1 ? { ...s, matchScore: 98 } : s));
  }
  if (answers.budget === "budget") {
    filtered = filtered.filter((s) => !s.priceRange.startsWith("$150"));
  } else if (answers.budget === "premium") {
    filtered = filtered.map((s) =>
      s.priceRange.startsWith("$150") || s.priceRange.startsWith("$50")
        ? { ...s, matchScore: s.matchScore + 5 }
        : s,
    );
  }

  if (selectedHairstyleId) {
    filtered = filtered.map((s) => ({
      ...s,
      matchScore: Math.min(s.matchScore + 5, 100),
    }));
  }

  filtered.sort((a, b) => b.matchScore - a.matchScore);
  stylists.push(...filtered.slice(0, 4));

  return { services, stylists };
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gray-900 dark:bg-gray-200"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-semibold text-text-muted dark:text-text-dark-muted tabular-nums shrink-0">
        {current + 1}/{total}
      </span>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/30"
        >
          <Sparkles size={32} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-3">
            Try on hairstyles
          </h1>
          <p className="text-text-muted dark:text-text-dark-muted text-base leading-relaxed max-w-sm mx-auto mb-8">
            Use your camera to see how different hairstyles look on you in real-time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {["AR Try-On", "Your vibe", "Hair type", "Face shape", "Occasion", "Budget"].map(
            (q) => (
              <span key={q} className="px-3 py-1.5 rounded-full bg-white dark:bg-surface-dark-secondary border border-gray-200 dark:border-gray-600 text-xs text-text-secondary dark:text-text-dark-secondary font-medium">
                {q}
              </span>
            ),
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-3"
        >
          <button
            onClick={onStart}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:from-amber-600 hover:to-orange-700 transition-all active:scale-[0.98]"
          >
            Start Try-On
            <ArrowRight size={15} />
          </button>

          <p className="text-xs text-text-muted dark:text-text-dark-muted">
            No uploads · Face detection runs in your browser
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function QuestionScreen({
  question, questionIndex, totalQuestions, selectedAnswers,
  onSelect, onBack, canGoBack,
}: {
  question: Question; questionIndex: number; totalQuestions: number;
  selectedAnswers: string[]; onSelect: (values: string[]) => void;
  onBack: () => void; canGoBack: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(selectedAnswers);

  const toggle = (value: string) => {
    if (question.multiSelect) {
      setSelected((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      );
    } else {
      onSelect([value]);
    }
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="min-h-[calc(100vh-64px)] flex flex-col"
    >
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 dark:bg-surface-dark/80 dark:border-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            {canGoBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-all">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="flex-1">
              <ProgressBar current={questionIndex} total={totalQuestions} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center pt-12 sm:pt-20 pb-8 px-4">
        <div className="max-w-2xl w-full">
          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-2"
            >
              {question.text}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-text-muted dark:text-text-dark-muted"
            >
              {question.subtitle}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, i) => {
              const isSelected = selected.includes(opt.value);
              return (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                  onClick={() => toggle(opt.value)}
                  className={`group relative w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-md shadow-amber-100 dark:shadow-amber-900/20" : "border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {opt.emoji && (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all duration-200 ${
                        isSelected ? "bg-amber-500 scale-105" : "bg-gray-50 dark:bg-surface-dark-tertiary group-hover:bg-gray-100 dark:group-hover:bg-surface-dark-hover"
                      }`}>
                        {isSelected ? <Check size={18} className="text-white" /> : opt.emoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? "text-amber-900 dark:text-amber-400" : "text-text-primary dark:text-text-dark-primary"}`}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">{opt.description}</p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${
                      isSelected ? "border-amber-500 bg-amber-500" : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400"
                    }`}>
                      {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {question.multiSelect && selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <button
                onClick={() => onSelect(selected)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-700 shadow-md transition-all active:scale-[0.98]"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const messages = [
    "Analyzing your style preferences…",
    "Matching with top stylists…",
    "Curating personalized services…",
    "Almost ready…",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 95));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const msgIndex = Math.min(Math.floor(progress / 25), messages.length - 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
    >
      <div className="max-w-sm w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles size={28} className="text-white animate-pulse" />
        </motion.div>

        <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary mb-2">
          Finding your matches
        </h3>
        <p className="text-sm text-text-muted dark:text-text-dark-muted mb-8">{messages[msgIndex]}</p>

        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ResultsScreen({
  services, stylists, selectedHairstyleId, onRestart, onBookStylist,
}: {
  services: ServiceRec[]; stylists: StylistRec[];
  selectedHairstyleId?: string; onRestart: () => void;
  onBookStylist: (id: number) => void;
}) {
  const navigate = useNavigate();
  const hairstyle = selectedHairstyleId ? getHairstyleById(selectedHairstyleId) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-surface-dark"
    >
      <div className="bg-white dark:bg-surface-dark-secondary border-b border-gray-100 dark:border-gray-700/40">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-1">
              Your Style Matches
            </h1>
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              {hairstyle
                ? `You tried on ${hairstyle.name} — here's what matches`
                : "Personalized recommendations based on your profile"}
            </p>
          </motion.div>
        </div>
      </div>

      {hairstyle && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="max-w-3xl mx-auto px-4 pt-6"
        >
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-amber-200 dark:border-amber-700"
                  style={{ backgroundColor: hairstyle.preview }}
                >
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary">Selected Style</p>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary capitalize">{hairstyle.name} · {hairstyle.category}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Recommended Services</h2>
              <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Tailored to your vibe and features</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-surface-dark-tertiary text-text-secondary dark:text-text-dark-secondary">
              {services.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {services.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">{svc.name}</p>
                      {svc.match >= 95 && (
                        <span className="badge-success text-[9px] uppercase tracking-wider">
                          Top match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted mb-2">{svc.reason}</p>
                    <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-text-dark-secondary">
                      <span className="flex items-center gap-1"><Clock size={11} />{svc.duration}</span>
                      <span>{svc.price}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-center">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 flex items-center justify-center">
                      <span className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{svc.match}%</span>
                    </div>
                    <p className="text-[9px] text-text-muted dark:text-text-dark-muted mt-1">match</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Top Stylists for You</h2>
              <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Matched by specialty, rating, and location</p>
            </div>
            <button
              onClick={() => navigate("/app")}
              className="text-xs font-medium text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors flex items-center gap-1"
            >
              Browse all
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stylists.map((stylist, i) => (
              <motion.div
                key={stylist.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                onClick={() => onBookStylist(stylist.id)}
                className="card-hover"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary shrink-0 ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-gray-200 dark:group-hover:ring-gray-600 transition-all">
                    <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary truncate group-hover:text-text-secondary dark:group-hover:text-text-dark-secondary transition-colors">
                        {stylist.name}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-600 text-white shrink-0">
                        {stylist.matchScore}%
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary mb-1.5">{stylist.category}</p>
                    <div className="flex items-center gap-2 text-xs text-text-muted dark:text-text-dark-muted flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                        <span className="font-semibold text-text-primary dark:text-text-dark-primary">{stylist.rating}</span>
                        <span>({stylist.reviewCount})</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={9} />
                        {getLocationString(stylist.location)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stylist.specialties.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 text-[10px] font-medium text-text-secondary dark:text-text-dark-secondary">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/40">
                  <span className="text-xs text-text-muted dark:text-text-dark-muted">{stylist.priceRange}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookStylist(stylist.id); }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold hover:from-amber-600 hover:to-orange-700 transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                  >
                    Book now
                    <ArrowRight size={11} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-3 pt-4 pb-8"
        >
          <button
            onClick={onRestart}
            className="btn-secondary btn-md"
          >
            <RotateCcw size={14} />
            Retake Quiz
          </button>
          <button
            onClick={() => navigate("/app")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-700 shadow-md transition-all active:scale-[0.98]"
          >
            Explore All Stylists
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

type Phase = "welcome" | "camera" | "quiz" | "loading" | "results";

export default function VibeMatch() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedHairstyle, setSelectedHairstyle] = useState<string | undefined>();
  const [result, setResult] = useState<{ services: ServiceRec[]; stylists: StylistRec[] } | null>(null);

  const handleStart = () => {
    setPhase("camera");
  };

  const handleCameraComplete = (hairstyleId: string) => {
    setSelectedHairstyle(hairstyleId);
    setPhase("quiz");
    setStep(0);
    setAnswers({});
  };

  const handleQuizOnly = () => {
    setPhase("quiz");
    setStep(0);
    setAnswers({});
  };

  const handleAnswer = (questionId: string, values: string[]) => {
    const newAnswers = { ...answers, [questionId]: values[0] };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateResults(newAnswers);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      setPhase("camera");
    }
  };

  const generateResults = (quizAnswers: Record<string, string>) => {
    setPhase("loading");
    setTimeout(() => {
      const recs = generateRecommendations(quizAnswers, selectedHairstyle);
      setResult(recs);
      setPhase("results");
    }, 2000);
  };

  const handleRestart = () => {
    setPhase("welcome");
    setStep(0);
    setAnswers({});
    setResult(null);
    setSelectedHairstyle(undefined);
  };

  const handleBookStylist = (id: number) => {
    navigate(`/app/stylist/${id}`);
  };

  return (
    <div className="bg-white dark:bg-surface-dark-secondary min-h-screen">
      <AnimatePresence mode="wait">
        {phase === "welcome" && <WelcomeScreen key="welcome" onStart={handleStart} />}

        {phase === "camera" && (
          <CameraCapture
            key="camera"
            onComplete={handleCameraComplete}
            onBack={handleRestart}
          />
        )}

        {phase === "quiz" && (
          <QuestionScreen
            key={`q-${step}`}
            question={questions[step]}
            questionIndex={step}
            totalQuestions={questions.length}
            selectedAnswers={answers[questions[step].id] ? [answers[questions[step].id]] : []}
            onSelect={(values) => handleAnswer(questions[step].id, values)}
            onBack={handleBack}
            canGoBack={step > 0}
          />
        )}

        {phase === "loading" && <LoadingScreen key="loading" />}

        {phase === "results" && result && (
          <ResultsScreen
            key="results"
            services={result.services}
            stylists={result.stylists}
            selectedHairstyleId={selectedHairstyle}
            onRestart={handleRestart}
            onBookStylist={handleBookStylist}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
