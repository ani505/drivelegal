import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  setCountry: (code: string, name: string) => void;
  setState:   (code: string, name: string) => void;
  reset:      () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      countryCode: 'IN',
      countryName: 'India',
      stateCode:   '',
      stateName:   '',
      setCountry: (code, name) => set({ countryCode: code, countryName: name, stateCode: '', stateName: '' }),
      setState:   (code, name) => set({ stateCode: code, stateName: name }),
      reset:      () => set({ countryCode: 'IN', countryName: 'India', stateCode: '', stateName: '' }),
    }),
    { name: 'dl-location' }
  )
);
