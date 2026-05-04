import { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/ui/Layout';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface BlockchainRecord {
  record_id:      string;
  driver_did:     string;
  violation_code: string;
  country_code:   string;
  data_hash:      string;
  is_paid:        boolean;
  is_appealed:    boolean;
  created_at:     string;
}

interface RecordResult {
  success:    boolean;
  record_id:  string;
  tx_hash:    string;
  data_hash:  string;
  block_number: number;
  status:     string;
  mock:       boolean;
}

export default function BlockchainPage() {
  const { user } = useAuthStore();
  const userId   = user?.id ?? 1;

  // Record form
  const [violationCode, setViolationCode] = useState('MV_OVERSPEEDING');
  const [countryCode,   setCountryCode]   = useState('IN');
  const [fineAmount,    setFineAmount]    = useState('500');
  const [recording,     setRecording]     = useState(false);
  const [recordResult,  setRecordResult]  = useState<RecordResult | null>(null);
  const [recordError,   setRecordError]   = useState('');

  // Verify form
  const [verifyId,      setVerifyId]      = useState('');
  const [verifying,     setVerifying]     = useState(false);
  const [verifyResult,  setVerifyResult]  = useState<{ verified: boolean; record?: BlockchainRecord } | null>(null);
  const [verifyError,   setVerifyError]   = useState('');

  // History
  const [history,       setHistory]       = useState<string[]>([]);
  const [histLoading,   setHistLoading]   = useState(false);

  // Status
  const [status,        setStatus]        = useState<Record<string, any> | null>(null);

  async function handleRecord() {
    setRecording(true);
    setRecordError('');
    setRecordResult(null);
    try {
      const res = await fetch(`${API}/blockchain/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:        userId,
          violation_code: violationCode,
          country_code:   countryCode,
          violation_data: {
            code: violationCode, country: countryCode,
            fine: parseFloat(fineAmount), recorded_by: 'drivelegal-frontend',
          },
          fine_amount_usd: parseFloat(fineAmount),
        }),
      });
      const data = await res.json();
      if (res.ok) setRecordResult(data);
      else setRecordError(data.detail ?? 'Recording failed');
    } catch (e: any) {
      setRecordError(e.message);
    } finally { setRecording(false); }
  }

  async function handleVerify() {
    if (!verifyId.trim()) return;
    setVerifying(true);
    setVerifyError('');
    setVerifyResult(null);
    try {
      const res = await fetch(`${API}/blockchain/verify/${encodeURIComponent(verifyId.trim())}`);
      const data = await res.json();
      if (res.ok) setVerifyResult(data);
      else setVerifyError(data.detail ?? 'Record not found');
    } catch (e: any) {
      setVerifyError(e.message);
    } finally { setVerifying(false); }
  }

  async function loadHistory() {
    setHistLoading(true);
    try {
      const did = `did:drivelegal:${countryCode.toLowerCase()}:${userId}`;
      const res = await fetch(`${API}/blockchain/history/${encodeURIComponent(did)}`);
      const data = await res.json();
      setHistory(data.record_ids ?? []);
    } catch {/* ignore */} finally { setHistLoading(false); }
  }

  async function loadStatus() {
    const res = await fetch(`${API}/blockchain/status`);
    if (res.ok) setStatus(await res.json());
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <Head><title>Blockchain Records — DriveLegal</title></Head>
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              🔗 Blockchain Violation Records
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Immutable, tamper-proof violation records on Polygon / Ethereum.
            </p>
          </div>

          {/* Status banner */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">Network status</span>
            <button
              onClick={loadStatus}
              className="text-xs text-blue-600 hover:underline"
            >
              Check
            </button>
          </div>
          {status && (
            <div className="text-xs font-mono bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto">
              {JSON.stringify(status, null, 2)}
            </div>
          )}

          {/* Record a violation */}
          <section className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Record Violation On-Chain</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Violation Code</label>
                <input value={violationCode} onChange={e => setViolationCode(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Country Code</label>
                <input value={countryCode} onChange={e => setCountryCode(e.target.value)} className={inputCls} placeholder="IN" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fine Amount (USD)</label>
                <input type="number" value={fineAmount} onChange={e => setFineAmount(e.target.value)} className={inputCls} />
              </div>
            </div>
            <button
              onClick={handleRecord}
              disabled={recording}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {recording ? 'Broadcasting…' : '📡 Record On-Chain'}
            </button>
            {recordError && <p className="text-red-500 text-sm">{recordError}</p>}
            {recordResult && (
              <div className="text-xs font-mono bg-gray-900 text-green-400 rounded-xl p-4 space-y-1 overflow-x-auto">
                <p>✅ <strong>Record ID:</strong> {recordResult.record_id}</p>
                <p>🔗 <strong>Tx Hash:</strong> {recordResult.tx_hash}</p>
                <p>🔒 <strong>Data Hash:</strong> {recordResult.data_hash}</p>
                <p>📦 <strong>Block:</strong> {recordResult.block_number}</p>
                <p>ℹ️  <strong>Mode:</strong> {recordResult.mock ? 'Mock (blockchain disabled)' : 'Live'}</p>
              </div>
            )}
          </section>

          {/* Verify */}
          <section className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Verify Record</h2>
            <div className="flex gap-2">
              <input
                value={verifyId}
                onChange={e => setVerifyId(e.target.value)}
                placeholder="0xabc123… (record ID)"
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {verifying ? '…' : 'Verify'}
              </button>
            </div>
            {verifyError && <p className="text-red-500 text-sm">{verifyError}</p>}
            {verifyResult && (
              <div className="text-xs font-mono bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto">
                {JSON.stringify(verifyResult, null, 2)}
              </div>
            )}
          </section>

          {/* History */}
          <section className="space-y-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">My On-Chain History</h2>
              <button
                onClick={loadHistory}
                disabled={histLoading}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {histLoading ? 'Loading…' : 'Load'}
              </button>
            </div>
            {history.length > 0 ? (
              <ul className="space-y-1">
                {history.map(id => (
                  <li
                    key={id}
                    className="text-xs font-mono text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 truncate"
                    onClick={() => { setVerifyId(id); setTab('verify'); }}
                  >
                    {id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No records found. Record a violation first.</p>
            )}
          </section>
        </div>
      </Layout>
    </>
  );
}

// unused but prevents TS error from onClick hack
function setTab(_: string) {}
