import { useEffect, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  hideClose?: boolean;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function Modal({ open, onClose, title, subtitle, children, size = 'md', className, hideClose }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-modal',
          'dark:bg-surface-dark-secondary dark:border-0',
          sizes[size],
          className,
        )}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-700/40">
            <div className="min-w-0 flex-1">
              {title && <h2 className="text-h3 text-text-primary dark:text-text-dark-primary truncate">{title}</h2>}
              {subtitle && <p className="text-sm text-text-secondary dark:text-text-dark-secondary mt-0.5">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-gray-100 dark:hover:bg-surface-dark-tertiary transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className={cn('p-6 overflow-y-auto max-h-[75vh]', !title && hideClose && 'pt-6')}>{children}</div>
      </div>
    </div>
  );
}
