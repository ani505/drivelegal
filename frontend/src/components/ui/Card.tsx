import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children:   React.ReactNode;
  className?: string;
  hover?:     boolean;
  glow?:      boolean;
  padding?:   'none' | 'sm' | 'md' | 'lg';
  onClick?:   () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover   = false,
  glow    = false,
  padding = 'md',
  onClick,
}) => {
  const paddings = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass',
        paddings[padding],
        hover && 'transition-all duration-300 hover:bg-slate-100 dark:hover:bg-surface-700/60 hover:border-slate-300 dark:hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-card-lg',
        glow  && 'hover:shadow-glow-sm',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
};
