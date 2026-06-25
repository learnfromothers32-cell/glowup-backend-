import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how" },
  { label: "Testimonials", id: "testimonials" },
  { label: "Services", id: "services" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between lg:h-[72px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_2px_8px_rgba(244,63,94,0.3)] transition-transform group-hover:scale-105">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-text-primary dark:text-text-dark-primary">
                GlowUp
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="h-11 px-5 rounded-xl text-sm font-semibold text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] hover:shadow-[0_4px_16px_rgba(244,63,94,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-surface-dark lg:hidden"
          >
            <div className="flex h-full flex-col px-6 pt-20 pb-8">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => scrollTo(link.id)}
                    className="flex items-center py-4 text-left text-2xl font-bold text-text-primary dark:text-text-dark-primary border-b border-gray-100 dark:border-gray-800"
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3">
                <button
                  onClick={() => { setOpen(false); navigate("/login"); }}
                  className="h-14 rounded-2xl border border-gray-200 dark:border-gray-700 text-base font-semibold text-text-primary dark:text-text-dark-primary hover:bg-gray-50 dark:hover:bg-surface-dark-secondary transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setOpen(false); navigate("/signup"); }}
                  className="h-14 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-base font-semibold text-white shadow-[0_4px_16px_rgba(244,63,94,0.3)]"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
