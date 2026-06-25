import { Star, ThumbsUp, CheckCircle, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Esi K.",
    rating: 5,
    date: "2 days ago",
    text: "Ama did an amazing job on my box braids! Quick, professional, and the result was perfect. The queue feature saved me so much time.",
    service: "Box Braids",
    verified: true,
    helpful: 24,
    color: "from-brand-400 to-brand-500",
  },
  {
    name: "Kofi A.",
    rating: 5,
    date: "1 week ago",
    text: "Best barber in Accra! Kofi's fade cuts are always on point. Love being able to book from my phone and see exactly when to show up.",
    service: "Fade Cut",
    verified: true,
    helpful: 18,
    color: "from-stylist-400 to-stylist-500",
  },
  {
    name: "Ama B.",
    rating: 4,
    date: "3 days ago",
    text: "My bridal makeup was absolutely stunning! Efua understood exactly what I wanted. The payment was smooth and secure.",
    service: "Bridal Makeup",
    verified: true,
    helpful: 31,
    color: "from-gold-400 to-gold-500",
  },
  {
    name: "Nana Y.",
    rating: 5,
    date: "5 days ago",
    text: "The AI recommendation was spot on! Found a great nail technician near me. The whole experience was seamless from booking to payment.",
    service: "Gel Nails",
    verified: true,
    helpful: 15,
    color: "from-success to-emerald-500",
  },
];

export default function ReviewsFeature() {
  return (
    <section className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Reviews</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
            Trustworthy{" "}
            <span className="text-brand-500">reviews</span>
          </h2>
          <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary">
            Read real customer reviews. Check ratings before booking. Verified reviews from actual clients.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r) => (
            <div
              key={r.name + r.service}
              className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-800 p-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300"
            >
              <Quote size={20} className="text-brand-200 dark:text-brand-800 mb-3" />
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary leading-relaxed mb-4">{r.text}</p>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < r.rating ? "#f43f5e" : "transparent"}
                    className={i < r.rating ? "text-brand-500" : "text-gray-200 dark:text-gray-700"}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {r.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-text-primary dark:text-text-dark-primary">{r.name}</span>
                    {r.verified && <CheckCircle size={10} className="text-brand-500" />}
                  </div>
                  <p className="text-[10px] text-text-muted dark:text-text-dark-muted">{r.service} · {r.date}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <ThumbsUp size={10} className="text-text-muted dark:text-text-dark-muted" />
                  <span className="text-[10px] text-text-muted dark:text-text-dark-muted">{r.helpful}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
