import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Akua Mensah",
    role: "Client",
    initials: "AM",
    color: "bg-brand-500",
    rating: 5,
    text: "GlowUp completely changed how I find stylists. The AI match was spot-on — Ama understood exactly what I wanted for my wedding look.",
  },
  {
    name: "Nana Yaa Asantewaa",
    role: "Stylist",
    initials: "NY",
    color: "bg-gold-500",
    rating: 5,
    text: "As a stylist, GlowUp grew my client base by 3x in two months. The live streaming feature lets me showcase my work in real-time.",
  },
  {
    name: "Kofi Adjei",
    role: "Client",
    initials: "KA",
    color: "bg-stylist-500",
    rating: 5,
    text: "The queue management is a game-changer. I can see exactly when my appointment is and plan my day. No more waiting around.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Testimonials</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
            Loved by{" "}
            <span className="text-brand-500">thousands</span>
          </h2>
          <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            See what our clients and stylists have to say about GlowUp.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300"
            >
              <Quote size={24} className="text-brand-100 dark:text-brand-900/30 absolute top-5 right-5" />

              <div className="flex items-center gap-1 mb-4">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} size={14} fill="#f43f5e" className="text-brand-500" />
                ))}
              </div>

              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed mb-6">
                &ldquo;{r.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className={`h-10 w-10 rounded-full ${r.color} flex items-center justify-center text-xs font-bold text-white`}>
                  {r.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary dark:text-text-dark-primary">{r.name}</p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
