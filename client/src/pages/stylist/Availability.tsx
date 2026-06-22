import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2, AlertCircle } from 'lucide-react';
import { getMyAvailability, updateMyAvailability } from '../../api/availability';
import type { DaySchedule } from '../../api/availability';
import { Button } from '../../components/ui/Button';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const defaultSchedule = (): Record<string, DaySchedule> => {
  const s: Record<string, DaySchedule> = {};
  DAYS.forEach(day => {
    s[day] = { enabled: day !== 'sunday', start: '09:00', end: '17:00', breaks: [] };
  });
  return s;
};

export default function Availability() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule());
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await getMyAvailability();
      if (data.schedule) setSchedule(data.schedule);
      if (data.bufferMinutes !== undefined) setBufferMinutes(data.bufferMinutes);
    } catch {
      setError('Could not load availability');
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (day: string, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const addBreak = (day: string) => {
    const breaks = schedule[day].breaks || [];
    updateDay(day, { breaks: [...breaks, { start: '12:00', end: '13:00' }] });
  };

  const removeBreak = (day: string, idx: number) => {
    const breaks = schedule[day].breaks || [];
    updateDay(day, { breaks: breaks.filter((_: any, i: number) => i !== idx) });
  };

  const updateBreak = (day: string, idx: number, field: 'start' | 'end', value: string) => {
    const breaks = [...(schedule[day].breaks || [])];
    breaks[idx] = { ...breaks[idx], [field]: value };
    updateDay(day, { breaks });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await updateMyAvailability({ schedule, bufferMinutes });
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
      <div className="space-y-3">
        <div className="h-8 w-48 skeleton-pulse rounded" />
        <div className="h-4 w-72 skeleton-pulse rounded" />
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden">
          <div className="h-12 skeleton-pulse" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-16 skeleton-pulse border-t border-gray-100 dark:border-gray-700/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Availability</h1>
          <p className="text-text-secondary dark:text-text-dark-secondary text-sm mt-1">Set your weekly working hours and breaks</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          loading={saving}
          className="w-full sm:w-auto"
        >
          {saved ? 'Saved!' : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-surface-dark-tertiary border-b border-gray-100 dark:border-gray-700/40 flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted dark:text-text-dark-muted" />
          <span className="text-sm font-medium text-text-primary dark:text-text-dark-primary">Weekly Schedule</span>
        </div>

        <div className="p-4 space-y-3">
          {DAYS.map(day => {
            const d = schedule[day] || { enabled: false, start: '09:00', end: '17:00', breaks: [] };
            return (
              <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl transition-colors ${d.enabled ? 'bg-white dark:bg-surface-dark-secondary' : 'bg-gray-50 dark:bg-surface-dark-tertiary'}`}>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={d.enabled} onChange={e => updateDay(day, { enabled: e.target.checked })} />
                    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
                  </label>
                  <span className={`w-20 sm:w-28 text-sm font-medium ${d.enabled ? 'text-text-primary dark:text-text-dark-primary' : 'text-text-muted dark:text-text-dark-muted'}`}>{DAY_LABELS[day]}</span>
                </div>
                {d.enabled ? (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <input type="time" value={d.start} onChange={e => updateDay(day, { start: e.target.value })}
                      className="input-field-sm w-[110px]" />
                    <span className="text-text-muted dark:text-text-dark-muted">to</span>
                    <input type="time" value={d.end} onChange={e => updateDay(day, { end: e.target.value })}
                      className="input-field-sm w-[110px]" />
                    <button onClick={() => addBreak(day)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">+ Add break</button>
                  </div>
                ) : (
                  <span className="text-sm italic text-text-muted dark:text-text-dark-muted">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700/40 p-4">
          <h3 className="text-sm font-medium text-text-primary dark:text-text-dark-primary mb-2">Breaks</h3>
          {DAYS.map(day => {
            const breaks = schedule[day]?.breaks || [];
            return breaks.length > 0 ? (
              <div key={`break-${day}`} className="flex flex-col sm:flex-row sm:items-center gap-1 mb-2">
                <span className="text-xs text-text-secondary dark:text-text-dark-secondary w-20 sm:w-28 shrink-0">{DAY_LABELS[day]}:</span>
                <div className="flex flex-wrap gap-1">
                  {breaks.map((b, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-surface-dark-tertiary px-2 py-0.5 rounded">
                      {b.start} – {b.end}
                      <button onClick={() => removeBreak(day, idx)} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="mt-4 bg-white dark:bg-surface-dark-secondary rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/40 p-4">
        <label className="text-sm font-medium text-text-primary dark:text-text-dark-primary">Buffer time between appointments (minutes)</label>
        <input type="number" value={bufferMinutes} onChange={e => setBufferMinutes(Math.max(0, Math.min(120, Number(e.target.value))))}
          className="mt-1 block w-full sm:w-32 input-field-sm" />
      </div>
    </motion.div>
  );
}
