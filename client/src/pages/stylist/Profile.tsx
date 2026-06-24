import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, MapPin, Phone, Loader2, AlertCircle, Save, RefreshCcw,
  BadgeCheck, Star, Camera, Scissors, Check, AtSign, Sparkles, Globe,
  X, Navigation,
} from "lucide-react";
import { getMyStylistProfile, updateMyProfile, uploadProfileImage } from "../../api/stylists";
import { useAuth } from "../../context/authUtils";
import { getMe } from "../../api/auth";
import { getLocationString } from "@/utils/location";
import StylistLocationPicker from "../../components/stylist/StylistLocationPicker";
import type { LocationValue } from "../../components/stylist/StylistLocationPicker";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const CATEGORIES = [
  "Braiding", "Haircut", "Coloring", "Styling", "Makeup",
  "Nails", "Skincare", "Barber", "Extensions", "Locs",
  "Relaxer", "Perm", "Blowout", "Updo", "Bridal",
];

const FIELD_LIMITS = {
  name: { max: 60 },
  bio: { max: 500 },
  category: { max: 40 },
  instagram: { max: 30 },
  twitter: { max: 30 },
  tiktok: { max: 30 },
  website: { max: 200 },
  phone: { max: 20 },
};

function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validatePhone(phone: string): boolean {
  if (!phone) return true;
  return /^[\d\s\+\-\(\)]{6,20}$/.test(phone);
}

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="h-8 w-32 skeleton-pulse" />
      <div className="h-4 w-48 skeleton-pulse" />
      <Card elevated padding="none" className="overflow-hidden">
        <div className="p-6 bg-gradient-to-br from-stylist-700 via-stylist-800 to-stylist-900">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-32 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
      <Card elevated padding="none" className="overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="h-5 w-24 skeleton-pulse" />
          <div className="h-10 w-full skeleton-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 skeleton-pulse" />
            <div className="h-10 skeleton-pulse" />
          </div>
          <div className="h-20 w-full skeleton-pulse" />
        </div>
      </Card>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-0.5 h-5 rounded-full bg-amber-400" />
      <Icon size={15} className="text-amber-400" />
      <h3 className="text-sm font-bold font-display text-text-primary dark:text-text-dark-primary">
        {label}
      </h3>
    </div>
  );
}

interface FieldError {
  field: string;
  message: string;
}

