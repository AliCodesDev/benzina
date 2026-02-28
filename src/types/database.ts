export interface Database {
  public: {
    Tables: {
      stations: {
        Row: {
          id: string;
          slug: string;
          name_en: string;
          name_ar: string | null;
          brand: string | null;
          brand_slug: string | null;
          location: string;
          address_en: string | null;
          address_ar: string | null;
          caza: string | null;
          city: string | null;
          phone: string | null;
          fuel_types: string[];
          is_24h: boolean;
          operating_hours: Record<string, unknown> | null;
          status: string;
          amenities: string[] | null;
          source: string;
          dgo_id: string | null;
          osm_id: number | null;
          google_place_id: string | null;
          created_at: string;
          updated_at: string;
          verified_at: string | null;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          name_en: string;
          name_ar?: string | null;
          brand?: string | null;
          brand_slug?: string | null;
          location: string;
          address_en?: string | null;
          address_ar?: string | null;
          caza?: string | null;
          city?: string | null;
          phone?: string | null;
          fuel_types: string[];
          is_24h?: boolean;
          operating_hours?: Record<string, unknown> | null;
          status?: string;
          amenities?: string[] | null;
          source?: string;
          dgo_id?: string | null;
          osm_id?: number | null;
          google_place_id?: string | null;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
          is_verified?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          name_en?: string;
          name_ar?: string | null;
          brand?: string | null;
          brand_slug?: string | null;
          location?: string;
          address_en?: string | null;
          address_ar?: string | null;
          caza?: string | null;
          city?: string | null;
          phone?: string | null;
          fuel_types?: string[];
          is_24h?: boolean;
          operating_hours?: Record<string, unknown> | null;
          status?: string;
          amenities?: string[] | null;
          source?: string;
          dgo_id?: string | null;
          osm_id?: number | null;
          google_place_id?: string | null;
          created_at?: string;
          updated_at?: string;
          verified_at?: string | null;
          is_verified?: boolean;
        };
        Relationships: [];
      };
      fuel_prices: {
        Row: {
          id: string;
          fuel_type: string;
          price_lbp: number;
          price_unit: string;
          effective_date: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          fuel_type: string;
          price_lbp: number;
          price_unit: string;
          effective_date: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          fuel_type?: string;
          price_lbp?: number;
          price_unit?: string;
          effective_date?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      scrape_logs: {
        Row: {
          id: string;
          scraper_name: string;
          status: string;
          records_found: number;
          records_updated: number;
          error_message: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scraper_name: string;
          status: string;
          records_found?: number;
          records_updated?: number;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scraper_name?: string;
          status?: string;
          records_found?: number;
          records_updated?: number;
          error_message?: string | null;
          duration_ms?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      nearby_stations: {
        Args: {
          lat: number;
          lng: number;
          radius_km?: number;
          fuel_filter?: string[];
          brand_filter?: string;
          result_limit?: number;
        };
        Returns: {
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
        }[];
      };
    };
  };
}
