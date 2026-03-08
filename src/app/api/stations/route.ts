import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

import { BEIRUT_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants';
import { rankStations } from '@/lib/ranking';

const DEFAULT_LIMIT = 100;
const ARABIC_REGEX = /[\u0600-\u06FF]/;

type NearbyRow = {
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
};

function matchScore(station: NearbyRow, query: string, isArabic: boolean): number {
  const q = query.toLowerCase();

  // Exact brand match → highest
  if (station.brand?.toLowerCase() === q) return 100;

  // Brand starts with query
  if (station.brand?.toLowerCase().startsWith(q)) return 90;

  // Name match (prioritize Arabic fields for Arabic queries)
  if (isArabic) {
    if (station.name_ar?.includes(query)) return 80;
    if (station.address_ar?.includes(query)) return 60;
  }

  if (station.name_en.toLowerCase().startsWith(q)) return 75;
  if (station.name_en.toLowerCase().includes(q)) return 70;
  if (station.name_ar?.includes(query)) return 65;

  // Brand contains
  if (station.brand?.toLowerCase().includes(q)) return 50;

  // Address match
  if (station.address_en?.toLowerCase().includes(q)) return 30;
  if (station.address_ar?.includes(query)) return 25;

  return 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse parameters
  const lat = Number(searchParams.get('lat') ?? BEIRUT_CENTER.lat);
  const lng = Number(searchParams.get('lng') ?? BEIRUT_CENTER.lng);
  const radius = Number(searchParams.get('radius') ?? DEFAULT_RADIUS_KM);
  const fuel = searchParams.get('fuel') ?? undefined;
  const brand = searchParams.get('brand') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const sort = searchParams.get('sort') ?? 'distance';
  const preferredFuel = searchParams.get('preferredFuel') ?? undefined;

  // Validate parameters
  if (isNaN(lat) || lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: 'Invalid lat: must be between -90 and 90' },
      { status: 400 },
    );
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Invalid lng: must be between -180 and 180' },
      { status: 400 },
    );
  }
  if (isNaN(radius) || radius <= 0) {
    return NextResponse.json(
      { error: 'Invalid radius: must be greater than 0' },
      { status: 400 },
    );
  }
  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json(
      { error: 'Invalid limit: must be greater than 0' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.rpc('nearby_stations', {
      lat,
      lng,
      radius_km: radius,
      result_limit: limit,
      ...(fuel ? { fuel_filter: fuel.split(',') } : {}),
      ...(brand ? { brand_filter: brand } : {}),
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stations' },
        { status: 500 },
      );
    }

    let stations = data ?? [];

    // Text search: filter across name_en, name_ar, brand, address_en, address_ar
    if (q) {
      const query = q.toLowerCase();
      const isArabic = ARABIC_REGEX.test(q);

      stations = stations.filter((s) => {
        const fields = [
          s.name_en,
          s.name_ar,
          s.brand,
          s.address_en,
          s.address_ar,
        ];
        return fields.some((field) =>
          field?.toLowerCase().includes(query),
        );
      });

      // Sort by relevance: exact brand > name > address
      stations.sort(
        (a, b) => matchScore(b, q, isArabic) - matchScore(a, q, isArabic),
      );
    }

    // Apply sort mode (skip if text search already sorted by relevance)
    if (!q) {
      if (sort === 'rank') {
        stations = rankStations(stations, {
          preferredFuel: preferredFuel ?? null,
          maxRadius: radius * 1000, // km → meters
        });
      } else if (sort === 'name') {
        stations = [...stations].sort((a, b) =>
          a.name_en.localeCompare(b.name_en),
        );
      }
      // sort === 'distance' is the default from the RPC (no re-sort needed)
    }

    const response = NextResponse.json({
      stations,
      count: stations.length,
      params: { lat, lng, radius, fuel, brand, q, sort },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60');

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
