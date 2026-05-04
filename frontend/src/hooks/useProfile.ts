import { useQuery } from 'react-query';
import { profileApi } from '@/utils/api';

const MOCK_PROFILE = {
  id: 1,
  full_name: 'Demo User',
  email: 'demo@drivelegal.app',
  country_code: 'IN',
  state_code: null,
  license_number: 'DL-0120110012345',
};

const MOCK_RISK = {
  score:    42,
  category: 'medium' as const,
  factors:  ['2 violations in past 12 months', 'Frequent night driving', 'High speed zone activity'],
};

const MOCK_VIOLATIONS = [
  { id: 1, code: 'MV-184',  name: 'Overspeeding',    date: '2026-01-15', fine: 1500, currency: 'INR', status: 'paid', category: 'Speed' },
  { id: 2, code: 'MV-194B', name: 'Mobile Phone',     date: '2025-11-03', fine: 1000, currency: 'INR', status: 'paid', category: 'Attention' },
  { id: 3, code: 'MV-177',  name: 'Signal Jumping',   date: '2025-08-12', fine: 500,  currency: 'INR', status: 'paid', category: 'Traffic' },
  { id: 4, code: 'MV-129',  name: 'No Helmet',        date: '2025-06-20', fine: 1000, currency: 'INR', status: 'paid', category: 'Safety' },
];

export function useProfile() {
  const { data: profileData } = useQuery('profile',  () => profileApi.me(),         { retry: 1 });
  const { data: riskData }    = useQuery('risk',     () => profileApi.riskScore(),   { retry: 1 });
  const { data: historyData } = useQuery('history',  () => profileApi.violations(),  { retry: 1 });

  return {
    profile:  profileData?.data  ?? MOCK_PROFILE,
    risk:     riskData?.data     ?? MOCK_RISK,
    history:  historyData?.data  ?? MOCK_VIOLATIONS,
  };
}
