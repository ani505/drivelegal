import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8f',
        },
        // Dark backgrounds
        surface: {
          950: '#060a12',
          900: '#0d1117',
          800: '#161c26',
          700: '#1e2535',
          600: '#252d3d',
          500: '#2e3750',
        },
        // Semantic
        success:  '#22c55e',
        warning:  '#f59e0b',
        danger:   '#ef4444',
        info:     '#38bdf8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace'],
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.25), transparent)',
        'card-glow': 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.04) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'glow':        'glow 2s ease-in-out infinite alternate',
        'typewriter':  'typewriter 0.05s steps(1) forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float:   { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        glow:    { from: { boxShadow: '0 0 20px rgba(59,130,246,0.3)' }, to: { boxShadow: '0 0 40px rgba(59,130,246,0.6)' } },
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.5)',
        'glow-sm': '0 0 20px rgba(59,130,246,0.25)',
        'glow-md': '0 0 40px rgba(59,130,246,0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
