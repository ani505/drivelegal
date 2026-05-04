import Head from 'next/head';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { HardHat, Info, ExternalLink, Mail, Search, Filter } from 'lucide-react';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/utils/api';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export default function RoadWatchPage() {
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery('road-projects', () => 
    api.get('/infrastructure/projects').then(res => res.data)
  );

  const projects = (data ?? []).filter((p: any) => 
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.road_type.includes(filter.toUpperCase())
  );

  return (
    <>
      <Head><title>RoadWatch — Infrastructure Transparency</title></Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HardHat className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">RoadWatch</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Consolidating data on road projects, budgets, and contractors to ensure public accountability.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects (e.g. NH, ORR)..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-surface-900/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p: any) => (
                <Card key={p.id} hover padding="lg" className="flex flex-col gap-4 border-white/5 bg-surface-900/40 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <Badge variant={p.road_type === 'NH' ? 'major' : 'moderate'}>{p.road_type}</Badge>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <HardHat className="w-3 h-3" /> Contractor: <span className="text-slate-300 font-medium">{p.contractor_name}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Sanctioned</p>
                      <p className="text-sm font-bold text-slate-200">₹ {(p.budget_sanctioned / 10000000).toFixed(1)} Cr</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Spent</p>
                      <p className="text-sm font-bold text-emerald-400">₹ {(p.budget_spent / 10000000).toFixed(1)} Cr</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Utilization</span>
                      <span className="text-slate-300 font-mono">{((p.budget_spent / p.budget_sanctioned) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full transition-all duration-1000" 
                        style={{ width: `${(p.budget_spent / p.budget_sanctioned) * 100}%` }} 
                      />
                    </div>
                  </div>

                  {p.authority_email && (
                    <a 
                      href={`mailto:${p.authority_email}`}
                      className="mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Report Issue to Authority
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
