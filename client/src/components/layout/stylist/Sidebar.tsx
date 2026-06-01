import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  Scissors,
  Wallet,
  Image,
  Radio,
  Settings,
  MessageSquare,
  BarChart3,
  Clock,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../../context/authUtils";

type NavItem = {
  path: string;
  label: string;
  icon: any;
  highlight?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { path: "/stylist/dashboard", label: "Overview", icon: LayoutDashboard },
      { path: "/stylist/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Manage",
    items: [
      { path: "/stylist/calendar", label: "Calendar", icon: CalendarDays },
      { path: "/stylist/availability", label: "Availability", icon: Clock },
      { path: "/stylist/bookings", label: "Bookings", icon: BookOpen },
      { path: "/stylist/clients", label: "Clients", icon: Users },
      { path: "/stylist/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    title: "Business",
    items: [
      { path: "/stylist/services", label: "Services", icon: Scissors },
      { path: "/stylist/portfolio", label: "Portfolio", icon: Image },
      { path: "/stylist/earnings", label: "Earnings", icon: Wallet },
    ],
  },
  {
    title: "Growth",
    items: [
      { path: "/stylist/live", label: "Go Live", icon: Radio, highlight: true },
    ],
  },
  {
    title: "Account",
    items: [
      { path: "/stylist/profile", label: "Profile", icon: User },
      { path: "/stylist/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-100 h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0B1A33] leading-tight">GlowUp</h2>
          <p className="text-[10px] text-gray-400 leading-tight">Stylist Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon, highlight }) => {
                const active = pathname === path || (path !== "/stylist/dashboard" && pathname.startsWith(path));

                return (
                  <button
                    key={path}
                    onClick={() => handleNavClick(path)}
                    className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.5} />
                    <span>{label}</span>

                    {highlight && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                        LIVE
                      </span>
                    )}

                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gray-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="shrink-0 border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "Stylist"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all mt-1"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
