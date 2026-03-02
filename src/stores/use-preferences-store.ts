import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { FuelType } from '@/types/station';

interface PreferencesState {
  locale: 'en' | 'ar';
  preferredFuel: FuelType | null;
  defaultRadius: number;
  currency: 'LBP' | 'USD' | 'both';
  theme: 'light' | 'dark' | 'system';
  hasCompletedOnboarding: boolean;
  setLocale: (locale: 'en' | 'ar') => void;
  setPreferredFuel: (fuel: FuelType | null) => void;
  setDefaultRadius: (radius: number) => void;
  setCurrency: (currency: 'LBP' | 'USD' | 'both') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  completeOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: 'en',
      preferredFuel: null,
      defaultRadius: 5,
      currency: 'both',
      theme: 'system',
      hasCompletedOnboarding: false,
      setLocale: (locale) => set({ locale }),
      setPreferredFuel: (fuel) => set({ preferredFuel: fuel }),
      setDefaultRadius: (radius) => set({ defaultRadius: radius }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    { name: 'benzina-preferences' },
  ),
);
