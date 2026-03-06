import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)));
  const q = searchParams.get('q') ?? undefined;
  const offset = (page - 1) * limit;

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('stations')
      .select('*', { count: 'exact' });

    if (q) {
      const search = `%${q}%`;
      query = query.or(
        `name_en.ilike.${search},name_ar.ilike.${search},brand.ilike.${search},address_en.ilike.${search},city.ilike.${search}`,
      );
    }

    const { data: stations, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stations' },
        { status: 500 },
      );
    }

    // Parse lat/lng from PostGIS location for each station
    const parsed = (stations ?? []).map((station) => {
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
          // ignore parse errors
        }
      }

      const { location: _location, ...rest } = station;
      return { ...rest, lat, lng };
    });

    return NextResponse.json({
      stations: parsed,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { lat, lng, slug: providedSlug, ...fields } = body;

    if (!fields.name_en) {
      return NextResponse.json(
        { error: 'name_en is required' },
        { status: 400 },
      );
    }

    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: 'lat and lng are required' },
        { status: 400 },
      );
    }

    const slug = providedSlug || slugify(fields.name_en);
    const location = `POINT(${lng} ${lat})`;

    const supabase = createAdminClient();

    const { data: station, error } = await supabase
      .from('stations')
      .insert({
        ...fields,
        slug,
        location,
        fuel_types: fields.fuel_types ?? [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ station }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
