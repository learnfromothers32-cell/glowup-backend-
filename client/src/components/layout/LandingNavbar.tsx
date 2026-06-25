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
      // detect active section
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
            ? "bg-white/95 dark:bg-surface-dark/95 backdrop-blur-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
            : "bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-transform group-hover:scale-105">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-[22px] font-extrabold tracking-tight text-brand-500">
                GlowUp
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.05] ${
                    activeId === link.id
                      ? "text-brand-500 bg-brand-50 dark:bg-brand-950/30"
                      : "text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="h-12 px-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="h-12 px-6 rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] hover:bg-brand-600 hover:shadow-[0_4px_16px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
              {open ? <X size={28} className="text-gray-600 dark:text-gray-300" /> : <Menu size={28} className="text-gray-600 dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay menu */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Menu panel */}
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-sm bg-white dark:bg-surface-dark shadow-2xl flex flex-col">
            {/* Close button */}
            <div className="flex justify-end px-5 pt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            {/* Links */}
            <div className="flex-1 px-5 py-6 space-y-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`w-full flex items-center py-3.5 px-4 text-left text-base font-semibold rounded-xl transition-all duration-200 ${
                    activeId === link.id
                      ? "text-brand-500 bg-brand-50 dark:bg-brand-950/30"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-brand-500"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            {/* Bottom buttons */}
            <div className="px-5 pb-8 space-y-3">
              <button
                onClick={() => { setOpen(false); navigate("/login"); }}
                className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Sign In
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/signup"); }}
                className="w-full h-12 rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] hover:bg-brand-600 hover:shadow-[0_4px_16px_rgba(244,63,94,0.4)] transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
