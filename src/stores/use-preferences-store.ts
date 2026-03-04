import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { FuelType } from '@/types/station';

interface PreferencesState {
  locale: 'en' | 'ar';
  preferredFuels: FuelType[];
  defaultRadius: number;
  currency: 'LBP' | 'USD' | 'both';
  theme: 'light' | 'dark' | 'system';
  hasCompletedOnboarding: boolean;
  setLocale: (locale: 'en' | 'ar') => void;
  setPreferredFuels: (fuels: FuelType[]) => void;
  setDefaultRadius: (radius: number) => void;
  setCurrency: (currency: 'LBP' | 'USD' | 'both') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  completeOnboarding: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: 'en',
      preferredFuels: [],
      defaultRadius: 5,
      currency: 'both',
      theme: 'system',
      hasCompletedOnboarding: false,
      setLocale: (locale) => set({ locale }),
      setPreferredFuels: (fuels) => set({ preferredFuels: fuels }),
      setDefaultRadius: (radius) => set({ defaultRadius: radius }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
    }),
    { name: 'benzina-preferences' },
  ),
);
