import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how" },
  { label: "Live", id: "live" },
  { label: "Preview", id: "preview" },
  { label: "Reviews", id: "reviews" },
  { label: "Pricing", id: "pricing" },
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

  const goToSection = (id: string) => {
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
  };

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
      {/* Fonts – Syne for the brand, Inter for everything else */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap');
      `}</style>

      {/* Main header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-lg shadow-gray-200/20"
            : "bg-white/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo (left) */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 group focus:outline-none"
              aria-label="Go to homepage"
            >
              {/* Icon */}
              <div
                className="relative flex items-center justify-center w-9 h-9 rounded-xl 
    bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 
    shadow-[0_6px_20px_rgba(196,65,12,0.25)]
    transition-all duration-300 ease-out
    group-hover:scale-105 group-hover:shadow-[0_10px_28px_rgba(196,65,12,0.35)]"
              >
                {/* subtle inner glow */}
                <div className="absolute inset-0 rounded-xl bg-white/10 blur-[6px] opacity-0 group-hover:opacity-100 transition-opacity" />

                <Sparkles
                  size={16}
                  className="text-white relative z-10 transition-transform duration-300 group-hover:rotate-6"
                />
              </div>

              {/* Text */}
              <div className="flex items-end gap-1">
                <span className="font-['Syne'] font-extrabold text-[20px] leading-none tracking-[-0.02em] text-gray-900">
                  Glow
                  <span className="text-orange-600">Up</span>
                </span>

                {/* refined accent dot */}
                <span className="w-[5px] h-[5px] rounded-full bg-orange-500 mb-[4px] opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Desktop navigation (center) */}
            <nav className="hidden md:flex items-center space-x-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => goToSection(link.id)}
                  className="relative px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 group"
                >
                  {link.label}
                  <span className="absolute left-4 right-4 bottom-0 h-0.5 bg-orange-500 scale-x-0 origin-left transition-transform group-hover:scale-x-100" />
                </button>
              ))}
            </nav>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                to="/stylist/signup"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-lg transition-all shadow-md shadow-orange-200/30 hover:shadow-lg hover:shadow-orange-200/40 active:scale-[0.98]"
              >
                Get started
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>

            {/* Mobile menu toggle (right) */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-16 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => goToSection(link.id)}
                    className="block w-full text-left text-lg font-medium text-gray-700 hover:text-gray-900 py-2 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}

                <hr className="border-gray-200" />

                <div className="space-y-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center text-base font-medium text-gray-700 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/stylist/signup"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 w-full text-base font-semibold text-white bg-orange-500 hover:bg-orange-600 py-3 rounded-lg shadow-md shadow-orange-200/30 transition-all"
                  >
                    Get started <ArrowUpRight size={16} />
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
