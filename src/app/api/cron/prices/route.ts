import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

const TOTAL_PRICING_URL = 'https://pricing.totalenergies.com.lb/fuelprice/';

// HTML structure per fuel type:
//   <div id="v1">1957000</div>
//   <div id="id1">excellium-unleaded-98</div>
// The price is in a hidden div, followed by the fuel identifier in the next div.
const FUEL_PATTERNS: { key: string; regex: RegExp; unit: string }[] = [
  { key: '95', regex: /id="v\d+">(\d+)<\/div>\s*<div[^>]*>excellium-unleaded-95</i, unit: '20L' },
  { key: '98', regex: /id="v\d+">(\d+)<\/div>\s*<div[^>]*>excellium-unleaded-98</i, unit: '20L' },
  { key: 'diesel', regex: /id="v\d+">(\d+)<\/div>\s*<div[^>]*>diesel</i, unit: '20L' },
  { key: 'lpg', regex: /id="v\d+">(\d+)<\/div>\s*<div[^>]*>gasoil</i, unit: '10kg' },
];

const MIN_VALID_PRICE = 100_000; // Sanity check: no fuel price should be under 100,000 LBP

function parsePrice(raw: string): number {
  return parseInt(raw.replace(/,/g, ''), 10);
}

export async function GET(request: NextRequest) {
  // Verify the request comes from Vercel Cron or has the correct secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch TotalEnergies pricing page
    const res = await fetch(TOTAL_PRICING_URL, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch pricing page: ${res.status}` },
        { status: 502 },
      );
    }

    const html = await res.text();

    // Extract prices
    const prices: { fuel_type: string; price_lbp: number; price_unit: string }[] = [];

    for (const { key, regex, unit } of FUEL_PATTERNS) {
      const match = html.match(regex);
      if (match) {
        const price = parsePrice(match[1]);
        if (price >= MIN_VALID_PRICE) {
          prices.push({ fuel_type: key, price_lbp: price, price_unit: unit });
        }
      }
    }

    if (prices.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any prices from page' },
        { status: 502 },
      );
    }

    // Upsert to database
    const today = new Date().toISOString().slice(0, 10);
    const supabase = createAdminClient();

    const rows = prices.map((p) => ({
      ...p,
      effective_date: today,
      source: 'dgo',
    }));

    const { error } = await supabase
      .from('fuel_prices')
      .upsert(rows, { onConflict: 'fuel_type,effective_date' });

    if (error) {
      return NextResponse.json(
        { error: `Database upsert failed: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      date: today,
      prices: prices.map((p) => ({
        fuel_type: p.fuel_type,
        price_lbp: p.price_lbp,
        price_unit: p.price_unit,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
