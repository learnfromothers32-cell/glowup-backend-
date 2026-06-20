import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bell, Lock, Shield, Trash2,
  ChevronRight, Check, AlertTriangle, Loader2,
  Eye, EyeOff, Mail, Smartphone, Megaphone,
  Globe, Key, LogOut, HelpCircle, Sun, Moon, Monitor,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/authUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  promotionalEmails: boolean;
  privateProfile: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  pushNotifications: true,
  promotionalEmails: false,
  privateProfile: false,
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: typeof Bell;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        checked ? "bg-gray-900 text-white dark:bg-indigo-500 dark:text-white" : "bg-gray-100 text-gray-400 dark:bg-surface-dark-tertiary dark:text-text-dark-muted"
      } transition-colors duration-200`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0
          ${checked ? "bg-gray-900 dark:bg-indigo-500" : "bg-gray-200 dark:bg-gray-600"}
        `}
      >
        <span className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}
        `} />
      </button>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  danger,
}: {
  icon: typeof Bell;
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      danger ? "border-red-200" : "border-gray-100"
    }`}>
      <div className={`px-5 py-4 ${danger ? "border-b border-red-100 dark:border-red-900/30 bg-red-50/30" : "border-b border-gray-100"}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            danger ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-500 dark:bg-surface-dark-tertiary dark:text-text-dark-muted"
          }`}>
            <Icon size={15} />
          </div>
          <div>
            <h2 className={`text-sm font-semibold ${danger ? "text-red-700 dark:text-red-400" : "text-gray-900"}`}>{title}</h2>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 py-2 divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

// ─── Navigation Row ───────────────────────────────────────────────────────────
function NavRow({
  icon: Icon,
  label,
  description,
  to,
  onClick,
  badge,
}: {
  icon: typeof Bell;
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
  badge?: string;
}) {
  const content = (
    <div className="flex items-center gap-3.5 py-3.5 group cursor-pointer">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-gray-200 transition-colors dark:bg-surface-dark-tertiary dark:text-text-dark-muted dark:group-hover:bg-surface-dark">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors dark:text-text-dark-primary">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 dark:text-text-dark-muted">{description}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-surface-dark-tertiary dark:text-dark-muted">
          {badge}
        </span>
      )}
      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors dark:text-text-dark-muted" />
    </div>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-left">{content}</button>;
  return content;
}

