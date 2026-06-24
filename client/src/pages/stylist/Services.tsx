import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Trash2, Save, Loader2, AlertCircle, Scissors, RefreshCcw, Check } from "lucide-react";
import { getMyStylistProfile, addMyService, updateMyService, deleteMyService } from "../../api/stylists";
import { getStylistServices } from "../../api/stylists";
import { Button } from "../../components/ui/Button";

interface ServiceItem {
  id?: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
  isActive?: boolean;
  popular?: boolean;
}

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getMyStylistProfile();
      setStylistId(profile.id);
      const svcs = await getStylistServices(profile.id);
      setServices(svcs.map((s: any) => ({
        id: s.id || s._id,
        name: s.name,
        price: typeof s.price === "number" ? s.price : parseFloat(s.price) || 0,
        duration: typeof s.duration === "number" ? s.duration : parseInt(s.duration) || 30,
        category: s.category,
        isActive: s.isActive,
        popular: s.popular,
      })));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleAdd = async () => {
    if (!stylistId) return;
    try {
      setError(null);
      const newService = await addMyService({
        name: "New Service",
        price: 0,
        duration: 30,
        category: "General",
      });
      setServices(prev => [...prev, {
        id: newService.id || newService._id,
        name: newService.name,
        price: newService.price,
        duration: newService.duration,
        category: newService.category,
      }]);
      showSuccess("Service added");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add service");
    }
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setServices(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = async (id: string) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    try {
      setSaving(id);
      setError(null);
      await updateMyService(id, {
        name: service.name,
        price: Number(service.price),
        duration: Number(service.duration),
        category: service.category,
      });
      showSuccess("Service saved");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save service");
      fetchServices();
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteMyService(id);
      setServices(prev => prev.filter(s => s.id !== id));
      showSuccess("Service removed");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete service");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <div className="h-6 w-40 skeleton-pulse rounded" />
            <div className="h-4 w-56 skeleton-pulse rounded" />
          </div>
          <div className="h-9 w-28 skeleton-pulse rounded-xl" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 skeleton-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-text-dark-primary font-display">
            My Services
          </h1>
          <p className="text-xs mt-0.5 text-text-muted dark:text-text-dark-muted">
            Manage what you offer to clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            className="p-2 rounded-xl transition-all text-text-muted dark:text-text-dark-muted"
            title="Refresh"
          >
            <RefreshCcw size={15} />
          </button>
          <Button onClick={handleAdd} size="sm">
            <Plus size={14} />
            Add Service
          </Button>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-error/10 border border-error/20">
          <AlertCircle size={14} className="text-error" />
          <p className="text-xs font-medium text-error">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-success/10 border border-success/20">
          <Check size={14} className="text-success" />
          <p className="text-xs font-medium text-success">{successMsg}</p>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-surface-dark-secondary shadow-card">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100 dark:bg-surface-dark-tertiary">
            <Scissors size={24} className="text-text-muted dark:text-text-dark-muted" />
          </div>
          <p className="text-sm font-semibold mb-1 text-text-primary dark:text-text-dark-primary">No services yet</p>
          <p className="text-xs mb-5 text-text-muted dark:text-text-dark-muted">Add your first service to start getting booked</p>
          <Button onClick={handleAdd} size="sm">
            <Plus size={14} />
            Add Service
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((svc, idx) => (
            <motion.div
              key={svc.id || idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl overflow-hidden transition-all bg-white dark:bg-surface-dark-secondary shadow-card"
            >
              {svc.popular && (
                <div className="h-0.5 bg-gradient-to-r from-amber-400 to-stylist-900" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/20">
                    <Scissors size={16} className="text-amber-400" />
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                        Name
                      </label>
                      <input
                        value={svc.name}
                        onChange={(e) => svc.id && handleUpdate(svc.id, "name", e.target.value)}
                        className="w-full text-sm font-semibold bg-transparent outline-none mt-0.5 text-text-primary dark:text-text-dark-primary"
                        placeholder="Service name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                        Duration
                      </label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={12} className="text-text-muted dark:text-text-dark-muted" />
                        <input
                          type="number"
                          value={svc.duration}
                          onChange={(e) => svc.id && handleUpdate(svc.id, "duration", parseInt(e.target.value) || 0)}
                          className="w-16 text-sm font-medium bg-transparent outline-none text-text-primary dark:text-text-dark-primary"
                          placeholder="30"
                        />
                        <span className="text-xs text-text-muted dark:text-text-dark-muted">min</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                        Price
                      </label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-bold text-text-muted dark:text-text-dark-muted">GH₵</span>
                        <input
                          type="number"
                          value={svc.price}
                          onChange={(e) => svc.id && handleUpdate(svc.id, "price", parseInt(e.target.value) || 0)}
                          className="w-20 text-sm font-bold bg-transparent outline-none text-text-primary dark:text-text-dark-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => svc.id && handleSave(svc.id)}
                      disabled={saving === svc.id}
                      className="p-2 rounded-xl transition-all text-text-muted dark:text-text-dark-muted"
                      title="Save"
                    >
                      {saving === svc.id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Save size={15} />
                      }
                    </button>
                    <button
                      onClick={() => svc.id && handleDelete(svc.id)}
                      className="p-2 rounded-xl transition-all text-text-secondary dark:text-text-dark-secondary hover:text-error"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
