import { Calendar, Brain, CreditCard, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Calendar,
    title: "Book Stylists",
    desc: "Find and book verified beauty professionals in your area. Real-time availability, instant confirmation.",
    color: "text-brand-500",
    bg: "bg-brand-50 dark:bg-brand-950/30",
  },
  {
    icon: Brain,
    title: "AI Recommendations",
    desc: "Our AI matches you with the perfect stylist based on your preferences, hair type, and budget.",
    color: "text-stylist-500",
    bg: "bg-stylist-50 dark:bg-stylist-950/30",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Pay securely in-app. No cash needed. Automatic receipts and loyalty point tracking.",
    color: "text-gold-500",
    bg: "bg-gold-50 dark:bg-gold-900/20",
  },
  {
    icon: Users,
    title: "Real-time Queue",
    desc: "See live wait times and queue positions. No more guessing when your appointment is up.",
    color: "text-success",
    bg: "bg-success/10",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
            Everything you need,{" "}
            <span className="text-brand-500">in one app</span>
          </h2>
          <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            From booking to payment, GlowUp handles the entire beauty experience with smart technology.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark-secondary p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
