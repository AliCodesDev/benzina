export type FuelType = '95' | '98' | 'diesel' | 'lpg';

export type StationStatus = 'active' | 'closed' | 'temporarily_closed';

export type Brand =
  | 'total'
  | 'totalenergies'
  | 'medco'
  | 'ipt'
  | 'coral'
  | 'hypco'
  | 'uniterminals'
  | 'wardieh'
  | 'apoil';

export interface Station {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  brand: string | null;
  brand_slug: string | null;
  address_en: string | null;
  address_ar: string | null;
  phone: string | null;
  status: string;
  fuel_types: string[];
  amenities: string[] | null;
  is_24h: boolean;
  created_at: string;
  updated_at: string;
}

export interface NearbyStation {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  brand: string | null;
  brand_slug: string | null;
  latitude: number;
  longitude: number;
  address_en: string | null;
  address_ar: string | null;
  phone: string | null;
  fuel_types: string[];
  amenities: string[] | null;
  is_24h: boolean;
  status: string;
  distance_meters: number;
}

export interface StationInsert {
  name_en: string;
  name_ar?: string | null;
  brand?: string | null;
  address_en?: string | null;
  address_ar?: string | null;
  lat: number;
  lng: number;
  phone?: string | null;
  status?: StationStatus;
  fuel_types: FuelType[];
  amenities?: string[];
}