// ─── Password Form ────────────────────────────────────────────────────────────
function PasswordForm() {
  const [form, setForm] = useState({ current: "", new: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.new !== form.confirm) {
      setError("New passwords do not match");
      return;
    }
    if (form.new.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSuccess("Password updated successfully");
    setForm({ current: "", new: "", confirm: "" });
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current password */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Current password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={form.current}
            onChange={e => setForm({ ...form, current: e.target.value })}
            className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all dark:bg-surface-dark-secondary dark:border-gray-600 dark:text-text-dark-primary dark:placeholder:text-text-dark-muted dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-text-dark-muted dark:hover:text-text-dark-secondary"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          New password
        </label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={form.new}
            onChange={e => setForm({ ...form, new: e.target.value })}
            className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all dark:bg-surface-dark-secondary dark:border-gray-600 dark:text-text-dark-primary dark:placeholder:text-text-dark-muted dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-text-dark-muted dark:hover:text-text-dark-secondary"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          value={form.confirm}
          onChange={e => setForm({ ...form, confirm: e.target.value })}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all dark:bg-surface-dark-secondary dark:border-gray-600 dark:text-text-dark-primary dark:placeholder:text-text-dark-muted dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
          required
        />
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium"
          >
            <AlertTriangle size={14} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium"
          >
            <Check size={14} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={saving}
        className={`
          flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
          transition-all duration-200 active:scale-[0.98]
          ${saving
            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700"
            : "bg-gray-900 text-white hover:bg-gray-800 shadow-md dark:bg-indigo-600 dark:hover:bg-indigo-500"
          }
        `}
      >
        {saving ? (
          <><Loader2 size={14} className="animate-spin" />Updating…</>
        ) : (
          <><Key size={14} />Update Password</>
        )}
      </button>
    </form>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === "DELETE";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl dark:bg-surface-dark-secondary"
      >
        <div className="h-1 bg-gradient-to-r from-red-500 to-red-300" />
        <div className="p-5">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Delete your account?</h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            This will permanently delete your account, bookings, reviews, and rewards. This action cannot be undone.
          </p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Type <span className="text-red-500">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all dark:bg-surface-dark-secondary dark:border-gray-600 dark:text-text-dark-primary dark:placeholder:text-text-dark-muted dark:focus:border-red-400 dark:focus:ring-red-500/30"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canDelete}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                canDelete
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                  : "bg-red-100 text-red-300 cursor-not-allowed"
              }`}
            >
              Delete Account
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isLoading: authLoading, logout: authLogout } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    const stored = localStorage.getItem("glowup_user_settings");
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, [navigate, isAuthenticated, authLoading]);

  const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("glowup_user_settings", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDeleteAccount = () => {
    localStorage.clear();
    authLogout();
    navigate("/");
  };

  const handleLogout = () => {
    authLogout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {/* ── Header ── */}
        <div className="pt-14 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white dark:bg-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
              <p className="text-sm text-gray-400 truncate">{user?.email || "user@example.com"}</p>
            </div>
            <Link
              to="/app/profile"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Edit Profile
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── Notifications ── */}
        <Section icon={Bell} title="Notifications" description="Control how you receive updates">
          <Toggle
            icon={Mail}
            label="Email notifications"
            description="Booking confirmations, reminders & updates"
            checked={settings.emailNotifications}
            onChange={v => updateSetting("emailNotifications", v)}
          />
          <Toggle
            icon={Smartphone}
            label="Push notifications"
            description="Live updates and instant alerts"
            checked={settings.pushNotifications}
            onChange={v => updateSetting("pushNotifications", v)}
          />
          <Toggle
            icon={Megaphone}
            label="Promotional emails"
            description="Deals, trends & stylist features"
            checked={settings.promotionalEmails}
            onChange={v => updateSetting("promotionalEmails", v)}
          />
        </Section>

        {/* ── Privacy ── */}
        <Section icon={Shield} title="Privacy" description="Control your visibility">
          <Toggle
            icon={Globe}
            label="Private profile"
            description="Hide your profile from search engines"
            checked={settings.privateProfile}
            onChange={v => updateSetting("privateProfile", v)}
          />
        </Section>

        {/* ── Appearance ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Sun size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize your theme</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === "light"
                    ? "border-gray-900 bg-gray-50 text-gray-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Sun size={20} />
                <span className="text-xs font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === "dark"
                    ? "border-gray-900 bg-gray-50 text-gray-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Moon size={20} />
                <span className="text-xs font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === "system"
                    ? "border-gray-900 bg-gray-50 text-gray-900 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "border-gray-100 text-gray-500 hover:border-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <Monitor size={20} />
                <span className="text-xs font-medium">System</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Lock size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Security</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage your password</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <PasswordForm />
          </div>
        </div>

        {/* ── Quick Links ── */}
        <Section icon={HelpCircle} title="Support">
          <NavRow icon={HelpCircle} label="Help Center" description="FAQs and guides" to="/help" />
          <NavRow icon={Mail} label="Contact Us" description="Get in touch with support" to="/contact" />
        </Section>

        {/* ── Sign Out ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 w-full py-3.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">
                Sign out
              </span>
            </button>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="mt-2">
          <Section icon={Trash2} title="Danger Zone" description="Irreversible actions" danger>
            <div className="py-3.5">
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Permanently delete your account and all associated data including bookings, reviews, and rewards.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 size={13} />
                Delete Account
              </button>
            </div>
          </Section>
        </div>

        {/* ── Footer ── */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-gray-300">GlowUp v1.0.0</p>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal
            key="delete"
            onConfirm={handleDeleteAccount}
            onClose={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}