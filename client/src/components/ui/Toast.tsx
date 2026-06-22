import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'bg-white dark:bg-surface-dark-secondary border-l-4 border-l-success shadow-elevated',
  error: 'bg-white dark:bg-surface-dark-secondary border-l-4 border-l-error shadow-elevated',
  warning: 'bg-white dark:bg-surface-dark-secondary border-l-4 border-l-warning shadow-elevated',
  info: 'bg-white dark:bg-surface-dark-secondary border-l-4 border-l-info shadow-elevated',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

interface ToastContextValue {
  toast: (type: ToastType, message: string, description?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((type: ToastType, message: string, description?: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, description, duration }]);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(t.id), 200);
  }, [t.id, onRemove]);

  useEffect(() => {
    if (t.duration && t.duration > 0) {
      timerRef.current = setTimeout(handleClose, t.duration);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [t.duration, handleClose]);

  const Icon = icons[t.type];

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-elevated',
        styles[t.type],
        exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0',
        'transition-all duration-200 ease-out',
      )}
      style={{ animation: 'slideUp 0.25s ease-out' }}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconColors[t.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary dark:text-text-dark-primary">{t.message}</p>
        {t.description && (
          <p className="text-xs text-text-secondary dark:text-text-dark-secondary mt-0.5">{t.description}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 p-0.5 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
