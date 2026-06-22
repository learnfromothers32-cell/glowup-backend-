import { useState } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Sparkles, Send, Check, AlertTriangle, Bug, DollarSign, Lock, UserX, CalendarX } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const CATEGORIES = [
  { value: "bug", label: "Bug / Crash", icon: Bug },
  { value: "payment", label: "Payment Issue", icon: DollarSign },
  { value: "account", label: "Account Problem", icon: Lock },
  { value: "content", label: "Inappropriate Content", icon: UserX },
  { value: "booking", label: "Booking Issue", icon: CalendarX },
  { value: "other", label: "Other", icon: AlertTriangle },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function ReportProblem() {
  const [sent, setSent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-neutral-950"
      >
      <LandingNavbar />
      <main className="pt-28 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6 w-fit">
              <Sparkles size={12} />
              Report
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Report a Problem</h1>
            <p className="text-lg text-neutral-400 max-w-xl mb-12">Help us improve GlowUp by reporting any issues you encounter. We take every report seriously.</p>
          </FadeIn>

          {sent ? (
            <FadeIn>
              <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
                  <Check size={24} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Report submitted</h2>
                <p className="text-sm text-neutral-400 max-w-sm">Thank you. Our team will review your report and follow up if needed. You can track the status in your email.</p>
              </div>
            </FadeIn>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <FadeIn delay={0.05}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Your name</label>
                    <input type="text" required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">Email address</label>
                    <input type="email" required
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all" />
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-3">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedCategory(value)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium transition-all ${
                          selectedCategory === value
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-white/[0.03] border-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="category" value={selectedCategory} required />
                </div>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Brief summary</label>
                  <input type="text" placeholder="e.g. 'App crashes when I try to book'" required
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all" />
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">Detailed description</label>
                  <textarea rows={5} placeholder="Describe what happened, including steps to reproduce if possible. Include screenshots if you can." required
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all resize-none" />
                </div>
              </FadeIn>

              <FadeIn delay={0.25}>
                <button type="submit"
                  className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/10">
                  <Send size={14} />
                  Submit Report
                </button>
              </FadeIn>
            </form>
          )}
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
