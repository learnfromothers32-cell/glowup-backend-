import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, Play } from "lucide-react";

const TRENDING = [
  { creator: "Ama Beauty", service: "Box Braids", likes: "12.4K", comments: "892", views: "45K", trending: true },
  { creator: "Kofi Fades", service: "Fade Cut", likes: "8.7K", comments: "567", views: "32K", trending: true },
  { creator: "Efua Glam", service: "Bridal Makeup", likes: "15.2K", comments: "1.2K", views: "67K", trending: true },
];

export default function TrendingFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Mockup - TikTok-style feed */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950/30 dark:to-brand-900/20 p-8 shadow-[0_20px_60px_rgba(244,63,94,0.08)]">
              <div className="mx-auto max-w-[220px] rounded-3xl bg-black shadow-2xl overflow-hidden h-[400px] relative">
                {/* Video */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-purple-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 mx-auto flex items-center justify-center text-white text-lg font-bold">AB</div>
                    <p className="text-white text-xs font-bold mt-3">@ama_beauty</p>
                    <p className="text-white/60 text-[10px] mt-1">Box Braids Transformation</p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  </div>
                </div>
                {/* Trending badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-1 z-10">
                  <TrendingUp size={10} className="text-white" />
                  <span className="text-[9px] font-bold text-white uppercase">Trending</span>
                </div>
                {/* Right side buttons */}
                <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 z-10">
                  <button className="flex flex-col items-center gap-0.5">
                    <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Heart size={18} fill="#f43f5e" className="text-brand-500" />
                    </div>
                    <span className="text-[9px] font-bold text-white">12.4K</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5">
                    <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-white">892</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5">
                    <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Share2 size={18} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-white">Share</span>
                  </button>
                  <button className="flex flex-col items-center gap-0.5">
                    <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Bookmark size={18} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-white">Save</span>
                  </button>
                </div>
                {/* Bottom info */}
                <div className="absolute bottom-3 left-3 right-14 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">AB</div>
                    <span className="text-[11px] font-bold text-white">@ama_beauty</span>
                    <button className="rounded-full border border-white/30 px-2 py-0.5 text-[8px] font-bold text-white">Follow</button>
                  </div>
                  <p className="text-[10px] text-white/80 leading-relaxed">Box braids transformation ✨ 3 hours of work, totally worth it! #braids #ghana #beauty</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Trending Feed</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              Discover viral{" "}
              <span className="text-brand-500">transformations</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Full-screen video feed of the latest beauty transformations. Swipe up for more, like and save your favorites.
            </p>
            <div className="mt-8 space-y-3">
              {TRENDING.map((t) => (
                <div key={t.creator} className="flex items-center gap-3 rounded-xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-white text-xs font-bold">{t.creator[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary truncate">{t.creator}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{t.service}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart size={10} fill="#f43f5e" className="text-brand-500" />
                      <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={10} className="text-text-muted dark:text-text-dark-muted" />
                      <span className="text-[10px] font-bold text-text-secondary dark:text-text-dark-secondary">{t.comments}</span>
                    </div>
                  </div>
                  {t.trending && (
                    <div className="flex items-center gap-1 rounded-full bg-gold-50 dark:bg-gold-900/20 px-2 py-1">
                      <TrendingUp size={9} className="text-gold-500" />
                      <span className="text-[8px] font-bold text-gold-600">Hot</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
