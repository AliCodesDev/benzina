'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FuelType } from '@/types/station';
import type { NearbyStation } from '@/types/station';

interface UseStationsParams {
  lat: number;
  lng: number;
  radius: number;
  fuelTypes: FuelType[];
  brand: string | null;
  searchQuery: string;
}

interface UseStationsResult {
  stations: NearbyStation[];
  count: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStations(params: UseStationsParams): UseStationsResult {
  const { lat, lng, radius, fuelTypes, brand, searchQuery } = params;

  const [stations, setStations] = useState<NearbyStation[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const fetchStations = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const url = new URL('/api/stations', window.location.origin);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lng', String(lng));
    url.searchParams.set('radius', String(radius));

    if (fuelTypes.length > 0) {
      url.searchParams.set('fuel', fuelTypes.join(','));
    }
    if (brand) {
      url.searchParams.set('brand', brand);
    }
    if (debouncedQuery) {
      url.searchParams.set('q', debouncedQuery);
    }

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setStations(data.stations);
      setCount(data.count);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [lat, lng, radius, fuelTypes, brand, debouncedQuery]);

  useEffect(() => {
    fetchStations();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchStations]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { stations, count, loading, error, refetch: fetchStations };
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
