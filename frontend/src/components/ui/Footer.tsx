import React from 'react';
import Link from 'next/link';
import { Scale, Heart } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-surface-950/60 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Scale className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white">
            Drive<span className="gradient-text">Legal</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link href="/violations" className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Violations</Link>
          <Link href="/chat"       className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">AI Chat</Link>
          <Link href="/appeal"     className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Appeals</Link>
          <Link href="/lawyers"    className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors">Lawyers</Link>
        </div>

        {/* Tagline */}
        <p className="text-xs text-slate-400 dark:text-slate-600 flex items-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-500" /> for Road Safety Hackathon 2026 · IIT Madras
        </p>
      </div>
    </div>
  </footer>
);
