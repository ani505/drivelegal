import { useEffect } from 'react';
import { useLocationStore } from '@/store/locationStore';
import { geoApi } from '@/utils/api';

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  AU: 'Australia',
  CA: 'Canada',
  SG: 'Singapore',
  AE: 'UAE',
};

/**
 * Auto-detects the user's jurisdiction on first load.
 * Returns the current location store state.
 */
export function useLocation() {
  const store = useLocationStore();

  useEffect(() => {
    // Only auto-detect if still on the default
    if (store.countryCode !== 'IN') return;

    geoApi.detect()
      .then((res) => {
        const code = res.data?.country_code;
        if (code && COUNTRY_NAMES[code]) {
          store.setCountry(code, COUNTRY_NAMES[code]);
        }
      })
      .catch(() => {
        // Keep default silently
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
