import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  brand: 'badge-brand',
  stylist: 'badge-stylist',
  gray: 'badge-gray',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  pill?: boolean;
}

export function Badge({ variant = 'gray', children, className, dot, pill }: BadgeProps) {
  return (
    <span
      className={cn(
        variants[variant],
        pill ? 'rounded-full px-3 py-1' : 'rounded-md px-2 py-0.5',
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />}
      {children}
    </span>
  );
}
