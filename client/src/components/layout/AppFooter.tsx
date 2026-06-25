import { Link } from "react-router-dom";
import { Sparkles, Heart, Download, ExternalLink } from "lucide-react";
import { usePwaInstall } from "../../hooks/usePwaInstall";

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Press", to: "/press" },
  { label: "Blog", to: "/blog" },
];

const FEATURE_LINKS = [
  { label: "Queue Management", to: "/#queue" },
  { label: "Booking", to: "/#booking" },
  { label: "Portfolio", to: "/#portfolio" },
  { label: "Live Streaming", to: "/#live" },
  { label: "Trending Feed", to: "/#trending" },
];

interface AppFooterProps {
  variant?: "landing" | "consumer";
}

export default function AppFooter({ variant = "landing" }: AppFooterProps) {
  const { promptInstall, isInstallable, isInstalled, isIOS } = usePwaInstall();

  const handleInstall = async () => {
    if (isIOS) {
      // iOS — open instructions modal (handled by parent or inline)
      const modal = document.getElementById("pwa-install-modal");
      if (modal) modal.classList.remove("hidden");
      return;
    }
    const result = await promptInstall();
    if (!result && isInstallable) {
      // Fallback: show modal
      const modal = document.getElementById("pwa-install-modal");
      if (modal) modal.classList.remove("hidden");
    }
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
          {/* Column 1: Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-transform group-hover:scale-105">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-brand-500">GlowUp</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              AI-Powered Beauty Platform — Connect with top stylists, book services, transform your look.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {["Instagram", "Facebook", "Twitter", "LinkedIn"].map((name) => (
                <a
                  key={name}
                  href="#"
                  aria-label={name}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-brand-500 hover:text-white hover:scale-110 transition-all duration-200"
                >
                  <span className="text-xs font-bold">{name[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="text-base font-bold text-white mb-5">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-brand-500 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Features */}
          <div>
            <h4 className="text-base font-bold text-white mb-5">Features</h4>
            <ul className="space-y-3">
              {FEATURE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-brand-500 hover:translate-x-1 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact + PWA */}
          <div>
            <h4 className="text-base font-bold text-white mb-5">Contact</h4>
            <a
              href="mailto:support@glowup.app"
              className="text-sm text-gray-400 hover:text-brand-500 transition-colors duration-200"
            >
              support@glowup.app
            </a>

            {/* PWA Download Button */}
            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="mt-6 w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-brand-500 text-sm font-bold text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] hover:bg-brand-600 hover:shadow-[0_4px_16px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <Download size={18} />
                Download App
              </button>
            )}
            {isInstalled && (
              <div className="mt-6 w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-success/10 border border-success/20 text-sm font-bold text-success">
                <span>✓</span> App Installed
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500">Available on Android & iOS</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} GlowUp. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">Terms of Service</Link>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            Made with <Heart size={12} fill="#f43f5e" className="text-brand-500" /> in Accra
          </div>
        </div>
      </div>
    </footer>
  );
}
