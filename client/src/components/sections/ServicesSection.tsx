import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SERVICES = [
  {
    title: "Bridal Makeup",
    desc: "Complete bridal beauty package with trial and day-of service.",
    price: "GH₵800",
    rating: 4.9,
    gradient: "from-brand-400 to-brand-600",
    emoji: "💄",
  },
  {
    title: "Natural Hair Braids",
    desc: "Box braids, cornrows, twist outs, and protective styles.",
    price: "GH₵250",
    rating: 4.8,
    gradient: "from-gold-400 to-gold-600",
    emoji: "💇‍♀️",
  },
  {
    title: "Manicure & Pedicure",
    desc: "Gel nails, nail art, spa pedicure, and luxury treatments.",
    price: "GH₵150",
    rating: 4.9,
    gradient: "from-stylist-400 to-stylist-600",
    emoji: "💅",
  },
  {
    title: "Facial Treatment",
    desc: "Deep cleansing, hydration, acne treatment, and glow facials.",
    price: "GH₵300",
    rating: 4.7,
    gradient: "from-success to-emerald-600",
    emoji: "✨",
  },
];

export default function ServicesSection() {
  const navigate = useNavigate();

  return (
    <section id="services" className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Services</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
              Popular{" "}
              <span className="text-brand-500">treatments</span>
            </h2>
            <p className="mt-3 text-base text-text-secondary dark:text-text-dark-secondary">
              Browse trending beauty services from verified professionals.
            </p>
          </div>
          <button
            onClick={() => navigate("/signup")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            View all services <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              {/* Image area */}
              <div className={`relative h-44 bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                <span className="text-5xl">{s.emoji}</span>
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm px-2 py-1">
                  <Star size={10} fill="#f43f5e" className="text-brand-500" />
                  <span className="text-[10px] font-bold text-text-primary dark:text-white">{s.rating}</span>
                </div>
              </div>
              {/* Content */}
              <div className="p-5">
                <h3 className="text-base font-bold text-text-primary dark:text-text-dark-primary mb-1">{s.title}</h3>
                <p className="text-xs text-text-secondary dark:text-text-dark-secondary leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-brand-500">{s.price}</span>
                  <span className="text-xs font-semibold text-brand-500 group-hover:translate-x-0.5 transition-transform">Book Now →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
