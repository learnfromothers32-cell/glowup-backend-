import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ConsumerNavbar from "./ConsumerNavbar";
import ConsumerFooter from "./ConsumerFooter";
import { fadeSlideUp, pageTransition, useReducedMotion } from "../../../utils/animations";

export default function ConsumerLayout() {
  const location = useLocation();
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark flex flex-col">
      <ConsumerNavbar />
      <main className="flex-1 pt-16">
        <motion.div
          key={reduced ? undefined : location.pathname}
          initial={reduced ? false : "hidden"}
          animate="visible"
          variants={fadeSlideUp}
          transition={pageTransition}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          <Outlet />
        </motion.div>
      </main>
      <ConsumerFooter />
    </div>
  );
}
