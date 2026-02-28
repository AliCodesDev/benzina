import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

import { BEIRUT_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants';

const DEFAULT_LIMIT = 50;

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

    // Additional text search filter
    if (q) {
      const query = q.toLowerCase();
      stations = stations.filter(
        (s) =>
          s.name_en.toLowerCase().includes(query) ||
          (s.brand?.toLowerCase().includes(query) ?? false),
      );
    }

    const response = NextResponse.json({
      stations,
      count: stations.length,
      params: { lat, lng, radius, fuel, brand, q },
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
