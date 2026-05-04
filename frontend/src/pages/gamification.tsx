import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/ui/Layout';
import BadgeGrid, { BadgeData } from '@/components/gamification/BadgeGrid';
import LeaderboardTable, { LeaderboardEntry } from '@/components/gamification/LeaderboardTable';
import InsurancePartners, { InsuranceDeal } from '@/components/gamification/InsurancePartners';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from 'react-query';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type Tab = 'badges' | 'leaderboard' | 'insurance';

export default function GamificationPage() {
  const { user } = useAuthStore();
  const userId   = user?.id ?? 1;

  const [tab, setTab] = useState<Tab>('badges');

  // Badge state
  const [myBadges,  setMyBadges]  = useState<BadgeData[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [badgeLoad, setBadgeLoad] = useState(true);

  // Leaderboard state
  const [entries,   setEntries]   = useState<LeaderboardEntry[]>([]);
  const [period,    setPeriod]    = useState<string>('monthly');
  const [region,    setRegion]    = useState<string>('GLOBAL');
  const [lbLoad,    setLbLoad]    = useState(false);

  // Insurance state
  const [deals,     setDeals]     = useState<InsuranceDeal[]>([]);
  const [insLoad,   setInsLoad]   = useState(false);
  const { data: riskData, isLoading } = useQuery('risk-score', async () => {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/profile/risk-score`);
    return res.data;
  });

  const userScore = riskData?.compliance_score ?? 0;

  // ─── Loaders ───────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadBadges() {
      setBadgeLoad(true);
      try {
        const [myRes, allRes] = await Promise.all([
          fetch(`${API}/gamification/my-badges?user_id=${userId}`),
          fetch(`${API}/gamification/badges`),
        ]);
        if (myRes.ok)  setMyBadges(await myRes.json());
        if (allRes.ok) setAllBadges(await allRes.json());
      } catch {/* ignore */} finally { setBadgeLoad(false); }
    }
    loadBadges();
  }, [userId]);

  useEffect(() => {
    if (tab !== 'leaderboard') return;
    async function loadLeaderboard() {
      setLbLoad(true);
      try {
        const res = await fetch(
          `${API}/gamification/leaderboard?region=${region}&period=${period}&limit=20`
        );
        if (res.ok) setEntries(await res.json());
      } catch {/* ignore */} finally { setLbLoad(false); }
    }
    loadLeaderboard();
  }, [tab, period, region]);

  useEffect(() => {
    if (tab !== 'insurance') return;
    async function loadInsurance() {
      setInsLoad(true);
      try {
        const res = await fetch(
          `${API}/gamification/insurance-deals?user_id=${userId}&score=${userScore}`
        );
        if (res.ok) {
          const data = await res.json();
          setDeals(data.eligible_deals ?? []);
        }
      } catch {/* ignore */} finally { setInsLoad(false); }
    }
    loadInsurance();
  }, [tab, userId]);

  async function checkBadges() {
    const res = await fetch(`${API}/gamification/check-badges?user_id=${userId}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.newly_awarded?.length) {
        alert(`🎉 New badge(s) unlocked: ${data.newly_awarded.map((b: BadgeData) => b.name).join(', ')}`);
        setMyBadges(prev => [...prev, ...data.newly_awarded]);
      } else {
        alert('No new badges this time. Keep driving safely!');
      }
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'badges',      label: 'Badges',      icon: '🎖️' },
    { key: 'leaderboard', label: 'Leaderboard',  icon: '🏆' },
    { key: 'insurance',   label: 'Insurance Deals', icon: '🛡️' },
  ];

  return (
    <>
      <Head>
        <title>Gamification — DriveLegal</title>
      </Head>
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                Safe Driver Rewards
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Earn badges, climb the leaderboard, and unlock insurance discounts.
              </p>
            </div>
            <button
              onClick={checkBadges}
              className="self-start sm:self-auto px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Check New Badges
            </button>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-2xl font-bold text-amber-500">{myBadges.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Badges Earned</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-2xl font-bold text-emerald-500">
                {myBadges.reduce((s, b) => s + b.points, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Points</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-2xl font-bold text-blue-500">{userScore}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compliance Score</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all
                  ${tab === t.key
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                `}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-64">
            {tab === 'badges' && (
              badgeLoad
                ? <div className="text-center py-16 text-gray-400">Loading badges…</div>
                : <BadgeGrid badges={myBadges} allBadges={allBadges} showUnearned />
            )}

            {tab === 'leaderboard' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  {['weekly', 'monthly', 'yearly', 'all_time'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        period === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="GLOBAL">🌍 Global</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="IN-MH">Maharashtra</option>
                    <option value="IN-DL">Delhi</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                  </select>
                </div>

                <LeaderboardTable
                  entries={entries}
                  currentUserId={userId}
                  loading={lbLoad}
                />
              </div>
            )}

            {tab === 'insurance' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your compliance score of <strong className="text-blue-600">{userScore}/100</strong> qualifies you for these partner discounts.
                </p>
                <InsurancePartners deals={deals} userScore={userScore} loading={insLoad} />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
