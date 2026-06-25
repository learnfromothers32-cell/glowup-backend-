import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how" },
  { label: "Testimonials", id: "testimonials" },
  { label: "Services", id: "services" },
  { label: "Queue", id: "queue" },
  { label: "Live", id: "live" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveId(link.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const scrollTo = useCallback((id: string) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [location, navigate]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 dark:bg-surface-dark/95 backdrop-blur-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            : "bg-white/60 dark:bg-surface-dark/60 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-brand-500 transition-colors group-hover:text-brand-600">
                GlowUp
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.05] group"
                >
                  <span className={`relative z-10 ${
                    activeId === link.id
                      ? "text-brand-500"
                      : "text-gray-500 group-hover:text-brand-500 dark:text-gray-400 dark:group-hover:text-brand-400"
                  }`}>
                    {link.label}
                  </span>
                  {activeId === link.id && (
                    <span className="absolute inset-0 rounded-lg bg-brand-50 dark:bg-brand-950/30 transition-all duration-300" />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="h-10 px-5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="h-10 px-5 rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={24} className="text-gray-600 dark:text-gray-300" /> : <Menu size={24} className="text-gray-600 dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          {/* Menu panel */}
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-slide-left">
            {/* Close button */}
            <div className="flex justify-end px-5 pt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            {/* Links with staggered animation */}
            <div className="flex-1 px-5 py-6 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link, i) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="w-full flex items-center py-3.5 px-4 text-left text-base font-semibold rounded-xl transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  <span className={`transition-colors ${
                    activeId === link.id
                      ? "text-brand-500"
                      : "text-gray-700 dark:text-gray-300 hover:text-brand-500"
                  }`}>
                    {link.label}
                  </span>
                  {activeId === link.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
            {/* Bottom buttons with stagger */}
            <div className="px-5 pb-8 space-y-2.5">
              <button
                onClick={() => { setOpen(false); navigate("/login"); }}
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: "300ms", animationFillMode: "both" }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/signup"); }}
                className="w-full h-10 rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-all duration-200 animate-slide-up"
                style={{ animationDelay: "350ms", animationFillMode: "both" }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-left {
          animation: slideLeft 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </>
  );
}
