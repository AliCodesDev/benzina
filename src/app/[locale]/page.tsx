'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { FilterBar } from '@/components/filters/filter-bar';
import { SortToggle } from '@/components/filters/sort-toggle';
import { StationMap } from '@/components/map/station-map';
import { StationList } from '@/components/station/station-list';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useStations } from '@/hooks/use-stations';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/use-filter-store';
import { usePreferencesStore } from '@/stores/use-preferences-store';

export default function HomePage() {
  const t = useTranslations('common');
  const { latitude, longitude } = useGeolocation();
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const radius = useFilterStore((s) => s.radius);
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const brand = useFilterStore((s) => s.brand);
  const sort = useFilterStore((s) => s.sort);
  const preferredFuels = usePreferencesStore((s) => s.preferredFuels);

  const { stations, count, loading, error, refetch } = useStations({
    lat: latitude,
    lng: longitude,
    radius,
    fuelTypes,
    brand,
    searchQuery,
    sort,
    preferredFuel: preferredFuels[0] ?? null,
  });

  const [sheetExpanded, setSheetExpanded] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100dvh-53px)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[420px] shrink-0 flex-col border-e bg-background">
          <div className="p-4 border-b">
            <FilterBar />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {t('stationsNearby', { count })}
            </span>
            <SortToggle />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <StationList stations={stations} loading={loading} error={error} onRetry={refetch} />
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <StationMap stations={stations} />

          {/* Mobile bottom sheet */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-10 flex flex-col bg-background rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-[max-height] duration-300 md:hidden',
              sheetExpanded ? 'max-h-[70dvh]' : 'max-h-[40dvh]',
            )}
          >
            {/* Drag handle */}
            <button
              type="button"
              onClick={() => setSheetExpanded((v) => !v)}
              className="flex items-center justify-center py-3 min-h-[44px] shrink-0"
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </button>

            <div className="px-4 pb-2">
              <FilterBar />
            </div>
            <div className="flex items-center justify-between px-4 py-1">
              <span className="text-xs text-muted-foreground">
                {t('stationsNearby', { count })}
              </span>
              <SortToggle />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom)+60px)]">
              <StationList stations={stations} loading={loading} error={error} onRetry={refetch} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
