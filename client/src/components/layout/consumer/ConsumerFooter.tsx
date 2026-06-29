import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Heart,
  Mail,
  Phone,
  Check,
  MapPin,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePwaInstall } from "../../../hooks/usePwaInstall";
import PwaInstallModal from "../../PwaInstallModal";

// ─── Social Icons ─────────────────────────────────────────────────────────────
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733-16z" />
    <path d="M4 20l6.768-6.768m2.46-2.46L20 4" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

const SOCIAL_LINKS = [
  { label: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/glowupapp" },
  { label: "Twitter", icon: TwitterIcon, href: "https://twitter.com/glowupapp" },
  { label: "TikTok", icon: TikTokIcon, href: "https://www.tiktok.com/@glowupapp" },
  { label: "Facebook", icon: FacebookIcon, href: "https://www.facebook.com/glowupapp" },
];

const DISCOVER_LINKS = [
  { label: "Home", to: "/app" },
  { label: "Vibe Match", to: "/app/vibe-match", badge: "AI" },
  { label: "Trending", to: "/app/trending" },
  { label: "Rewards", to: "/app/rewards" },
  { label: "Live Sessions", to: "/app/live" },
  { label: "Queue", to: "/app/queue" },
];

const ACCOUNT_LINKS = [
  { label: "My Bookings", to: "/app/my-bookings" },
  { label: "Waitlist", to: "/app/waitlist" },
  { label: "Favorites", to: "/app/favorites" },
  { label: "Profile", to: "/app/profile" },
  { label: "Settings", to: "/app/settings" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", to: "/help" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact Us", to: "/contact" },
  { label: "Report a Problem", to: "/report" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Cookie Policy", to: "/cookies" },
  { label: "Refund Policy", to: "/refunds" },
];

// ─── Brand color tokens ──────────────────────────────────────────────────────
const BRAND = {
  primary: "#f43f5e",
  light: "#fb7188",
  dark: "#be123c",
  glow: "rgba(244, 63, 94, 0.08)",
  glowStrong: "rgba(244, 63, 94, 0.15)",
  border: "rgba(244, 63, 94, 0.12)",
  borderStrong: "rgba(244, 63, 94, 0.25)",
};

// ─── Footer Nav Group ─────────────────────────────────────────────────────────
function FooterNavGroup({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; to: string; badge?: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <p
        className="text-[10px] uppercase tracking-[0.16em] font-bold mb-5"
        style={{ color: BRAND.primary }}
      >
        {heading}
      </p>
      <ul className="space-y-3.5">
        {links.map(({ label, to, badge }) => (
          <li key={label}>
            <Link
              to={to}
              className="group inline-flex items-center gap-2 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
              style={{ color: "#7a706a" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.light)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7a706a")}
            >
              {label}
              {badge && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    background: BRAND.glow,
                    color: BRAND.primary,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
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
function SocialButton({
  label,
  icon: Icon,
  href,
}: {
  label: string;
  icon: React.FC;
  href: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      style={{
        border: `1px solid ${hovered ? BRAND.borderStrong : "rgba(255,255,255,0.04)"}`,
        background: hovered ? BRAND.glow : "rgba(255,255,255,0.01)",
        color: hovered ? BRAND.light : "#6b6560",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 4px 12px ${BRAND.glow}` : "none",
      }}
    >
      <Icon />
    </a>
  );
}

// ─── Newsletter Form ──────────────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
      setEmail("");
    }, 1000);
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.015)",
        border: `1px solid rgba(255,255,255,0.04)`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: BRAND.glow }}
        >
          <Mail size={14} style={{ color: BRAND.primary }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#e8e0d8" }}>
            Stay in the Glow
          </p>
          <p className="text-[11px]" style={{ color: "#5a5450" }}>
            Asante for being here ✨
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed mb-4" style={{ color: "#5a5450" }}>
        Drops, trends & exclusive stylist access — straight to your inbox.
      </p>

      <AnimatePresence mode="wait">
        {subscribed ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 py-3 px-3.5 rounded-xl text-xs font-medium"
            style={{
              background: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.15)",
              color: "#4ade80",
            }}
          >
            <Check size={14} />
            You're on the list! Check your inbox.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex overflow-hidden rounded-xl transition-all duration-200"
            style={{
              border: `1px solid ${focused ? BRAND.borderStrong : "rgba(255,255,255,0.06)"}`,
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="your@email.com"
              required
              className="flex-1 min-w-0 bg-transparent border-none outline-none px-3.5 py-3 text-sm"
              style={{ color: "#c5b8ac" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 flex items-center gap-1.5 px-4 text-sm font-semibold transition-all duration-200"
              style={{
                background: BRAND.primary,
                color: "#0f0b07",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = BRAND.light;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = BRAND.primary;
              }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: "rgba(15,11,7,0.2)", borderTopColor: "#0f0b07" }}
                />
              ) : (
                <>
                  <Send size={13} />
                  <span className="hidden sm:inline">Subscribe</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── App Store Badge ──────────────────────────────────────────────────────────
function StoreBadge({
  store,
  sub,
  icon,
  onInstall,
}: {
  store: string;
  sub: string;
  icon: React.ReactNode;
  onInstall: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onInstall}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-1 inline-flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      style={{
        border: `1px solid ${hovered ? BRAND.borderStrong : "rgba(255,255,255,0.04)"}`,
        background: hovered ? BRAND.glow : "rgba(255,255,255,0.01)",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <span className="shrink-0" style={{ color: hovered ? BRAND.light : "#8a8078" }}>{icon}</span>
      <div className="text-left min-w-0">
        <p className="text-[8px] sm:text-[9px] leading-none truncate" style={{ color: "#5a5450" }}>
          {sub}
        </p>
        <p
          className="text-xs sm:text-sm font-semibold leading-tight truncate"
          style={{ color: hovered ? "#e8e0d8" : "#a09890" }}
        >
          {store}
        </p>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConsumerFooter() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { isIOS, isAndroid, promptInstall, isInstallable } = usePwaInstall();

  const handleInstall = async () => {
    if (isIOS || (!isAndroid && !isInstallable)) {
      setShowInstallModal(true);
      return;
    }
    const accepted = await promptInstall();
    if (!accepted) {
      setShowInstallModal(true);
    }
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #141010 0%, #0c0907 100%)",
        borderTop: `1px solid rgba(255,255,255,0.04)`,
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .footer-animate { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
      {/* ── Decorative elements ──────────────────────────── */}
      {/* Top golden line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px pointer-events-none"
        style={{
          width: "50%",
          background: `linear-gradient(90deg, transparent, ${BRAND.border}, transparent)`,
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "250px",
          background: `radial-gradient(ellipse at center, ${BRAND.glow} 0%, transparent 70%)`,
        }}
      />

      {/* ── Newsletter Banner ────────────────────────────── */}
      <div style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main Footer Grid ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_3fr] gap-12 lg:gap-16">
          {/* ── Brand Column ──────────────────────────────── */}
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <div>
              <Link to="/app" className="inline-flex items-center gap-3 group">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.dark})`,
                  }}
                >
                  <Sparkles size={16} className="text-black" />
                </div>
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{
                    color: "#f0e8dc",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  GlowUp
                </span>
              </Link>

              <p
                className="mt-4 text-[13px] leading-relaxed max-w-[260px]"
                style={{
                  color: "#5a5450",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                Book top stylists, discover your next look, and watch
                transformations live — all in one place.
              </p>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              <p
                className="text-[10px] uppercase tracking-[0.16em] font-bold mb-4"
                style={{ color: BRAND.primary }}
              >
                Get in touch
              </p>
              <a
                href="mailto:asantekelvin229@gmail.com"
                className="flex items-center gap-3 text-[13px] transition-colors duration-200"
                style={{ color: "#6b6560" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.light)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6560")}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <Mail size={13} style={{ color: BRAND.primary }} />
                </div>
                asantekelvin229@gmail.com
              </a>
              <a
                href="tel:+233538281749"
                className="flex items-center gap-3 text-[13px] transition-colors duration-200"
                style={{ color: "#6b6560" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.light)}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6560")}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <Phone size={13} style={{ color: BRAND.primary }} />
                </div>
                +233 538-281-749
              </a>
              <div
                className="flex items-center gap-3 text-[13px]"
                style={{ color: "#6b6560" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <MapPin size={13} style={{ color: BRAND.primary }} />
                </div>
                Accra, Ghana
              </div>
            </div>

            {/* Social links */}
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em] font-bold mb-4"
                style={{ color: BRAND.primary }}
              >
                Follow us
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((s) => (
                  <SocialButton key={s.label} {...s} />
                ))}
              </div>
            </div>

            {/* App badges */}
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.16em] font-bold mb-4"
                style={{ color: BRAND.primary }}
              >
                Get the app
              </p>
              <div className="flex flex-row flex-wrap gap-2">
                <StoreBadge
                  store="App Store"
                  sub="Download on the"
                  onInstall={handleInstall}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  }
                />
                <StoreBadge
                  store="Google Play"
                  sub="Get it on"
                  onInstall={handleInstall}
                  icon={
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 1.33c.576.334.576 1.16 0 1.494l-2.302 1.33-2.532-2.532 2.532-2.622zM5.864 3.458L16.8 9.79l-2.302 2.302-8.635-8.634z" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Navigation Grid ───────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-6">
            <FooterNavGroup heading="Discover" links={DISCOVER_LINKS} />
            <FooterNavGroup heading="Account" links={ACCOUNT_LINKS} />
            <FooterNavGroup heading="Support" links={SUPPORT_LINKS} />
            <FooterNavGroup heading="Legal" links={LEGAL_LINKS} />
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────── */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs" style={{ color: "#3a3530" }}>
              © {CURRENT_YEAR} GlowUp Technologies Ltd. All rights reserved.
            </p>

            {/* Legal links */}
            <div className="flex items-center gap-5">
              {[
                { label: "Privacy", to: "/privacy" },
                { label: "Terms", to: "/terms" },
                { label: "Cookies", to: "/cookies" },
              ].map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="text-xs transition-colors duration-200"
                  style={{ color: "#3a3530" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7a706a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#3a3530")
                  }
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Made with love */}
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#3a3530" }}
            >
              Made with
              <Heart
                size={10}
                fill={BRAND.primary}
                style={{ color: BRAND.primary }}
              />
              for beauty lovers
            </div>
          </div>
        </div>
      </div>

      <PwaInstallModal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </footer>
  );
}