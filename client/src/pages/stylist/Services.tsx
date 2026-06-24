import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, Trash2, Loader2, AlertCircle, Scissors,
  RefreshCcw, X, Tag, Edit3, Power, Check,
  DollarSign, ArchiveRestore,
} from "lucide-react";
import { getMyStylistProfile, addMyService, updateMyService, deleteMyService } from "../../api/stylists";
import { getStylistServices } from "../../api/stylists";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

interface ServiceItem {
  id?: string;
  name: string;
  price: number;
  duration: number;
  category?: string;
  isActive?: boolean;
  popular?: boolean;
}

const emptyService = (): ServiceItem => ({
  name: "",
  price: 0,
  duration: 30,
  category: "General",
  isActive: true,
});

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stylistId, setStylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [formData, setFormData] = useState<ServiceItem>(emptyService());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savingForm, setSavingForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openAddModal = () => {
    setFormData(emptyService());
    setFormErrors({});
    setModalMode("add");
  };

  const openEditModal = (svc: ServiceItem) => {
    setFormData({ ...svc });
    setFormErrors({});
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setFormErrors({});
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteTarget) setDeleteTarget(null);
        else closeModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [deleteTarget]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Service name is required";
    if (formData.price < 0) errors.price = "Price cannot be negative";
    if (formData.duration < 5) errors.duration = "Duration must be at least 5 min";
    if (formData.duration > 480) errors.duration = "Duration cannot exceed 480 min";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!stylistId) return;
    setSavingForm(true);
    try {
      setError(null);
      if (modalMode === "add") {
        const newService = await addMyService({
          name: formData.name,
          price: Number(formData.price),
          duration: Number(formData.duration),
          category: formData.category || "General",
        });
        setServices(prev => [...prev, {
          id: newService.id || newService._id,
          name: newService.name,
          price: newService.price,
          duration: newService.duration,
          category: newService.category,
          isActive: true,
        }]);
        showSuccess("Service added successfully");
      } else if (modalMode === "edit" && formData.id) {
        await updateMyService(formData.id, {
          name: formData.name,
          price: Number(formData.price),
          duration: Number(formData.duration),
          category: formData.category,
        });
        setServices(prev => prev.map(s =>
          s.id === formData.id ? { ...formData } : s
        ));
        showSuccess("Service updated successfully");
      }
      closeModal();
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to ${modalMode} service`);
    } finally {
      setSavingForm(false);
    }
  };

  const handleToggleActive = async (svc: ServiceItem) => {
    if (!svc.id) return;
    try {
      setError(null);
      await updateMyService(svc.id, { isActive: !svc.isActive });
      setServices(prev => prev.map(s =>
        s.id === svc.id ? { ...s, isActive: !s.isActive } : s
      ));
      showSuccess(`${svc.name} ${svc.isActive ? "paused" : "activated"}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      setError(null);
      await deleteMyService(deleteTarget.id);
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      showSuccess("Service removed");
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  {/* ─── Loading State ─── */}
  if (loading) {
    return (
      <div className="px-2 sm:px-0 py-2">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-7">
          <div className="space-y-2">
            <div className="h-7 w-44 skeleton-pulse rounded-lg" />
            <div className="h-4 w-56 skeleton-pulse rounded-lg" />
          </div>
          <div className="h-11 w-36 skeleton-pulse rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-5 skeleton-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 sm:px-0 py-2">
      {/* ─── Header ─── */}
      <div className="flex flex-col xs:flex-row xs:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Services & Pricing</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">Manage your service menu, set prices, and control availability</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            aria-label="Refresh services"
          >
            <RefreshCcw size={16} />
          </button>
          <Button onClick={openAddModal} className="h-10 sm:h-11 gap-2 text-sm font-semibold px-4">
            <Plus size={16} />
            <span className="hidden xs:inline">Add New Service</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* ─── Toast: Error / Success ─── */}
      <AnimatePresence>
        {(error || successMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mb-5 border ${
              error
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30"
            }`}
          >
            {error ? (
              <AlertCircle size={16} className="text-error shrink-0" />
            ) : (
              <Check size={16} className="text-success shrink-0" />
            )}
            <p className={`text-sm font-medium flex-1 ${error ? "text-error" : "text-success"}`}>
              {error || successMsg}
            </p>
            <button
              onClick={() => { setError(null); setSuccessMsg(null); }}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} className="text-text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State ─── */}
      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stylist-50 dark:bg-stylist-950/30 flex items-center justify-center mb-5 shadow-sm">
            <Scissors size={28} className="text-stylist-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-dark-primary mb-1.5 font-display">No services yet</h2>
          <p className="text-sm text-text-secondary dark:text-text-dark-secondary max-w-xs mb-6">Add your first service to start getting booked by clients</p>
          <Button onClick={openAddModal} className="h-12 px-6 gap-2 text-sm font-semibold">
            <Plus size={18} />
            Add Your First Service
          </Button>
        </motion.div>
      ) : (
        /* ─── Service Cards ─── */
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs sm:text-sm font-medium text-text-muted dark:text-text-dark-muted">
              {services.length} service{services.length !== 1 ? "s" : ""}
            </p>
          </div>
          {services.map((svc, idx) => (
            <motion.div
              key={svc.id || idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.035, duration: 0.25 }}
              className={`group relative rounded-2xl border bg-white dark:bg-surface-dark-secondary transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 ${
                svc.isActive === false
                  ? "border-gray-200 dark:border-gray-700/30 opacity-70"
                  : "border-gray-100 dark:border-gray-700/40"
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    svc.isActive === false
                      ? "bg-gray-100 dark:bg-surface-dark-tertiary"
                      : "bg-stylist-50 dark:bg-stylist-950/30"
                  }`}>
                    <Scissors size={18} className={
                      svc.isActive === false
                        ? "text-gray-400 dark:text-text-dark-muted"
                        : "text-stylist-500"
                    } />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`text-sm sm:text-base font-bold font-display truncate ${
                          svc.isActive === false
                            ? "text-text-muted dark:text-text-dark-muted"
                            : "text-text-primary dark:text-text-dark-primary"
                        }`}>
                          {svc.name}
                        </h3>
                        {svc.category && (
                          <p className="text-caption text-text-secondary dark:text-text-dark-secondary mt-0.5 flex items-center gap-1">
                            <Tag size={11} className="shrink-0" />
                            {svc.category}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={svc.isActive === false ? "gray" : "success"}
                        pill
                        dot
                        className="shrink-0 mt-0.5"
                      >
                        {svc.isActive === false ? "Paused" : "Active"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 sm:mt-3">
                      <span className="inline-flex items-center gap-1.5 text-caption sm:text-sm font-medium text-text-primary dark:text-text-dark-primary">
                        <Clock size={14} className="text-text-muted dark:text-text-dark-muted shrink-0" />
                        {formatDuration(svc.duration)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                      <span className="inline-flex items-center gap-1.5 text-caption sm:text-sm font-bold text-text-primary dark:text-text-dark-primary">
                        <DollarSign size={14} className="text-emerald-500 shrink-0" />
                        GH₵{svc.price.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(svc)}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                        svc.isActive === false
                          ? "text-text-muted hover:text-stylist-500 hover:bg-stylist-50 dark:hover:bg-stylist-950/30"
                          : "text-emerald-500 hover:text-stylist-500 hover:bg-stylist-50 dark:hover:bg-stylist-950/30"
                      }`}
                      aria-label={svc.isActive === false ? "Activate service" : "Pause service"}
                      title={svc.isActive === false ? "Activate" : "Pause"}
                    >
                      {svc.isActive === false ? <ArchiveRestore size={16} /> : <Power size={16} />}
                    </button>
                    <button
                      onClick={() => openEditModal(svc)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-stylist-500 hover:bg-stylist-50 dark:hover:bg-stylist-950/30 transition-all"
                      aria-label={`Edit ${svc.name}`}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(svc)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-error hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      aria-label={`Delete ${svc.name}`}
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

      {/* ─── Add / Edit Modal ─── */}
      <AnimatePresence>
        {modalMode && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={closeModal}
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-surface-dark-secondary rounded-t-2xl sm:rounded-2xl shadow-modal"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-gray-700/40">
                <h2 className="text-lg sm:text-xl font-bold text-text-primary dark:text-text-dark-primary font-display">
                  {modalMode === "add" ? "Add New Service" : "Edit Service"}
                </h2>
                <button
                  onClick={closeModal}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-text-muted dark:text-text-dark-muted hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-all"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 min-h-0 px-5 sm:px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">
                    Service Name <span className="text-error">*</span>
                  </label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Braids, Haircut, Makeup"
                    className={`input-field text-sm w-full ${formErrors.name ? "input-error" : ""}`}
                  />
                  {formErrors.name && <p className="text-xs text-error mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category || "General"}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="input-field text-sm w-full"
                  >
                    <option value="General">General</option>
                    <option value="Hair">Hair</option>
                    <option value="Nails">Nails</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Skincare">Skincare</option>
                    <option value="Massage">Massage</option>
                    <option value="Barber">Barber</option>
                    <option value="Bridal">Bridal</option>
                    <option value="Men's Grooming">Men's Grooming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">
                      Duration (min) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted" />
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        min={5}
                        max={480}
                        className={`input-field text-sm w-full pl-9 ${formErrors.duration ? "input-error" : ""}`}
                      />
                    </div>
                    {formErrors.duration && <p className="text-xs text-error mt-1">{formErrors.duration}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary dark:text-text-dark-primary mb-1.5">
                      Price (GH₵) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-dark-muted" />
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        min={0}
                        className={`input-field text-sm w-full pl-9 ${formErrors.price ? "input-error" : ""}`}
                      />
                    </div>
                    {formErrors.price && <p className="text-xs text-error mt-1">{formErrors.price}</p>}
                  </div>
                </div>

                {modalMode === "edit" && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-surface-dark-tertiary">
                    <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                      formData.isActive === false ? "bg-gray-300 dark:bg-gray-600" : "bg-stylist-500"
                    }`}
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      role="switch"
                      aria-checked={formData.isActive !== false}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFormData(prev => ({ ...prev, isActive: !prev.isActive })); } }}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.isActive === false ? "left-0.5" : "left-[18px]"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">
                        {formData.isActive === false ? "Service is paused" : "Service is active"}
                      </p>
                      <p className="text-caption text-text-muted dark:text-text-dark-muted">
                        {formData.isActive === false ? "Clients cannot book this service" : "Clients can see and book this service"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 flex items-center gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-surface-dark-tertiary rounded-b-2xl">
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  className="flex-1 h-12 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={savingForm}
                  className="flex-1 h-12 text-sm font-semibold gap-2"
                >
                  {savingForm ? null : <Check size={16} />}
                  {modalMode === "add" ? "Add Service" : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setDeleteTarget(null)}
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-sm bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-modal p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-error" />
              </div>
              <h3 className="text-lg font-bold text-text-primary dark:text-text-dark-primary font-display mb-1">Delete Service</h3>
              <p className="text-sm text-text-secondary dark:text-text-dark-secondary mb-6">
                Are you sure you want to delete <span className="font-semibold text-text-primary dark:text-text-dark-primary">{deleteTarget.name}</span>? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 h-12 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  className="flex-1 h-12 text-sm font-semibold gap-2"
                >
                  {deleting ? null : <Trash2 size={16} />}
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
