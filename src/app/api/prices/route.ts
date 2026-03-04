import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import type { FuelPrice } from '@/types/price';

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: prices, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .order('effective_date', { ascending: false })
      .order('fuel_type');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch prices' },
        { status: 500 },
      );
    }

    // Deduplicate: keep only the latest entry per fuel_type
    const latestPrices = Object.values(
      (prices ?? []).reduce<Record<string, FuelPrice>>((acc, price) => {
        if (!acc[price.fuel_type]) {
          acc[price.fuel_type] = price as FuelPrice;
        }
        return acc;
      }, {}),
    );

    const lastUpdated =
      latestPrices.length > 0 ? latestPrices[0].effective_date : null;

    const response = NextResponse.json({ prices: latestPrices, lastUpdated });
    response.headers.set('Cache-Control', 'public, s-maxage=3600');

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
