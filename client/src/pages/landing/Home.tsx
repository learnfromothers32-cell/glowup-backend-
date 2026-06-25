import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import LiveFeature from "../../components/sections/LiveFeature";
import TrendingFeature from "../../components/sections/TrendingFeature";
import PricingFeature from "../../components/sections/PricingFeature";
import ReviewsFeature from "../../components/sections/ReviewsFeature";
import ClientManagementFeature from "../../components/sections/ClientManagementFeature";
import AIRecommendationsFeature from "../../components/sections/AIRecommendationsFeature";
import PaymentsFeature from "../../components/sections/PaymentsFeature";
import NotificationsFeature from "../../components/sections/NotificationsFeature";
import PwaInstallModal from "../../components/PwaInstallModal";

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
        <div id="features"><FeaturesSection /></div>
        <div id="how"><HowItWorks /></div>
        <div id="queue"><QueueFeature /></div>
        <div id="booking"><BookingFeature /></div>
        <div id="portfolio"><PortfolioFeature /></div>
        <StylistFeature />
        <div id="live"><LiveFeature /></div>
        <div id="trending"><TrendingFeature /></div>
        <StatsSection />
        <PricingFeature />
        <div id="testimonials"><ReviewsFeature /></div>
        <div id="services"><ServicesSection /></div>
        <ClientManagementFeature />
        <AIRecommendationsFeature />
        <PaymentsFeature />
        <NotificationsFeature />
        <FinalCTASection />
      </main>
      <AppFooter variant="landing" />
      <PwaInstallModal />
    </div>
  );
}
