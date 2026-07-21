import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Wallet,
  Menu,
  MessageSquare,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/stylist/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/stylist/bookings", label: "Bookings", icon: BookOpen },
  { path: "/stylist/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/stylist/messages", label: "Messages", icon: MessageSquare },
  { path: "/stylist/clients", label: "Clients", icon: Users },
  { path: "/stylist/earnings", label: "Earnings", icon: Wallet },
];

interface MobileNavProps {
  onOpenMenu?: () => void;
}

export default function MobileNav({ onOpenMenu }: MobileNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden flex items-center justify-around py-1.5 bg-white/95 dark:bg-surface-dark-secondary/95 backdrop-blur-lg border-t border-gray-200/60 dark:border-gray-700/50 shadow-[0_-4px_20px_rgba(15,31,61,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      {navItems.map(({ path, label, icon: Icon }) => {
        const active = location.pathname.startsWith(path);

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] font-semibold transition-all min-h-[48px] rounded-lg ${
              active
                ? "text-stylist-600 dark:text-stylist-400"
                : "text-gray-400 dark:text-text-dark-muted hover:text-gray-600 dark:hover:text-text-dark-secondary"
            }`}
            aria-label={label}
            aria-current={active ? "page" : undefined}
          >
            {active && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-stylist-500" />}
            <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            <span>{label}</span>
          </button>
        );
      })}



      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] font-semibold min-h-[48px] rounded-lg text-gray-400 dark:text-text-dark-muted hover:text-gray-600 dark:hover:text-text-dark-secondary"
        aria-label="More menu"
      >
        <Menu size={18} />
        <span>More</span>
      </button>
    </nav>
  );
}
