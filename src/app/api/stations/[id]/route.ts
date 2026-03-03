import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createServerClient();

    // Query by UUID or slug
    const isUuid = UUID_REGEX.test(id);
    const query = supabase.from('stations').select('*');
    const { data: station, error } = await (isUuid
      ? query.eq('id', id)
      : query.eq('slug', id)
    ).single();

    if (error || !station) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 },
      );
    }

    // Extract lat/lng from PostGIS geography (returned as GeoJSON by PostgREST)
    let lat: number | null = null;
    let lng: number | null = null;

    if (station.location) {
      try {
        const geo =
          typeof station.location === 'string'
            ? JSON.parse(station.location)
            : station.location;
        if (geo?.type === 'Point' && Array.isArray(geo.coordinates)) {
          lng = geo.coordinates[0];
          lat = geo.coordinates[1];
        }
      } catch {
        // location could not be parsed — leave lat/lng null
      }
    }

    // Fetch latest fuel prices (one per fuel_type, most recent effective_date)
    const { data: prices } = await supabase
      .from('fuel_prices')
      .select('*')
      .order('effective_date', { ascending: false })
      .order('fuel_type', { ascending: true });

    // Deduplicate: keep only the latest entry per fuel_type
    const latestPrices = Object.values(
      (prices ?? []).reduce<Record<string, (typeof prices extends (infer T)[] | null ? T : never)>>(
        (acc, price) => {
          if (!acc[price.fuel_type]) {
            acc[price.fuel_type] = price;
          }
          return acc;
        },
        {},
      ),
    );

    const { location: _location, ...stationFields } = station;

    const response = NextResponse.json({
      station: { ...stationFields, lat, lng },
      prices: latestPrices,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=300');

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
