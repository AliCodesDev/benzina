import { create } from 'zustand';

import { BEIRUT_CENTER, DEFAULT_ZOOM } from '@/lib/constants';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedStationId: string | null;
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  selectStation: (id: string | null) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: BEIRUT_CENTER.lat, lng: BEIRUT_CENTER.lng },
  zoom: DEFAULT_ZOOM,
  selectedStationId: null,
  setCenter: (lat, lng) => set({ center: { lat, lng } }),
  setZoom: (zoom) => set({ zoom }),
  selectStation: (id) => set({ selectedStationId: id }),
  flyTo: (lat, lng, zoom) =>
    set((state) => ({
      center: { lat, lng },
      zoom: zoom ?? state.zoom,
    })),
}));
