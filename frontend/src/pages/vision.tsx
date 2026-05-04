import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/ui/Layout';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type AnalysisMode = 'sign' | 'speed' | 'vehicle';

const MODES: { key: AnalysisMode; label: string; icon: string; endpoint: string; description: string }[] = [
  {
    key: 'sign',
    label: 'Traffic Sign',
    icon: '🚦',
    endpoint: '/vision/analyze-sign',
    description: 'Detect and identify traffic signs with legal implications',
  },
  {
    key: 'speed',
    label: 'Speed Limit',
    icon: '⚡',
    endpoint: '/vision/detect-speed-limit',
    description: 'Extract speed limit value from road or sign photos',
  },
  {
    key: 'vehicle',
    label: 'Vehicle Check',
    icon: '🚗',
    endpoint: '/vision/analyze-vehicle',
    description: 'Check vehicle photos for visible condition violations',
  },
];

const CONFIDENCE_COLOR = (c: number) =>
  c >= 0.8 ? 'text-green-600 dark:text-green-400' :
  c >= 0.5 ? 'text-amber-600 dark:text-amber-400' :
             'text-red-500 dark:text-red-400';

export default function VisionPage() {
  const [mode,       setMode]       = useState<AnalysisMode>('sign');
  const [preview,    setPreview]    = useState<string | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<any>(null);
  const [error,      setError]      = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError('');
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) handleFile(f);
  };

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const endpoint = MODES.find(m => m.key === mode)!.endpoint;
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API}${endpoint}`, { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.detail ?? 'Analysis failed');
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  const selectedMode = MODES.find(m => m.key === mode)!;

  return (
    <>
      <Head><title>Computer Vision — DriveLegal</title></Head>
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              📷 Traffic Vision Analysis
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload a road image to detect traffic signs, speed limits, and vehicle violations.
            </p>
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); setResult(null); setError(''); }}
                className={`
                  flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 text-sm font-medium transition-all
                  ${mode === m.key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}
                `}
              >
                <span className="text-2xl">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{selectedMode.description}</p>

          {/* Upload zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-xl object-contain" />
            ) : (
              <div className="space-y-2 text-gray-400 dark:text-gray-600">
                <p className="text-4xl">📤</p>
                <p className="text-sm">Drop an image here or click to upload</p>
                <p className="text-xs">JPEG, PNG, WebP — max 10 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onInputChange} className="hidden" />
          </div>

          {/* Action */}
          {file && (
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? `Analysing with YOLOv8…` : `Analyse Image`}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
              {/* Mock badge */}
              {result.mock && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  Demo mode — install ultralytics for real detection
                </span>
              )}

              {/* Sign analysis */}
              {mode === 'sign' && (
                result.detected ? (
                  <div className="space-y-3">
                    {result.signs?.map((s: any, i: number) => (
                      <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{s.label}</span>
                          <span className={`text-xs font-mono ${CONFIDENCE_COLOR(s.confidence)}`}>
                            {(s.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {s.type}
                        </span>
                        {s.legal_implication && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ⚖️ {s.legal_implication}
                          </p>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Model: {result.model}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No traffic signs detected in this image.</p>
                )
              )}

              {/* Speed limit */}
              {mode === 'speed' && (
                result.detected ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                      {result.speed_limit}
                    </p>
                    <p className="text-gray-500 text-sm">{result.unit}</p>
                    <p className={`text-xs font-mono ${CONFIDENCE_COLOR(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(0)}% confidence
                    </p>
                    {result.legal_implication && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        ⚖️ {result.legal_implication}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No speed limit sign detected.</p>
                )
              )}

              {/* Vehicle */}
              {mode === 'vehicle' && (
                result.issues_found ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {result.issue_count} issue(s) found
                    </p>
                    {result.issues?.map((issue: any, i: number) => (
                      <div key={i} className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm">
                        <p className="font-medium text-red-700 dark:text-red-400">{issue.issue}</p>
                        {issue.violation && (
                          <p className="text-xs text-red-500 mt-0.5">⚖️ {issue.violation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    ✅ No visible violations detected. Image quality: {result.image_quality}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
