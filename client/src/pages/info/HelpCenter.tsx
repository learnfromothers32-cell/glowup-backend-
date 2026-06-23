import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Link } from "react-router-dom";
import {
  Sparkles, Search, Book, MessageCircle, Shield, CreditCard, Smartphone,
  ChevronRight, ArrowRight, HelpCircle, ChevronDown, FileText,
  LifeBuoy, Mail, Bot, ThumbsUp, ThumbsDown, Plus, Minus,
} from "lucide-react";
import ConsumerNavbar from "../../components/layout/consumer/ConsumerNavbar";
import ConsumerFooter from "../../components/layout/consumer/ConsumerFooter";

const TOPICS = [
  { icon: Book, label: "Getting Started", desc: "Profile setup, first booking, and navigating the app", gradient: "from-brand-500 to-rose-500" },
  { icon: MessageCircle, label: "Bookings & Payments", desc: "Pricing, refunds, cancellations, and billing", gradient: "from-brand-400 to-rose-400" },
  { icon: Shield, label: "Account & Security", desc: "Password, privacy, and two-factor authentication", gradient: "from-rose-500 to-rose-400" },
  { icon: CreditCard, label: "Stylist Services", desc: "Tools and resources for beauty professionals", gradient: "from-brand-600 to-rose-600" },
  { icon: Smartphone, label: "Troubleshooting", desc: "App crashes, login issues, and error fixes", gradient: "from-brand-300 to-rose-300" },
  { icon: Bot, label: "AI & Vibe Match", desc: "How our AI matching and recommendations work", gradient: "from-brand-500 to-rose-400" },
];

const FAQ_CATEGORIES = [
  { label: "All", key: "all" },
  { label: "Getting Started", key: "getting-started" },
  { label: "Bookings", key: "bookings" },
  { label: "Vibe Match", key: "vibe-match" },
  { label: "Security", key: "security" },
  { label: "Stylists", key: "stylists" },
] as const;

const ARTICLES = [
  { title: "How to book your first appointment", reads: "12k", tag: "Guide" },
  { title: "Understanding our refund policy", reads: "8.5k", tag: "Policy" },
  { title: "How Vibe Match AI works", reads: "6.2k", tag: "AI" },
  { title: "Setting up your stylist profile", reads: "5.1k", tag: "Stylist" },
  { title: "Live session guidelines for viewers", reads: "4.8k", tag: "Live" },
  { title: "Managing notifications & preferences", reads: "3.9k", tag: "Settings" },
];

