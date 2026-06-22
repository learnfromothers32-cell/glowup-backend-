import { cn } from '../../utils/cn';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  ring?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
  '2xl': 'h-28 w-28 text-4xl',
};

const statusColors = {
  online: 'bg-success',
  offline: 'bg-gray-400 dark:bg-gray-500',
  away: 'bg-warning',
  busy: 'bg-error',
};

const statusSizes = {
  sm: 'h-2.5 w-2.5 ring-1',
  md: 'h-3 w-3 ring-2',
  lg: 'h-3.5 w-3.5 ring-2',
  xl: 'h-4 w-4 ring-2',
  '2xl': 'h-5 w-5 ring-2',
};

const iconSizes = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  '2xl': 40,
};

function getInitials(name?: string) {
  if (!name) return null;
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const bgColors = [
  'bg-gradient-to-br from-brand-500 to-brand-600',
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-green-500 to-emerald-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-teal-500 to-teal-600',
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-indigo-500 to-indigo-600',
];

function getColor(name?: string) {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ src, name, size = 'md', className, ring, status }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className={cn('relative shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={cn(
            'rounded-full object-cover',
            ring && 'ring-2 ring-brand-200 dark:ring-brand-800',
            sizeMap[size],
          )}
        />
      ) : initials ? (
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-white font-semibold',
            ring && 'ring-2 ring-brand-200 dark:ring-brand-800',
            getColor(name),
            sizeMap[size],
          )}
        >
          {initials}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
            ring && 'ring-2 ring-gray-200 dark:ring-gray-700',
            sizeMap[size],
          )}
        >
          <User size={iconSizes[size]} />
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white dark:ring-surface-dark-secondary',
            statusColors[status],
            statusSizes[size],
          )}
        />
      )}
    </div>
  );
}
