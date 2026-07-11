import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/authUtils";
import { useGamification } from "../../hooks/useGamification";
import { updateProfile as updateProfileApi, getMe, uploadAvatar } from "../../api/auth";
import api from "../../api/axios";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
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
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.bg}`}>
          <Icon size={16} className={color.icon} />
        </div>
        <span className={`text-2xl font-bold tabular-nums ${color.text}`}>{value}</span>
      </div>
      <p className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof Mail; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-gray-100 dark:border-gray-700/20 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-500 dark:text-text-dark-muted shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-text-dark-muted mb-0.5">{label}</p>
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary truncate">{value || "Not set"}</p>
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
        className="relative w-full max-w-md bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/40 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary dark:text-text-dark-primary">Edit Profile</h2>
            <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Update your personal information</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs">
              {error}
            </div>
          )}

          {fields.map(({ key, label, type, icon: Icon }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-text-secondary dark:text-text-dark-secondary uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted pointer-events-none" />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="input-field pl-10"
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
                className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success-dark dark:text-success text-xs font-medium"
              >
                <Check size={14} />Profile updated successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            size="md"
            className="w-full"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" />Saving…</>
            ) : saved ? (
              <><Check size={16} />Saved!</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ConsumerProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [profileUser, setProfileUser] = useState(user);
  const [localUser, setLocalUser] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
  }));
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLimitMB, setUploadLimitMB] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { points, badges, checkInStreak } = useGamification();

  useEffect(() => {
    api.get<{ data: { maxUploadSizeMB: number } }>('/config/public')
      .then(({ data }) => {
        if (data?.data?.maxUploadSizeMB) setUploadLimitMB(data.data.maxUploadSizeMB);
      })
      .catch(() => {});
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > uploadLimitMB * 1024 * 1024) {
      setUploadError(`File exceeds ${uploadLimitMB}MB limit`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadAvatar(formData);
      setProfileUser((prev) => prev ? { ...prev, avatar: res.data.avatar } : null);
      updateUser(res.data.user);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || "Failed to upload image";
      setUploadError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    getMe().then((res) => {
      setProfileUser(res.data.user);
      setLocalUser({
        name: res.data.user.name || "",
        email: res.data.user.email || "",
        phone: (res.data.user as any).phone || "",
        location: (res.data.user as any).location || "",
      });
    }).catch(() => {
      // fall back to auth context user
    });
  }, []);

  const displayName = localUser.name || profileUser?.name || "Beauty Lover";
  const displayEmail = localUser.email || profileUser?.email || "user@example.com";
  const memberSince = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "May 2026";

  const handleSave = useCallback(async (data: { name: string; email: string; phone: string; location: string }) => {
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
    <div className="min-h-screen bg-warm-50 dark:bg-surface-dark">
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="pt-14 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors mb-5"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <Card className="overflow-hidden mb-4">
          <div className="p-6 pb-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar
                  src={profileUser?.avatar}
                  name={displayName}
                  size="xl"
                  ring
                  className="cursor-pointer"
                  onClick={() => profileUser?.avatar && setShowImagePreview(true)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:shadow-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-bold text-text-primary dark:text-text-dark-primary tracking-tight mb-0.5">
                  {displayName}
                </h1>
                <p className="text-sm text-text-muted dark:text-text-dark-muted mb-3">
                  Member since {memberSince}
                </p>
                {uploadError && (
                  <p className="text-[11px] text-error mb-2">{uploadError}</p>
                )}
                <Button
                  onClick={() => setShowEdit(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 size={12} />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          <div className="divider mx-5" />

          <div className="px-5 py-2">
            <InfoRow icon={Mail} label="Email" value={displayEmail} />
            <InfoRow icon={Phone} label="Phone" value={localUser.phone || (profileUser as any)?.phone || "Not set"} />
            <InfoRow icon={MapPin} label="Location" value={localUser.location || (profileUser as any)?.location || "Not set"} />
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Points" value={points} icon={Trophy} color={{ bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-500", text: "text-amber-700 dark:text-amber-400" }} />
          <StatCard label="Badges" value={badges.length} icon={Award} color={{ bg: "bg-blue-50 dark:bg-blue-950/30", icon: "text-blue-500", text: "text-blue-700 dark:text-blue-400" }} />
          <StatCard label="Streak" value={`${checkInStreak}d`} icon={Flame} color={{ bg: "bg-orange-50 dark:bg-orange-950/30", icon: "text-orange-500", text: "text-orange-700 dark:text-orange-400" }} />
        </div>

        {badges.length > 0 && (
          <Card className="overflow-hidden mb-4 !p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Award size={15} className="text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">Recent Badges</h2>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">{badges.length} earned</p>
                </div>
              </div>
              <Link
                to="/app/rewards"
                className="text-xs font-medium text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary transition-colors flex items-center gap-1"
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
                  <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary border border-gray-100 dark:border-gray-700/40 flex items-center justify-center text-2xl">
                    {badge.icon}
                  </div>
                  <p className="text-[10px] font-medium text-text-secondary dark:text-text-dark-secondary text-center truncate w-full">
                    {badge.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        <Card className="overflow-hidden mb-4 !p-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <h2 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">Quick Actions</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/20">
            {[
              { label: "My Bookings", description: "View upcoming and past appointments", to: "/app/my-bookings", icon: Calendar },
              { label: "Favorites", description: "Stylists you've saved", to: "/app/favorites", icon: Heart },
              { label: "Rewards", description: "Points, badges & milestones", to: "/app/rewards", icon: Trophy },
              { label: "Settings", description: "Account, notifications & privacy", to: "/app/settings", icon: Settings },
            ].map(({ label, description, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-500 dark:text-text-dark-muted shrink-0 group-hover:bg-gray-200 dark:group-hover:bg-surface-dark transition-colors">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{label}</p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">{description}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden !p-0">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-500 dark:text-text-dark-muted">
                <Shield size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">Account</h2>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Security & data</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/20">
            <Link
              to="/app/settings"
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-500 dark:text-text-dark-muted shrink-0">
                <Shield size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">Privacy & Security</p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">Password, privacy settings, delete account</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            </Link>
            <Link
              to="/help"
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-surface-dark-tertiary flex items-center justify-center text-gray-500 dark:text-text-dark-muted shrink-0">
                <ExternalLink size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">Help & Support</p>
                <p className="text-xs text-text-muted dark:text-text-dark-muted mt-0.5">FAQs, contact support, report a problem</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
            </Link>
          </div>
        </Card>

        <div className="text-center mt-8">
          <p className="text-[11px] text-text-muted dark:text-text-dark-muted">GlowUp · Member since {memberSince}</p>
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

      <AnimatePresence>
        {showImagePreview && profileUser?.avatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowImagePreview(false)}
          >
            <motion.img
              key="preview"
              src={profileUser.avatar}
              alt=""
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
