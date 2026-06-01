import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, ArrowRight, ArrowLeft, Scissors, Image, Clock, User, MapPin, Phone, Save } from "lucide-react";
import { saveOnboarding } from "../../api/stylists";

const T = {
  navy: "#0B1A33",
  ink: "#0A1424",
  inkSoft: "#5A6E8A",
  shadowCard: "0 2px 12px rgba(10,20,40,0.06), 0 0 0 1px rgba(10,20,40,0.04)",
};

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
  const [profile, setProfile] = useState({ phone: "", location: "", bio: "" });
  const [services, setServices] = useState<ServiceEntry[]>([
    { name: "", duration: "30 min", price: "" },
  ]);
  const [images, setImages] = useState<string[]>([]);
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
    if (step === 0) return profile.location.trim().length > 0;
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
    if (e.target.files && e.target.files[0]) {
      setImages([...images, URL.createObjectURL(e.target.files[0])]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveOnboarding({ profile, services, schedule });
      navigate("/stylist/dashboard", { replace: true });
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FC] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0B1A33] rounded-xl mb-4">
            <Sparkles className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: T.ink, fontFamily: "'Playfair Display', serif" }}>
            Set Up Your Studio
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete these steps to start accepting bookings</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                i < step ? "bg-green-100 text-green-700" :
                i === step ? "bg-gray-900 text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < step ? <Check size={12} /> : <s.icon size={12} />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8" style={{ boxShadow: T.shadowCard }}>
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
                  <h2 className="text-lg font-bold text-gray-900">Your Profile</h2>
                  <p className="text-xs text-gray-400">* Location is required</p>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Your location (e.g., Accra, Ghana)"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="relative">
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell clients about yourself (optional)"
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Services */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Your Services</h2>
                    <button onClick={addService} className="text-xs font-semibold text-blue-600 hover:underline">
                      + Add another
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 -mt-2">* Name and price required for at least one service</p>
                  {services.map((svc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 space-y-2">
                        <input
                          value={svc.name}
                          onChange={(e) => updateService(i, "name", e.target.value)}
                          placeholder="Service name"
                          className="w-full text-sm font-semibold bg-transparent outline-none"
                        />
                        <div className="flex items-center gap-3">
                          <select
                            value={svc.duration}
                            onChange={(e) => updateService(i, "duration", e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1"
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
                            className="w-24 text-sm font-bold bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      {services.length > 1 && (
                        <button onClick={() => removeService(i)} className="text-red-400 hover:text-red-500 text-xs">
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
                  <h2 className="text-lg font-bold text-gray-900">Portfolio</h2>
                  <p className="text-xs text-gray-500">Upload photos of your work to attract clients</p>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 text-white flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition">
                      <Image size={20} className="text-gray-300" />
                      <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={addImage} />
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Availability */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Availability</h2>
                  <p className="text-xs text-gray-500">Set your weekly working hours</p>
                  {Object.entries(schedule).map(([day, s]) => (
                    <div key={day} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={() => setSchedule({ ...schedule, [day]: { ...s, enabled: !s.enabled } })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                      <span className={`text-sm font-medium w-24 ${s.enabled ? "text-gray-900" : "text-gray-300"}`}>
                        {day.slice(0, 3)}
                      </span>
                      {s.enabled ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={s.start}
                            onChange={(e) => setSchedule({ ...schedule, [day]: { ...s, start: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                          />
                          <span className="text-xs text-gray-400">to</span>
                          <input
                            type="time"
                            value={s.end}
                            onChange={(e) => setSchedule({ ...schedule, [day]: { ...s, end: e.target.value } })}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => step === 0 ? navigate("/signup") : setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition"
            >
              <ArrowLeft size={14} />
              {step === 0 ? "Back" : "Previous"}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: T.navy }}
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: T.navy }}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
