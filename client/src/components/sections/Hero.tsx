import { useNavigate } from "react-router-dom";
import { ArrowRight, Star, Play, Shield, Sparkles, Download } from "lucide-react";

interface HeroProps {
  onOpenInstall?: () => void;
}

export default function Hero({ onOpenInstall }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white dark:from-surface-dark dark:via-surface-dark dark:to-surface-dark">
      {/* Background gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-brand-100/30 dark:bg-brand-950/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-brand-50/50 dark:bg-brand-950/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-gold-100/20 dark:bg-gold-900/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 dark:border-brand-800/40 dark:bg-brand-950/20 mb-6 backdrop-blur-sm">
              <Sparkles size={14} className="text-brand-500 animate-pulse-soft" />
              <span className="text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                AI beauty matching is now live
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-text-primary dark:text-text-dark-primary">
              Where beauty meets{" "}
              <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 bg-clip-text text-transparent">
                intelligence.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-text-secondary dark:text-text-dark-secondary leading-relaxed">
              Discover verified stylists, watch live beauty sessions, get AI-powered matches, and earn rewards — the premium platform for modern beauty.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started Free
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark-secondary px-5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={onOpenInstall}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gray-900 dark:bg-white px-5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Download size={14} />
                Download App
              </button>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  "https://picsum.photos/seed/hero1/80/80",
                  "https://picsum.photos/seed/hero2/80/80",
                  "https://picsum.photos/seed/hero3/80/80",
                  "https://picsum.photos/seed/hero4/80/80",
                  "https://picsum.photos/seed/hero5/80/80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`User ${i + 1}`}
                    className="h-8 w-8 rounded-full border-2 border-white dark:border-surface-dark object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#f43f5e" className="text-brand-500" />
                  ))}
                </div>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">
                  Loved by 10K+ clients
                </p>
              </div>
            </div>
          </div>

          {/* Right — App preview card */}
          <div className="relative lg:ml-auto w-full max-w-md">
            <div className="relative rounded-3xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-[0_8px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* App header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary">AI Match Found</p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">Based on your preferences</p>
                </div>
                <div className="ml-auto flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-semibold text-success-dark">47 online</span>
                </div>
              </div>

              {/* Stylist card */}
              <div className="mx-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark-tertiary p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src="https://picsum.photos/seed/stylist1/100/100"
                      alt="Stylist"
                      className="h-12 w-12 rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center border-2 border-white dark:border-gray-900">
                      <Shield size={8} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary">Ama K.</p>
                      <span className="text-[10px] font-semibold text-gold-600 bg-gold-50 dark:bg-gold-900/20 px-1.5 py-0.5 rounded-full">Top Rated</span>
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Bridal makeup · Braids · Natural glam</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} fill="#f43f5e" className="text-brand-500" />
                      <span className="text-[11px] font-semibold text-text-primary dark:text-text-dark-primary">4.9</span>
                      <span className="text-[10px] text-text-muted dark:text-text-dark-muted">(120+ bookings)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live preview with image */}
              <div className="mx-5 mt-3 mb-5 rounded-2xl overflow-hidden relative">
                <img
                  src="https://picsum.photos/seed/livesession/600/340"
                  alt="Live session preview"
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <Play size={20} className="text-brand-500 ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-white">LIVE</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-semibold text-white drop-shadow">Bridal Styling Session</p>
                  <p className="text-[10px] text-white/80 drop-shadow">with Ama K. · 2.4K watching</p>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-lg px-3 py-2 flex items-center gap-2 animate-float">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield size={14} className="text-success" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-primary dark:text-text-dark-primary">Verified</p>
                <p className="text-[9px] text-text-muted">All stylists</p>
              </div>
            </div>

            <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 shadow-lg px-3 py-2 flex items-center gap-2 animate-float-delay">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                <Star size={14} className="text-brand-500" fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-primary dark:text-text-dark-primary">4.9 Rating</p>
                <p className="text-[9px] text-text-muted">10K+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
