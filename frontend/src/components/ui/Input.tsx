import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  icon?:    React.ReactNode;
  suffix?:  React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  suffix,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full bg-white dark:bg-surface-800 border border-slate-200 dark:border-white/8 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
            'focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20',
            'transition-all duration-200 text-sm',
            icon   ? 'pl-9 pr-4 py-2.5' : 'px-4 py-2.5',
            suffix ? 'pr-10' : '',
            error  ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20' : '',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
};
