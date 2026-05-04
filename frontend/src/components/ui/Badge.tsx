import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'minor' | 'moderate' | 'major' | 'criminal' | 'info' | 'success';
  size?:    'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size    = 'sm',
  className,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    default:  'bg-slate-200 dark:bg-surface-600 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10',
    minor:    'badge-minor',
    moderate: 'badge-moderate',
    major:    'badge-major',
    criminal: 'badge-criminal',
    info:     'bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/25',
    success:  'bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-400 border border-green-500/20 dark:border-green-500/25',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={clsx(base, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
