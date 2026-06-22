import { useState } from "react";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Link } from "react-router-dom";
import { Sparkles, Search, Book, MessageCircle, Shield, CreditCard, Smartphone, ChevronRight, ArrowRight } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const TOPICS = [
  { icon: Book, label: "Getting Started", desc: "Set up your profile, make your first booking", color: "from-blue-500/20 to-blue-600/10", textColor: "text-blue-400" },
  { icon: MessageCircle, label: "Bookings & Payments", desc: "Pricing, refunds, cancellations & billing", color: "from-green-500/20 to-green-600/10", textColor: "text-green-400" },
  { icon: Shield, label: "Account & Security", desc: "Password, privacy, two-factor auth", color: "from-purple-500/20 to-purple-600/10", textColor: "text-purple-400" },
  { icon: CreditCard, label: "Stylist Services", desc: "For beauty professionals on GlowUp", color: "from-amber-500/20 to-amber-600/10", textColor: "text-amber-400" },
  { icon: Smartphone, label: "Troubleshooting", desc: "App crashes, login issues & errors", color: "from-red-500/20 to-red-600/10", textColor: "text-red-400" },
];

const ARTICLES = [
  { title: "How to book your first appointment", reads: "12k", icon: Book },
  { title: "Understanding our refund policy", reads: "8.5k", icon: Shield },
  { title: "How Vibe Match AI works", reads: "6.2k", icon: Sparkles },
  { title: "Setting up your stylist profile", reads: "5.1k", icon: CreditCard },
  { title: "Live session guidelines for viewers", reads: "4.8k", icon: Smartphone },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function HelpCenter() {
  const [query, setQuery] = useState("");

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
                <Sparkles size={12} />
                Help Center
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">How can we help?</h1>
              <p className="text-neutral-400 mb-8">Search our help articles or browse by topic below.</p>
              <div className="relative max-w-lg mx-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for help, e.g. 'how to book'..."
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-2xl py-4 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>
          </FadeIn>

          {/* Topics */}
          <FadeIn delay={0.1}>
            <h2 className="text-sm font-semibold text-white mb-5">Browse by topic</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {TOPICS.map(({ icon: Icon, label, desc, color, textColor }) => (
                <button
                  key={label}
                  className="group relative overflow-hidden p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all text-left"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-3 group-hover:bg-white/[0.08] transition-colors`}>
                      <Icon size={16} className={textColor} />
                    </div>
                    <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                    <p className="text-xs text-neutral-500">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Popular Articles */}
          <FadeIn delay={0.15}>
            <h2 className="text-sm font-semibold text-white mb-5">Popular articles</h2>
            <div className="space-y-2 mb-16">
              {ARTICLES.map(({ title, reads, icon: Icon }) => (
                <button
                  key={title}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={14} className="text-amber-400" />
                    <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600">{reads} reads</span>
                    <ChevronRight size={14} className="text-neutral-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </FadeIn>

          {/* CTA */}
          <FadeIn>
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-amber-500/5 via-neutral-900 to-neutral-950 border border-amber-500/10 text-center">
              <p className="text-white font-semibold mb-1">Still need help?</p>
              <p className="text-sm text-neutral-500 mb-5">Our support team typically responds within 2 hours.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/10">
                Contact Support <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
