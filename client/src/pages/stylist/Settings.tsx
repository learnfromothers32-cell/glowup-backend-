import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Palette, Sun, Moon, Monitor, AlertCircle, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { logger } from '../../utils/logger';
import { getMyStylistSettings, updateMyStylistSettings } from '../../api/settings';
import { Button } from '../../components/ui/Button';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    newBooking: true, cancellationAlert: true, reviewNotify: true, marketingEmails: false, reminderEmails: true
  });
  const [privacy, setPrivacy] = useState({
    showInSearch: true, showEmailToClients: false, showPhoneToClients: false
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getMyStylistSettings();
      setNotifications(data.notifications || notifications);
      setPrivacy(data.privacy || privacy);
    } catch {
      logger.error('Could not load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateMyStylistSettings({ notifications, privacy });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="h-7 w-24 skeleton-pulse rounded mb-1" />
        <div className="h-4 w-48 skeleton-pulse rounded mb-6" />
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl bg-white dark:bg-surface-dark-secondary border border-gray-100 dark:border-gray-700/40 p-4 skeleton-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display mb-1">Settings</h1>
      <p className="text-text-secondary dark:text-text-dark-secondary text-sm mb-6">Manage your account preferences</p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-2xl bg-error/10 border border-error/20 text-error text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-6">
        <div className="card p-4 sm:p-5">
          <h3 className="font-medium text-text-primary dark:text-text-dark-primary flex items-center gap-2 mb-4"><Bell className="w-4 h-4" /> Notifications</h3>
          <div className="space-y-3">
            {[
              { key: 'newBooking', label: 'New booking alerts' },
              { key: 'cancellationAlert', label: 'Cancellation alerts' },
              { key: 'reviewNotify', label: 'Review notifications' },
              { key: 'marketingEmails', label: 'Marketing emails' },
              { key: 'reminderEmails', label: 'Appointment reminder emails' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-sm text-text-primary dark:text-text-dark-primary">{item.label}</span>
                <input type="checkbox" checked={(notifications as any)[item.key]}
                  onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  className="rounded border-gray-200 dark:border-gray-600 text-brand-500 focus:ring-brand-500 shrink-0" />
              </label>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="font-medium text-text-primary dark:text-text-dark-primary flex items-center gap-2 mb-4"><Shield className="w-4 h-4" /> Privacy</h3>
          <div className="space-y-3">
            {[
              { key: 'showInSearch', label: 'Show profile in search results' },
              { key: 'showEmailToClients', label: 'Show email to clients' },
              { key: 'showPhoneToClients', label: 'Show phone to clients' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-sm text-text-primary dark:text-text-dark-primary">{item.label}</span>
                <input type="checkbox" checked={(privacy as any)[item.key]}
                  onChange={e => setPrivacy({ ...privacy, [item.key]: e.target.checked })}
                  className="rounded border-gray-200 dark:border-gray-600 text-brand-500 focus:ring-brand-500 shrink-0" />
              </label>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="font-medium text-text-primary dark:text-text-dark-primary flex items-center gap-2 mb-4"><Palette className="w-4 h-4" /> Appearance</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: 'light', icon: Sun, label: 'Light' },
              { key: 'dark', icon: Moon, label: 'Dark' },
              { key: 'system', icon: Monitor, label: 'System' },
            ].map(option => (
              <button key={option.key} onClick={() => setTheme(option.key as any)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 rounded-xl border text-xs sm:text-sm transition-colors min-h-[44px] ${
                  theme === option.key
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-gray-600 text-text-secondary dark:text-text-dark-secondary hover:border-gray-300 dark:hover:border-gray-500'
                }`}>
                <option.icon className="w-4 h-4 shrink-0" /> <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </motion.div>
  );
}
