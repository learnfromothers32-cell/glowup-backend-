import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";
import Hero from "../../components/sections/Hero";
import FeaturesSection from "../../components/sections/FeaturesSection";
import HowItWorks from "../../components/sections/HowItWorks";
import TestimonialsSection from "../../components/sections/TestimonialsSection";
import StatsSection from "../../components/sections/StatsSection";
import ServicesSection from "../../components/sections/ServicesSection";
import FinalCTASection from "../../components/sections/FinalCTASection";

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
    const navigationEntry = window.performance?.getEntriesByType?.(
      "navigation",
    )?.[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === "reload";

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
    <div className="min-h-screen bg-white dark:bg-surface-dark">
      <LandingNavbar />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorks />
        <StatsSection />
        <TestimonialsSection />
        <ServicesSection />
        <FinalCTASection />
      </main>
      <AppFooter variant="landing" />
    </div>
  );
}
