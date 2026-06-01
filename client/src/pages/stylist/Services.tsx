import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Trash2, Save, Loader2, AlertCircle, Scissors, DollarSign, RefreshCcw } from "lucide-react";
import { getMyStylistProfile, addMyService, updateMyService, deleteMyService } from "../../api/stylists";
import { getStylistServices } from "../../api/stylists";

interface ServiceItem {
  id?: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
  isActive?: boolean;
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
        price: s.price,
        duration: s.duration,
        category: s.category,
        isActive: s.isActive
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
        category: "General"
      });
      setServices(prev => [...prev, {
        id: newService.id || newService._id,
        name: newService.name,
        price: newService.price,
        duration: newService.duration,
        category: newService.category
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
        category: service.category
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Services</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage what you offer to clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all"
            title="Refresh"
          >
            <RefreshCcw size={15} className="text-gray-400" />
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Plus size={14} />
            Add Service
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <Scissors size={14} className="text-emerald-500 flex-shrink-0" />
          <p className="text-xs font-medium text-emerald-700">{successMsg}</p>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Scissors size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">No services yet</p>
          <p className="text-xs text-gray-400 mb-4">Add your first service to start getting booked</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={14} />
            Add Service
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((svc, idx) => (
            <motion.div
              key={svc.id || idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                  <Scissors size={16} className="text-indigo-500" />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Name</label>
                    <input
                      value={svc.name}
                      onChange={(e) => svc.id && handleUpdate(svc.id, "name", e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 bg-transparent outline-none mt-0.5 placeholder-gray-300"
                      placeholder="Service name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={12} className="text-gray-300" />
                      <input
                        type="number"
                        value={svc.duration}
                        onChange={(e) => svc.id && handleUpdate(svc.id, "duration", parseInt(e.target.value) || 0)}
                        className="w-16 text-sm font-medium text-gray-900 bg-transparent outline-none"
                        placeholder="30"
                      />
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Price</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <DollarSign size={12} className="text-gray-300" />
                      <input
                        type="number"
                        value={svc.price}
                        onChange={(e) => svc.id && handleUpdate(svc.id, "price", parseInt(e.target.value) || 0)}
                        className="w-20 text-sm font-bold text-gray-900 bg-transparent outline-none"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-400">GH₵</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => svc.id && handleSave(svc.id)}
                    disabled={saving === svc.id}
                    className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all"
                    title="Save"
                  >
                    {saving === svc.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Save size={15} />
                    }
                  </button>
                  <button
                    onClick={() => svc.id && handleDelete(svc.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
