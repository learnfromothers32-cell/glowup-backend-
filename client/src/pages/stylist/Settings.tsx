import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Bell, Shield, Palette, Globe, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

export default function StylistSettings() {
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
        Settings
      </h1>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "New booking alerts", key: "booking" },
            { label: "Cancellation alerts", key: "cancel" },
            { label: "Review notifications", key: "review" },
            { label: "Marketing emails", key: "marketing" },
          ].map(({ label, key }) => (
            <label key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700">{label}</span>
              <input type="checkbox" defaultChecked className="accent-[#0B1A33] rounded" />
            </label>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={18} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Privacy</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: "Show profile in search", key: "searchable" },
            { label: "Show email to clients", key: "showEmail" },
            { label: "Show phone to clients", key: "showPhone" },
          ].map(({ label, key }) => (
            <label key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700">{label}</span>
              <input type="checkbox" defaultChecked className="accent-[#0B1A33] rounded" />
            </label>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: T.shadowCard }}>
        <div className="flex items-center gap-3 mb-4">
          <Palette size={18} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Appearance</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              theme === "light"
                ? "border-gray-900 bg-gray-50 text-gray-900"
                : "border-gray-100 text-gray-500 hover:border-gray-200"
            }`}
          >
            <Sun size={20} />
            <span className="text-xs font-medium">Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              theme === "dark"
                ? "border-gray-900 bg-gray-50 text-gray-900"
                : "border-gray-100 text-gray-500 hover:border-gray-200"
            }`}
          >
            <Moon size={20} />
            <span className="text-xs font-medium">Dark</span>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              theme === "system"
                ? "border-gray-900 bg-gray-50 text-gray-900"
                : "border-gray-100 text-gray-500 hover:border-gray-200"
            }`}
          >
            <Monitor size={20} />
            <span className="text-xs font-medium">System</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: T.navy }}
      >
        <Save size={16} />
        {saved ? "Saved!" : "Save Settings"}
      </motion.button>
    </div>
  );
}