const FAQS = [
  { q: "How do I book my first appointment?", a: "Browse stylists in your area, select a service, pick a time slot that works for you, and confirm your booking. You'll receive a confirmation notification once the stylist accepts.", category: "getting-started" },
  { q: "Can I cancel or reschedule a booking?", a: "Yes. Go to My Bookings, select the appointment, and choose cancel or reschedule. Cancellations made 24+ hours before are free. Late cancellations may incur a small fee.", category: "bookings" },
  { q: "How does Vibe Match work?", a: "Vibe Match uses your style preferences, past bookings, and reviews to recommend stylists you'll love. The more you use GlowUp, the smarter your matches become.", category: "vibe-match" },
  { q: "Is my payment information secure?", a: "Absolutely. We use industry-standard encryption and never store your full card details. All payments are processed through secure, PCI-compliant gateways.", category: "security" },
  { q: "How do I become a stylist on GlowUp?", a: "Sign up as a stylist, complete your profile with portfolio images and services, and set your availability. Our team reviews and approves your profile within 48 hours.", category: "stylists" },
  { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards, mobile money (MTN MoMo, Vodafone Cash, AirtelTigo), and secure bank transfers. All transactions are processed in GHS.", category: "bookings" },
  { q: "Can I change my appointment time after booking?", a: "Yes, you can reschedule up to 6 hours before your appointment. Go to My Bookings, select the appointment, and choose a new time slot. Same-day changes may depend on stylist availability.", category: "bookings" },
  { q: "How are stylists verified on the platform?", a: "Every stylist undergoes a verification process including ID checks, portfolio review, and service quality assessment. Verified stylists have a blue checkmark badge on their profile.", category: "stylists" },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  return (
    <div
      className={`group transition-all duration-300 ${
        open
          ? "bg-white/[0.03] rounded-xl mx-2 my-1.5 shadow-lg shadow-brand-500/5"
          : "border-b border-white/[0.04] last:border-0 mx-2"
      }`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-4 text-left transition-all duration-300 ${
          open ? "py-4 px-4" : "py-4 px-2"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
              open
                ? "bg-brand-500/15 scale-110"
                : "bg-white/[0.03] group-hover:bg-brand-500/8"
            }`}
          >
            <HelpCircle
              size={13}
              className={`transition-colors duration-300 ${
                open ? "text-brand-400" : "text-neutral-600 group-hover:text-brand-400"
              }`}
            />
          </div>
          <span
            className={`text-sm leading-snug transition-colors duration-300 ${
              open ? "text-white font-medium" : "text-neutral-300 group-hover:text-white"
            }`}
          >
            {question}
          </span>
        </div>
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
            open
              ? "bg-brand-500/15 rotate-180"
              : "bg-white/[0.03] group-hover:bg-brand-500/8"
          }`}
        >
          {open ? (
            <Minus size={12} className="text-brand-400" />
          ) : (
            <Plus size={12} className="text-neutral-500 group-hover:text-brand-400 transition-colors" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">
              <div className="w-8 h-0.5 rounded-full bg-gradient-to-r from-brand-500/40 to-transparent mb-4" />
              <p className="text-sm text-neutral-400 leading-relaxed">{answer}</p>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.04]">
                <span className="text-[11px] text-neutral-600">Was this helpful?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setHelpful(helpful === true ? null : true); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    helpful === true
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.03] text-neutral-600 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setHelpful(helpful === false ? null : false); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    helpful === false
                      ? "bg-red-500/15 text-red-400"
                      : "bg-white/[0.03] text-neutral-600 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const filteredArticles = ARTICLES.filter(
    a => a.title.toLowerCase().includes(query.toLowerCase()) || a.tag.toLowerCase().includes(query.toLowerCase())
  );
  const filteredFaqs = (activeCategory === "all"
    ? FAQS
    : FAQS.filter(f => f.category === activeCategory)
  ).filter(f => f.q.toLowerCase().includes(query.toLowerCase()));
  const hasSearch = query.trim().length > 0;

  return (
    <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        transition={pageTransition}
        className="min-h-screen bg-neutral-950"
      >
      <ConsumerNavbar />
      <main className="pt-28 pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/8 via-transparent to-transparent" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 sm:pb-20">
            <FadeIn>
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide mb-6">
                  <Sparkles size={12} />
                  Help Center
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 leading-[1.1]">
                  How can we{" "}
                  <span className="bg-gradient-to-r from-brand-400 via-rose-400 to-brand-300 bg-clip-text text-transparent">help</span>?
                </h1>
                <p className="text-neutral-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
                  Search our knowledge base or browse topics to find answers fast.
                </p>
                <div className="relative max-w-xl mx-auto">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles, topics, or questions..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pl-13 pr-5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/15 focus:bg-white/[0.06] transition-all shadow-sm"
                    style={{ paddingLeft: "3.25rem" }}
                  />
                  <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[10px] font-medium text-neutral-500">
                    <span>⌘</span>K
                  </kbd>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {hasSearch && filteredArticles.length === 0 && filteredFaqs.length === 0 ? (
            <FadeIn>
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-brand-400" />
                </div>
                <p className="text-white font-semibold mb-1">No results found</p>
                <p className="text-sm text-neutral-500">Try different keywords or browse topics below</p>
              </div>
            </FadeIn>
          ) : hasSearch ? (
            <>
              {filteredArticles.length > 0 && (
                <FadeIn>
                  <div className="mb-12">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.12em] mb-4">
                      Articles ({filteredArticles.length})
                    </h2>
                    <div className="space-y-1">
                      {filteredArticles.map(({ title, reads, tag }) => (
                        <button
                          key={title}
                          className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.03] transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={14} className="text-neutral-600 group-hover:text-brand-400 transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] text-neutral-600">{tag}</span>
                            <span className="text-xs text-neutral-600">{reads}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
              {filteredFaqs.length > 0 && (
                <FadeIn delay={0.1}>
                  <div className="mb-16">
                    <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-[0.12em] mb-4">
                      FAQs ({filteredFaqs.length})
                    </h2>
                    <div className="rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.06] py-2">
                      {filteredFaqs.map((faq, i) => (
                        <FaqItem
                          key={i}
                          question={faq.q}
                          answer={faq.a}
                          open={openFaq === i}
                          onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                        />
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
            </>
          ) : (
            <>
              {/* Topics */}
              <FadeIn delay={0.1}>
                <div className="mb-16">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-4 rounded-full bg-brand-500" />
                    <h2 className="text-sm font-semibold text-white">Browse by topic</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TOPICS.map(({ icon: Icon, label, desc, gradient }) => (
                      <button
                        key={label}
                        className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left overflow-hidden"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
                        <div className="relative flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-300">
                            <Icon size={18} className="text-brand-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white mb-0.5 group-hover:text-brand-300 transition-colors">{label}</p>
                            <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </FadeIn>

              {/* Popular Articles */}
              <FadeIn delay={0.15}>
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-brand-500" />
                      <h2 className="text-sm font-semibold text-white">Popular articles</h2>
                    </div>
                    <button className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ARTICLES.map(({ title, reads, tag }) => (
                      <button
                        key={title}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                            <FileText size={14} className="text-brand-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm text-neutral-300 group-hover:text-white transition-colors block truncate">{title}</span>
                            <span className="text-[10px] text-neutral-600 mt-0.5 block">{reads} reads</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="shrink-0 text-neutral-600 group-hover:text-brand-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </FadeIn>

              {/* FAQ */}
              <FadeIn delay={0.2}>
                <div className="mb-16">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-brand-500" />
                      <h2 className="text-sm font-semibold text-white">Frequently asked questions</h2>
                      <span className="text-[11px] text-neutral-600 bg-white/[0.04] px-2 py-0.5 rounded-md ml-1">{FAQS.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 sm:mx-0 px-4 sm:px-0">
                      {FAQ_CATEGORIES.map(({ label, key }) => (
                        <button
                          key={key}
                          onClick={() => { setActiveCategory(key); setOpenFaq(null); }}
                          className={`shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                            activeCategory === key
                              ? "bg-brand-500/15 text-brand-400 border border-brand-500/20 shadow-sm shadow-brand-500/10"
                              : "text-neutral-500 bg-white/[0.03] border border-transparent hover:text-neutral-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.06] py-2">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq, i) => (
                        <FaqItem
                          key={i}
                          question={faq.q}
                          answer={faq.a}
                          open={openFaq === i}
                          onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <HelpCircle size={20} className="text-neutral-600 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">No FAQs in this category</p>
                      </div>
                    )}
                  </div>
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={0.25}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/10 via-neutral-900 to-neutral-950 border border-brand-500/15 p-8 sm:p-10 mb-8">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-500/10 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-rose-500/10 blur-3xl" />
                  <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                        <LifeBuoy size={22} className="text-brand-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-base mb-1">Still need help?</p>
                        <p className="text-sm text-neutral-500">Our support team typically responds within 2 hours.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-600 active:bg-brand-700 transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                      >
                        Contact Support <ArrowRight size={14} />
                      </Link>
                      <a
                        href="mailto:support@glowup.com"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm text-neutral-300 hover:text-white hover:border-white/[0.15] transition-all"
                      >
                        <Mail size={14} />
                        <span className="hidden sm:inline">Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </>
          )}
        </div>
      </main>
      <ConsumerFooter />
    </motion.div>
  );
}
