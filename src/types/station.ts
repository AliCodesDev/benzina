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
  name_en: string;
  name_ar: string;
  brand: Brand;
  address_en: string;
  address_ar: string;
  lat: number;
  lng: number;
  phone: string | null;
  status: StationStatus;
  fuel_types: FuelType[];
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface NearbyStation extends Station {
  distance_km: number;
}

export interface StationInsert {
  name_en: string;
  name_ar: string;
  brand: Brand;
  address_en: string;
  address_ar: string;
  lat: number;
  lng: number;
  phone?: string | null;
  status?: StationStatus;
  fuel_types: FuelType[];
  amenities?: string[];
}
