import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, ArrowRight, ArrowLeft, Scissors, Image, Clock, User, Phone, Loader2, X } from "lucide-react";
import { saveOnboarding } from "../../api/stylists";
import api from "../../api/axios";
import StylistLocationPicker from "../../components/stylist/StylistLocationPicker";
import type { LocationValue } from "../../components/stylist/StylistLocationPicker";
import { Button } from "../../components/ui/Button";

const STEPS = [
  { title: "Profile", subtitle: "Tell us about yourself", icon: User },
  { title: "Services", subtitle: "What do you offer?", icon: Scissors },
  { title: "Portfolio", subtitle: "Show your work", icon: Image },
  { title: "Availability", subtitle: "Set your hours", icon: Clock },
];

type ServiceEntry = { name: string; duration: string; price: string };

export default function StylistOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<{ phone: string; location: LocationValue | string; bio: string }>({
    phone: "",
    location: { area: "", lat: 0, lng: 0 },
    bio: "",
  });
  const [services, setServices] = useState<ServiceEntry[]>([
    { name: "", duration: "30 min", price: "" },
  ]);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, { enabled: boolean; start: string; end: string }>>(
    Object.fromEntries(
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => [
        d,
        d === "Sunday" ? { enabled: false, start: "09:00", end: "17:00" } : { enabled: true, start: "09:00", end: "17:00" },
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const canNext = () => {
    if (step === 0) {
      const loc = profile.location;
      if (typeof loc === "string") return loc.trim().length > 0;
      return loc.area.trim().length > 0;
    }
    if (step === 1) return services.some((s) => s.name.trim() && s.price.trim());
    return true;
  };

  const addService = () => setServices([...services, { name: "", duration: "30 min", price: "" }]);
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: keyof ServiceEntry, value: string) => {
    setServices((prev) =>
      prev.map((svc, idx) => (idx === i ? { ...svc, [field]: value } : svc))
    );
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages([...images, ...newImages]);
    }
    if (e.target) e.target.value = "";
  };

  const removeImage = (index: number) => {
    const img = images[index];
    URL.revokeObjectURL(img.preview);
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setSaving(true);
    setSaveError("");

    try {
      await saveOnboarding({ profile, services, schedule });

      if (images.length > 0) {
        setUploadProgress(true);
        for (const img of images) {
          const formData = new FormData();
          formData.append("image", img.file);
          await api.post("/stylists/portfolio", formData);
        }
        setUploadProgress(false);
      }
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      navigate("/stylist/dashboard", { replace: true });
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setUploadProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-surface-dark dark:to-surface-dark-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-700 rounded-xl mb-4">
            <Sparkles className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">
            Set Up Your Studio
          </h1>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-1">Complete these steps to start accepting bookings</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                i < step ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" :
                i === step ? "bg-gray-900 dark:bg-gray-700 text-white" :
                "bg-gray-100 dark:bg-surface-dark-tertiary text-text-muted dark:text-text-dark-muted"
              }`}>
                {i < step ? <Check size={12} /> : <s.icon size={12} />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
                {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-green-400 dark:bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 sm:p-8 shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Step 0: Profile */}
              {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">Your Profile</h2>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted">* Location is required</p>
                    <StylistLocationPicker
                      value={
                        typeof profile.location === "string"
                          ? { area: profile.location, lat: 0, lng: 0 }
                          : profile.location
                      }
                      onChange={(loc) => setProfile({ ...profile, location: loc })}
                    />
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary"
                    />
                  </div>
                  <div className="relative">
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell clients about yourself (optional)"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Services */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">Your Services</h2>
                    <button onClick={addService} className="text-xs font-semibold text-brand-500 hover:underline">
                      + Add another
                    </button>
                  </div>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted -mt-2">* Name and price required for at least one service</p>
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex-1 space-y-2">
                        <input
                          value={svc.name}
                          onChange={(e) => updateService(i, "name", e.target.value)}
                          placeholder="Service name"
                          className="w-full text-sm font-semibold bg-transparent outline-none text-text-primary dark:text-text-dark-primary"
                        />
                        <div className="flex items-center gap-3">
                          <select
                            value={svc.duration}
                            onChange={(e) => updateService(i, "duration", e.target.value)}
                            className="text-xs border border-gray-200 dark:border-gray-600 rounded-xl px-2 py-1 bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary"
                          >
                            <option>15 min</option>
                            <option>30 min</option>
                            <option>45 min</option>
                            <option>60 min</option>
                            <option>90 min</option>
                            <option>120 min</option>
                          </select>
                          <input
                            value={svc.price}
                            onChange={(e) => updateService(i, "price", e.target.value)}
                            placeholder="GH₵ 0"
                            className="w-24 text-sm font-bold bg-transparent outline-none text-text-primary dark:text-text-dark-primary"
                          />
                        </div>
                      </div>
                      {services.length > 1 && (
                        <button onClick={() => removeService(i)} className="text-red-400 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 text-xs">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Portfolio */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">Portfolio</h2>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Upload photos of your work to attract clients</p>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-surface-dark-tertiary group">
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition">
                      <Image size={20} className="text-text-muted dark:text-text-dark-muted" />
                      <span className="text-[10px] text-text-muted dark:text-text-dark-muted mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={addImage} multiple />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Availability */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary">Availability</h2>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary">Set your weekly working hours</p>
                  {Object.entries(schedule).map(([day, s]) => (
                    <div key={day} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={() => setSchedule({ ...schedule, [day]: { ...s, enabled: !s.enabled } })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-success peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                      <span className={`text-sm font-medium w-24 ${s.enabled ? "text-text-primary dark:text-text-dark-primary" : "text-text-muted dark:text-text-dark-muted"}`}>
                        {day.slice(0, 3)}
                      </span>
                      {s.enabled ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={s.start}
                            onChange={(e) => setSchedule({ ...schedule, [day]: { ...s, start: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary"
                          />
                          <span className="text-xs text-text-muted dark:text-text-dark-muted">to</span>
                          <input
                            type="time"
                            value={s.end}
                            onChange={(e) => setSchedule({ ...schedule, [day]: { ...s, end: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-surface-dark-secondary text-text-primary dark:text-text-dark-primary"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted dark:text-text-dark-muted italic">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {saveError && (
            <div className="mt-4 p-3 bg-error/10 border border-error/20 text-error rounded-xl text-sm">
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
            <Button
              variant="secondary"
              onClick={() => step === 0 ? navigate("/signup") : setStep(step - 1)}
            >
              <ArrowLeft size={14} className="mr-1" />
              {step === 0 ? "Back" : "Previous"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
              >
                Next
                <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                loading={saving}
              >
                {uploadProgress ? "Uploading images..." : saving ? "Saving..." : <><Check size={14} className="mr-1" />Complete Setup</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
