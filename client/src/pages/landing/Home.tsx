import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import LandingNavbar from "../../components/layout/LandingNavbar";
import AppFooter from "../../components/layout/AppFooter";
import Hero from "../../components/sections/Hero";
import FeaturesSection from "../../components/sections/FeaturesSection";
import HowItWorks from "../../components/sections/HowItWorks";
import StatsSection from "../../components/sections/StatsSection";
import ServicesSection from "../../components/sections/ServicesSection";
import FinalCTASection from "../../components/sections/FinalCTASection";
import QueueFeature from "../../components/sections/QueueFeature";
import BookingFeature from "../../components/sections/BookingFeature";
import PortfolioFeature from "../../components/sections/PortfolioFeature";
import StylistFeature from "../../components/sections/StylistFeature";
import TrendingFeature from "../../components/sections/TrendingFeature";
import PricingFeature from "../../components/sections/PricingFeature";
import ReviewsFeature from "../../components/sections/ReviewsFeature";
import ClientManagementFeature from "../../components/sections/ClientManagementFeature";
import AIRecommendationsFeature from "../../components/sections/AIRecommendationsFeature";
import PaymentsFeature from "../../components/sections/PaymentsFeature";
import NotificationsFeature from "../../components/sections/NotificationsFeature";

const fadeUp = {
  initial: { opacity: 0, y: 48 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

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
        <motion.div id="features" {...fadeUp}><FeaturesSection /></motion.div>
        <motion.div id="how" {...fadeUp}><HowItWorks /></motion.div>
        <motion.div id="queue" {...fadeUp}><QueueFeature /></motion.div>
        <motion.div id="booking" {...fadeUp}><BookingFeature /></motion.div>
        <motion.div id="portfolio" {...fadeUp}><PortfolioFeature /></motion.div>
        <motion.div {...fadeUp}><StylistFeature /></motion.div>
        <motion.div id="trending" {...fadeUp}><TrendingFeature /></motion.div>
        <motion.div {...fadeUp}><StatsSection /></motion.div>
        <motion.div {...fadeUp}><PricingFeature /></motion.div>
        <motion.div id="testimonials" {...fadeUp}><ReviewsFeature /></motion.div>
        <motion.div id="services" {...fadeUp}><ServicesSection /></motion.div>
        <motion.div {...fadeUp}><ClientManagementFeature /></motion.div>
        <motion.div {...fadeUp}><AIRecommendationsFeature /></motion.div>
        <motion.div {...fadeUp}><PaymentsFeature /></motion.div>
        <motion.div {...fadeUp}><NotificationsFeature /></motion.div>
        <motion.div {...fadeUp}><FinalCTASection /></motion.div>
      </main>
      <AppFooter variant="landing" />
    </div>
  );
}
