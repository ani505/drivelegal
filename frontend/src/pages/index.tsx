import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import {
  MessageSquare, AlertTriangle, Upload, Map,
  FileText, Briefcase, Globe, Zap, Shield, ArrowRight,
  Scale, ChevronRight, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useLocationStore } from '@/store/locationStore';

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    id:    'ai-chat',
    icon:  MessageSquare,
    color: 'text-primary-400',
    bg:    'bg-primary-500/10 border-primary-500/20',
    title: 'AI Legal Assistant',
    desc:  'Ask anything about traffic laws in plain language. Get jurisdiction-specific answers citing real legal sections.',
    href:  '/chat',
    badge: 'Core Feature',
  },
  {
    id:    'violations',
    icon:  AlertTriangle,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/20',
    title: 'Violation Browser',
    desc:  'Explore the complete fine schedule for your country and state — filter by severity, category, or legal code.',
    href:  '/violations',
    badge: null,
  },
  {
    id:    'ocr-upload',
    icon:  Upload,
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/10 border-emerald-500/20',
    title: 'Citation OCR',
    desc:  'Photograph or upload your traffic ticket. Our AI extracts all key details and explains what you owe.',
    href:  '/upload',
    badge: null,
  },
  {
    id:    'map',
    icon:  Map,
    color: 'text-sky-400',
    bg:    'bg-sky-500/10 border-sky-500/20',
    title: 'Enforcement Map',
    desc:  'See live enforcement zones, speed camera locations, and active patrol areas on an interactive map.',
    href:  '/map',
    badge: null,
  },
  {
    id:    'appeal',
    icon:  FileText,
    color: 'text-violet-400',
    bg:    'bg-violet-500/10 border-violet-500/20',
    title: 'Appeal Guidance',
    desc:  'Step-by-step AI-generated appeal instructions tailored to your violation type and jurisdiction.',
    href:  '/appeal',
    badge: null,
  },
  {
    id:    'lawyers',
    icon:  Briefcase,
    color: 'text-rose-400',
    bg:    'bg-rose-500/10 border-rose-500/20',
    title: 'Lawyer Directory',
    desc:  'Find traffic attorneys in your area who speak your language and specialise in your violation type.',
    href:  '/lawyers',
    badge: null,
  },
];

const HOW_IT_WORKS = [
  {
    step:  '01',
    title: 'Set Your Location',
    desc:  'Select your country and state from the navigation bar. DriveLegal instantly tailors all information to your jurisdiction.',
    icon:  Globe,
  },
  {
    step:  '02',
    title: 'Ask or Browse',
    desc:  "Use the AI Chat for natural language Q&A, or browse the Violations database to look up specific fines and legal codes.",
    icon:  Zap,
  },
  {
    step:  '03',
    title: 'Know Your Rights',
    desc:  'Got a ticket? Upload it for instant analysis, find an attorney, or generate a step-by-step appeal guide.',
    icon:  Shield,
  },
];

const STATS = [
  { value: '50+',    label: 'Jurisdictions Covered' },
  { value: '1,200+', label: 'Violation Types' },
  { value: '22',     label: 'Languages Supported' },
  { value: '< 2s',   label: 'Average AI Response' },
];

const SAMPLE_QUESTIONS = [
  'What is the fine for jumping a red light in Maharashtra?',
  'How many demerit points before my license is suspended?',
  'Can I contest a speeding ticket I received in California?',
  'What documents must I carry while driving in the UK?',
];

// ─── Sections ─────────────────────────────────────────────────────────────────

