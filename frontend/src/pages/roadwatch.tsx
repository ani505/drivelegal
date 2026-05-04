// RoadWatch Page - Built for IIT Madras Hackathon
// This page shows road construction projects and how the budget is being spent
import Head from 'next/head';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { HardHat, Info, ExternalLink, Mail, Search, Filter } from 'lucide-react';
import { Layout } from '@/components/ui/Layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/utils/api';

export default function RoadWatchPage() {
  // simple state to filter our list
  const [searchQuery, setSearchQuery] = useState('');

  // fetching data from our FastAPI backend
  const { data: allProjects, isLoading } = useQuery('road-projects', () => 
    api.get('/infrastructure/projects').then(res => res.data)
  );

  // basic filtering logic based on the search input
  const filteredList = (allProjects ?? []).filter((p: any) => {
    if (!searchQuery) return true;
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = p.road_type.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || typeMatch;
  });

  return (
    <>
      <Head>
        <title>RoadWatch - Track Road Work</title>
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-10">
          
          {/* Header section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <HardHat className="w-6 h-6 text-amber-500" />
              <h1 className="text-3xl font-extrabold text-white">RoadWatch</h1>
            </div>
            <p className="text-slate-400">
              Check out active road works, contractors, and budget spending in your area.
            </p>
          </div>

          {/* Simple search bar */}
          <div className="mb-8 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredList.map((item: any) => (
                <Card key={item.id} className="bg-surface-900/50 border-white/5 hover:border-amber-500/30 transition-all">
                  <div className="p-5">
                    {/* Tags at top */}
                    <div className="flex justify-between mb-4">
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20">{item.road_type}</Badge>
                      <span className={`text-[10px] uppercase font-bold p-1 rounded ${item.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Name and Contractor */}
                    <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-xs text-slate-500 mb-4">Contractor: {item.contractor_name}</p>

                    {/* Budget info */}
                    <div className="flex gap-4 mb-4 border-t border-b border-white/5 py-3">
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-500 uppercase">Budget Sanctioned</p>
                        <p className="font-bold text-slate-200">₹ {(item.budget_sanctioned / 10000000).toFixed(1)} Cr</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[10px] text-slate-500 uppercase">Actual Spent</p>
                        <p className="font-bold text-green-400">₹ {(item.budget_spent / 10000000).toFixed(1)} Cr</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Utilization</span>
                        <span className="text-slate-300 font-bold">{((item.budget_spent / item.budget_sanctioned) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full" 
                          style={{ width: `${(item.budget_spent / item.budget_sanctioned) * 100}%` }} 
                        />
                      </div>
                    </div>

                    {/* Report button */}
                    {item.authority_email && (
                      <a 
                        href={`mailto:${item.authority_email}?subject=Feedback regarding ${item.name}`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10"
                      >
                        <Mail className="w-4 h-4" /> Send feedback to Authority
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
