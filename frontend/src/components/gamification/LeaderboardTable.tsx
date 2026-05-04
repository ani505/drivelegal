import React from 'react';

export interface LeaderboardEntry {
  rank:             number;
  user_id:          number;
  display_name:     string;
  score:            number;
  badge_count:      number;
  violations_count: number;
  region_key:       string;
  period:           string;
}

interface LeaderboardTableProps {
  entries:        LeaderboardEntry[];
  currentUserId?: number;
  loading?:       boolean;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 1000) / 10; // normalise to %
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-600"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function LeaderboardTable({
  entries,
  currentUserId,
  loading = false,
}: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <p className="text-4xl mb-3">🏁</p>
        <p className="text-sm">No rankings yet for this period / region.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
            <th className="py-3 px-4 text-left w-14">Rank</th>
            <th className="py-3 px-4 text-left">Driver</th>
            <th className="py-3 px-4 text-right">Score</th>
            <th className="py-3 px-4 text-right hidden sm:table-cell">Badges</th>
            <th className="py-3 px-4 text-right hidden md:table-cell">Violations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {entries.map(entry => {
            const isMe = currentUserId && entry.user_id === currentUserId;
            const medal = RANK_MEDALS[entry.rank];

            return (
              <tr
                key={entry.user_id}
                className={`
                  transition-colors
                  ${isMe
                    ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}
                `}
              >
                {/* Rank */}
                <td className="py-3 px-4">
                  <span className="text-base">
                    {medal ?? (
                      <span className="text-gray-400 dark:text-gray-500 font-mono">
                        #{entry.rank}
                      </span>
                    )}
                  </span>
                </td>

                {/* Driver */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {entry.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="truncate max-w-[120px]">
                        {entry.display_name}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <ScoreBar score={entry.score} />
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="py-3 px-4 text-right">
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {entry.score.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </td>

                {/* Badges */}
                <td className="py-3 px-4 text-right hidden sm:table-cell">
                  <span className="text-amber-600 dark:text-amber-400">
                    🎖️ {entry.badge_count}
                  </span>
                </td>

                {/* Violations */}
                <td className="py-3 px-4 text-right hidden md:table-cell">
                  <span className={entry.violations_count === 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-500 dark:text-red-400'}>
                    {entry.violations_count === 0 ? '✅ 0' : `⚠️ ${entry.violations_count}`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
