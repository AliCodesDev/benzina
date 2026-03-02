'use client';

import { useTranslations } from 'next-intl';

import { StationCard } from '@/components/station/station-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMapStore } from '@/stores/use-map-store';
import type { NearbyStation } from '@/types/station';

interface StationListProps {
  stations: NearbyStation[];
  loading: boolean;
}

function StationCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1.5 size-2.5 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-48 mt-1.5" />
          <div className="flex gap-1.5 mt-2">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StationList({ stations, loading }: StationListProps) {
  const t = useTranslations('common');
  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectStation = useMapStore((s) => s.selectStation);
  const flyTo = useMapStore((s) => s.flyTo);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 overflow-y-auto">
        {Array.from({ length: 5 }, (_, i) => (
          <StationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t('noStations')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('expandSearch')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          isSelected={station.id === selectedStationId}
          onClick={() => {
            selectStation(station.id);
            flyTo(station.latitude, station.longitude, 15);
          }}
        />
      ))}
    </div>
  );
}
