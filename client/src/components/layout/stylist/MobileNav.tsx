import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Wallet,
  Radio,
  Menu,
} from "lucide-react";

const T = {
  navy: "#0B1A33",
  inkSoft: "#5A6E8A",
  canvas: "#FFFFFF",
  line: "#E9EEF5",
};

const navItems = [
  { path: "/stylist/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/stylist/bookings", label: "Bookings", icon: BookOpen },
  { path: "/stylist/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/stylist/earnings", label: "Earnings", icon: Wallet },
  { path: "/stylist/live", label: "Live", icon: Radio },
];

interface MobileNavProps {
  onOpenMenu?: () => void;
}

export default function MobileNav({ onOpenMenu }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden flex items-center justify-around py-2"
      style={{
        background: T.canvas,
        borderTop: `1px solid ${T.line}`,
        boxShadow: "0 -4px 20px rgba(15,31,61,0.06)",
      }}
    >
      {navItems.map(({ path, label, icon: Icon }) => {
        const active = location.pathname.startsWith(path);

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition-all"
            style={{ color: active ? T.navy : T.inkSoft }}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold"
        style={{ color: T.inkSoft }}
      >
        <Menu size={18} />
        <span>More</span>
      </button>
    </nav>
  );
}
