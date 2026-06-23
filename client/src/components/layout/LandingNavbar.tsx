import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, ArrowUpRight, Scissors } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "How it works", id: "how" },
  { label: "Live", id: "live" },
  { label: "Features", id: "features" },
  { label: "Pricing", id: "pricing" },
  { label: "Reviews", id: "reviews" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") return;
    const ids = NAV_LINKS.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [location.pathname]);

  const goToSection = useCallback(
    (id: string) => {
      setOpen(false);
      const scroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `/#${id}`);
        }
      };
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollTo: id } });
        setTimeout(scroll, 300);
      } else {
        setTimeout(scroll, 50);
      }
    },
    [location.pathname, navigate],
  );

  const handleLogoClick = () => {
    setOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-lg shadow-brand-500/5 dark:bg-surface-dark/70 dark:border-white/5"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 group focus:outline-none"
              aria-label="Go to homepage"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-brand-500 to-rose-600 shadow-[0_4px_16px_rgba(244,63,94,0.3)] transition-all duration-500 ease-out group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(244,63,94,0.45)]">
                <div className="absolute inset-0 rounded-xl bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Sparkles
                  size={15}
                  className="text-white relative z-10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-['Syne'] font-extrabold text-[23px] leading-none tracking-[-0.04em] bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                  Glow<span className="bg-gradient-to-r from-brand-400 via-brand-500 to-rose-500 bg-clip-text text-transparent">Up</span>
                </span>
                <span className="w-[5px] h-[5px] rounded-full bg-gradient-to-br from-brand-400 to-rose-500 mb-[6px] opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-125" />
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => goToSection(link.id)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive
                        ? "text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-surface-dark-tertiary/60"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute -bottom-px left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-brand-500 to-rose-400" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-surface-dark-tertiary/60"
              >
                Log in
              </Link>
              <Link
                to="/stylist/signup"
                className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-rose-600 px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-brand-500/20 hover:shadow-xl hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
              >
                <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Get started</span>
                <ArrowUpRight size={14} className="relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden inline-flex items-center justify-center p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-surface-dark-tertiary/60 transition-all"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Bottom gradient line on scroll */}
        {scrolled && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"
          />
        )}
      </motion.header>

      {/* Mobile menu — full screen overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 bg-white dark:bg-surface-dark shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-rose-600">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <span className="font-['Syne'] font-extrabold text-lg tracking-[-0.03em] bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                      Glow<span className="bg-gradient-to-r from-brand-400 via-brand-500 to-rose-500 bg-clip-text text-transparent">Up</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-5 py-6 space-y-1">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = activeSection === link.id;
                    return (
                      <motion.button
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => goToSection(link.id)}
                        className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                          isActive
                            ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-800/30"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary/60 border border-transparent"
                        }`}
                      >
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                        )}
                        <span className={isActive ? "" : "ml-[18px]"}>{link.label}</span>
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Bottom CTAs */}
                <div className="px-5 pb-8 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-sm font-medium text-gray-700 dark:text-gray-300 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary/60 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/stylist/signup"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-rose-600 py-3.5 rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.98] transition-all"
                  >
                    <Scissors size={14} />
                    Join as a stylist
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
