import { Link } from "react-router-dom";
import { Sparkles, Heart, Globe, MessageSquareShare, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", to: "/#features" },
    { label: "How It Works", to: "/#how" },
    { label: "Pricing", to: "/#services" },
    { label: "For Stylists", to: "/stylist/signup" },
  ],
  Company: [
    { label: "About", to: "/about" },
    { label: "Careers", to: "/careers" },
    { label: "Blog", to: "/blog" },
    { label: "Press Kit", to: "/press" },
  ],
  Support: [
    { label: "Help Center", to: "/help" },
    { label: "Contact", to: "/contact" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ],
};

const SOCIALS = [
  { icon: Globe, label: "Website", href: "#" },
  { icon: MessageSquareShare, label: "Community", href: "#" },
];

interface AppFooterProps {
  variant?: "landing" | "consumer";
}

export default function AppFooter({ variant = "landing" }: AppFooterProps) {
  return (
    <footer className="bg-gray-900 dark:bg-surface-dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-white">GlowUp</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              The AI-powered beauty platform connecting clients with verified stylists across Ghana.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500 mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} GlowUp Technologies Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            Made with <Heart size={10} fill="#f43f5e" className="text-brand-500" /> in Accra
          </div>
          <a href="mailto:hello@glowup.app" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <Mail size={12} /> hello@glowup.app
          </a>
        </div>
      </div>
    </footer>
  );
}
