import Head from 'next/head';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Briefcase, Search, Phone, Mail, Globe, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { lawyersApi } from '@/utils/api';
import { useLocationStore } from '@/store/locationStore';
import type { Lawyer } from '@/types';

const MOCK_LAWYERS: Lawyer[] = [
  { id: 1, name: 'Adv. Priya Sharma', specializations: ['Overspeeding', 'DUI', 'License Suspension'], languages: ['English', 'Hindi'], country_code: 'IN', state_code: 'DL', contact_email: 'priya@legalaid.in', contact_phone: '+91 98100 12345' },
  { id: 2, name: 'Adv. Rajan Mehta', specializations: ['Traffic Appeals', 'Challan Disputes'], languages: ['English', 'Gujarati', 'Hindi'], country_code: 'IN', state_code: 'MH', contact_email: 'rajan@mehtalaw.com', contact_phone: '+91 97600 54321' },
  { id: 3, name: 'Adv. Sunita Rao', specializations: ['Hit & Run', 'Insurance Claims', 'DUI'], languages: ['English', 'Telugu', 'Kannada'], country_code: 'IN', state_code: 'KA', contact_email: 'sunita@raolaw.in', contact_phone: '+91 80500 67890' },
  { id: 4, name: 'Adv. Vikram Nair', specializations: ['Commercial Vehicle Violations', 'License Issues'], languages: ['English', 'Malayalam', 'Tamil'], country_code: 'IN', state_code: 'KL', contact_email: 'vikram@nairlaw.com', contact_phone: '+91 94470 11223' },
  { id: 5, name: 'Adv. Anjali Bose', specializations: ['Traffic Fines', 'Vehicle Impound', 'Appeals'], languages: ['English', 'Bengali', 'Hindi'], country_code: 'IN', state_code: 'WB', contact_email: 'anjali@boselaw.in', contact_phone: '+91 98300 44556' },
  { id: 6, name: 'Adv. Deepak Gupta', specializations: ['DUI', 'Rash Driving', 'Criminal Traffic Cases'], languages: ['English', 'Hindi', 'Punjabi'], country_code: 'IN', state_code: 'PB', contact_email: 'deepak@guptalaw.in', contact_phone: '+91 98140 77889' },
];

const LawyerCard: React.FC<{ lawyer: Lawyer }> = ({ lawyer }) => (
  <Card hover padding="lg" className="flex flex-col gap-4">
    {/* Avatar & name */}
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-glow-sm flex-shrink-0">
        {lawyer.name.replace('Adv. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div>
        <h3 className="font-semibold text-slate-100 text-sm leading-tight">{lawyer.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{lawyer.state_code ? `${lawyer.state_code}, ` : ''}{lawyer.country_code}</p>
      </div>
    </div>

    {/* Specializations */}
    <div className="flex flex-wrap gap-1.5">
      {lawyer.specializations.map((s) => (
        <Badge key={s} variant="info" size="sm">{s}</Badge>
      ))}
    </div>

    {/* Languages */}
    <div className="flex items-center gap-1.5 flex-wrap">
      <Globe className="w-3.5 h-3.5 text-slate-500" />
      {lawyer.languages.map((l) => (
        <span key={l} className="text-xs text-slate-400">{l}</span>
      ))}
    </div>

    {/* Contact */}
    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
      {lawyer.contact_phone && (
        <a href={`tel:${lawyer.contact_phone}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-400 transition-colors">
          <Phone className="w-3.5 h-3.5" />{lawyer.contact_phone}
        </a>
      )}
      {lawyer.contact_email && (
        <a href={`mailto:${lawyer.contact_email}`} className="flex items-center gap-2 text-xs text-slate-400 hover:text-primary-400 transition-colors">
          <Mail className="w-3.5 h-3.5" />{lawyer.contact_email}
        </a>
      )}
    </div>
  </Card>
);

export default function LawyersPage() {
  const { countryCode, countryName } = useLocationStore();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery(
    ['lawyers', countryCode],
    () => lawyersApi.list({ country_code: countryCode }),
    { retry: 1 }
  );

  const lawyers: Lawyer[] = (data?.data?.items ?? MOCK_LAWYERS).filter((l: Lawyer) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.specializations.some((s) => s.toLowerCase().includes(q)) ||
      l.languages.some((lang) => lang.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Head>
        <title>Lawyer Directory — DriveLegal</title>
        <meta name="description" content="Find traffic attorneys in your jurisdiction who speak your language." />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-bold text-white">Lawyer Directory</h1>
          </div>
          <p className="text-slate-400 text-sm">Traffic attorneys in <span className="text-slate-200 font-medium">{countryName}</span> · {lawyers.length} listed</p>
        </div>

        <div className="flex gap-3 mb-8 max-w-md">
          <Input
            id="lawyers-search"
            placeholder="Search by name, specialization, or language…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            suffix={search ? (
              <button onClick={() => setSearch('')} className="hover:text-slate-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
            ) : undefined}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : lawyers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No attorneys found. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lawyers.map((l) => <LawyerCard key={l.id} lawyer={l} />)}
          </div>
        )}
      </div>
    </>
  );
}
