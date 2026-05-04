import Head from 'next/head';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { 
  User, AlertTriangle, TrendingUp, Shield, Clock, 
  BarChart3, PieChart as PieChartIcon, Activity, Zap
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell, PieChart, Pie
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { profileApi } from '@/utils/api';

const MOCK_PROFILE = {
  full_name: 'Demo User',
  email: 'demo@drivelegal.app',
  country_code: 'IN',
  license_number: 'DL-0120110012345',
};

const MOCK_RISK = {
  score: 42,
  category: 'medium' as const,
  factors: ['2 violations in past 12 months', 'Frequent night driving', 'High speed zone activity'],
};

const MOCK_VIOLATIONS = [
  { id: 1, code: 'MV-184', name: 'Overspeeding', date: '2026-01-15', fine: 1500, currency: 'INR', status: 'paid', category: 'Speed' },
  { id: 2, code: 'MV-194B', name: 'Mobile Phone', date: '2025-11-03', fine: 1000, currency: 'INR', status: 'paid', category: 'Attention' },
  { id: 3, code: 'MV-177', name: 'Signal Jumping', date: '2025-08-12', fine: 500, currency: 'INR', status: 'paid', category: 'Traffic' },
  { id: 4, code: 'MV-129', name: 'No Helmet', date: '2025-06-20', fine: 1000, currency: 'INR', status: 'paid', category: 'Safety' },
];

const CATEGORY_DATA = [
  { subject: 'Speed', A: 80, fullMark: 100 },
  { subject: 'Parking', A: 20, fullMark: 100 },
  { subject: 'Safety', A: 50, fullMark: 100 },
  { subject: 'Signal', A: 70, fullMark: 100 },
  { subject: 'Papers', A: 30, fullMark: 100 },
  { subject: 'DUI', A: 10, fullMark: 100 },
];

const MONTHLY_DATA = [
  { name: 'Aug', violations: 1 },
  { name: 'Sep', violations: 0 },
  { name: 'Oct', violations: 2 },
  { name: 'Nov', violations: 1 },
  { name: 'Dec', violations: 0 },
  { name: 'Jan', violations: 1 },
];

const RISK_CONFIG = {
  low:      { label: 'Low Risk',      color: 'text-emerald-500', bg: 'bg-emerald-500', track: 'bg-emerald-500/10', badge: 'success' as const },
  medium:   { label: 'Medium Risk',   color: 'text-amber-500',   bg: 'bg-amber-500',   track: 'bg-amber-500/10',   badge: 'moderate' as const },
  high:     { label: 'High Risk',     color: 'text-orange-500',  bg: 'bg-orange-500',  track: 'bg-orange-500/10',  badge: 'major' as const },
  critical: { label: 'Critical Risk', color: 'text-red-500',     bg: 'bg-red-500',     track: 'bg-red-500/10',     badge: 'criminal' as const },
};

export default function ProfilePage() {
  const { data: profileData } = useQuery('profile', () => profileApi.me(), { retry: 1 });
  const { data: riskData }    = useQuery('risk',    () => profileApi.riskScore(), { retry: 1 });
  const { data: historyData } = useQuery('history', () => profileApi.violations(), { retry: 1 });

  const profile    = profileData?.data ?? MOCK_PROFILE;
  const risk       = riskData?.data    ?? MOCK_RISK;
  const history    = historyData?.data ?? MOCK_VIOLATIONS;
  const riskConfig = RISK_CONFIG[risk.category as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.low;

  return (
    <>
      <Head>
        <title>Driving Insights — DriveLegal</title>
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Driving Insights</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">
              Advanced analytics and risk profiling based on your driving history and local traffic enforcement data.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-surface-800 p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glow-sm">
              {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2) ?? 'U'}
            </div>
            <div className="pr-4">
              <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{profile.full_name}</p>
              <p className="text-xs text-slate-500">{profile.license_number || 'No license linked'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Risk Dashboard */}
          <Card className="lg:col-span-8 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Left Side: Score & Factors */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-500" />
                    <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Overall Safety Score</h2>
                  </div>
                  <Badge variant={riskConfig.badge}>{riskConfig.label}</Badge>
                </div>

                <div className="relative w-48 h-48 mx-auto mb-8">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96" cy="96" r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-slate-100 dark:text-surface-700"
                    />
                    <circle
                      cx="96" cy="96" r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={552.9}
                      strokeDashoffset={552.9 - (552.9 * risk.score) / 100}
                      strokeLinecap="round"
                      className={`${riskConfig.color} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black ${riskConfig.color}`}>{risk.score}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Points</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contributing Factors</p>
                  {risk.factors?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-white/5 transition-hover hover:border-primary-500/30">
                      <Zap className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Radar Chart */}
              <div className="p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <PieChartIcon className="w-4 h-4 text-primary-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Risk Distribution</h2>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={CATEGORY_DATA}>
                      <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <Radar
                        name="Risk"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 text-center italic mt-4">
                  * Higher values indicate higher risk in that specific category.
                </p>
              </div>
            </div>
          </Card>

          {/* Right Column: Mini Charts */}
          <div className="lg:col-span-4 space-y-6">
            <Card padding="lg" className="h-[220px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Monthly Trend</h2>
                </div>
                <Badge variant="default">Last 6 Months</Badge>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DATA}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Bar dataKey="violations" radius={[4, 4, 0, 0]}>
                      {MONTHLY_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.violations > 1 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding="lg" className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertTriangle className="w-24 h-24 text-primary-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Liability</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                  INR {history.reduce((acc: number, curr: any) => acc + curr.fine, 0).toLocaleString()}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Unpaid Fines</span>
                    <span className="font-bold text-orange-500">INR 0</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-surface-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[100%]" />
                  </div>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">All fines cleared</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Table: History */}
          <div className="lg:col-span-12">
            <Card padding="none" className="overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Recent Violations</h2>
                </div>
                <button className="text-xs text-primary-500 font-bold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-surface-900/50">
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Violation</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {history.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-800/30 transition-colors">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{v.code}</p>
                        </td>
                        <td className="px-8 py-4">
                          <Badge variant="default" size="sm">{v.category || 'General'}</Badge>
                        </td>
                        <td className="px-8 py-4 text-sm text-slate-500">{v.date}</td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{v.currency} {v.fine}</td>
                        <td className="px-8 py-4">
                          <Badge variant={v.status === 'paid' ? 'success' : 'major'} size="sm">
                            {v.status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
