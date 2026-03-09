'use client';

import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Locate } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { MAPBOX_STYLE, MAPBOX_STYLE_DARK } from '@/lib/constants';
import { useFilterStore } from '@/stores/use-filter-store';
import { useMapStore } from '@/stores/use-map-store';
import { usePreferencesStore } from '@/stores/use-preferences-store';
import type { NearbyStation } from '@/types/station';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface StationMapProps {
  stations: NearbyStation[];
  userLat: number;
  userLng: number;
  onLocateMe?: () => void;
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

/** Create a GeoJSON polygon approximating a circle. */
function createCirclePolygon(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceDeg = radiusKm / 111.32; // rough km-to-degrees

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = distanceDeg * Math.cos(angle);
    const dy = distanceDeg * Math.sin(angle) / Math.cos((centerLat * Math.PI) / 180);
    coords.push([centerLng + dy, centerLat + dx]);
  }

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  };
}

const STATION_LAYER_PAINT: mapboxgl.CirclePaint = {
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
  'circle-stroke-color': '#ffffff',
};

function addMapLayers(
  map: mapboxgl.Map,
  stations: NearbyStation[],
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  isDark: boolean,
) {
  // Radius circle
  map.addSource('radius-circle', {
    type: 'geojson',
    data: createCirclePolygon(centerLng, centerLat, radiusKm),
  });

  map.addLayer({
    id: 'radius-fill',
    type: 'fill',
    source: 'radius-circle',
    paint: {
      'fill-color': '#f59e0b',
      'fill-opacity': isDark ? 0.08 : 0.06,
    },
  });

  map.addLayer({
    id: 'radius-line',
    type: 'line',
    source: 'radius-circle',
    paint: {
      'line-color': '#f59e0b',
      'line-width': 2,
      'line-dasharray': [4, 3],
      'line-opacity': isDark ? 0.5 : 0.6,
    },
  });

  // Station dots
  map.addSource('stations', {
    type: 'geojson',
    data: toGeoJSON(stations),
  });

  map.addLayer({
    id: 'station-circles',
    type: 'circle',
    source: 'stations',
    paint: {
      ...STATION_LAYER_PAINT,
      'circle-stroke-color': isDark ? '#1e293b' : '#ffffff',
    },
  });
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

export function StationMap({ stations, userLat, userLng, onLocateMe }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isDark = useIsDark();

  const radius = useFilterStore((s) => s.radius);
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedStationId = useMapStore((s) => s.selectedStationId);
  const selectStation = useMapStore((s) => s.selectStation);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);
  const flyTo = useMapStore((s) => s.flyTo);

  const handleLocateMe = useCallback(() => {
    onLocateMe?.();
    flyTo(userLat, userLng, 14);
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [userLng, userLat], zoom: 14 });
    }
  }, [onLocateMe, flyTo, userLat, userLng]);

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
      addMapLayers(map, stations, userLng, userLat, radius, isDark);

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
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
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

  // Update radius circle when radius or user position changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const source = map.getSource('radius-circle') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(createCirclePolygon(userLng, userLat, radius));
    }
  }, [radius, userLat, userLng, loaded]);

  // User location blue dot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLng, userLat]);
      return;
    }

    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'relative',
      width: '16px',
      height: '16px',
    });

    // Pulse ring
    const ring = document.createElement('div');
    Object.assign(ring.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: '50%',
      background: '#4285f4',
      animation: 'user-pulse 2s ease-out infinite',
    });
    wrapper.appendChild(ring);

    // Solid dot
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: '50%',
      background: '#4285f4',
      border: '2.5px solid #fff',
      boxShadow: '0 0 6px rgba(0,0,0,0.35)',
      zIndex: '1',
    });
    wrapper.appendChild(dot);

    userMarkerRef.current = new mapboxgl.Marker({ element: wrapper })
      .setLngLat([userLng, userLat])
      .addTo(map);
  }, [userLat, userLng, loaded]);

  // Fly to selected station + highlight it
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (!map.getLayer('station-circles')) return;

    // Scale: selected = 13, default = 8
    map.setPaintProperty('station-circles', 'circle-radius', selectedStationId
      ? ['case', ['==', ['get', 'id'], selectedStationId], 13, 8]
      : 8,
    );

    // Stroke width: selected = 3.5, default = 2
    map.setPaintProperty('station-circles', 'circle-stroke-width', selectedStationId
      ? ['case', ['==', ['get', 'id'], selectedStationId], 3.5, 2]
      : 2,
    );

    // Stroke color: selected = amber, default = theme-based
    const defaultStroke = isDark ? '#1e293b' : '#ffffff';
    map.setPaintProperty('station-circles', 'circle-stroke-color', selectedStationId
      ? ['case', ['==', ['get', 'id'], selectedStationId], '#f59e0b', defaultStroke]
      : defaultStroke,
    );

    // Fly to the station
    if (selectedStationId) {
      const station = stations.find((s) => s.id === selectedStationId);
      if (station) {
        map.flyTo({ center: [station.longitude, station.latitude], zoom: 15 });
      }
    }
  }, [selectedStationId, stations, loaded, isDark]);

  // Switch map style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const newStyle = isDark ? MAPBOX_STYLE_DARK : MAPBOX_STYLE;
    map.setStyle(newStyle);

    map.once('style.load', () => {
      addMapLayers(map, stations, userLng, userLat, radius, isDark);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full" />
      {!loaded && (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
      {/* Locate me button */}
      <button
        type="button"
        onClick={handleLocateMe}
        className="absolute end-4 bottom-[28dvh] z-10 flex size-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors md:bottom-14"
        aria-label="Locate me"
      >
        <Locate className="size-5" />
      </button>
    </div>
  );
}
