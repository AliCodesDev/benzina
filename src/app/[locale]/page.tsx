'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw, X } from 'lucide-react';

import dynamic from 'next/dynamic';

import { FilterBar } from '@/components/filters/filter-bar';
import { StationList } from '@/components/station/station-list';
import { Skeleton } from '@/components/ui/skeleton';

const StationMap = dynamic(
  () => import('@/components/map/station-map').then((m) => m.StationMap),
  { ssr: false, loading: () => <Skeleton className="size-full rounded-none" /> },
);
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useStations } from '@/hooks/use-stations';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/stores/use-filter-store';
import { useMapStore } from '@/stores/use-map-store';

export default function HomePage() {
  const t = useTranslations('common');
  const { latitude, longitude, error: geoError, refresh: refreshGeo } = useGeolocation();
  const radius = useFilterStore((s) => s.radius);
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const brand = useFilterStore((s) => s.brand);
  const { stations, count, loading, error, refetch } = useStations({
    lat: latitude,
    lng: longitude,
    radius,
    fuelTypes: [],
    brand,
    searchQuery,
  });

  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectionSource = useMapStore((s) => s.selectionSource);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number; isDragging: boolean }>({
    startY: 0,
    startHeight: 0,
    isDragging: false,
  });

  // Auto-expand sheet when a station is selected from the map
  useEffect(() => {
    if (selectedStationId && selectionSource === 'map') {
      setSheetExpanded(true);
    }
  }, [selectedStationId, selectionSource]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    dragRef.current = {
      startY: e.touches[0].clientY,
      startHeight: sheet.getBoundingClientRect().height,
      isDragging: true,
    };
    sheet.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const drag = dragRef.current;
    const sheet = sheetRef.current;
    if (!drag.isDragging || !sheet) return;

    const deltaY = drag.startY - e.touches[0].clientY;
    const vh = window.innerHeight;
    const newHeight = Math.max(0, Math.min(vh * 0.85, drag.startHeight + deltaY));
    sheet.style.maxHeight = `${newHeight}px`;
  }, []);

  const onTouchEnd = useCallback(() => {
    const drag = dragRef.current;
    const sheet = sheetRef.current;
    if (!drag.isDragging || !sheet) return;

    drag.isDragging = false;
    const currentHeight = sheet.getBoundingClientRect().height;
    const vh = window.innerHeight;
    const midpoint = vh * 0.55;

    sheet.style.transition = '';
    sheet.style.maxHeight = '';
    setSheetExpanded(currentHeight > midpoint);
  }, []);

  const showGeoBanner = geoError && !bannerDismissed;

  return (
    <div className="flex flex-col h-[calc(100dvh-53px)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[420px] shrink-0 flex-col border-e bg-background">
          <div className="p-4 border-b">
            <FilterBar />
          </div>
          {showGeoBanner && (
            <GeoBanner
              message={t('locationUnavailable')}
              retryLabel={t('retry')}
              onRetry={refreshGeo}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <StationList stations={stations} loading={loading} error={error} onRetry={refetch} />
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <StationMap
            stations={stations}
            userLat={latitude}
            userLng={longitude}
            onLocateMe={refreshGeo}
          />

          {/* Mobile bottom sheet */}
          <div
            ref={sheetRef}
            className={cn(
              'absolute inset-x-0 bottom-0 z-10 flex flex-col bg-background rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-[max-height] duration-300 md:hidden',
              sheetExpanded ? 'max-h-[70dvh]' : 'max-h-[40dvh]',
            )}
          >
            {/* Drag handle */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSheetExpanded((v) => !v)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSheetExpanded((v) => !v); }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="flex items-center justify-center py-3 min-h-[44px] shrink-0 touch-none cursor-grab"
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-4 pb-2">
              <FilterBar />
            </div>
            {showGeoBanner && (
              <GeoBanner
                message={t('locationUnavailable')}
                retryLabel={t('retry')}
                onRetry={refreshGeo}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}
            <div className="flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom)+60px)]">
              <StationList stations={stations} loading={loading} error={error} onRetry={refetch} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function GeoBanner({
  message,
  retryLabel,
  onRetry,
  onDismiss,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 my-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
      <MapPin className="size-4 shrink-0" />
      <p className="flex-1 text-xs">{message}</p>
      <Button variant="ghost" size="xs" onClick={onRetry} className="shrink-0 text-amber-700 hover:text-amber-900 dark:text-amber-300">
        <RefreshCw className="size-3" />
        {retryLabel}
      </Button>
      <button type="button" onClick={onDismiss} className="shrink-0 text-amber-600 hover:text-amber-800 dark:text-amber-400">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
