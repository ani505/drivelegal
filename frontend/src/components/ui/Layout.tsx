import React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-surface-950 transition-colors duration-300">
    <Navbar />
    <main className="flex-1 pt-16">
      {children}
    </main>
    <Footer />
    <ThemeToggle />
  </div>
);
