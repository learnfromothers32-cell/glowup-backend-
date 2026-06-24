import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Users, Calendar, Clock, Bell, Trash2, X, RefreshCw } from 'lucide-react';
import { getMyWaitlist, notifyWaitlistEntry, removeWaitlistEntry } from '../../api/waitlist';

export default function Waitlist() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => { loadEntries(); }, [filter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getMyWaitlist(filter || undefined);
      setEntries(data);
    } catch { setError('Failed to load'); } finally { setLoading(false); }
  };

  const handleNotify = async (id: string) => {
    try {
      await notifyWaitlistEntry(id);
      loadEntries();
    } catch { setError('Failed to notify'); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this entry?')) return;
    try { await removeWaitlistEntry(id); loadEntries(); } catch { setError('Failed to remove'); }
  };

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-700',
    notified: 'bg-blue-100 text-blue-700',
    booked: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Waitlist</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Clients waiting for appointment availability</p>
        </div>
        <button onClick={loadEntries} className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary self-end"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-50 dark:bg-surface-dark-tertiary rounded-xl p-1 overflow-x-auto">
        {['', 'waiting', 'notified', 'booked'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors whitespace-nowrap ${filter === s ? 'bg-white dark:bg-surface-dark-secondary shadow-sm' : 'text-text-secondary dark:text-text-dark-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-text-muted dark:text-text-dark-muted" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-muted dark:text-text-dark-muted"><Users className="w-12 h-12 mx-auto mb-3" /><p>No waitlist entries</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map(entry => (
            <div key={entry._id} className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {entry.clientId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-text-primary dark:text-text-dark-primary truncate">{entry.clientId?.name || 'Unknown'}</h3>
                    <p className="text-xs text-text-secondary dark:text-text-dark-secondary truncate">{entry.clientId?.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${statusColors[entry.status] || 'bg-gray-100'}`}>{entry.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary dark:text-text-dark-secondary">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {new Date(entry.preferredDate).toLocaleDateString()}</span>
                {entry.preferredTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" /> {entry.preferredTime}</span>}
                <span className="truncate">{entry.serviceId?.name || 'Any service'}</span>
              </div>
              {entry.notes && <p className="text-xs text-text-muted dark:text-text-dark-muted mt-2 line-clamp-2">{entry.notes}</p>}
              <div className="mt-3 flex gap-2">
                {entry.status === 'waiting' && (
                  <button onClick={() => handleNotify(entry._id)}
                    className="flex items-center gap-1 text-xs bg-stylist-50 text-stylist-600 hover:bg-stylist-500 hover:text-white px-3 py-1.5 rounded-xl transition-colors min-h-[32px]">
                    <Bell className="w-3 h-3 shrink-0" /> Notify Client
                  </button>
                )}
                <button onClick={() => handleRemove(entry._id)}
                  className="text-xs text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 min-h-[32px]">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
