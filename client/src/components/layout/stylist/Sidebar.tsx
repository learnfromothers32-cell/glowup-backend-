import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, BookOpen, Users, Scissors,
  Wallet, Image, Radio, Settings, MessageSquare, BarChart3,
  Clock, User, LogOut, Sparkles, Package, Crown, Percent,
  ShoppingCart, Timer, FileText, Star, Box, LayoutGrid,
} from "lucide-react";
import { useAuth } from "../../../context/authUtils";
import { cn } from "../../../utils/cn";

type NavItem = { path: string; label: string; icon: any; badge?: string; badgeColor?: string };
type NavSection = { title: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { path: "/stylist/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/stylist/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/stylist/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Schedule",
    items: [
      { path: "/stylist/calendar", label: "Calendar", icon: CalendarDays },
      { path: "/stylist/availability", label: "Availability", icon: Clock },
      { path: "/stylist/bookings", label: "Bookings", icon: BookOpen, badge: "12", badgeColor: "bg-brand-500" },
      { path: "/stylist/waitlist", label: "Waitlist", icon: Timer },
      { path: "/stylist/queue", label: "Queue", icon: Users },
    ],
  },
  {
    title: "Clients",
    items: [
      { path: "/stylist/clients", label: "Clients", icon: Users },
      { path: "/stylist/messages", label: "Messages", icon: MessageSquare },
      { path: "/stylist/consultation-forms", label: "Consultation", icon: FileText },
    ],
  },
  {
    title: "Services",
    items: [
      { path: "/stylist/services", label: "Services", icon: Scissors },
      { path: "/stylist/products", label: "Products", icon: Box },
      { path: "/stylist/portfolio", label: "Portfolio", icon: Image },
      { path: "/stylist/packages", label: "Packages", icon: Package },
      { path: "/stylist/memberships", label: "Memberships", icon: Crown },
    ],
  },
  {
    title: "Revenue",
    items: [
      { path: "/stylist/earnings", label: "Earnings", icon: Wallet },
      { path: "/stylist/pos", label: "POS", icon: ShoppingCart },
    ],
  },
  {
    title: "Marketing",
    items: [
      { path: "/stylist/marketing", label: "Promos & Gifts", icon: Percent },
      { path: "/stylist/articles", label: "Articles", icon: FileText },
    ],
  },
  {
    title: "Growth",
    items: [
      { path: "/stylist/live", label: "Go Live", icon: Radio, badge: "LIVE", badgeColor: "bg-error text-white" },
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
  collapsed?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ collapsed, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initials = user?.name
    ? user.name.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  const isActive = (path: string) => {
    if (path === "/stylist/dashboard") return pathname === path;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  return (
    <aside className={cn(
      "flex flex-col bg-white dark:bg-surface-dark-secondary border-r border-gray-100 dark:border-gray-700/50 h-full transition-all duration-300",
      collapsed ? "w-16" : "w-64 max-w-[85vw]",
    )}>
      {/* Brand */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-100 dark:border-gray-700/50 shrink-0",
        collapsed ? "justify-center px-0" : "gap-2.5 px-5",
      )}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">GlowUp</h2>
            <p className="text-[10px] text-text-muted leading-tight">Stylist Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon, badge, badgeColor }) => {
                const active = isActive(path);
                return (
                  <button
                    key={path}
                    onClick={() => { navigate(path); onClose?.(); }}
                    className={cn(
                      "relative flex items-center w-full rounded-xl text-sm font-medium transition-all duration-150",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                      active
                        ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:hover:text-text-dark-primary dark:hover:bg-surface-dark-tertiary",
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={collapsed ? 20 : 18} strokeWidth={active ? 2.2 : 1.5} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{label}</span>
                        {badge && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                            badgeColor || "bg-gray-100 text-gray-600",
                          )}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                    {active && (
                      <span className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-brand-500",
                        collapsed ? "left-0" : "left-0",
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-100 dark:border-gray-700/50 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">{user?.name || "Stylist"}</p>
              <p className="text-xs text-text-muted truncate">{user?.email || ""}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full rounded-xl text-sm text-error hover:bg-error/10 transition-all",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={collapsed ? 20 : 16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
