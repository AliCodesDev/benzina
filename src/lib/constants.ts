export const BEIRUT_CENTER = { lat: 33.8938, lng: 35.5018 } as const;
export const DEFAULT_ZOOM = 13;
export const DEFAULT_RADIUS_KM = 5;
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';
export const BRAND_COLORS: Record<string, string> = {
  total: '#e11d48',
  totalenergies: '#e11d48',
  medco: '#2563eb',
  ipt: '#16a34a',
  coral: '#f97316',
  hypco: '#7c3aed',
  uniterminals: '#0891b2',
  wardieh: '#dc2626',
  apoil: '#ea580c',
  default: '#94a3b8',
};
export const FUEL_TYPES = ['95', '98', 'diesel', 'lpg'] as const;
export const RADIUS_OPTIONS = [1, 3, 5, 10, 25] as const;
export const LBP_USD_RATE = 89500; // approximate, update as needed
