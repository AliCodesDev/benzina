import type { FuelType } from '@/types/station';

export interface FuelPrice {
  id: string;
  station_id: string;
  fuel_type: FuelType;
  price_lbp: number;
  price_usd: number | null;
  reported_at: string;
  created_at: string;
}

export interface FuelPriceInsert {
  station_id: string;
  fuel_type: FuelType;
  price_lbp: number;
  price_usd?: number | null;
  reported_at?: string;
}
