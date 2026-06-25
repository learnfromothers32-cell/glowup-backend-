import { Link } from "react-router-dom";
import { Sparkles, Heart, Download, Mail } from "lucide-react";
import { usePwaInstall } from "../../hooks/usePwaInstall";

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Press", to: "/press-kit" },
  { label: "Blog", to: "/blog" },
];

const FEATURE_LINKS = [
  { label: "Queue Management", to: "/#queue" },
  { label: "Booking", to: "/#booking" },
  { label: "Portfolio", to: "/#portfolio" },
  { label: "Live Streaming", to: "/#live" },
  { label: "Trending Feed", to: "/#trending" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", to: "/help" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact Us", to: "/contact" },
  { label: "Report a Problem", to: "/report" },
];

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SOCIAL_ICONS = [
  { name: "Instagram", icon: InstagramIcon, href: "#" },
  { name: "Facebook", icon: FacebookIcon, href: "#" },
  { name: "Twitter", icon: TwitterIcon, href: "#" },
  { name: "LinkedIn", icon: LinkedInIcon, href: "#" },
];

interface AppFooterProps {
  variant?: "landing" | "consumer";
  onOpenInstall?: () => void;
}

export default function AppFooter({ variant = "landing", onOpenInstall }: AppFooterProps) {
  const { isInstalled } = usePwaInstall();

  const handleInstall = () => {
    onOpenInstall?.();
  };

  if (variant === "consumer") {
    return (
      <footer className="bg-gray-900 dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-sm font-extrabold text-white">GlowUp</span>
              </Link>
            </div>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} GlowUp Technologies Ltd.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 dark:bg-surface-dark border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand + Newsletter */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-brand-500">GlowUp</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              AI-Powered Beauty Platform — Connect with top stylists, book services, transform your look.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_ICONS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-brand-500 hover:text-white hover:scale-110 hover:shadow-glow-sm transition-all duration-200"
                >
                  <social.icon />
                </a>
              ))}
            </div>
            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-gray-300 mb-2">Stay updated</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-gray-700 text-sm text-white placeholder:text-gray-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
                <button className="h-10 px-4 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 hover:shadow-glow-sm transition-all duration-200">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-brand-400 hover:translate-x-1 transition-all duration-200 inline-flex items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Features */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Features</h4>
            <ul className="space-y-3">
              {FEATURE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-brand-400 hover:translate-x-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support + Download */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-brand-400 hover:translate-x-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* PWA Download Button */}
            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="mt-6 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand-500 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-all duration-200"
              >
                <Download size={14} />
                Download App
              </button>
            )}
            {isInstalled && (
              <div className="mt-6 w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-success/10 border border-success/20 text-xs font-semibold text-success">
                <span>✓</span> App Installed
              </div>
            )}

            {/* App Store Badges */}
            <div className="mt-4 flex gap-2">
              <div className="flex-1 h-10 rounded-lg bg-white/5 border border-gray-700 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.98-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.14 4.48-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <p className="text-[8px] text-gray-400 leading-none">Download on the</p>
                  <p className="text-[10px] font-semibold text-white leading-tight">App Store</p>
                </div>
              </div>
              <div className="flex-1 h-10 rounded-lg bg-white/5 border border-gray-700 flex items-center justify-center gap-1.5 hover:bg-white/10 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.147 1.24a1 1 0 010 1.74l-2.147 1.24-2.53-2.53 2.53-2.69zM5.864 3.458L16.8 9.79l-2.302 2.302-8.634-8.634z" />
                </svg>
                <div className="text-left">
                  <p className="text-[8px] text-gray-400 leading-none">Get it on</p>
                  <p className="text-[10px] font-semibold text-white leading-tight">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} GlowUp. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">Terms</Link>
            <Link to="/cookies" className="text-sm text-gray-500 hover:text-brand-400 transition-colors">Cookies</Link>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            Made with <Heart size={12} fill="#f43f5e" className="text-brand-500" /> in Accra
          </div>
        </div>
      </div>
    </footer>
  );
}
