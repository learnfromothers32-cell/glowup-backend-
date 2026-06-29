import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Scissors, CalendarDays, X, Loader2, ExternalLink } from 'lucide-react';
import { getConsumerWaitlist, cancelConsumerEntry } from '../../api/waitlist';
import { Link } from 'react-router-dom';

interface WaitlistEntry {
  _id: string;
  stylistId: { _id: string; name: string; image?: string };
  serviceId: { _id: string; name: string; duration: number; price: number };
  preferredDate: string;
  preferredTime: string;
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';
  notified: boolean;
  notes: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  waiting: { label: 'Waiting', classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600' },
  notified: { label: 'Spot Available!', classes: 'bg-green-50 dark:bg-green-500/10 text-green-600' },
  booked: { label: 'Booked', classes: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
  expired: { label: 'Expired', classes: 'bg-gray-50 dark:bg-gray-700/30 text-gray-500' },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50 dark:bg-red-500/10 text-red-500' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diffMs = now - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export default function Waitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getConsumerWaitlist(filter === 'all' ? undefined : filter)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await cancelConsumerEntry(id);
      setEntries(prev => prev.map(e => e._id === id ? { ...e, status: 'cancelled' } : e));
    } catch {
      /* ignore */
    }
    setCancelling(null);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'waiting', label: 'Waiting' },
    { key: 'notified', label: 'Available' },
    { key: 'booked', label: 'Booked' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Waitlist
        </h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-text-dark-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700/40 p-5 space-y-3">
              <div className="h-5 w-48 skeleton-pulse rounded" />
              <div className="h-4 w-32 skeleton-pulse rounded" />
              <div className="h-4 w-24 skeleton-pulse rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <Clock size={40} className="mx-auto mb-4 text-text-muted dark:text-text-dark-muted" />
          <p className="text-text-muted dark:text-text-dark-muted text-sm mb-2">No waitlist entries</p>
          <Link to="/app/browse" className="text-brand-500 text-sm font-medium hover:underline">
            Browse stylists
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const sc = statusConfig[entry.status] || statusConfig.waiting;
            const canCancel = entry.status === 'waiting';
            return (
              <div
                key={entry._id}
                className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-surface-dark-secondary p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Link
                        to={`/app/stylist/${entry.stylistId._id}`}
                        className="font-semibold text-text-primary dark:text-text-dark-primary hover:text-brand-500 transition-colors truncate"
                      >
                        {entry.stylistId.name}
                      </Link>
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${sc.classes}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary dark:text-text-dark-secondary">
                      <span className="flex items-center gap-1.5">
                        <Scissors size={13} />
                        {entry.serviceId?.name || 'Service'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {formatDate(entry.preferredDate)}
                      </span>
                      {entry.preferredTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {entry.preferredTime}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted dark:text-text-dark-muted mt-2">
                      Joined {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.notified && entry.status === 'notified' && (
                      <Link
                        to={`/app/stylist/${entry.stylistId._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                      >
                        <ExternalLink size={12} />
                        Book Now
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(entry._id)}
                        disabled={cancelling === entry._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {cancelling === entry._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={12} />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
