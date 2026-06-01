import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User, Mail, MapPin, Phone, Loader2, AlertCircle, Save, RefreshCcw, BadgeCheck, Star, Camera } from "lucide-react";
import { getMyStylistProfile, updateMyProfile } from "../../api/stylists";
import { getLocationString } from "@/utils/location";

export default function Profile() {
  const [stylist, setStylist] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await getMyStylistProfile();
      setStylist(p);
      setName(p.name || "");
      setBio(p.bio || "");
      setCategory(p.category || "");
      setLocation(getLocationString(p.location));
      setPhone((p as any).phone || "");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateMyProfile({
        name,
        bio,
        category,
        location: { area: location },
        phone
      });
      setStylist(updated);
      setSuccessMsg("Profile saved successfully");
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your public stylist profile</p>
      </div>

      {/* Current Profile Card */}
      {stylist && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {stylist.name?.[0] || "?"}
              </div>
              <button className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                <Camera size={10} className="text-gray-600" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold truncate">{stylist.name}</h2>
                {stylist.isVerified && <BadgeCheck size={14} className="text-blue-300" />}
              </div>
              <p className="text-white/70 text-sm">{stylist.category || "Stylist"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-white/60">
                  <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
                  {stylist.rating?.toFixed(1) || "—"} ({stylist.reviewCount || 0})
                </span>
                <span className="text-xs text-white/60">{getLocationString(stylist.location) || "No location set"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <Save size={14} className="text-emerald-500 flex-shrink-0" />
          <p className="text-xs font-medium text-emerald-700">{successMsg}</p>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-gray-900">Edit Profile</h3>
          <button
            onClick={fetchProfile}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
            title="Reset"
          >
            <RefreshCcw size={13} className="text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Display Name</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <User size={14} className="text-gray-300 flex-shrink-0" />
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-300" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <User size={14} className="text-gray-300 flex-shrink-0" />
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-300" placeholder="e.g. Braiding, Haircut" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:border-indigo-200 focus:bg-white text-sm text-gray-900 outline-none resize-none transition-all placeholder-gray-300"
            placeholder="Tell clients about yourself..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Location</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <MapPin size={14} className="text-gray-300 flex-shrink-0" />
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-300" placeholder="e.g. Accra, Ghana" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</label>
            <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus-within:border-indigo-200 focus-within:bg-white transition-all">
              <Phone size={14} className="text-gray-300 flex-shrink-0" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-300" placeholder="+233 XX XXX XXXX" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={15} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
