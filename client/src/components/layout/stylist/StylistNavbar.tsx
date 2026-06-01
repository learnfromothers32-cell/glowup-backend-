import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  MessageSquare,
  CalendarDays,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/authUtils";

const T = {
  navy: "#0B1A33",
  canvas: "#FFFFFF",
  inkSoft: "#5A6E8A",
  line: "#E9EEF5",
};

interface StylistNavbarProps {
  onMenuToggle?: () => void;
}

export default function StylistNavbar({ onMenuToggle }: StylistNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{ background: "rgba(255,255,255,0.92)", borderColor: T.line }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} color={T.navy} />
          </button>

          <button
            onClick={() => navigate("/stylist/dashboard")}
            className="text-lg font-bold tracking-tight"
            style={{ color: T.navy }}
          >
            GlowUp Studio
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/stylist/bookings")}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <CalendarDays size={16} />
            Bookings
          </button>

          <button
            onClick={() => navigate("/stylist/messages")}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare size={18} />
            <span className="absolute top-1 right-1 text-[10px] bg-black text-white rounded-full px-1 leading-tight">
              3
            </span>
          </button>

          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 text-[10px] bg-red-500 text-white rounded-full px-1 leading-tight">
              2
            </span>
          </button>

          {/* Profile dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-[10px] font-bold">
                {initials}
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-gray-900/8 border border-gray-200/80 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "Stylist"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email || ""}</p>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/stylist/profile"); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate("/stylist/settings"); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
