import Head from 'next/head';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, Filter, AlertTriangle, ChevronRight, X, IndianRupee } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { violationsApi } from '@/utils/api';
import { useLocationStore } from '@/store/locationStore';
import type { Violation } from '@/types';

const SEVERITIES = ['minor', 'moderate', 'major', 'criminal'] as const;
type Severity = typeof SEVERITIES[number];

const SEV_LABEL: Record<Severity, string> = {
  minor: 'Minor', moderate: 'Moderate', major: 'Major', criminal: 'Criminal',
};

function severityVariant(s: string): 'minor' | 'moderate' | 'major' | 'criminal' {
  if (SEVERITIES.includes(s as Severity)) return s as Severity;
  return 'minor';
}

const DetailDrawer: React.FC<{ v: Violation; onClose: () => void }> = ({ v, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div
      className="relative glass w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={severityVariant(v.severity)}>{SEV_LABEL[v.severity as Severity] ?? v.severity}</Badge>
              <span className="text-xs text-slate-500 font-mono">{v.code}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{v.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-700 text-slate-400 hover:text-slate-200 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {v.description && <p className="text-sm text-slate-400 mb-5 leading-relaxed">{v.description}</p>}

        <div className="grid grid-cols-2 gap-3 mb-5">
          {v.fine_min != null && (
            <div className="bg-surface-700/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Min Fine</p>
              <p className="text-lg font-bold text-emerald-400">{v.currency} {v.fine_min.toLocaleString()}</p>
            </div>
          )}
          {v.fine_max != null && (
            <div className="bg-surface-700/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Max Fine</p>
              <p className="text-lg font-bold text-red-400">{v.currency} {v.fine_max.toLocaleString()}</p>
            </div>
          )}
          {v.license_points != null && (
            <div className="bg-surface-700/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">License Points</p>
              <p className="text-lg font-bold text-amber-400">{v.license_points}</p>
            </div>
          )}
          {v.suspension_days != null && (
            <div className="bg-surface-700/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Suspension</p>
              <p className="text-lg font-bold text-orange-400">{v.suspension_days} days</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {v.legal_section && (
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-slate-500">Legal Section</span>
              <span className="text-slate-200 font-mono text-xs">{v.legal_section}</span>
            </div>
          )}
          {v.act_name && (
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-slate-500">Act</span>
              <span className="text-slate-200 text-right text-xs max-w-[60%]">{v.act_name}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-slate-500">Cognizable</span>
            <Badge variant={v.is_cognizable ? 'major' : 'success'} size="sm">{v.is_cognizable ? 'Yes' : 'No'}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-slate-500">Bailable</span>
            <Badge variant={v.is_bailable ? 'success' : 'criminal'} size="sm">{v.is_bailable ? 'Yes' : 'No'}</Badge>
          </div>
          {v.appeal_window_days != null && (
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Appeal Window</span>
              <span className="text-slate-200">{v.appeal_window_days} days</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ViolationCard: React.FC<{ v: Violation; onClick: () => void }> = ({ v, onClick }) => (
  <Card hover glow padding="md" onClick={onClick} className="cursor-pointer group">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <Badge variant={severityVariant(v.severity)} size="sm">{SEV_LABEL[v.severity as Severity] ?? v.severity}</Badge>
          <span className="text-xs text-slate-500 font-mono">{v.code}</span>
        </div>
        <h3 className="font-semibold text-slate-100 text-sm group-hover:text-white transition-colors mb-1 line-clamp-2">{v.name}</h3>
        {(v.fine_min != null || v.fine_max != null) && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <IndianRupee className="w-3 h-3" />
            {v.fine_min != null ? v.fine_min.toLocaleString() : '—'}
            {v.fine_max != null ? ` – ${v.fine_max.toLocaleString()}` : ''} {v.currency}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
    </div>
  </Card>
);

const MOCK_VIOLATIONS: Violation[] = [
  { id: 1, code: 'MV-184', name: 'Overspeeding', description: 'Driving above the prescribed speed limit.', severity: 'moderate', fine_min: 1000, fine_max: 2000, fine_base: 1500, currency: 'INR', license_points: 2, suspension_days: null, legal_section: 'Section 184', act_name: 'Motor Vehicles Act 1988', is_cognizable: false, is_bailable: true, appeal_window_days: 30, appeal_authority: 'RTO', name_translations: null, description_translations: null },
  { id: 2, code: 'MV-183', name: 'Dangerous Driving', description: 'Driving in a manner dangerous to the public.', severity: 'major', fine_min: 1000, fine_max: 5000, fine_base: 3000, currency: 'INR', license_points: 4, suspension_days: 30, legal_section: 'Section 183', act_name: 'Motor Vehicles Act 1988', is_cognizable: true, is_bailable: false, appeal_window_days: 15, appeal_authority: 'Magistrate Court', name_translations: null, description_translations: null },
  { id: 3, code: 'MV-185', name: 'Drunk Driving (DUI)', description: 'Driving under the influence of alcohol or drugs.', severity: 'criminal', fine_min: 10000, fine_max: 15000, fine_base: 10000, currency: 'INR', license_points: 6, suspension_days: 90, legal_section: 'Section 185', act_name: 'Motor Vehicles Act 1988', is_cognizable: true, is_bailable: false, appeal_window_days: 30, appeal_authority: 'Sessions Court', name_translations: null, description_translations: null },
  { id: 4, code: 'MV-177', name: 'Signal Jumping', description: 'Jumping a red traffic signal.', severity: 'minor', fine_min: 500, fine_max: 1000, fine_base: 500, currency: 'INR', license_points: 1, suspension_days: null, legal_section: 'Section 177', act_name: 'Motor Vehicles Act 1988', is_cognizable: false, is_bailable: true, appeal_window_days: 30, appeal_authority: 'RTO', name_translations: null, description_translations: null },
  { id: 5, code: 'MV-194B', name: 'Mobile Phone While Driving', description: 'Using a hand-held mobile device while operating a vehicle.', severity: 'moderate', fine_min: 1000, fine_max: 5000, fine_base: 1000, currency: 'INR', license_points: 2, suspension_days: null, legal_section: 'Section 194B', act_name: 'Motor Vehicles Act 2019', is_cognizable: false, is_bailable: true, appeal_window_days: 30, appeal_authority: 'RTO', name_translations: null, description_translations: null },
  { id: 6, code: 'MV-177A', name: 'Seat Belt Violation', description: 'Driving without wearing a seat belt.', severity: 'minor', fine_min: 1000, fine_max: 1000, fine_base: 1000, currency: 'INR', license_points: 1, suspension_days: null, legal_section: 'Section 177A', act_name: 'Motor Vehicles Act 2019', is_cognizable: false, is_bailable: true, appeal_window_days: 30, appeal_authority: 'RTO', name_translations: null, description_translations: null },
];

export default function ViolationsPage() {
  const { countryCode, countryName } = useLocationStore();
  const [search, setSearch]     = useState('');
  const [severity, setSeverity] = useState<string>('');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Violation | null>(null);

  const { data, isLoading, isError } = useQuery(
    ['violations', countryCode, search, severity, page],
    () => violationsApi.list({ country_code: countryCode, q: search || undefined, severity: severity || undefined, page, page_size: 12 }),
    { keepPreviousData: true }
  );

  const violations: Violation[] = data?.data?.items ?? MOCK_VIOLATIONS.filter((v) => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.code.toLowerCase().includes(search.toLowerCase());
    const matchSev    = !severity || v.severity === severity;
    return matchSearch && matchSev;
  });

  const total      = data?.data?.total      ?? violations.length;
  const totalPages = data?.data?.total_pages ?? 1;

  return (
    <>
      <Head>
        <title>Traffic Violations — DriveLegal</title>
        <meta name="description" content="Browse traffic violations and fine schedules by jurisdiction." />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Violation Browser</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Showing traffic laws for <span className="text-slate-200 font-medium">{countryName}</span>
            {' '}· {total} violation{total !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px] max-w-md">
            <Input
              id="violations-search"
              placeholder="Search by name, code, legal section…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
              suffix={search ? (
                <button onClick={() => setSearch('')} className="hover:text-slate-200 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {(['', ...SEVERITIES] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSeverity(s); setPage(1); }}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  severity === s
                    ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                    : 'border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/15',
                )}
              >
                {s === '' ? 'All' : SEV_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : violations.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No violations found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {violations.map((v) => (
              <ViolationCard key={v.id} v={v} onClick={() => setSelected(v)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && <DetailDrawer v={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
