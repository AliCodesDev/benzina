'use client';

import { useCallback, useEffect, useState } from 'react';

import { BEIRUT_CENTER } from '@/lib/constants';

interface GeolocationState {
  latitude: number;
  longitude: number;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: BEIRUT_CENTER.lat,
    longitude: BEIRUT_CENTER.lng,
    loading: true,
    error: null,
  });

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: BEIRUT_CENTER.lat,
        longitude: BEIRUT_CENTER.lng,
        loading: false,
        error: 'Geolocation is not supported by this browser',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          latitude: BEIRUT_CENTER.lat,
          longitude: BEIRUT_CENTER.lng,
          loading: false,
          error: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    requestPosition();
  }, [requestPosition]);

  return {
    latitude: state.latitude,
    longitude: state.longitude,
    loading: state.loading,
    error: state.error,
    refresh: requestPosition,
  };
}
