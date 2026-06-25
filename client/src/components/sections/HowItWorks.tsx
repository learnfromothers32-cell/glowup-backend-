import { Search, Scissors, CreditCard } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Discover & Match",
    desc: "Tell us your style preferences. Our AI finds the perfect stylist for you in seconds.",
    color: "text-brand-500",
    bg: "bg-brand-50 dark:bg-brand-950/30",
    border: "border-brand-200 dark:border-brand-800",
  },
  {
    num: "02",
    icon: Scissors,
    title: "Book & Experience",
    desc: "Choose a time, book instantly, and watch your stylist's live session while you wait.",
    color: "text-gold-500",
    bg: "bg-gold-50 dark:bg-gold-900/20",
    border: "border-gold-200 dark:border-gold-800",
  },
  {
    num: "03",
    icon: CreditCard,
    title: "Pay & Earn Rewards",
    desc: "Pay securely in-app, earn Glow Score points, and unlock exclusive perks.",
    color: "text-stylist-500",
    bg: "bg-stylist-50 dark:bg-stylist-950/30",
    border: "border-stylist-200 dark:border-stylist-800",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-28 bg-gray-50 dark:bg-surface-dark-secondary">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand-500 mb-3">How It Works</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
            Book your look{" "}
            <span className="text-brand-500">in 3 steps</span>
          </h2>
          <p className="mt-4 text-base text-text-secondary dark:text-text-dark-secondary leading-relaxed">
            Getting a professional beauty treatment has never been easier.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-brand-200 via-gold-200 to-stylist-200 dark:from-brand-800 dark:via-gold-800 dark:to-stylist-800" />

          {STEPS.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              {/* Step number circle */}
              <div className={`relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${step.bg} border ${step.border} shadow-sm`}>
                <step.icon size={26} className={step.color} />
              </div>
              <span className="text-xs font-bold text-text-muted dark:text-text-dark-muted mb-2">Step {step.num}</span>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-dark-primary mb-3">{step.title}</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
