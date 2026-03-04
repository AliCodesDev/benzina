import { ImageResponse } from 'next/og';
import { type NextRequest, NextResponse } from 'next/server';

import { BRAND_COLORS } from '@/lib/constants';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

const FUEL_LABELS: Record<string, string> = {
  '95': 'Gasoline 95',
  '98': 'Gasoline 98',
  diesel: 'Diesel',
  lpg: 'LPG',
};

const FUEL_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  '95': { bg: '#dbeafe', text: '#1e40af' },
  '98': { bg: '#ede9fe', text: '#5b21b6' },
  diesel: { bg: '#fef3c7', text: '#92400e' },
  lpg: { bg: '#dcfce7', text: '#166534' },
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const supabase = await createServerClient();

    const { data: station, error } = await supabase
      .from('stations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    const brandColor =
      BRAND_COLORS[station.brand_slug ?? ''] ??
      BRAND_COLORS[station.brand ?? ''] ??
      BRAND_COLORS.default;

    const image = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Brand color accent bar */}
          <div style={{ height: 6, width: '100%', backgroundColor: brandColor, display: 'flex' }} />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '48px 56px 40px',
            }}
          >
            {/* Top section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  B
                </div>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#f8fafc',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Benzina
                </span>
              </div>

              {/* Brand name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: brandColor,
                  }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {station.brand ?? 'Independent'}
                </span>
              </div>

              {/* Station name */}
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: '#f8fafc',
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {station.name_en}
              </div>

              {/* Address */}
              {station.address_en && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={{ fontSize: 20, color: '#94a3b8' }}>
                    {station.address_en}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom: Fuel type badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {station.fuel_types.map((type: string) => {
                const colors = FUEL_BADGE_COLORS[type] ?? {
                  bg: '#334155',
                  text: '#e2e8f0',
                };
                return (
                  <div
                    key={type}
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: 600,
                      padding: '6px 16px',
                      borderRadius: 20,
                    }}
                  >
                    {FUEL_LABELS[type] ?? type.toUpperCase()}
                  </div>
                );
              })}
              {station.is_24h && (
                <div
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#6ee7b7',
                    fontSize: 16,
                    fontWeight: 600,
                    padding: '6px 16px',
                    borderRadius: 20,
                  }}
                >
                  Open 24h
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );

    image.headers.set('Cache-Control', 'public, s-maxage=86400');

    return image;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
