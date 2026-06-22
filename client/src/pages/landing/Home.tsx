import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Hero from "../../components/sections/Hero";
import HowItWorks from "../../components/sections/HowItWorks";
import LiveSection from "../../components/sections/LiveSection";
import FeaturesSection from "../../components/sections/FeaturesSection";
import PricingSection from "../../components/sections/PricingSection";
import ProductPreviewSection from "../../components/sections/ProductPreviewSection";
import SocialProofSection from "../../components/sections/SocialProofSection";
import FinalCTASection from "../../components/sections/FinalCTASection";
import AppFooter from "../../components/layout/AppFooter";
import LandingNavbar from "../../components/layout/LandingNavbar";
import { fadeSlideUp, pageTransition } from "../../utils/animations";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`reveal ${delay > 0 ? `reveal-delay-${delay}` : ""}`}>
      {children}
    </div>
  );
}

const SECTIONS = [
  { component: <HowItWorks />, id: "how" },
  { component: <LiveSection />, id: "live" },
  { component: <FeaturesSection />, id: "features" },
  { component: <PricingSection />, id: "pricing" },
  { component: <ProductPreviewSection />, id: "preview" },
  { component: <SocialProofSection />, id: "reviews" },
  { component: <FinalCTASection />, id: "cta" },
];

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;

    // Get navigation type using modern API
    const navigationEntry = window.performance?.getEntriesByType?.(
      "navigation",
    )?.[0] as PerformanceNavigationTiming | undefined;
    const navigationType = navigationEntry?.type;
    const isReload = navigationType === "reload";

    if (state?.scrollTo) {
      const el = document.getElementById(state.scrollTo);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
          window.history.replaceState(null, "", `/#${state.scrollTo}`);
        }, 100);
      }
    } else if (location.hash && !isReload) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <>
      <LandingNavbar />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeSlideUp}
        transition={pageTransition}
      >
        <Hero />

        {SECTIONS.map(({ component, id }, i) => (
          <RevealSection key={id} delay={Math.min(i + 1, 4)}>
            <div id={id}>
              {component}
            </div>
          </RevealSection>
        ))}
        <AppFooter variant="landing" />
      </motion.div>
    </>
  );
}
