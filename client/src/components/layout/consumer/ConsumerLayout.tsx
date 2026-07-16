import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ConsumerNavbar from "./ConsumerNavbar";
import ConsumerFooter from "./ConsumerFooter";
import { fadeSlideUp, pageTransition, useReducedMotion } from "../../../utils/animations";

const CONSUMER_SINGLE_SEGMENT_ROUTES = new Set([
  'trending', 'hairstyle-studio', 'vibe-match', 'ai-vibe-match',
  'rewards', 'queue', 'live', 'messages', 'notifications', 'payment-history',
  'my-bookings', 'profile', 'favorites', 'waitlist', 'settings',
  'browse', 'search',
]);

export default function ConsumerLayout() {
  const location = useLocation();
  const reduced = useReducedMotion();

  const segments = location.pathname.replace(/^\/|\/$/g, '').split('/');
  const isServicePage = segments[0] === 'app' && segments.length === 2 && !CONSUMER_SINGLE_SEGMENT_ROUTES.has(segments[1]);
  const isLiveRoom = segments[0] === 'app' && segments[1] === 'live' && segments.length === 3;

  if (isLiveRoom) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark flex flex-col">
      {!isServicePage && <ConsumerNavbar />}
      <main className={`flex-1 ${isServicePage ? "pb-6" : "pt-7 pb-6"}`}>
        <motion.div
          key={reduced ? undefined : location.pathname}
          initial={reduced ? false : "hidden"}
          animate="visible"
          variants={fadeSlideUp}
          transition={pageTransition}
          className="page-container"
        >
          <Outlet />
        </motion.div>
      </main>
      <ConsumerFooter />
    </div>
  );
}
