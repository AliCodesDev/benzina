import {
  ArrowLeft,
  Clock,
  Droplets,
  Fuel,
  MapPin,
  Phone,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { FuelBadge } from '@/components/station/fuel-badge';
import { NavigateButton } from '@/components/station/navigate-button';
import { ShareButton } from '@/components/station/share-button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { BRAND_COLORS, LBP_USD_RATE } from '@/lib/constants';
import { createServerClient } from '@/lib/supabase/server';
import type { FuelType } from '@/types/station';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getStation(id: string) {
  const supabase = await createServerClient();
  const isUuid = UUID_REGEX.test(id);

  const { data: station, error } = await (isUuid
    ? supabase.from('stations').select('*').eq('id', id)
    : supabase.from('stations').select('*').eq('slug', id)
  ).single();

  if (error || !station) return null;

  // Extract lat/lng from PostGIS geography
  let lat: number | null = null;
  let lng: number | null = null;

  if (station.location) {
    const loc = station.location;
    try {
      // PostgREST may return GeoJSON object or stringified GeoJSON
      const geo = typeof loc === 'string' ? JSON.parse(loc) : loc;
      if (geo?.type === 'Point' && Array.isArray(geo.coordinates)) {
        lng = geo.coordinates[0];
        lat = geo.coordinates[1];
      }
    } catch {
      // PostGIS returns EWKB hex string — decode it
      if (typeof loc === 'string' && /^[0-9a-fA-F]+$/.test(loc)) {
        try {
          const buf = Buffer.from(loc, 'hex');
          const le = buf[0] === 1;
          const wkbType = le ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
          const hasSRID = (wkbType & 0x20000000) !== 0;
          const offset = hasSRID ? 9 : 5;
          lng = le ? buf.readDoubleLE(offset) : buf.readDoubleBE(offset);
          lat = le ? buf.readDoubleLE(offset + 8) : buf.readDoubleBE(offset + 8);
        } catch {
          // ignore decode errors
        }
      }
    }
  }

  // Fetch latest fuel prices (one per fuel_type)
  const { data: prices } = await supabase
    .from('fuel_prices')
    .select('*')
    .order('effective_date', { ascending: false })
    .order('fuel_type', { ascending: true });

  const latestPrices = Object.values(
    (prices ?? []).reduce<Record<string, NonNullable<typeof prices>[number]>>(
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
  return { station: { ...stationFields, lat, lng }, prices: latestPrices };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getStation(id);

  if (!data) {
    return { title: 'Station Not Found - Benzina' };
  }

  const { station } = data;
  const fuelList = station.fuel_types.join(', ');
  const description = station.address_en
    ? `Gas station in ${station.address_en}. Fuel types: ${fuelList}`
    : `Gas station. Fuel types: ${fuelList}`;

  return {
    title: `${station.name_en} - Benzina`,
    description,
    openGraph: {
      title: `${station.name_en} - Benzina`,
      description,
      images: [`/api/og?slug=${station.slug}`],
    },
  };
}

export default async function StationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getStation(id);

  if (!data) notFound();

  const { station, prices } = data;
  const locale = await getLocale();
  const t = await getTranslations('station');
  const tFuel = await getTranslations('fuel');
  const tBrand = await getTranslations('brand');

  const name =
    locale === 'ar' && station.name_ar ? station.name_ar : station.name_en;
  const address =
    locale === 'ar' && station.address_ar
      ? station.address_ar
      : station.address_en;
  const brandColor =
    BRAND_COLORS[station.brand_slug ?? ''] ??
    BRAND_COLORS[station.brand ?? ''] ??
    BRAND_COLORS.default;

  const isOpen = station.status === 'active';
  const stationUrl =
    typeof window === 'undefined'
      ? `/station/${station.slug}`
      : `${window.location.origin}/station/${station.slug}`;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Brand color bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: brandColor }}
      />

      <div className="px-4 py-5 space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t('backToMap')}
        </Link>

        {/* Header */}
        <div className="space-y-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: brandColor }}
            />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {station.brand ?? tBrand('independent')}
            </span>
          </div>

          {/* Station name */}
          <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-instrument-serif)] italic leading-tight">
            {name}
          </h1>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
            <span
              className={`text-sm font-medium ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {station.is_24h
                ? t('open24h')
                : isOpen
                  ? t('openNow')
                  : t('closed')}
            </span>
          </div>
        </div>

        {/* Fuel type badges */}
        <div className="flex flex-wrap gap-2">
          {station.fuel_types.map((type) => (
            <FuelBadge key={type} fuelType={type as FuelType} />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {station.lat != null && station.lng != null && (
            <NavigateButton
              latitude={station.lat}
              longitude={station.lng}
              stationName={station.name_en}
            />
          )}
          <ShareButton
            url={stationUrl}
            title={`${station.name_en} - Benzina`}
          />
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          {/* Address */}
          {address && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('address')}
                </p>
                <p className="text-sm mt-0.5">{address}</p>
              </div>
            </div>
          )}

          {/* Phone */}
          {station.phone && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Phone className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('phone')}
                </p>
                <a
                  href={`tel:${station.phone}`}
                  className="text-sm mt-0.5 text-primary hover:underline"
                >
                  {station.phone}
                </a>
              </div>
            </div>
          )}

          {/* Operating hours */}
          {station.operating_hours && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Clock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('operatingHours')}
                </p>
                <p className="text-sm mt-0.5">
                  {station.is_24h ? t('open24h') : t('openNow')}
                </p>
              </div>
            </div>
          )}

          {/* Amenities */}
          {station.amenities && station.amenities.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Droplets className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('amenities')}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {station.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fuel Prices */}
        {prices.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Fuel className="size-5" />
              {t('currentPrices')}
            </h2>
            <div className="grid gap-2">
              {prices.map((price) => (
                <div
                  key={price.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium">
                    {tFuel(price.fuel_type as FuelType)}
                  </span>
                  <div className="text-end">
                    <p className="text-sm font-semibold">
                      {price.price_lbp.toLocaleString()}{' '}
                      <span className="text-muted-foreground font-normal">
                        LBP
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~${(price.price_lbp / LBP_USD_RATE).toFixed(2)} USD
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map link */}
        {station.lat != null && station.lng != null && (
          <Link
            href={`/?lat=${station.lat}&lng=${station.lng}&zoom=16`}
            className="flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <MapPin className="size-4" />
            {t('viewOnMap')}
          </Link>
        )}
      </div>
    </div>
  );
}
