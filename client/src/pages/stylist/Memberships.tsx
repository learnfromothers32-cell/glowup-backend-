import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Crown, Users, Clock, DollarSign, Trash2, Edit3, X } from 'lucide-react';
import { getMyTiers, createTier, updateTier, deleteTier, getMySubscribers } from '../../api/memberships';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function Memberships() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({ name: '', description: '', price: 0, billingCycle: 'monthly', benefits: [], discountPercent: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'tiers' | 'subscribers'>('tiers');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tierData, subData] = await Promise.all([getMyTiers(), getMySubscribers()]);
      setTiers(tierData);
      setSubscribers(subData);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!editForm.name || editForm.price <= 0) { setError('Name and price required'); return; }
    setSaving(true);
    try {
      if (editing) await updateTier(editing, editForm);
      else await createTier(editForm);
      setShowAdd(false); setEditing(null); loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Memberships</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Reccuring subscription plans for loyal clients</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditing(null); setEditForm({ name: '', description: '', price: 0, billingCycle: 'monthly', benefits: [], discountPercent: 0 }); }} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> New Tier
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
        <button onClick={() => setTab('tiers')} className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${tab === 'tiers' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Crown className="w-3 h-3 inline mr-1" /> Membership Tiers
        </button>
        <button onClick={() => setTab('subscribers')} className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${tab === 'subscribers' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm text-text-primary dark:text-text-dark-primary' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Users className="w-3 h-3 inline mr-1" /> Subscribers
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 skeleton-pulse" />
          ))}
        </div>
      ) : tab === 'tiers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tiers.length === 0 ? (
            <Card elevated padding="none" className="col-span-full overflow-hidden">
              <div className="text-center py-16">
                <Crown className="w-12 h-12 mx-auto mb-3 text-text-muted dark:text-text-dark-muted" />
                <p className="text-text-muted dark:text-text-dark-muted text-sm">No membership tiers created yet</p>
              </div>
            </Card>
          ) : tiers.map(tier => (
            <Card key={tier._id} padding="md" hover className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text-primary dark:text-text-dark-primary truncate">{tier.name}</h3>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5 line-clamp-2">{tier.description}</p>
                </div>
                {tier.isActive ? (
                  <span className="badge-success shrink-0 ml-2">Active</span>
                ) : (
                  <span className="badge-gray shrink-0 ml-2">Inactive</span>
                )}
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-text-primary dark:text-text-dark-primary">GH₵{tier.price}</span>
                <span className="text-sm text-text-secondary dark:text-text-dark-secondary">/{tier.billingCycle}</span>
              </div>
              {tier.discountPercent > 0 && (
                <p className="text-xs text-success mt-1">{tier.discountPercent}% discount on all services</p>
              )}
              {tier.benefits?.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {tier.benefits.map((b: string, i: number) => (
                    <li key={i} className="text-xs text-text-secondary dark:text-text-dark-secondary flex items-center gap-1">
                      <span className="text-success">&#10003;</span> {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-3 flex gap-2">
                <Button onClick={() => { setEditing(tier._id); setEditForm(tier); setShowAdd(true); }} variant="secondary" size="sm" className="flex-1"><Edit3 className="w-3 h-3" /> Edit</Button>
                <Button onClick={() => { if (confirm('Delete this tier?')) deleteTier(tier._id).then(loadData); }} variant="danger" size="sm"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card elevated padding="none" className="overflow-hidden">
          {subscribers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-2 text-text-muted dark:text-text-dark-muted" />
              <p className="text-sm text-text-muted dark:text-text-dark-muted">No subscribers yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark-tertiary">
                  <tr><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Client</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Plan</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Billing</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Next Payment</th><th className="text-left p-3 text-text-secondary dark:text-text-dark-secondary font-medium whitespace-nowrap">Status</th></tr>
                </thead>
                <tbody>
                  {subscribers.map((s: any) => (
                    <tr key={s._id} className="border-t border-gray-100 dark:border-gray-700/40">
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{s.clientId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{s.tierId?.name || 'Unknown'}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">GH₵{s.tierId?.price}/{s.tierId?.billingCycle}</td>
                      <td className="p-3 whitespace-nowrap text-text-primary dark:text-text-dark-primary">{s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : '-'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`badge ${
                          s.status === 'active' ? 'badge-success' : s.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                        }`}>{s.status}</span>
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
            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-4">{editing ? 'Edit Tier' : 'New Membership Tier'}</h2>
            <div className="space-y-3">
              <div>
                <label className="label-secondary">Tier Name *</label>
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
                  <label className="label-secondary">Billing Cycle</label>
                  <select value={editForm.billingCycle} onChange={e => setEditForm({ ...editForm, billingCycle: e.target.value })}
                    className="input-field-sm mt-1">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="label-secondary">Discount %</label>
                  <input type="number" value={editForm.discountPercent} onChange={e => setEditForm({ ...editForm, discountPercent: Number(e.target.value) })}
                    className="input-field-sm mt-1" />
                </div>
              </div>
              <div>
                <label className="label-secondary">Benefits (one per line)</label>
                <textarea value={editForm.benefits.join('\n')} onChange={e => setEditForm({ ...editForm, benefits: e.target.value.split('\n').filter(Boolean) })}
                  className="input-field-sm mt-1" rows={3} placeholder="Free consultation&#10;10% off products&#10;Priority booking" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => { setShowAdd(false); setEditing(null); }} variant="secondary" size="md" className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} variant="primary" size="md" className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Create Tier')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
