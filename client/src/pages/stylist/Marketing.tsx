import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, AlertCircle, Tag, Gift, Percent, Calendar, Users, Trash2, X, Copy, Check } from 'lucide-react';
import { getMyPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getMyGiftCards, createGiftCard } from '../../api/marketing';
import { Button } from '../../components/ui/Button';

export default function Marketing() {
  const [promos, setPromos] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'promos' | 'giftcards'>('promos');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({ code: '', description: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, maxUses: 0, maxUsesPerClient: 1, expiresAt: '' });
  const [giftForm, setGiftForm] = useState<any>({ initialBalance: 0, senderName: '', recipientEmail: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, g] = await Promise.all([getMyPromoCodes(), getMyGiftCards()]);
      setPromos(p);
      setGiftCards(g);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const handleCreatePromo = async () => {
    if (!editForm.code || editForm.discountValue <= 0) { setError('Code and discount value required'); return; }
    setSaving(true);
    try {
      await createPromoCode(editForm);
      setShowPromoModal(false);
      setEditForm({ code: '', description: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, maxUses: 0, maxUsesPerClient: 1, expiresAt: '' });
      loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to create'); } finally { setSaving(false); }
  };

  const handleCreateGiftCard = async () => {
    if (giftForm.initialBalance <= 0) { setError('Valid balance required'); return; }
    setSaving(true);
    try {
      await createGiftCard(giftForm);
      setShowGiftModal(false);
      setGiftForm({ initialBalance: 0, senderName: '', recipientEmail: '', message: '' });
      loadData();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to create'); } finally { setSaving(false); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Marketing</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Promo codes, gift cards, and campaigns</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl p-1 w-fit">
        <button onClick={() => setTab('promos')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'promos' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Percent className="w-3 h-3 inline mr-1" /> Promo Codes
        </button>
        <button onClick={() => setTab('giftcards')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'giftcards' ? 'bg-white dark:bg-surface-dark-secondary shadow-sm' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
          <Gift className="w-3 h-3 inline mr-1" /> Gift Cards
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-text-muted dark:text-text-dark-muted" /></div>
      ) : tab === 'promos' ? (
        <>
          <Button onClick={() => setShowPromoModal(true)}
            className="mb-4">
            <Plus className="w-4 h-4" /> New Promo Code
          </Button>
          {promos.length === 0 ? (
            <div className="text-center py-16 text-text-muted dark:text-text-dark-muted"><Tag className="w-12 h-12 mx-auto mb-3" /><p>No promo codes yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {promos.map(promo => (
                <div key={promo._id} className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg tracking-wide">{promo.code}</span>
                      <button onClick={() => copyToClipboard(promo.code, promo._id)} className="text-text-muted dark:text-text-dark-muted hover:text-text-secondary dark:hover:text-text-dark-secondary">
                        {copied === promo._id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-1">{promo.description}</p>
                  <div className="mt-2 font-medium">{promo.discountType === 'percentage' ? `${promo.discountValue}% off` : `GH₵${promo.discountValue} off`}</div>
                  <div className="mt-1 text-xs text-text-muted dark:text-text-dark-muted">
                    Used {promo.currentUses}{promo.maxUses > 0 ? `/${promo.maxUses}` : ''} times
                    {promo.expiresAt && ` • Expires ${new Date(promo.expiresAt).toLocaleDateString()}`}
                  </div>
                  <button onClick={() => { if (confirm('Delete this promo code?')) deletePromoCode(promo._id).then(loadData); }}
                    className="mt-3 text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Button onClick={() => setShowGiftModal(true)}
            className="mb-4">
            <Plus className="w-4 h-4" /> Issue Gift Card
          </Button>
          {giftCards.length === 0 ? (
            <div className="text-center py-16 text-text-muted dark:text-text-dark-muted"><Gift className="w-12 h-12 mx-auto mb-3" /><p>No gift cards issued</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {giftCards.map(gc => (
                <div key={gc._id} className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-sm font-medium">{gc.code}</span>
                      <p className="text-xs text-text-muted dark:text-text-dark-muted">To: {gc.recipientEmail || 'Unassigned'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${gc.status === 'active' ? 'bg-green-100 text-green-700' : gc.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {gc.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-lg font-bold">GH₵{gc.remainingBalance}</span>
                    <span className="text-xs text-text-muted dark:text-text-dark-muted ml-1">/ GH₵{gc.initialBalance}</span>
                  </div>
                  {gc.expiresAt && <p className="text-xs text-text-muted dark:text-text-dark-muted mt-1">Expires {new Date(gc.expiresAt).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPromoModal(false)}>
          <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-4">Create Promo Code</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Code *</label>
                  <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="SUMMER20" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Type</label>
                  <select value={editForm.discountType} onChange={e => setEditForm({ ...editForm, discountType: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Value *</label>
                  <input type="number" value={editForm.discountValue} onChange={e => setEditForm({ ...editForm, discountValue: Number(e.target.value) })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Min Booking Value</label>
                  <input type="number" value={editForm.minBookingValue} onChange={e => setEditForm({ ...editForm, minBookingValue: Number(e.target.value) })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Max Uses (0 = unlimited)</label>
                  <input type="number" value={editForm.maxUses} onChange={e => setEditForm({ ...editForm, maxUses: Number(e.target.value) })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Expires</label>
                  <input type="date" value={editForm.expiresAt} onChange={e => setEditForm({ ...editForm, expiresAt: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Description</label>
                <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowPromoModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreatePromo} disabled={saving} loading={saving} className="flex-1">Create Promo Code</Button>
            </div>
          </div>
        </div>
      )}

      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowGiftModal(false)}>
          <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text-primary dark:text-text-dark-primary mb-4">Issue Gift Card</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Balance (GH₵) *</label>
                <input type="number" value={giftForm.initialBalance} onChange={e => setGiftForm({ ...giftForm, initialBalance: Number(e.target.value) })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Recipient Email</label>
                <input type="email" value={giftForm.recipientEmail} onChange={e => setGiftForm({ ...giftForm, recipientEmail: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">From (your name)</label>
                <input value={giftForm.senderName} onChange={e => setGiftForm({ ...giftForm, senderName: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-text-secondary dark:text-text-dark-secondary">Message</label>
                <textarea value={giftForm.message} onChange={e => setGiftForm({ ...giftForm, message: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowGiftModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateGiftCard} disabled={saving} loading={saving} className="flex-1">Issue Gift Card</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
