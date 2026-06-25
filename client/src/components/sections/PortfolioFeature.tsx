import { Heart, Eye, ArrowLeftRight, Star } from "lucide-react";

const TRANSFORMATIONS = [
  { before: "Pre-braid", after: "Box Braids", likes: 342, views: "2.1K", service: "Braids", rating: 4.9 },
  { before: "Natural", after: "Cornrows", likes: 218, views: "1.5K", service: "Braids", rating: 4.8 },
  { before: "Plain", after: "Glow Up", likes: 567, views: "4.2K", service: "Full Glam", rating: 5.0 },
];

export default function PortfolioFeature() {
  return (
    <section className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-gold-500 mb-3">Portfolio</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Showcase your{" "}
              <span className="text-gold-500">transformations</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Stylists display their best before & after work. Swipe through transformations, see service details, and discover your next look.
            </p>
            <div className="mt-6 space-y-3">
              {["Swipeable before/after carousel", "See likes and view counts", "Service details on each transformation", "Get inspired by real results"].map((b) => (
                <div key={b} className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                  </div>
                  <span className="text-sm text-text-secondary dark:text-text-dark-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup - Transformation Cards */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-950/30 dark:to-gold-900/20 p-8 shadow-[0_20px_60px_rgba(245,158,11,0.08)]">
              <div className="space-y-4">
                {TRANSFORMATIONS.map((t) => (
                  <div key={t.after} className="mx-auto max-w-sm rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                    {/* Before / After */}
                    <div className="grid grid-cols-2 h-32">
                      <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center relative">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Before</span>
                        <span className="text-lg mt-1">💇‍♀️</span>
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">{t.before}</span>
                      </div>
                      <div className="bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/40 dark:to-gold-800/30 flex flex-col items-center justify-center relative">
                        <span className="text-[10px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">After</span>
                        <span className="text-lg mt-1">✨</span>
                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-medium text-gold-700 dark:text-gold-300 bg-white/80 dark:bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">{t.after}</span>
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700">
                        <ArrowLeftRight size={12} className="text-gold-500" />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{t.service}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={9} fill="#f59e0b" className="text-gold-500" />
                            <span className="text-[10px] font-semibold text-gold-500">{t.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart size={11} className="text-brand-500" fill="#f43f5e" />
                            <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={11} className="text-text-muted dark:text-text-dark-muted" />
                            <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
