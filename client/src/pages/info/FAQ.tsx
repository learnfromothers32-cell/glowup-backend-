import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Sparkles, ChevronDown, Search } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const FAQS = [
  {
    q: "How do I book a stylist?",
    a: "Browse stylists in your area, select a service that fits your needs, choose your preferred time slot, and confirm your booking. You'll receive a confirmation once the stylist accepts. You can track your booking status in the My Bookings section.",
  },
  {
    q: "Can I cancel or reschedule a booking?",
    a: "Yes — you can cancel or reschedule up to 4 hours before the appointment at no charge. Late cancellations (within 4 hours) may incur a 50% fee at the stylist's discretion. Simply go to My Bookings and select the appointment to manage it.",
  },
  {
    q: "How does Vibe Match AI work?",
    a: "Vibe Match uses machine learning to analyze your style preferences, past bookings, saved favorites, and even reference images to recommend the perfect stylist. The more you use GlowUp, the smarter your matches become. Most matches happen in under 5 seconds.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept major credit and debit cards (Visa, Mastercard), mobile money (MTN, Vodafone, AirtelTigo), and PayPal. All payments are processed securely through our payment partners with end-to-end encryption.",
  },
  {
    q: "How do refunds work?",
    a: "Refunds are processed within 5–7 business days and credited to your original payment method. Mobile money refunds are typically processed within 24 hours. See our Refund Policy for full details on eligibility and timeframes.",
  },
  {
    q: "Is my personal data safe?",
    a: "Absolutely. We use industry-standard encryption (TLS 1.3), secure cloud infrastructure, and strict access controls. We never share your personal data with third parties without your explicit consent. Read our Privacy Policy for full details.",
  },
  {
    q: "How do I join as a stylist?",
    a: "Sign up and select the 'Stylist' role. Complete your profile with certifications, portfolio photos, and service offerings. Set your availability, pricing, and service areas. Once approved, you'll start receiving bookings from clients in your area.",
  },
  {
    q: "What are Live Sessions?",
    a: "Live Sessions are real-time video streams where stylists showcase techniques, demonstrate products, and interact with viewers. You can watch for free, tip your favorite stylists, or book private one-on-one sessions for personalized guidance.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes! GlowUp is available on both iOS and Android. Download from the App Store or Google Play for the best experience, including push notifications, offline access to your bookings, and mobile-only features.",
  },
  {
    q: "How are stylists verified?",
    a: "Every stylist on GlowUp goes through a verification process that includes credential checks, portfolio review, and identity verification. We also maintain a rating and review system to ensure quality and accountability.",
  },
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

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = FAQS.filter(
    (faq) => faq.q.toLowerCase().includes(query.toLowerCase()) || faq.a.toLowerCase().includes(query.toLowerCase())
  );

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
            <div className="text-center max-w-xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide mb-6">
                <Sparkles size={12} />
                FAQ
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Frequently Asked Questions</h1>
              <p className="text-neutral-400">Everything you need to know about using GlowUp.</p>
            </div>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.1}>
            <div className="relative max-w-md mx-auto mb-12">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
          </FadeIn>

          {/* FAQ List */}
          <FadeIn delay={0.15}>
            <div className="space-y-2">
              {filtered.map(({ q, a }, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4"
                  >
                    <span className="text-sm font-medium text-neutral-200 leading-snug">{q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-neutral-500 shrink-0 transition-transform duration-300 ${
                        openIndex === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                          <div className="w-full h-px bg-white/[0.06] mb-4" />
                          <p className="text-sm text-neutral-400 leading-relaxed">{a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </FadeIn>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-500 mb-1">No results for "{query}"</p>
              <p className="text-xs text-neutral-600">Try different keywords or browse all questions above.</p>
            </div>
          )}
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
