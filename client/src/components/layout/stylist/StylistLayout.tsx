// src/components/layout/stylist/StylistLayout.tsx
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StylistNavbar from "./StylistNavbar";
import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";

export default function StylistLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLivePage = location.pathname === "/stylist/live";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-surface-dark flex">
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
          <nav className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-surface-dark-secondary shadow-2xl border-r border-gray-100 dark:border-gray-700 overflow-y-auto">
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
              : "flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6"
          }
        >
          <Outlet />
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