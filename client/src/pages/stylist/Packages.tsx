import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Package, DollarSign, Clock, Users, Trash2, Edit3, X } from 'lucide-react';
import { getMyPackages, createPackage, updatePackage, deletePackage, getPackagePurchases } from '../../api/packages';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editForm, setEditForm] = useState<any>({ name: '', description: '', price: 0, totalSessions: 1, expiryDays: 90, popular: false, services: [] });
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'packages' | 'purchases'>('packages');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgData, purchData] = await Promise.all([getMyPackages(), getPackagePurchases()]);
      setPackages(pkgData);
      setPurchases(purchData);
    } catch { setError('Failed to load data'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editForm.name || editForm.price <= 0 || !editForm.totalSessions) {
      setError('Name, price, and sessions are required'); return;
    }
    setSaving(true);
    try {
      if (editing) await updatePackage(editing, editForm);
      else await createPackage(editForm);
      setShowAdd(false); setEditing(null); loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Packages</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Create prepaid service packages for your clients</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditing(null); setEditForm({ name: '', description: '', price: 0, totalSessions: 1, expiryDays: 90, popular: false, services: [] }); }} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> New Package
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-error/10 border border-error/20">
          <AlertCircle size={14} className="text-error shrink-0" />
          <p className="text-xs font-medium text-error flex-1">{error}</p>
          <button onClick={() => setError('')} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shrink-0">
            <X size={13} className="text-error" />
          </button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl p-1 w-fit">
        <button onClick={() => setTab('packages')} className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${tab === 'packages' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Package className="w-3 h-3 inline mr-1" /> Packages
        </button>
        <button onClick={() => setTab('purchases')} className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${tab === 'purchases' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Users className="w-3 h-3 inline mr-1" /> Purchases
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 skeleton-pulse" />
          ))}
        </div>
      ) : tab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.length === 0 ? (
            <Card elevated padding="none" className="col-span-full overflow-hidden">
              <div className="text-center py-16">
                <Package className="w-12 h-12 mx-auto mb-3 text-text-muted dark:text-text-dark-muted" />
                <p className="text-text-muted dark:text-text-dark-muted text-sm">No packages created yet</p>
              </div>
            </Card>
          ) : packages.map(pkg => (
            <Card key={pkg._id} padding="md" hover className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text-primary dark:text-text-dark-primary truncate">{pkg.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5 line-clamp-2">{pkg.description}</p>
                </div>
                {pkg.popular && <span className="badge-warning shrink-0 ml-2">Popular</span>}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="font-bold text-lg text-text-primary dark:text-text-dark-primary">GH₵{pkg.price}</span>
                <span className="flex items-center gap-1 text-text-secondary dark:text-text-dark-secondary"><Clock className="w-3 h-3" /> {pkg.totalSessions} sessions</span>
              </div>
              <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1">Expires in {pkg.expiryDays} days</p>
              <div className="mt-auto pt-3 flex gap-2">
                <Button onClick={() => { setEditing(pkg._id); setEditForm(pkg); setShowAdd(true); }} variant="secondary" size="sm" className="flex-1"><Edit3 className="w-3 h-3" /> Edit</Button>
                <Button onClick={() => { if (confirm('Delete this package?')) deletePackage(pkg._id).then(loadData); }} variant="danger" size="sm"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card elevated padding="none" className="overflow-hidden">
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-2 text-text-muted dark:text-text-dark-muted" />
              <p className="text-sm text-text-muted dark:text-text-dark-muted">No package purchases yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark-tertiary">
                  <tr><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Package</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Sessions</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Paid</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {purchases.map((p: any) => (
                    <tr key={p._id} className="border-t border-gray-100 dark:border-gray-700/40">
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{p.clientId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{p.packageId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{p.remainingSessions}/{p.totalSessions}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">GH₵{p.amountPaid}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`badge ${
                          p.status === 'active' ? 'badge-success' : p.status === 'completed' ? 'badge-info' : 'badge-error'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <Card padding="lg" className="w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-4">{editing ? 'Edit Package' : 'New Package'}</h2>
            <div className="space-y-3">
              <div>
                <label className="label-secondary">Package Name *</label>
                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field-sm mt-1" />
              </div>
              <div>
                <label className="label-secondary">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="input-field-sm mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-secondary">Price (GH₵) *</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    className="input-field-sm mt-1" />
                </div>
                <div>
                  <label className="label-secondary">Total Sessions *</label>
                  <input type="number" value={editForm.totalSessions} onChange={e => setEditForm({ ...editForm, totalSessions: Number(e.target.value) })}
                    className="input-field-sm mt-1" />
                </div>
                <div>
                  <label className="label-secondary">Expiry (days)</label>
                  <input type="number" value={editForm.expiryDays} onChange={e => setEditForm({ ...editForm, expiryDays: Number(e.target.value) })}
                    className="input-field-sm mt-1" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-primary dark:text-text-dark-primary">
                <input type="checkbox" checked={editForm.popular} onChange={e => setEditForm({ ...editForm, popular: e.target.checked })}
                  className="rounded border-gray-200 dark:border-gray-600 text-brand-500 focus:ring-brand-500" />
                Mark as popular
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => { setShowAdd(false); setEditing(null); }} variant="secondary" size="md" className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} variant="primary" size="md" className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Create Package')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
