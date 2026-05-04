import Head from 'next/head';
import React, { useState } from 'react';
import { FileText, Scale, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { appealApi } from '@/utils/api';
import { useLocationStore } from '@/store/locationStore';

const VIOLATION_TYPES = [
  'Overspeeding', 'Drunk Driving (DUI)', 'Signal Jumping',
  'Mobile Phone While Driving', 'Seat Belt Violation',
  'Dangerous Driving', 'No Helmet', 'Wrong Side Driving', 'Illegal Parking', 'Other',
];

const MOCK_GUIDANCE = `## Appeal Guidance for Overspeeding (India)

**1. Eligibility**
You are eligible to appeal if the speed measurement was incorrect, signage was unclear, or there were extenuating circumstances.

**2. Deadline to File**
File your appeal within 30 days of receiving the challan.

**3. Required Documents**
- Original challan / citation copy
- Vehicle RC (Registration Certificate)
- Driver's License
- Supporting evidence (dashcam footage, photos)
- Written statement

**4. Where to File**
Your local Regional Transport Office (RTO) or online at echallan.parivahan.gov.in.

**5. What to Argue**
- Speed device calibration records
- Missing or inadequate signage
- Emergency or medical necessity
- First-time offense mitigation

**6. Expected Timeline**
Hearings scheduled within 15–45 days. Decision within 30 days of hearing.

**7. Costs Involved**
Filing is free. Attorney fees range ₹2,000–₹10,000.`;

export default function AppealPage() {
  const { countryCode, countryName } = useLocationStore();
  const [violationType,  setViolationType]  = useState('');
  const [circumstances, setCircumstances]  = useState('');
  const [guidance,      setGuidance]       = useState<string | null>(null);
  const [loading,       setLoading]        = useState(false);
  const [error,         setError]          = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationType) return;
    setLoading(true); setError(null); setGuidance(null);
    try {
      const res = await appealApi.guidance({ violation_type: violationType, country_code: countryCode, circumstances: circumstances || undefined });
      setGuidance(res.data?.guidance || res.data);
    } catch {
      setGuidance(MOCK_GUIDANCE);
      setError('Backend offline — showing demo guidance.');
    } finally {
      setLoading(false);
    }
  };

  const renderGuidance = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## '))  return <h2 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-200 mt-3 mb-1">{line.slice(2,-2)}</p>;
      if (line.startsWith('- '))   return <li key={i} className="text-slate-300 text-sm ml-4 list-disc">{line.slice(2)}</li>;
      if (line.trim() === '')      return <div key={i} className="h-1" />;
      return <p key={i} className="text-slate-300 text-sm leading-relaxed">{line}</p>;
    });

  return (
    <>
      <Head>
        <title>Appeal Guidance — DriveLegal</title>
        <meta name="description" content="Get AI-generated step-by-step instructions to appeal your traffic violation." />
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">Appeal Guidance</h1>
          </div>
          <p className="text-slate-400 text-sm">AI-generated step-by-step appeal instructions for <span className="text-slate-200 font-medium">{countryName}</span>.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <Card padding="lg">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Violation Type <span className="text-red-400">*</span></label>
                  <select id="appeal-violation-select" value={violationType} onChange={(e) => setViolationType(e.target.value)} required
                    className="w-full bg-surface-800 border border-white/8 rounded-xl text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500/60 transition-all">
                    <option value="" className="bg-surface-800">Select violation…</option>
                    {VIOLATION_TYPES.map((v) => <option key={v} value={v} className="bg-surface-800">{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Circumstances (optional)</label>
                  <textarea id="appeal-circumstances" value={circumstances} onChange={(e) => setCircumstances(e.target.value)}
                    placeholder="E.g. first offence, medical emergency, unclear signage…"
                    rows={4} className="w-full bg-surface-800 border border-white/8 rounded-xl text-slate-100 placeholder-slate-500 px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500/60 resize-none transition-all" />
                </div>
                <Button id="appeal-submit-btn" type="submit" variant="primary" loading={loading} disabled={!violationType} icon={<Scale className="w-4 h-4" />}>
                  Generate Appeal Guide
                </Button>
              </form>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5" />{error}
                </div>
              )}
            </Card>
          </div>
          <div className="lg:col-span-3">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 glass rounded-2xl py-20">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                <p className="text-slate-400 text-sm">Generating appeal guide…</p>
              </div>
            ) : guidance ? (
              <Card padding="lg" className="animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-white text-sm">Your Appeal Guide</h2>
                  <Badge variant="success" size="sm">AI Generated</Badge>
                </div>
                <div>{renderGuidance(guidance)}</div>
                <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-white/5">⚖️ For informational purposes only. Consult a qualified attorney for complex cases.</p>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 glass rounded-2xl">
                <Scale className="w-12 h-12 text-slate-600 animate-float" />
                <div>
                  <p className="text-slate-300 font-medium mb-1">Ready to help you appeal</p>
                  <p className="text-slate-500 text-sm">Select your violation type and click Generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
