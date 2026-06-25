import { Star, MapPin, MessageCircle, UserPlus, Briefcase, Award } from "lucide-react";

const STYLISTS = [
  { name: "Ama Boateng", specialty: "Braids & Locs", location: "Osu, Accra", rating: 4.9, reviews: 127, followers: "2.3K", verified: true, color: "from-brand-400 to-brand-500" },
  { name: "Kofi Mensah", specialty: "Barber & Fades", location: "Labone, Accra", rating: 4.8, reviews: 89, followers: "1.8K", verified: true, color: "from-stylist-400 to-stylist-500" },
  { name: "Efua Asante", specialty: "Makeup & Skincare", location: "East Legon, Accra", rating: 4.9, reviews: 203, followers: "4.1K", verified: true, color: "from-gold-400 to-gold-500" },
];

export default function StylistFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Stylists</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
            Find{" "}
            <span className="text-brand-500">top stylists</span>
          </h2>
          <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary">
            Browse verified stylist profiles. Check ratings, view portfolios, and follow your favorites.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STYLISTS.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Cover */}
              <div className={`h-24 bg-gradient-to-br ${s.color} relative`}>
                {s.verified && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1">
                    <Award size={10} className="text-brand-500" />
                    <span className="text-[9px] font-bold text-brand-600">Verified</span>
                  </div>
                )}
              </div>
              {/* Avatar */}
              <div className="px-5 -mt-8 relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 border-4 border-white dark:border-surface-dark-secondary flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {s.name.split(" ").map(n => n[0]).join("")}
                </div>
              </div>
              {/* Info */}
              <div className="px-5 pt-3 pb-5">
                <h3 className="text-base font-bold text-text-primary dark:text-text-dark-primary">{s.name}</h3>
                <p className="text-xs text-brand-500 font-semibold mt-0.5">{s.specialty}</p>
                <div className="flex items-center gap-1 mt-2 text-text-muted dark:text-text-dark-muted">
                  <MapPin size={11} />
                  <span className="text-[10px]">{s.location}</span>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1">
                    <Star size={11} fill="#f43f5e" className="text-brand-500" />
                    <span className="text-[11px] font-bold text-text-primary dark:text-text-dark-primary">{s.rating}</span>
                    <span className="text-[10px] text-text-muted dark:text-text-dark-muted">({s.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={10} className="text-text-muted dark:text-text-dark-muted" />
                    <span className="text-[10px] text-text-secondary dark:text-text-dark-secondary">{s.followers} followers</span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 text-[11px] font-bold text-white hover:bg-brand-600 transition-colors">
                    <UserPlus size={12} /> Follow
                  </button>
                  <button className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-[11px] font-semibold text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <MessageCircle size={12} /> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
