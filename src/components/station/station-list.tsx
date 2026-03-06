'use client';

import { useTranslations } from 'next-intl';

import { StationCard } from '@/components/station/station-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StationCardSkeleton } from '@/components/ui/station-card-skeleton';
import { useMapStore } from '@/stores/use-map-store';
import type { NearbyStation } from '@/types/station';

interface StationListProps {
  stations: NearbyStation[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function StationList({ stations, loading, error, onRetry }: StationListProps) {
  const t = useTranslations('common');
  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectStation = useMapStore((s) => s.selectStation);
  const flyTo = useMapStore((s) => s.flyTo);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <StationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (stations.length === 0) {
    return (
      <EmptyState
        message={t('noStations')}
        suggestion={t('expandSearch')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
