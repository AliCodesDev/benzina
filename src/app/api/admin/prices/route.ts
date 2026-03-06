import { NextRequest, NextResponse } from 'next/server';

import { verifyAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_FUEL_TYPES = ['95', '98', 'diesel', 'lpg'] as const;

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: prices, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .order('effective_date', { ascending: false })
      .order('fuel_type')
      .limit(80); // 20 dates × 4 fuel types

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch prices' },
        { status: 500 },
      );
    }

    return NextResponse.json({ prices: prices ?? [] });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fuel_type, price_lbp, price_unit, effective_date } = body;

    if (!VALID_FUEL_TYPES.includes(fuel_type)) {
      return NextResponse.json(
        { error: `Invalid fuel_type. Must be one of: ${VALID_FUEL_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!price_lbp || typeof price_lbp !== 'number' || price_lbp <= 0) {
      return NextResponse.json(
        { error: 'price_lbp must be a positive number' },
        { status: 400 },
      );
    }

    if (!effective_date) {
      return NextResponse.json(
        { error: 'effective_date is required' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('fuel_prices')
      .upsert(
        {
          fuel_type,
          price_lbp,
          price_unit: price_unit ?? 'LBP/L',
          effective_date,
          source: 'admin',
        },
        { onConflict: 'fuel_type,effective_date' },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ price: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
