'use client';

import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { MAPBOX_STYLE, MAPBOX_STYLE_DARK } from '@/lib/constants';
import { useMapStore } from '@/stores/use-map-store';
import { usePreferencesStore } from '@/stores/use-preferences-store';
import type { NearbyStation } from '@/types/station';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface StationMapProps {
  stations: NearbyStation[];
}

function toGeoJSON(stations: NearbyStation[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [s.longitude, s.latitude],
      },
      properties: {
        id: s.id,
        brand_slug: s.brand_slug,
        name_en: s.name_en,
        name_ar: s.name_ar,
        fuel_types: s.fuel_types,
        is_24h: s.is_24h,
      },
    })),
  };
}

function useIsDark() {
  const theme = usePreferencesStore((s) => s.theme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      setIsDark(true);
      return;
    }
    if (theme === 'light') {
      setIsDark(false);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    function onChange(e: MediaQueryListEvent) {
      setIsDark(e.matches);
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return isDark;
}

export function StationMap({ stations }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isDark = useIsDark();

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectStation = useMapStore((s) => s.selectStation);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE,
      center: [center.lng, center.lat],
      zoom,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('stations', {
        type: 'geojson',
        data: toGeoJSON(stations),
      });

      map.addLayer({
        id: 'station-circles',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'brand_slug'],
            'total', '#e11d48',
            'totalenergies', '#e11d48',
            'medco', '#2563eb',
            'ipt', '#16a34a',
            'coral', '#f97316',
            'hypco', '#7c3aed',
            '#94a3b8',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': isDark ? '#1e293b' : '#ffffff',
        },
      });

      map.on('click', 'station-circles', (e) => {
        const feature = e.features?.[0];
        if (feature?.properties?.id) {
          selectStation(feature.properties.id);
        }
      });

      map.on('mouseenter', 'station-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'station-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      setLoaded(true);
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setCenter(c.lat, c.lng);
      setZoom(map.getZoom());
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update stations data when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const source = map.getSource('stations') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toGeoJSON(stations));
    }
  }, [stations, loaded]);

  // Fly to selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !selectedStationId) return;

    const station = stations.find((s) => s.id === selectedStationId);
    if (station) {
      map.flyTo({ center: [station.longitude, station.latitude], zoom: 15 });
    }
  }, [selectedStationId, stations, loaded]);

  // Switch map style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const newStyle = isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE;
    map.setStyle(newStyle);

    map.once('style.load', () => {
      map.addSource('stations', {
        type: 'geojson',
        data: toGeoJSON(stations),
      });

      map.addLayer({
        id: 'station-circles',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'brand_slug'],
            'total', '#e11d48',
            'totalenergies', '#e11d48',
            'medco', '#2563eb',
            'ipt', '#16a34a',
            'coral', '#f97316',
            'hypco', '#7c3aed',
            '#94a3b8',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': isDark ? '#1e293b' : '#ffffff',
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full" />
      {!loaded && (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
    </div>
  );
}
