import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeSlideUp, pageTransition } from "../../utils/animations";
import { Sparkles, Search, Calendar, Clock, User, ArrowRight } from "lucide-react";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";

const CATEGORIES = ["All", "Product", "Engineering", "Design", "Community", "Tutorials"];

const POSTS = [
  {
    title: "The Future of Beauty Booking in Africa",
    excerpt: "How GlowUp is reshaping the beauty industry with live sessions and AI-powered matching. A look at what's next for beauty tech on the continent.",
    date: "Dec 15, 2025",
    readTime: "5 min read",
    author: "Kelvin Asante",
    category: "Product",
    featured: true,
  },
  {
    title: "5 Tips for Building Your Stylist Portfolio",
    excerpt: "Stand out from the crowd with these portfolio best practices from GlowUp's top-rated stylists.",
    date: "Nov 28, 2025",
    readTime: "4 min read",
    author: "Abena Osei",
    category: "Tutorials",
  },
  {
    title: "Introducing Vibe Match: AI-Powered Stylist Discovery",
    excerpt: "Our new AI feature that matches you with stylists based on your unique style preferences and past bookings.",
    date: "Nov 10, 2025",
    readTime: "6 min read",
    author: "Team GlowUp",
    category: "Product",
  },
  {
    title: "Behind the Scenes: Building GlowUp Live",
    excerpt: "How we built a real-time streaming platform for beauty professionals using WebRTC and adaptive bitrate streaming.",
    date: "Oct 22, 2025",
    readTime: "7 min read",
    author: "Kofi Mensah",
    category: "Engineering",
  },
  {
    title: "Beauty Trends Across Africa: 2025 Edition",
    excerpt: "From Accra to Nairobi — the trends shaping African beauty this year, as seen through our stylist community.",
    date: "Oct 5, 2025",
    readTime: "5 min read",
    author: "Nana Yaa",
    category: "Community",
  },
  {
    title: "Designing for Delight: Our Design Philosophy",
    excerpt: "How we approach product design at GlowUp — from our gold-accented design system to micro-interactions.",
    date: "Sep 18, 2025",
    readTime: "6 min read",
    author: "Nana Yaa",
    category: "Design",
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

export default function Blog() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = POSTS.filter(
    (p) => (active === "All" || p.category === active) &&
      (p.title.toLowerCase().includes(query.toLowerCase()) || p.excerpt.toLowerCase().includes(query.toLowerCase()))
  );

  const featured = POSTS.find((p) => p.featured);

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium tracking-wide mb-6">
              <Sparkles size={12} />
              Blog
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">Latest from GlowUp</h1>
            <p className="text-lg text-neutral-400 max-w-xl mb-10">Insights, stories, and updates from the team building the future of beauty.</p>
          </FadeIn>

          {/* Search */}
          <FadeIn delay={0.1}>
            <div className="relative max-w-md mb-8">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/30 transition-colors"
              />
            </div>
          </FadeIn>

          {/* Categories */}
          <FadeIn delay={0.15}>
            <div className="flex flex-wrap gap-2 mb-10">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    active === c
                      ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                      : "bg-white/[0.04] text-neutral-500 border border-transparent hover:text-neutral-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Featured */}
          {featured && active === "All" && !query && (
            <FadeIn delay={0.2}>
              <div className="relative group cursor-pointer mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/5 via-neutral-900 to-neutral-950 border border-white/[0.06] p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-2xl" />
                <div className="relative">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-400/70 mb-3 block">Featured</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">{featured.title}</h2>
                  <p className="text-neutral-400 text-sm mb-4 max-w-xl leading-relaxed">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-5">
                    <span className="flex items-center gap-1.5"><Calendar size={12} />{featured.date}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} />{featured.readTime}</span>
                    <span className="flex items-center gap-1.5"><User size={12} />{featured.author}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                    Read article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.filter((p) => !p.featured).map((post, i) => (
              <FadeIn key={post.title} delay={i * 0.05}>
                <div className="group relative h-full p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-2.5 text-[11px] text-neutral-500 mb-3">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400">{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 leading-snug group-hover:text-brand-400 transition-colors">{post.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-600 mt-auto">
                    <User size={11} />
                    {post.author}
                    <span className="ml-auto">{post.date}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500">No articles found.</p>
            </div>
          )}

          <FadeIn delay={0.3}>
            <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-brand-500/5 via-neutral-900 to-neutral-950 border border-brand-500/10 text-center">
              <Sparkles size={20} className="mx-auto text-brand-400 mb-3" />
              <h2 className="text-lg font-bold text-white mb-2">Looking for Beauty Tips?</h2>
              <p className="text-sm text-neutral-400 mb-5 max-w-md mx-auto">
                Practical guides on braids, skincare, nails, lashes, barber — expert advice for your next appointment.
              </p>
              <Link
                to="/blog/beauty"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-colors"
              >
                Explore beauty tips
                <ArrowRight size={14} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </main>
      <AppFooter variant="landing" />
    </motion.div>
  );
}
