import Head from 'next/head';
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, CheckCircle, AlertCircle, RefreshCw, MessageSquare, X } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { documentsApi } from '@/utils/api';
import type { CitationExtraction } from '@/types';

const MOCK_EXTRACTION: CitationExtraction = {
  violation_type:   'Overspeeding',
  violation_code:   'MV-184',
  fine_amount:      1500,
  currency:         'INR',
  violation_date:   '2026-04-20',
  location:         'NH-48, Gurugram, Haryana',
  vehicle_number:   'HR 26 AX 4521',
  officer_id:       'TI-2247',
  court_date:       '2026-05-25',
  appeal_deadline:  '2026-05-20',
  legal_section:    'Section 184, Motor Vehicles Act',
  notes:            'Vehicle clocked at 98 km/h in a 60 km/h zone.',
};

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

const FIELD_LABELS: Record<keyof CitationExtraction, string> = {
  violation_type:  'Violation Type',
  violation_code:  'Violation Code',
  fine_amount:     'Fine Amount',
  currency:        'Currency',
  violation_date:  'Violation Date',
  location:        'Location',
  vehicle_number:  'Vehicle Number',
  officer_id:      'Officer ID',
  court_date:      'Court Date',
  appeal_deadline: 'Appeal Deadline',
  legal_section:   'Legal Section',
  notes:           'Notes',
  error:           'Error',
};

export default function UploadPage() {
  const [state, setState]           = useState<UploadState>('idle');
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [extraction, setExtraction] = useState<CitationExtraction | null>(null);
  const [errMsg, setErrMsg]         = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setExtraction(null);
    setErrMsg(null);
    setState('idle');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setState('uploading');
    setErrMsg(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await documentsApi.uploadCitation(formData);
      setExtraction(res.data);
      setState('success');
    } catch {
      // Graceful fallback with mock data
      setExtraction(MOCK_EXTRACTION);
      setState('success');
      setErrMsg('Backend offline — showing demo extraction.');
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setExtraction(null);
    setErrMsg(null); setState('idle');
  };

  const chatQuery = extraction?.violation_type
    ? `I received a citation for ${extraction.violation_type}${extraction.location ? ` at ${extraction.location}` : ''}. What are my options?`
    : '';

  return (
    <>
      <Head>
        <title>Upload Citation — DriveLegal</title>
        <meta name="description" content="Upload your traffic ticket for AI-powered OCR extraction and legal analysis." />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Citation OCR Upload</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Upload your traffic ticket (image or PDF) and our AI will extract all key details instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Drop zone */}
          <div className="flex flex-col gap-4">
            <div
              {...getRootProps()}
              className={clsx(
                'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 min-h-[260px] flex flex-col items-center justify-center gap-4',
                isDragActive
                  ? 'border-primary-500 bg-primary-500/10'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/10 bg-surface-800/40 hover:border-primary-500/40 hover:bg-surface-800/60',
              )}
            >
              <input {...getInputProps()} id="citation-file-input" />

              {preview ? (
                <img src={preview} alt="Preview" className="max-h-40 rounded-xl object-contain" />
              ) : (
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                  isDragActive ? 'bg-primary-500/20 scale-110' : 'bg-surface-700',
                )}>
                  {file?.type === 'application/pdf'
                    ? <FileText className="w-7 h-7 text-emerald-400" />
                    : <Image className="w-7 h-7 text-slate-400" />}
                </div>
              )}

              {file ? (
                <div>
                  <p className="font-semibold text-slate-200 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-200">{isDragActive ? 'Drop it here!' : 'Drag & drop your citation'}</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse · JPG, PNG, PDF · max 10 MB</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {file && state !== 'uploading' && (
                <>
                  <Button
                    id="upload-submit-btn"
                    variant="primary"
                    className="flex-1"
                    onClick={handleUpload}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    Extract Details
                  </Button>
                  <Button variant="ghost" size="md" onClick={reset} icon={<X className="w-4 h-4" />} />
                </>
              )}
              {state === 'uploading' && (
                <div className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400">
                  <Spinner size="sm" /> Processing citation…
                </div>
              )}
            </div>

            {errMsg && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errMsg}
              </div>
            )}
          </div>

          {/* Right — Extracted data */}
          <div>
            {extraction ? (
              <Card padding="lg" className="animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-white text-sm">Extracted Details</h2>
                  <Badge variant="success" size="sm">AI Parsed</Badge>
                </div>
                <div className="flex flex-col gap-0">
                  {(Object.keys(FIELD_LABELS) as Array<keyof CitationExtraction>)
                    .filter((k) => k !== 'error' && extraction[k] != null)
                    .map((k) => (
                      <div key={k} className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
                        <span className="text-xs text-slate-500 flex-shrink-0">{FIELD_LABELS[k]}</span>
                        <span className="text-xs text-slate-200 text-right font-medium">{String(extraction[k])}</span>
                      </div>
                    ))}
                </div>
                {chatQuery && (
                  <Link href={`/chat?q=${encodeURIComponent(chatQuery)}`} className="mt-4 block">
                    <Button variant="secondary" className="w-full" icon={<MessageSquare className="w-4 h-4" />}>
                      Ask AI about this violation
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 glass rounded-2xl">
                <FileText className="w-12 h-12 text-slate-600" />
                <p className="text-slate-500 text-sm">Upload a citation to see extracted details here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
