import { Sparkles, MapPin, Star, Heart, Zap, Target } from "lucide-react";

const AI_SUGGESTIONS = [
  {
    title: "Based on your style",
    reason: "You loved box braids last time",
    stylist: "Ama Boateng",
    service: "Medium Box Braids",
    rating: 4.9,
    match: "98% match",
    color: "from-brand-400 to-brand-500",
  },
  {
    title: "Near you in Osu",
    reason: "Top rated barber in your area",
    stylist: "Kofi Mensah",
    service: "Fade Cut",
    rating: 4.8,
    match: "95% match",
    color: "from-stylist-400 to-stylist-500",
  },
  {
    title: "Trending in Accra",
    reason: "Most booked this week",
    stylist: "Efua Asante",
    service: "Glow Facial",
    rating: 4.9,
    match: "92% match",
    color: "from-gold-400 to-gold-500",
  },
];

export default function AIRecommendationsFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Mockup */}
          <div className="relative">
            <div className="rounded-[2rem] bg-gradient-to-br from-brand-50 to-stylist-50 dark:from-brand-950/30 dark:to-stylist-950/30 p-8 shadow-[0_20px_60px_rgba(244,63,94,0.06)]">
              <div className="mx-auto max-w-sm rounded-3xl bg-white dark:bg-surface-dark-secondary shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-500 via-stylist-500 to-gold-500 px-5 py-4 text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-white" />
                    <p className="text-base font-extrabold">AI Recommendations</p>
                  </div>
                  <p className="text-[10px] text-white/70 mt-1">Personalized for you based on your preferences</p>
                </div>
                {/* Suggestions */}
                <div className="px-4 py-4 space-y-3">
                  {AI_SUGGESTIONS.map((s) => (
                    <div key={s.title} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {s.stylist.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-text-primary dark:text-text-dark-primary">{s.stylist}</p>
                          <p className="text-[9px] text-text-muted dark:text-text-dark-muted">{s.service}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={9} fill="#f43f5e" className="text-brand-500" />
                          <span className="text-[9px] font-bold text-text-secondary dark:text-text-dark-secondary">{s.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-semibold text-brand-500">{s.title}</p>
                          <p className="text-[8px] text-text-muted dark:text-text-dark-muted">{s.reason}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-success bg-success/10 rounded-full px-2 py-0.5">{s.match}</span>
                          <button className="h-6 w-6 rounded-full bg-brand-500 flex items-center justify-center">
                            <Heart size={10} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* AI insight */}
                <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-brand-50 to-stylist-50 dark:from-brand-950/30 dark:to-stylist-950/30 border border-brand-100 dark:border-brand-800 p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={12} className="text-brand-500" />
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">AI Insight</span>
                  </div>
                  <p className="text-[9px] text-text-secondary dark:text-text-dark-secondary leading-relaxed">
                    Based on your booking history, we think you&apos;ll love Ama&apos;s braids. She has a 98% satisfaction rate from clients with similar preferences.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">AI-Powered</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary leading-tight">
              AI finds the{" "}
              <span className="text-brand-500">perfect stylist</span>
            </h2>
            <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-md">
              Our AI learns your preferences, location, and past bookings to recommend the best stylists and services for you.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { icon: Heart, label: "Style Preferences", desc: "Learns what you like from your favorites" },
                { icon: MapPin, label: "Location-Based", desc: "Finds top stylists near you" },
                { icon: Zap, label: "Smart Matching", desc: "Matches you with 95%+ accuracy" },
                { icon: Star, label: "Rating Analysis", desc: "Considers ratings from similar clients" },
              ].map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/30">
                    <f.icon size={14} className="text-brand-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{f.label}</p>
                    <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
