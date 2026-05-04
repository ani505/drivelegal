'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  Scale, MessageSquare, AlertTriangle, Upload,
  Map, User, Briefcase, FileText, Menu, X, Globe, LogOut,
  Link2, Camera, Trophy, HardHat,
} from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from './Button';

const NAV_LINKS = [
  { href: '/chat',         label: 'AI Chat',    icon: MessageSquare },
  { href: '/violations',   label: 'Violations', icon: AlertTriangle },
  { href: '/upload',       label: 'Upload',     icon: Upload },
  { href: '/map',          label: 'Map',        icon: Map },
  { href: '/lawyers',      label: 'Lawyers',    icon: Briefcase },
  { href: '/appeal',       label: 'Appeal',     icon: FileText },
  { href: '/vision',       label: 'CV Vision',  icon: Camera },
  { href: '/roadwatch',    label: 'RoadWatch',  icon: HardHat },
  { href: '/blockchain',   label: 'Blockchain', icon: Link2 },
  { href: '/gamification', label: 'Rewards',    icon: Trophy },
  { href: '/profile',      label: 'Profile',    icon: User },
];

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' },
];

export const Navbar: React.FC = () => {
  const router                             = useRouter();
  const [mobileOpen, setMobileOpen]        = useState(false);
  const [scrolled, setScrolled]            = useState(false);
  const { countryCode, countryName, setCountry } = useLocationStore();
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-surface-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm'
          : 'bg-transparent',
      )}
    >
      <nav className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            Drive<span className="gradient-text">Legal</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                router.pathname === href
                  ? 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-surface-700',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Country picker */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-surface-800 border border-slate-200 dark:border-white/8 rounded-lg px-2.5 py-1.5 transition-colors">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <select
              id="navbar-country-select"
              value={countryCode}
              onChange={(e) => {
                const c = COUNTRIES.find((c) => c.code === e.target.value);
                if (c) setCountry(c.code, c.name);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none cursor-pointer"
              aria-label="Select jurisdiction"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-surface-800 text-slate-900 dark:text-slate-100">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auth section */}
          <div className="hidden lg:flex items-center gap-2 ml-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/10">
                <Link href="/profile" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-surface-700 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400 border border-primary-500/20">
                    {user?.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="max-w-[100px] truncate">{user?.full_name}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-surface-700 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/98 dark:bg-surface-950/98 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 animate-fade-in shadow-lg">
          <div className="px-4 py-4 flex flex-col gap-1">
            {/* Mobile Auth */}
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Link href="/login" className="w-full">
                  <Button variant="secondary" size="sm" className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup" className="w-full">
                  <Button variant="primary" size="sm" className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
            {/* Mobile country picker */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-slate-100 dark:bg-surface-800 rounded-lg border border-slate-200 dark:border-white/8">
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <select
                value={countryCode}
                onChange={(e) => {
                  const c = COUNTRIES.find((c) => c.code === e.target.value);
                  if (c) setCountry(c.code, c.name);
                }}
                className="bg-transparent text-slate-700 dark:text-slate-300 text-sm focus:outline-none flex-1"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-surface-800">
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  router.pathname === href
                    ? 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-surface-700',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
