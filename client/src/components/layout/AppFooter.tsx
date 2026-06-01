import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Send,
  Check,
  Heart,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

interface FooterGroup {
  heading: string;
  links: NavLink[];
}

interface SocialLink {
  label: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CONSUMER_GROUPS: FooterGroup[] = [
  {
    heading: "Discover",
    links: [
      { label: "Home", href: "/app" },
      { label: "Vibe Match", href: "/app/vibe-match", badge: "AI" },
      { label: "Trending", href: "/app/trending" },
      { label: "Rewards", href: "/app/rewards" },
      { label: "Live Sessions", href: "/app/live-stylists" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "My Bookings", href: "/app/my-bookings" },
      { label: "Favorites", href: "/app/favorites" },
      { label: "Profile", href: "/app/profile" },
      { label: "Settings", href: "/app/settings" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/app" },
      { label: "FAQ", href: "/app" },
      { label: "Contact Us", href: "/app" },
      { label: "Report a Problem", href: "/app" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/" },
      { label: "Privacy Policy", href: "/" },
      { label: "Cookie Policy", href: "/" },
      { label: "Refund Policy", href: "/" },
    ],
  },
];

const LANDING_GROUPS: FooterGroup[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "AI Vibe Match", href: "/signup", badge: "AI" },
      { label: "Live Sessions", href: "/signup" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "For Stylists",
    links: [
      { label: "Join as Stylist", href: "/signup" },
      { label: "Stylist Dashboard", href: "/login" },
      { label: "Creator Program", href: "/signup", badge: "New" },
      { label: "Get a Demo", href: "/signup" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/" },
      { label: "Blog", href: "/" },
      { label: "Careers", href: "/", badge: "Hiring" },
      { label: "Press Kit", href: "/" },
      { label: "Contact", href: "/" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/" },
      { label: "Terms of Service", href: "/" },
      { label: "Cookie Policy", href: "/" },
    ],
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/glowupapp",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://twitter.com/glowupapp",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 4l11.733 16h4.267l-11.733-16z" />
        <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@glowupapp",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/glowupapp",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Newsletter Form ──────────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Mail size={13} className="text-amber-500" />
        </div>
        <p className="text-sm font-semibold text-neutral-200">Stay in the loop</p>
      </div>
      <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
        Get beauty tips, exclusive deals, and new stylist alerts — straight to your inbox.
      </p>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium"
        >
          <Check size={14} />
          You're subscribed! Check your inbox.
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.08] text-neutral-300 text-sm font-medium hover:bg-white/[0.12] hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={13} />
                <span className="hidden sm:inline">Subscribe</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Nav Group ────────────────────────────────────────────────────────────────
function NavGroup({ heading, links }: FooterGroup) {
  return (
    <nav aria-label={heading}>
      <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-400 mb-4">
        {heading}
      </p>
      <ul className="space-y-3">
        {links.map(({ label, href, badge }) => (
          <li key={label}>
            <Link
              to={href}
              className="group inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-200 transition-colors duration-200"
            >
              {label}
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────
function SocialBtn({ label, href, icon: Icon }: SocialLink) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`GlowUp on ${label}`}
      className="w-9 h-9 flex items-center justify-center rounded-xl
        text-neutral-500 border border-white/[0.06] bg-white/[0.02]
        hover:text-white hover:border-white/20 hover:bg-white/[0.06]
        transition-all duration-200"
    >
      <Icon />
    </a>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface AppFooterProps {
  variant?: "landing" | "consumer";
}

export default function AppFooter({ variant = "landing" }: AppFooterProps) {
  const isConsumer = variant === "consumer";
  const navGroups = isConsumer ? CONSUMER_GROUPS : LANDING_GROUPS;

  return (
    <footer
      aria-label="Site footer"
      className="bg-neutral-950 border-t border-white/[0.06] mt-12"
    >
      {/* ── CTA Banner ─────────────────────────────────────── */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles size={13} className="text-amber-500" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-amber-500">
                  Ready to glow?
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                Book your next look in{" "}
                <span className="text-amber-400">seconds.</span>
              </h2>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                Join thousands of people discovering top stylists and transforming their style.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={isConsumer ? "/app/vibe-match" : "/signup"}
                className="inline-flex items-center gap-2.5 bg-white text-gray-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors duration-200 shadow-lg shadow-white/10"
              >
                {isConsumer ? "Find Your Vibe" : "Get Started"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Body ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_3fr] gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="flex flex-col gap-8">
            {/* Logo + tagline */}
            <div>
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
                  <Sparkles size={16} className="text-gray-900" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  GlowUp
                </span>
              </Link>
              <p className="mt-4 text-sm text-neutral-500 leading-relaxed max-w-[280px]">
                {isConsumer
                  ? "Your beauty & style companion — discover top stylists, book appointments, and transform your look."
                  : "The modern beauty platform — live sessions, AI matching, instant booking, and growth tools for stylists."}
              </p>
            </div>

            {/* Newsletter */}
            <NewsletterForm />

            {/* Social links */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-400 mb-3">
                Follow us
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <SocialBtn key={s.label} {...s} />
                ))}
              </div>
            </div>

            {/* App store badges */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-400 mb-3">
                Get the app
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    store: "App Store",
                    sub: "Download on the",
                    href: "https://apps.apple.com",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    ),
                  },
                  {
                    store: "Google Play",
                    sub: "Get it on",
                    href: "https://play.google.com",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 1.33c.576.334.576 1.16 0 1.494l-2.302 1.33-2.532-2.532 2.532-2.622zM5.864 3.458L16.8 9.79l-2.302 2.302-8.635-8.634z" />
                      </svg>
                    ),
                  },
                ].map(({ store, sub, href, icon }) => (
                  <a
                    key={store}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 w-fit px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:border-white/15 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <span className="text-neutral-300">{icon}</span>
                    <div className="text-left">
                      <p className="text-[9px] text-neutral-500 leading-none">{sub}</p>
                      <p className="text-sm font-semibold leading-tight">{store}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-6">
            {navGroups.map((group) => (
              <NavGroup key={group.heading} {...group} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ─────────────────────────────────────── */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: copyright + location */}
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <span>© {CURRENT_YEAR} GlowUp Technologies Ltd.</span>
              <span className="hidden sm:flex items-center gap-1">
                <MapPin size={10} />
                Accra, Ghana
              </span>
            </div>

            {/* Center: legal links */}
            <div className="flex items-center gap-5">
              {[
                { label: "Privacy", href: "/" },
                { label: "Terms", href: "/" },
                { label: "Cookies", href: "/" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right: made with love */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <span>Made with</span>
              <Heart size={10} fill="#ef4444" className="text-red-500" />
              <span>in Accra</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}