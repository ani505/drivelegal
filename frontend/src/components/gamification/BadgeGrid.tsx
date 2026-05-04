import React from 'react';

export interface BadgeData {
  key: string;
  name: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  description: string;
  earned_at?: string;
}

interface BadgeGridProps {
  badges: BadgeData[];
  allBadges?: BadgeData[];   // for greying-out unearned badges
  showUnearned?: boolean;
}

const TIER_STYLES: Record<string, string> = {
  bronze:   'border-amber-600   bg-amber-50  dark:bg-amber-950/30  text-amber-800  dark:text-amber-300',
  silver:   'border-slate-400   bg-slate-50  dark:bg-slate-800/40  text-slate-700  dark:text-slate-300',
  gold:     'border-yellow-500  bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  platinum: 'border-purple-500  bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
};

const TIER_GLOW: Record<string, string> = {
  bronze:   'shadow-amber-200  dark:shadow-amber-900',
  silver:   'shadow-slate-200  dark:shadow-slate-700',
  gold:     'shadow-yellow-200 dark:shadow-yellow-900',
  platinum: 'shadow-purple-200 dark:shadow-purple-900',
};

function BadgeCard({ badge, earned }: { badge: BadgeData; earned: boolean }) {
  const tier = badge.tier || 'bronze';
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.bronze;
  const glow      = TIER_GLOW[tier]  ?? TIER_GLOW.bronze;

  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
        ${tierStyle}
        ${earned
          ? `shadow-lg ${glow} hover:scale-105 cursor-default`
          : 'opacity-35 grayscale border-gray-200 bg-gray-50 dark:bg-gray-900/20'}
      `}
      title={badge.description}
    >
      {/* Tier ribbon */}
      <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider opacity-60">
        {tier}
      </span>

      {/* Icon */}
      <span className="text-4xl select-none" role="img" aria-label={badge.name}>
        {badge.icon}
      </span>

      {/* Name */}
      <p className="text-sm font-semibold text-center leading-tight">{badge.name}</p>

      {/* Points */}
      <span className="text-xs font-medium opacity-75">+{badge.points} pts</span>

      {/* Earned date */}
      {earned && badge.earned_at && (
        <span className="text-[10px] opacity-50 mt-auto">
          {new Date(badge.earned_at).toLocaleDateString()}
        </span>
      )}

      {/* Lock icon for unearned */}
      {!earned && (
        <span className="text-gray-400 dark:text-gray-600 text-lg">🔒</span>
      )}
    </div>
  );
}

export default function BadgeGrid({
  badges,
  allBadges,
  showUnearned = true,
}: BadgeGridProps) {
  const earnedKeys = new Set(badges.map(b => b.key));
  const unearned   = (allBadges ?? []).filter(b => !earnedKeys.has(b.key));

  if (badges.length === 0 && (!showUnearned || unearned.length === 0)) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-600">
        <p className="text-4xl mb-3">🎖️</p>
        <p className="text-sm">No badges yet — keep driving safely!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {badges.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Earned ({badges.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {badges.map(b => (
              <BadgeCard key={b.key} badge={b} earned />
            ))}
          </div>
        </section>
      )}

      {showUnearned && unearned.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">
            Locked ({unearned.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {unearned.map(b => (
              <BadgeCard key={b.key} badge={b} earned={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
