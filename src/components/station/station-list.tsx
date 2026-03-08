'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { StationCard } from '@/components/station/station-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StationCardSkeleton } from '@/components/ui/station-card-skeleton';
import { useFilterStore } from '@/stores/use-filter-store';
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
  const router = useRouter();
  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectStation = useMapStore((s) => s.selectStation);
  const flyTo = useMapStore((s) => s.flyTo);
  const setRadius = useFilterStore((s) => s.setRadius);

  // Auto-scroll to selected station card
  useEffect(() => {
    if (!selectedStationId) return;

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-station-id="${selectedStationId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 350);

    return () => clearTimeout(timer);
  }, [selectedStationId]);

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
        actionLabel={t('expandTo5km')}
        onAction={() => setRadius(5)}
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
            if (station.id === selectedStationId) {
              router.push(`/station/${station.slug}`);
            } else {
              selectStation(station.id, 'list');
              flyTo(station.latitude, station.longitude, 15);
            }
          }}
        />
      ))}
    </div>
  );
}
