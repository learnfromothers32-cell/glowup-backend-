// src/components/layout/stylist/StylistLayout.tsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import StylistNavbar from "./StylistNavbar";
import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";
import { fadeSlideUp, pageTransition, useReducedMotion } from "../../../utils/animations";

export default function StylistLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLivePage = location.pathname === "/stylist/live";
  const reduced = useReducedMotion();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark flex overflow-x-hidden">
      {/* ── Desktop Sidebar (always visible on lg screens) ── */}
      {!isLivePage && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* ── Mobile Sidebar Drawer (overlay) ── */}
      {sidebarOpen && !isLivePage && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          {/* sidebar panel */}
          <          nav className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-surface-dark-secondary shadow-2xl border-r border-gray-100 dark:border-gray-700/50 overflow-y-auto">
            <Sidebar onClose={closeSidebar} />
          </nav>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navbar (hidden on live page - it has its own UI) */}
        {!isLivePage && (
          <StylistNavbar onMenuToggle={() => setSidebarOpen(true)} />
        )}

        {/* Page content - no padding on live page */}
        <main
          className={
            isLivePage
              ? "flex-1 flex flex-col overflow-hidden"
              : "flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-6"
          }
        >
          <motion.div
            key={reduced ? undefined : location.pathname}
            initial={reduced ? false : "hidden"}
            animate="visible"
            variants={fadeSlideUp}
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile bottom navigation (hidden on live page - it has its own controls) */}
        {!isLivePage && (
          <div className="lg:hidden">
            <MobileNav onOpenMenu={() => setSidebarOpen(true)} />
          </div>
        )}
      </div>
    </div>
  );
}