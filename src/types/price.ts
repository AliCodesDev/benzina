import type { FuelType } from '@/types/station';

export interface FuelPrice {
  id: string;
  fuel_type: FuelType;
  price_lbp: number;
  price_unit: string;
  effective_date: string;
  source: string;
  created_at: string;
}
