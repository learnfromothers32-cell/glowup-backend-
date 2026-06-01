// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/authUtils";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

// Layouts
import ConsumerLayout from "../components/layout/consumer/ConsumerLayout";
import StylistLayout from "../components/layout/stylist/StylistLayout";

// Landing
import Home from "../pages/landing/Home";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import StylistSignupPage from "../pages/auth/StylistSignupPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

// Consumer pages
import ConsumerHome from "../pages/consumer/Home";
import TrendingFeed from "../features/consumer/components/TrendingFeed";
import VibeMatch from "../features/consumer/components/VibeMatch";
import Rewards from "../pages/consumer/Rewards";
import MyBookings from "../features/consumer/components/MyBookings";
import LiveRoom from "../features/consumer/components/LiveRoom";
import StylistDetail from "../pages/consumer/StylistDetail";
import ServicePage from "../features/consumer/components/ServicePage";
import ConsumerProfile from "../pages/consumer/Profile";
import Favorites from "../features/consumer/components/Favorites";
import Settings from "../features/consumer/components/Settings";
import LiveStylists from "../features/consumer/components/LiveStylists";
import ServiceDetailPage from "../features/consumer/components/ServiceDetailPage";
import SearchResultsPage from "../features/consumer/components/SearchResultsPage";
import ScrollToTop from "../features/consumer/components/ScrollToTop";

// Stylist pages
import StylistDashboard from "../pages/stylist/Dashboard";
import StylistServices from "../pages/stylist/Services";
import StylistPortfolio from "../pages/stylist/Portfolio";
import StylistLive from "../pages/stylist/Live";
import StylistProfile from "../pages/stylist/Profile";
import StylistCalendar from "../pages/stylist/Calendar";
import StylistBookings from "../pages/stylist/Bookings";
import StylistClients from "../pages/stylist/Clients";
import StylistEarnings from "../pages/stylist/Earnings";
import StylistAnalytics from "../pages/stylist/Analytics";
import StylistAvailability from "../pages/stylist/Availability";
import StylistMessages from "../pages/stylist/Messages";
import StylistSettings from "../pages/stylist/Settings";
import StylistOnboarding from "../pages/stylist/Onboarding";

/* ────────── Protected Route Wrapper ────────── */
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: "client" | "stylist";
}> = ({ children, allowedRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4]">
        <div className="text-center text-[#7A7168]">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to their appropriate home
    return (
      <Navigate
        to={user?.role === "stylist" ? "/stylist/dashboard" : "/app"}
        replace
      />
    );
  }

  return <>{children}</>;
};

/* ────────── Main App Router ────────── */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/stylist/signup" element={<StylistSignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* ── Consumer (protected: role = client) ── */}
          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRole="client">
                <ConsumerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ConsumerHome />} />
            <Route path="trending" element={<TrendingFeed />} />
            <Route path="vibe-match" element={<VibeMatch />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="queue" element={<Navigate to="/app/my-bookings" replace />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="live-stylists" element={<LiveStylists />} />
            <Route path="profile" element={<ConsumerProfile />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="settings" element={<Settings />} />
            <Route path="stylist/:id" element={<StylistDetail />} />
            <Route
              path="stylist/:stylistId/service/:serviceId"
              element={<ServiceDetailPage />}
            />
            <Route path="live/:stylistId" element={<LiveRoom />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path=":service" element={<ServicePage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>

          {/* ── Stylist onboarding (standalone, no layout) ── */}
          <Route
            path="/stylist/onboarding"
            element={
              <ProtectedRoute allowedRole="stylist">
                <StylistOnboarding />
              </ProtectedRoute>
            }
          />

          {/* ── Stylist (protected: role = stylist) ── */}
          <Route
            path="/stylist"
            element={
              <ProtectedRoute allowedRole="stylist">
                <StylistLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={<Navigate to="/stylist/dashboard" replace />}
            />
            <Route path="dashboard" element={<StylistDashboard />} />
            <Route path="services" element={<StylistServices />} />
            <Route path="portfolio" element={<StylistPortfolio />} />
            <Route path="live" element={<StylistLive />} />
            <Route path="profile" element={<StylistProfile />} />
            <Route path="calendar" element={<StylistCalendar />} />
            <Route path="bookings" element={<StylistBookings />} />
            <Route path="bookings/new" element={<Navigate to="/stylist/bookings" replace />} />
            <Route path="clients" element={<StylistClients />} />
            <Route path="earnings" element={<StylistEarnings />} />
            <Route path="analytics" element={<StylistAnalytics />} />
            <Route path="availability" element={<StylistAvailability />} />
            <Route path="messages" element={<StylistMessages />} />
            <Route path="settings" element={<StylistSettings />} />

            <Route
              path="*"
              element={<Navigate to="/stylist/dashboard" replace />}
            />
          </Route>

          {/* ── Global catch‑all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
