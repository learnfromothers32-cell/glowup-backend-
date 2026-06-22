import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'btn-primary',
  secondary:
    'btn-secondary',
  ghost:
    'btn-ghost',
  'ghost-gray':
    'btn-ghost-gray',
  danger:
    'btn-danger',
  gold:
    'btn-gold',
  outline:
    'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500 dark:text-brand-400 dark:hover:bg-brand-950/20',
};

const sizes = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'btn',
        variants[variant],
        sizes[size],
        icon && 'p-0 aspect-square',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
