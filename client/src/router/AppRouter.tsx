import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authUtils";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import SEOHead from "../components/seo/SEOHead";
import { useTranslation } from "react-i18next";
import { usePageTracking } from "../hooks/usePageTracking";

const ConsumerLayout = lazy(() => import("../components/layout/consumer/ConsumerLayout"));
const StylistLayout = lazy(() => import("../components/layout/stylist/StylistLayout"));
const Home = lazy(() => import("../pages/landing/Home"));
const About = lazy(() => import("../pages/info/About"));
const Blog = lazy(() => import("../pages/info/Blog"));
const BeautyTipsPage = lazy(() => import("../pages/info/BeautyTipsPage"));
const BeautyArticle = lazy(() => import("../pages/info/BeautyArticle"));
const Careers = lazy(() => import("../pages/info/Careers"));
const PressKit = lazy(() => import("../pages/info/PressKit"));
const HelpCenter = lazy(() => import("../pages/info/HelpCenter"));
const FAQ = lazy(() => import("../pages/info/FAQ"));
const Contact = lazy(() => import("../pages/info/Contact"));
const ReportProblem = lazy(() => import("../pages/info/ReportProblem"));
const PrivacyPolicy = lazy(() => import("../pages/info/PrivacyPolicy"));
const TermsOfService = lazy(() => import("../pages/info/TermsOfService"));
const CookiePolicy = lazy(() => import("../pages/info/CookiePolicy"));
const RefundPolicy = lazy(() => import("../pages/info/RefundPolicy"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const SignupPage = lazy(() => import("../pages/auth/SignupPage"));
const StylistSignupPage = lazy(() => import("../pages/auth/StylistSignupPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));
const ConsumerHome = lazy(() => import("../pages/consumer/Home"));
const HairstyleStudioPage = lazy(() => import("../pages/consumer/HairstyleStudioPage"));
const TrendingFeed = lazy(() => import("../pages/consumer/TrendingFeed"));
const AiVibeMatchPage = lazy(() => import("../pages/consumer/AiVibeMatchPage"));
const Rewards = lazy(() => import("../pages/consumer/Rewards"));
const MyBookings = lazy(() => import("../pages/consumer/MyBookings"));

const StylistDetail = lazy(() => import("../pages/consumer/StylistDetail"));
const ServicePage = lazy(() => import("../pages/consumer/ServicePage"));
const ConsumerProfile = lazy(() => import("../pages/consumer/Profile"));
const ConsumerMessages = lazy(() => import("../pages/consumer/Messages"));
const ConsumerNotifications = lazy(() => import("../pages/consumer/Notifications"));
const Favorites = lazy(() => import("../pages/consumer/Favorites"));
const ConsumerWaitlist = lazy(() => import("../pages/consumer/Waitlist"));
const Settings = lazy(() => import("../pages/consumer/Settings"));

const ServiceDetailPage = lazy(() => import("../pages/consumer/ServiceDetailPage"));
const SearchResultsPage = lazy(() => import("../pages/consumer/SearchResultsPage"));
const BrowseStylists = lazy(() => import("../pages/consumer/BrowseStylists"));
const QueueScreen = lazy(() => import("../features/consumer/components/QueueScreen"));
const PaymentCallback = lazy(() => import("../pages/consumer/PaymentCallback"));
import ScrollToTop from "../pages/consumer/ScrollToTop";
const PaymentHistory = lazy(() => import("../pages/consumer/PaymentHistory"));
const StylistDashboard = lazy(() => import("../pages/stylist/Dashboard"));
const StylistServices = lazy(() => import("../pages/stylist/Services"));
const StylistPortfolio = lazy(() => import("../pages/stylist/Portfolio"));

const StylistProfile = lazy(() => import("../pages/stylist/Profile"));
const StylistCalendar = lazy(() => import("../pages/stylist/Calendar"));
const StylistBookings = lazy(() => import("../pages/stylist/Bookings"));
const StylistClients = lazy(() => import("../pages/stylist/Clients"));
const StylistEarnings = lazy(() => import("../pages/stylist/Earnings"));
const StylistAnalytics = lazy(() => import("../pages/stylist/Analytics"));
const StylistAvailability = lazy(() => import("../pages/stylist/Availability"));
const StylistMessages = lazy(() => import("../pages/stylist/Messages"));
const StylistSettings = lazy(() => import("../pages/stylist/Settings"));
const StylistOnboarding = lazy(() => import("../pages/stylist/Onboarding"));
const StylistProducts = lazy(() => import("../pages/stylist/Products"));
const StylistPackages = lazy(() => import("../pages/stylist/Packages"));
const StylistMemberships = lazy(() => import("../pages/stylist/Memberships"));
const StylistMarketing = lazy(() => import("../pages/stylist/Marketing"));
const StylistPOS = lazy(() => import("../pages/stylist/POS"));
const StylistWaitlist = lazy(() => import("../pages/stylist/Waitlist"));
const StylistReviews = lazy(() => import("../pages/stylist/Reviews"));
const StylistConsultationForms = lazy(() => import("../pages/stylist/ConsultationForms"));
const StylistQueue = lazy(() => import("../pages/stylist/QueueManagement"));
const StylistArticles = lazy(() => import("../pages/stylist/Articles"));
const StylistLiveStudio = lazy(() => import("../pages/stylist/LiveStudio"));
const ConsumerLiveStream = lazy(() => import("../pages/consumer/LiveStream"));

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: "client" | "stylist";
}> = ({ children, allowedRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const currentPath = window.location.pathname.replace("/app/", "");
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4]"><div className="text-center text-[#7A7168]">Loading…</div></div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === "stylist" ? "/stylist/dashboard" : "/app"} replace />;
  }
  return <>{children}</>;
};

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4]">
        <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

function BeautyRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/app/blog/beauty${slug ? `/${slug}` : ""}`} replace />;
}

function AppRoutes() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={
        <>
          <SEOHead
            title="AI Hairstyle Generator"
            description="Upload your photo and try on 150+ hairstyles virtually using AI technology. Get face shape analysis, before/after comparison, and personalized recommendations."
            locale={locale}
          />
          <Home />
        </>
      } />
      <Route path="/login" element={
        <>
          <SEOHead title="Sign In" description="Sign in to Hairstyle Studio AI to access your saved looks and hairstyle history." locale={locale} />
          <LoginPage />
        </>
      } />
      <Route path="/signup" element={
        <>
          <SEOHead title="Sign Up" description="Create your Hairstyle Studio AI account and get 5 free credits to try virtual hairstyles." locale={locale} />
          <SignupPage />
        </>
      } />
      <Route path="/stylist/signup" element={<StylistSignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="/app" element={
        <ProtectedRoute allowedRole="client">
          <ConsumerLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ConsumerHome />} />
        <Route path="hairstyle-studio" element={<HairstyleStudioPage />} />
        <Route path="trending" element={<TrendingFeed />} />
        <Route path="vibe-match" element={
          <>
            <SEOHead
              title="Vibe Match – Coming Soon"
              description="Vibe Match is coming soon! Try on hairstyles virtually and find your perfect look."
              locale={locale}
            />
            <AiVibeMatchPage />
          </>
        } />
        <Route path="ai-vibe-match" element={
          <>
            <SEOHead
              title="AI Vibe Match – Coming Soon"
              description="AI Vibe Match is coming soon! Get personalized hairstyle recommendations based on your unique face shape."
              locale={locale}
            />
            <AiVibeMatchPage />
          </>
        } />
        <Route path="rewards" element={<Rewards />} />
        <Route path="queue" element={<QueueScreen />} />
        <Route path="messages" element={<ConsumerMessages />} />
        <Route path="notifications" element={<ConsumerNotifications />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="profile" element={<ConsumerProfile />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="waitlist" element={<ConsumerWaitlist />} />
        <Route path="settings" element={<Settings />} />
        <Route path="stylist/:id" element={<StylistDetail />} />
        <Route path="stylist/:stylistId/service/:serviceId" element={<ServiceDetailPage />} />
        <Route path="browse" element={<BrowseStylists />} />
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="blog/beauty" element={<BeautyTipsPage />} />
        <Route path="blog/beauty/:slug" element={<BeautyArticle />} />
        <Route path="live/:sessionId" element={<ConsumerLiveStream />} />
        <Route path=":service" element={<ServicePage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="/payment/callback" element={<PaymentCallback />} />

      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/beauty" element={<BeautyRedirect />} />
      <Route path="/blog/beauty/:slug" element={<BeautyRedirect />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/press-kit" element={<PressKit />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/report" element={<ReportProblem />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/refunds" element={<RefundPolicy />} />

      <Route path="/stylist/onboarding" element={
        <ProtectedRoute allowedRole="stylist">
          <StylistOnboarding />
        </ProtectedRoute>
      } />

      <Route path="/stylist" element={
        <ProtectedRoute allowedRole="stylist">
          <StylistLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/stylist/dashboard" replace />} />
        <Route path="dashboard" element={<StylistDashboard />} />
        <Route path="services" element={<StylistServices />} />
        <Route path="portfolio" element={<StylistPortfolio />} />
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
        <Route path="products" element={<StylistProducts />} />
        <Route path="packages" element={<StylistPackages />} />
        <Route path="memberships" element={<StylistMemberships />} />
        <Route path="marketing" element={<StylistMarketing />} />
        <Route path="pos" element={<StylistPOS />} />
        <Route path="waitlist" element={<StylistWaitlist />} />
        <Route path="queue" element={<StylistQueue />} />
        <Route path="reviews" element={<StylistReviews />} />
        <Route path="consultation-forms" element={<StylistConsultationForms />} />
        <Route path="articles" element={<StylistArticles />} />
        <Route path="live" element={<StylistLiveStudio />} />
        <Route path="*" element={<Navigate to="/stylist/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <ErrorBoundary>
        <RouteSuspense>
          <AppRoutes />
        </RouteSuspense>
        </ErrorBoundary>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
