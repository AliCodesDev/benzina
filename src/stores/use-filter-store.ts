import { create } from 'zustand';

import { DEFAULT_RADIUS_KM } from '@/lib/constants';
import type { FuelType } from '@/types/station';

interface FilterState {
  fuelTypes: FuelType[];
  radius: number;
  searchQuery: string;
  brand: string | null;
  toggleFuelType: (type: FuelType) => void;
  setRadius: (km: number) => void;
  setSearchQuery: (q: string) => void;
  setBrand: (brand: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  fuelTypes: [],
  radius: DEFAULT_RADIUS_KM,
  searchQuery: '',
  brand: null,
  toggleFuelType: (type) =>
    set((state) => ({
      fuelTypes: state.fuelTypes.includes(type)
        ? state.fuelTypes.filter((t) => t !== type)
        : [...state.fuelTypes, type],
    })),
  setRadius: (km) => set({ radius: km }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setBrand: (brand) => set({ brand }),
  resetFilters: () =>
    set({ fuelTypes: [], radius: DEFAULT_RADIUS_KM, searchQuery: '', brand: null }),
}));
