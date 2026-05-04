'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import clsx from 'clsx';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={clsx(
        'fixed bottom-6 left-6 z-[100] w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-glow-md border',
        isDark 
          ? 'bg-surface-800 border-white/10 text-amber-400 hover:bg-surface-700 hover:scale-110 active:scale-95' 
          : 'bg-white border-slate-200 text-primary-600 hover:bg-slate-50 hover:scale-110 active:scale-95 shadow-lg'
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 animate-slide-up" />
      ) : (
        <Moon className="w-5 h-5 animate-slide-up" />
      )}
    </button>
  );
};
