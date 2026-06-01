import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/authUtils";
import { useGamification } from "../../hooks/useGamification";
import { updateProfile as updateProfileApi } from "../../api/auth";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Heart,
  Trophy, X, Camera, Check, Loader2, ChevronRight,
  Award, Flame, Settings, Edit3,
  Shield, ExternalLink,
} from "lucide-react";

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: string | number;
  icon: typeof Trophy;
  color: { bg: string; icon: string; text: string };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.bg}`}>
          <Icon size={16} className={color.icon} />
        </div>
        <span className={`text-2xl font-bold tabular-nums ${color.text}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof Mail; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || "Not set"}</p>
      </div>
    </div>
  );
}

function EditModal({
  data, onClose, onSave,
}: {
  data: { name: string; email: string; phone: string; location: string };
  onClose: () => void;
  onSave: (d: typeof data) => Promise<void>;
}) {
  const [form, setForm] = useState(data);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; type: string; icon: typeof Mail }[] = [
    { key: "name", label: "Full Name", type: "text", icon: Edit3 },
    { key: "email", label: "Email Address", type: "email", icon: Mail },
    { key: "phone", label: "Phone Number", type: "tel", icon: Phone },
    { key: "location", label: "Location", type: "text", icon: MapPin },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update your personal information</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {fields.map(({ key, label, type, icon: Icon }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                  required={key === "name" || key === "email"}
                />
              </div>
            </div>
          ))}

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium"
              >
                <Check size={14} />Profile updated successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={saving}
            className={`
              w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold
              transition-all duration-200 active:scale-[0.98]
              ${saving
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
              }
            `}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" />Saving…</>
            ) : saved ? (
              <><Check size={16} />Saved!</>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ConsumerProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [localUser, setLocalUser] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
  }));
  const { points, badges, checkInStreak } = useGamification();

  const displayName = localUser.name || user?.name || "Beauty Lover";
  const displayEmail = localUser.email || user?.email || "user@example.com";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "May 2026";

  const handleSave = useCallback(async (data: typeof localUser) => {
    const res = await updateProfileApi({
      name: data.name,
      phone: data.phone || undefined,
      location: data.location || undefined,
    });
    setLocalUser({
      name: res.data.user.name,
      email: res.data.user.email,
      phone: res.data.user.phone || "",
      location: res.data.user.location || "",
    });
  }, []);

  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="pt-14 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="p-6 pb-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:shadow-sm transition-all shadow-sm">
                  <Camera size={12} />
                </button>
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-0.5">
                  {displayName}
                </h1>
                <p className="text-sm text-gray-400 mb-3">
                  Member since {memberSince}
                </p>
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Edit3 size={12} />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          <div className="mx-5 h-px bg-gray-100" />

          <div className="px-5 py-2">
            <InfoRow icon={Mail} label="Email" value={displayEmail} />
            <InfoRow icon={Phone} label="Phone" value={localUser.phone || user?.phone || "Not set"} />
            <InfoRow icon={MapPin} label="Location" value={localUser.location || user?.location || "Not set"} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Points" value={points} icon={Trophy} color={{ bg: "bg-amber-50", icon: "text-amber-500", text: "text-amber-700" }} />
          <StatCard label="Badges" value={badges.length} icon={Award} color={{ bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-700" }} />
          <StatCard label="Streak" value={`${checkInStreak}d`} icon={Flame} color={{ bg: "bg-orange-50", icon: "text-orange-500", text: "text-orange-700" }} />
        </div>

        {badges.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award size={15} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Recent Badges</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{badges.length} earned</p>
                </div>
              </div>
              <Link
                to="/app/rewards"
                className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex gap-3 px-5 py-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {badges.slice(0, 5).map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="shrink-0 flex flex-col items-center gap-2 w-[72px]"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">
                    {badge.icon}
                  </div>
                  <p className="text-[10px] font-medium text-gray-600 text-center truncate w-full">
                    {badge.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: "My Bookings", description: "View upcoming and past appointments", to: "/app/my-bookings", icon: Calendar },
              { label: "Favorites", description: "Stylists you've saved", to: "/app/favorites", icon: Heart },
              { label: "Rewards", description: "Points, badges & milestones", to: "/app/rewards", icon: Trophy },
              { label: "Settings", description: "Account, notifications & privacy", to: "/app/settings", icon: Settings },
            ].map(({ label, description, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-gray-200 transition-colors">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Shield size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Account</h2>
                <p className="text-xs text-gray-400 mt-0.5">Security & data</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            <Link
              to="/app/settings"
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <Shield size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Privacy & Security</p>
                <p className="text-xs text-gray-400 mt-0.5">Password, privacy settings, delete account</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
            <a
              href="/help"
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <ExternalLink size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Help & Support</p>
                <p className="text-xs text-gray-400 mt-0.5">FAQs, contact support, report a problem</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-[11px] text-gray-300">GlowUp · Member since {memberSince}</p>
        </div>
      </div>

      <AnimatePresence>
        {showEdit && (
          <EditModal
            key="edit"
            data={{
              name: displayName,
              email: displayEmail,
              phone: localUser.phone || user?.phone || "",
              location: localUser.location || user?.location || "",
            }}
            onClose={() => setShowEdit(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