const HeroSection: React.FC<{ countryName: string }> = ({ countryName }) => (
  <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
    {/* Decorative background blobs */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-500/8 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/6 blur-3xl" />
    </div>

    {/* Hackathon pill */}
    <div className="animate-fade-in mb-6">
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-xs font-semibold tracking-wide uppercase">
        <Star className="w-3 h-3 fill-primary-400 text-primary-400" />
        Road Safety Hackathon 2026 · IIT Madras
      </span>
    </div>

    {/* Heading */}
    <h1 className="animate-slide-up text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-balance mb-6 max-w-4xl">
      Know Your{' '}
      <span className="gradient-text">Traffic Rights.</span>
      <br />
      Anywhere. Instantly.
    </h1>

    {/* Sub-heading */}
    <p className="animate-slide-up text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 text-balance leading-relaxed">
      DriveLegal is an AI-powered assistant that gives you{' '}
      <span className="text-slate-200 font-medium">location-specific traffic law information</span>,
      fine schedules, OCR citation parsing, and multilingual legal Q&A — all in one place.
    </p>

    {/* Jurisdiction badge */}
    <div className="animate-fade-in mb-8">
      <Badge variant="info" size="md" className="gap-1.5">
        <Globe className="w-3.5 h-3.5" />
        Currently browsing laws for{' '}
        <strong className="text-sky-300">{countryName}</strong>
        <span className="text-sky-600">— change in navbar</span>
      </Badge>
    </div>

    {/* CTAs */}
    <div className="animate-fade-in flex flex-wrap items-center justify-center gap-3 mb-14">
      <Link href="/chat">
        <Button size="lg" variant="primary" icon={<MessageSquare className="w-4 h-4" />}>
          Ask the AI
        </Button>
      </Link>
      <Link href="/violations">
        <Button size="lg" variant="secondary" icon={<AlertTriangle className="w-4 h-4" />}>
          Browse Violations
        </Button>
      </Link>
    </div>

    {/* Sample questions ticker */}
    <div className="animate-fade-in w-full max-w-2xl">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Try asking →</p>
      <div className="flex flex-col gap-2">
        {SAMPLE_QUESTIONS.map((q, i) => (
          <Link
            key={i}
            href={`/chat?q=${encodeURIComponent(q)}`}
            className="group flex items-center gap-2 px-4 py-2.5 glass-sm hover:bg-surface-700/60 hover:border-white/10 rounded-xl transition-all duration-200 text-left"
          >
            <ChevronRight className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{q}</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const StatsSection: React.FC = () => (
  <section className="py-12 border-y border-white/5 bg-surface-900/40">
    <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
      {STATS.map(({ value, label }) => (
        <div key={label}>
          <p className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{value}</p>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
        </div>
      ))}
    </div>
  </section>
);

const FeaturesSection: React.FC = () => (
  <section className="py-24 px-4">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <Badge variant="info" className="mb-4">Everything you need</Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-balance">
          One platform for all things{' '}
          <span className="gradient-text">traffic law</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-balance">
          Whether you&apos;re a driver, fleet manager, or legal professional — DriveLegal has you covered.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ id, icon: Icon, color, bg, title, desc, href, badge }) => (
          <Link key={id} href={href} className="block group">
            <Card hover glow padding="lg" className="h-full">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {title}
                    </h3>
                    {badge && <Badge variant="info" size="sm">{badge}</Badge>}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorksSection: React.FC = () => (
  <section className="py-24 px-4 bg-surface-900/30">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <Badge variant="success" className="mb-4">Simple workflow</Badge>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          From question to answer in{' '}
          <span className="gradient-text-warm">seconds</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector line (desktop only) */}
        <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-primary-500/40 via-indigo-500/40 to-primary-500/40" />

        {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
          <div key={step} className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-sm animate-float">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center text-xs font-bold text-primary-400">
                {step.replace('0', '')}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection: React.FC = () => (
  <section className="py-24 px-4">
    <div className="max-w-3xl mx-auto text-center">
      <div className="relative glass p-10 sm:p-14 overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <Scale className="w-12 h-12 mx-auto mb-6 text-primary-400 animate-float" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 text-balance">
            Don&apos;t let a traffic fine catch you off guard
          </h2>
          <p className="text-slate-400 mb-8 text-balance">
            Get instant, accurate, jurisdiction-specific traffic law information — in your language, for free.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/chat">
              <Button size="lg" variant="primary" icon={<MessageSquare className="w-4 h-4" />}>
                Start Chatting Now
              </Button>
            </Link>
            <Link href="/violations">
              <Button size="lg" variant="secondary" icon={<AlertTriangle className="w-4 h-4" />}>
                Browse Laws
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { countryName } = useLocationStore();

  return (
    <>
      <Head>
        <title>DriveLegal — AI-Powered Traffic Law Assistant</title>
        <meta
          name="description"
          content="Location-specific traffic violation info, fine schedules, AI legal Q&A, OCR citation parsing, and multilingual support. Built for Road Safety Hackathon 2026."
        />
      </Head>

      <HeroSection countryName={countryName} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
