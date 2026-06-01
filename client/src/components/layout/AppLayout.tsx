import { Outlet, useLocation } from "react-router-dom";
import LandingNavbar from "./LandingNavbar";
import ConsumerNavbar from "./consumer/ConsumerNavbar";
import StylistNavbar from "./stylist/StylistNavbar";

export default function AppLayout() {
  const { pathname } = useLocation();

  const isLanding = pathname === "/";
  const isStylist = pathname.startsWith("/stylist");
  const isConsumer = !isLanding && !isStylist;

  return (
    <>
      {/* NAVIGATION LAYER */}
      {isLanding && <LandingNavbar />}
      {isConsumer && <ConsumerNavbar />}
      {isStylist && <StylistNavbar />}

      {/* CONTENT LAYER */}
      <main className={isLanding ? "" : "pt-20"}>
        <Outlet />
      </main>
    </>
  );
}