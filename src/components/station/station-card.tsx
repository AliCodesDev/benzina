'use client';

import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { FuelBadge } from '@/components/station/fuel-badge';
import { BRAND_COLORS } from '@/lib/constants';
import { cn, formatDistance } from '@/lib/utils';
import type { FuelType, NearbyStation } from '@/types/station';

interface StationCardProps {
  station: NearbyStation;
  isSelected: boolean;
  onClick: () => void;
}

export function StationCard({ station, isSelected, onClick }: StationCardProps) {
  const locale = useLocale();
  const t = useTranslations('station');

  const name = (locale === 'ar' && station.name_ar) ? station.name_ar : station.name_en;
  const address = locale === 'ar' ? station.address_ar : station.address_en;
  const brandColor = BRAND_COLORS[station.brand ?? ''] ?? BRAND_COLORS.default;

  return (
    <button
      type="button"
      data-station-id={station.id}
      onClick={onClick}
      className={cn(
        'w-full text-start p-3 rounded-lg border transition-colors animate-in fade-in duration-300',
        isSelected
          ? 'border-amber-500 bg-amber-100 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:hover:bg-amber-950 border-is-4'
          : 'border-border border-is-4 border-is-transparent hover:bg-muted/50',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 shrink-0 size-2.5 rounded-full"
          style={{ backgroundColor: brandColor }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold truncate">{name}</h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistance(station.distance_meters)}
            </span>
          </div>

          {address && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {address}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {station.fuel_types.map((type) => (
              <FuelBadge key={type} fuelType={type as FuelType} />
            ))}
            {station.is_24h && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                24h
              </span>
            )}
          </div>

          {isSelected && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1 font-medium">
              {t('tapToViewDetails')}
              <ChevronRight className="size-3" />
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
