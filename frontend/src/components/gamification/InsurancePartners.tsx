import React from 'react';

export interface InsuranceDeal {
  name:          string;
  discount_pct:  number;
  description:   string;
  affiliate_url: string | null;
  country_codes: string[];
  eligible:      boolean;
}

interface InsurancePartnersProps {
  deals:       InsuranceDeal[];
  userScore:   number;
  loading?:    boolean;
}

function DiscountBadge({ pct }: { pct: number }) {
  const color =
    pct >= 20 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
    pct >= 15 ? 'bg-blue-100  text-blue-700  dark:bg-blue-900/40  dark:text-blue-300'  :
                'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {pct}% OFF
    </span>
  );
}

export default function InsurancePartners({
  deals,
  userScore,
  loading = false,
}: InsurancePartnersProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-400">
        <p className="text-3xl mb-2">🛡️</p>
        <p className="text-sm">
          Improve your compliance score to unlock insurance partner discounts.
        </p>
        <p className="text-xs mt-1 opacity-70">Current score: {userScore}/100</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map(deal => (
        <div
          key={deal.name}
          className="flex flex-col justify-between gap-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight">
                {deal.name}
              </h3>
              <DiscountBadge pct={deal.discount_pct} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {deal.description}
            </p>
          </div>

          {deal.country_codes.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {deal.country_codes.map(cc => (
                <span
                  key={cc}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono"
                >
                  {cc}
                </span>
              ))}
            </div>
          )}

          {deal.affiliate_url ? (
            <a
              href={deal.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
            >
              Claim Discount ↗
            </a>
          ) : (
            <span className="text-xs text-gray-400 italic">Contact us to claim</span>
          )}
        </div>
      ))}
    </div>
  );
}
