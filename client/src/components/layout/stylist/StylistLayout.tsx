// src/components/layout/stylist/StylistLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import StylistNavbar from "./StylistNavbar";
import MobileNav from "./MobileNav";
import Sidebar from "./Sidebar";

export default function StylistLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex">
      {/* ── Desktop Sidebar (always visible on lg screens) ── */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Drawer (overlay) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSidebar}
          />
          {/* sidebar panel */}
          <nav className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl border-r border-gray-100 overflow-y-auto">
            <Sidebar onClose={closeSidebar} />
          </nav>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top navbar (visible on all screens) */}
        <StylistNavbar onMenuToggle={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* Mobile bottom navigation (hidden on large screens where sidebar is visible) */}
        <div className="lg:hidden">
          <MobileNav onOpenMenu={() => setSidebarOpen(true)} />
        </div>
      </div>
    </div>
  );
}