export default function Profile() {
  const { updateUser } = useAuth();
  const [stylist, setStylist] = useState<any>(null);
  const [initialForm, setInitialForm] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [location, setLocation] = useState<LocationValue>({ area: "", lat: 0, lng: 0 });
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const isDirty = useCallback(() => {
    const current = { name, bio, category, phone, instagram, twitter, tiktok, website, location };
    return JSON.stringify(current) !== JSON.stringify(initialForm);
  }, [name, bio, category, phone, instagram, twitter, tiktok, website, location, initialForm]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors.find((fe) => fe.field === field)?.message;
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => prev.filter((fe) => fe.field !== field));
  };

  const validate = (): boolean => {
    const errors: FieldError[] = [];

    if (!name.trim()) {
      errors.push({ field: "name", message: "Display name is required" });
    } else if (name.trim().length > FIELD_LIMITS.name.max) {
      errors.push({ field: "name", message: `Max ${FIELD_LIMITS.name.max} characters` });
    }

    if (!category.trim()) {
      errors.push({ field: "category", message: "Category is required" });
    } else if (category.trim().length > FIELD_LIMITS.category.max) {
      errors.push({ field: "category", message: `Max ${FIELD_LIMITS.category.max} characters` });
    }

    if (!location.area.trim()) {
      errors.push({ field: "location", message: "Location is required" });
    }

    if (bio.length > FIELD_LIMITS.bio.max) {
      errors.push({ field: "bio", message: `Max ${FIELD_LIMITS.bio.max} characters` });
    }

    if (phone && !validatePhone(phone)) {
      errors.push({ field: "phone", message: "Enter a valid phone number" });
    }

    if (website && !validateUrl(website)) {
      errors.push({ field: "website", message: "Enter a valid URL (https://...)" });
    }

    if (instagram.length > FIELD_LIMITS.instagram.max) {
      errors.push({ field: "instagram", message: `Max ${FIELD_LIMITS.instagram.max} characters` });
    }
    if (twitter.length > FIELD_LIMITS.twitter.max) {
      errors.push({ field: "twitter", message: `Max ${FIELD_LIMITS.twitter.max} characters` });
    }
    if (tiktok.length > FIELD_LIMITS.tiktok.max) {
      errors.push({ field: "tiktok", message: `Max ${FIELD_LIMITS.tiktok.max} characters` });
    }

    setFieldErrors(errors);
    return errors.length === 0;
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const result = await uploadProfileImage(fd);
      setStylist((prev: any) => ({ ...prev, image: result.imageUrl }));
      const meRes = await getMe();
      updateUser(meRes.data.user);
      setSuccessMsg("Profile image updated");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setImagePreview(null);
      setError(err?.response?.data?.message || err?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await getMyStylistProfile();
      setStylist(p);
      const formState = {
        name: p.name || "",
        bio: p.bio || "",
        category: p.category || "",
        phone: (p as any).phone || "",
        instagram: (p as any).instagram || "",
        twitter: (p as any).twitter || "",
        tiktok: (p as any).tiktok || "",
        website: (p as any).website || "",
        location: (() => {
          const loc = p.location as any;
          return {
            area: loc?.area || getLocationString(loc) || "",
            lat: loc?.lat || 0,
            lng: loc?.lng || 0,
          };
        })(),
      };
      setName(formState.name);
      setBio(formState.bio);
      setCategory(formState.category);
      setPhone(formState.phone);
      setInstagram(formState.instagram);
      setTwitter(formState.twitter);
      setTiktok(formState.tiktok);
      setWebsite(formState.website);
      setLocation(formState.location);
      setInitialForm(formState);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await updateMyProfile({
        name: name.trim(),
        bio: bio.trim(),
        category: category.trim(),
        location: { area: location.area.trim(), lat: location.lat, lng: location.lng },
        phone: phone.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        tiktok: tiktok.trim(),
        website: website.trim(),
      });
      setStylist(updated);
      const newForm = {
        name: name.trim(),
        bio: bio.trim(),
        category: category.trim(),
        phone: phone.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        tiktok: tiktok.trim(),
        website: website.trim(),
        location: { area: location.area.trim(), lat: location.lat, lng: location.lng },
      };
      setInitialForm(newForm);
      setSuccessMsg("Profile saved successfully");
      setFieldErrors([]);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setName(initialForm.name || "");
    setBio(initialForm.bio || "");
    setCategory(initialForm.category || "");
    setPhone(initialForm.phone || "");
    setInstagram(initialForm.instagram || "");
    setTwitter(initialForm.twitter || "");
    setTiktok(initialForm.tiktok || "");
    setWebsite(initialForm.website || "");
    setLocation(initialForm.location || { area: "", lat: 0, lng: 0 });
    setFieldErrors([]);
    setError(null);
  };

  const filteredCategories = CATEGORIES.filter(
    (c) => c.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  const initials = stylist?.name
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const hasChanges = isDirty();
  const bioRemaining = FIELD_LIMITS.bio.max - bio.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-text-primary dark:text-text-dark-primary">
          Profile
        </h1>
        <p className="text-xs mt-0.5 text-text-muted dark:text-text-dark-muted">
          Manage your public stylist profile and location
        </p>
      </div>

      {stylist && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-card bg-gradient-to-br from-stylist-700 via-stylist-800 to-stylist-900 text-white"
        >
          <div className="p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <Sparkles size={128} />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="relative shrink-0">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/20">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : stylist.image ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/20">
                    <img src={stylist.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg ring-2 ring-white/20 bg-gradient-to-br from-amber-400 to-amber-600"
                  >
                    {initials}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform hover:scale-105 active:scale-95 bg-white dark:bg-surface-dark-secondary dark:border-gray-600"
                  title="Change profile photo"
                >
                  {uploadingImage ? (
                    <Loader2 size={10} className="animate-spin text-text-primary dark:text-text-dark-primary" />
                  ) : (
                    <Camera size={10} className="text-text-primary dark:text-text-dark-primary" />
                  )}
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold truncate">{stylist.name}</h2>
                  {stylist.isVerified && <BadgeCheck size={14} className="text-amber-400 shrink-0" />}
                </div>
                <p className="text-white/70 text-sm">{stylist.category || "Stylist"}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-amber-200">
                    <Star size={10} className="fill-amber-400 stroke-amber-400" />
                    {stylist.rating?.toFixed(1) || "—"} ({stylist.reviewCount || 0})
                  </span>
                  <span className="text-xs text-white/60">
                    <MapPin size={10} className="inline mr-0.5" />
                    {getLocationString(location) || "No location set"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-xl px-4 py-3 bg-error/10 border border-error/20"
        >
          <AlertCircle size={15} className="text-error mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-error">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shrink-0">
            <X size={13} className="text-error" />
          </button>
        </motion.div>
      )}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 bg-success/10 border border-success/20"
        >
          <Check size={14} className="text-success" />
          <p className="text-xs font-medium text-success">{successMsg}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card elevated padding="none" className="overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/40">
            <SectionHeader icon={User} label="Basic Information" />
            <div className="flex items-center gap-1">
              {hasChanges && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-400">
                  Unsaved
                </span>
              )}
              <Button
                onClick={fetchProfile}
                variant="ghost-gray"
                size="sm"
                icon
                title="Refresh from server"
              >
                <RefreshCcw size={13} />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  Display Name <span className="text-error">*</span>
                </label>
                <div
                  className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                    getFieldError("name")
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                  }`}
                >
                  <User size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                    maxLength={FIELD_LIMITS.name.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="Your full name"
                  />
                </div>
                {getFieldError("name") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("name")}</p>
                )}
              </div>
              <div ref={categoryRef} className="relative">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  Category <span className="text-error">*</span>
                </label>
                <div
                  className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    getFieldError("category")
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                  }`}
                  onClick={() => { setShowCategoryDropdown(true); setCategorySearch(category); }}
                >
                  <Scissors size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                      clearFieldError("category");
                    }}
                    onFocus={() => { setShowCategoryDropdown(true); setCategorySearch(category); }}
                    maxLength={FIELD_LIMITS.category.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="e.g. Braiding, Haircut"
                  />
                </div>
                {getFieldError("category") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("category")}</p>
                )}
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-20 mt-1 left-0 right-0 bg-white dark:bg-surface-dark-secondary rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto py-1">
                      {filteredCategories.length === 0 ? (
                        <div className="px-4 py-3 text-center">
                          <p className="text-xs text-text-muted dark:text-text-dark-muted">No matching categories</p>
                        </div>
                      ) : (
                        filteredCategories.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCategory(c);
                              setShowCategoryDropdown(false);
                              clearFieldError("category");
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              category === c ? "bg-stylist-50 text-stylist-700 dark:bg-stylist-950/20 dark:text-stylist-300 font-medium" : "text-text-secondary dark:text-text-dark-secondary hover:bg-gray-50 dark:hover:bg-surface-dark-tertiary"
                            }`}
                          >
                            {c}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => { setBio(e.target.value); clearFieldError("bio"); }}
                rows={3}
                maxLength={FIELD_LIMITS.bio.max}
                className={`w-full mt-1.5 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all ${
                  getFieldError("bio")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                } text-text-primary dark:text-text-dark-primary`}
                placeholder="Tell clients about yourself..."
              />
              <div className="flex items-center justify-between mt-1">
                {getFieldError("bio") && (
                  <p className="text-[10px] font-medium text-error">{getFieldError("bio")}</p>
                )}
                <p className={`text-[10px] ml-auto ${
                  bioRemaining < 0
                    ? "text-error font-medium"
                    : bioRemaining < 50
                      ? "text-amber-400 font-medium"
                      : "text-text-muted dark:text-text-dark-muted"
                }`}>
                  {bioRemaining} characters left
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card elevated padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <SectionHeader icon={MapPin} label="Location" />
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
                Set your current working location so clients can find you on the map.
                Update this whenever you relocate.
              </p>
            </div>
            {location.area && (location.lat || location.lng) && (
              <div className="flex items-center gap-2.5 mb-4 px-3.5 py-2.5 rounded-xl bg-stylist-50 dark:bg-stylist-950/20 border border-stylist-900/10 dark:border-stylist-900/30">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stylist-800">
                  <Navigation size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-text-primary dark:text-text-dark-primary">{location.area}</p>
                  <p className="text-[10px] text-text-muted dark:text-text-dark-muted">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
            <StylistLocationPicker
              value={location}
              onChange={(loc) => { setLocation(loc); clearFieldError("location"); }}
            />
            {getFieldError("location") && (
              <p className="text-[10px] mt-1.5 font-medium text-error">{getFieldError("location")}</p>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card elevated padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <SectionHeader icon={Phone} label="Contact" />
          </div>
          <div className="p-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                Phone
              </label>
              <div
                className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                  getFieldError("phone")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                }`}
              >
                <Phone size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }}
                  maxLength={FIELD_LIMITS.phone.max}
                  className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              {getFieldError("phone") && (
                <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("phone")}</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card elevated padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/40">
            <SectionHeader icon={AtSign} label="Social Links" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  Instagram
                </label>
                <div className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                  getFieldError("instagram")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                }`}>
                  <AtSign size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input value={instagram} onChange={(e) => { setInstagram(e.target.value); clearFieldError("instagram"); }}
                    maxLength={FIELD_LIMITS.instagram.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="your_handle" />
                </div>
                {getFieldError("instagram") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("instagram")}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  Twitter / X
                </label>
                <div className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                  getFieldError("twitter")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                }`}>
                  <AtSign size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input value={twitter} onChange={(e) => { setTwitter(e.target.value); clearFieldError("twitter"); }}
                    maxLength={FIELD_LIMITS.twitter.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="your_handle" />
                </div>
                {getFieldError("twitter") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("twitter")}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  TikTok
                </label>
                <div className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                  getFieldError("tiktok")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                }`}>
                  <AtSign size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input value={tiktok} onChange={(e) => { setTiktok(e.target.value); clearFieldError("tiktok"); }}
                    maxLength={FIELD_LIMITS.tiktok.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="@your_handle" />
                </div>
                {getFieldError("tiktok") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("tiktok")}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                  Website
                </label>
                <div className={`flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl border transition-all ${
                  getFieldError("website")
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary"
                }`}>
                  <Globe size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                  <input value={website} onChange={(e) => { setWebsite(e.target.value); clearFieldError("website"); }}
                    maxLength={FIELD_LIMITS.website.max}
                    className="flex-1 bg-transparent text-sm font-medium outline-none text-text-primary dark:text-text-dark-primary"
                    placeholder="https://" />
                </div>
                {getFieldError("website") && (
                  <p className="text-[10px] mt-1 font-medium text-error">{getFieldError("website")}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="flex items-center gap-3 pt-1">
        {hasChanges && (
          <Button
            onClick={handleRevert}
            disabled={saving}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            Revert
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || (!hasChanges && fieldErrors.length === 0)}
          variant="primary"
          size="md"
          className={hasChanges ? "flex-[2]" : "w-full"}
        >
          {saving ? (
            <><Loader2 size={15} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={15} /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
