import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getMyTransactions } from '../../api/payments';

const statusConfig: Record<string, { icon: any; colorClass: string; bgClass: string; label: string }> = {
  success: { icon: CheckCircle, colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-100 dark:bg-green-900/30', label: 'Paid' },
  failed: { icon: XCircle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' },
  pending: { icon: Clock, colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' },
};

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { setTransactions(await getMyTransactions()); }
      catch { /* ignore */ }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-bold mb-6 font-display text-text-primary dark:text-text-dark-primary">
        Payment History
      </h1>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40">
              <div className="w-10 h-10 rounded-xl skeleton-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 skeleton-pulse rounded" />
                <div className="h-3 w-32 skeleton-pulse rounded" />
              </div>
              <div className="h-6 w-16 skeleton-pulse rounded-full" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20">
          <Wallet size={40} className="mx-auto mb-4 text-text-muted dark:text-text-dark-muted" />
          <p className="text-sm text-text-muted dark:text-text-dark-muted">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => {
            const cfg = statusConfig[tx.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={tx._id} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bgClass}`}>
                  <Icon size={18} className={cfg.colorClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary dark:text-text-dark-primary">GH₵ {tx.amount?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-text-muted dark:text-text-dark-muted">
                    {tx.reference || tx._id?.slice(-8)} • {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bgClass} ${cfg.colorClass}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
