import type { NearbyStation } from '@/types/station';

export interface RankingPreferences {
  preferredFuel?: string | null;
  maxRadius: number; // in meters
}

export interface ScoreBreakdown {
  proximity: number;
  fuelMatch: number;
  openStatus: number;
}

export interface RankedStation {
  station: NearbyStation;
  score: number;
  breakdown: ScoreBreakdown;
}

const WEIGHT_PROXIMITY = 0.5;
const WEIGHT_FUEL_MATCH = 0.3;
const WEIGHT_OPEN_STATUS = 0.2;

export function scoreStation(
  station: NearbyStation,
  preferences: RankingPreferences,
): RankedStation {
  // Proximity: 1 - (distance / maxRadius), capped at 0
  const proximity = Math.max(
    0,
    1 - station.distance_meters / preferences.maxRadius,
  );

  // Fuel match: 1 if station has preferred fuel, 0.5 if no preference
  let fuelMatch = 0.5;
  if (preferences.preferredFuel) {
    fuelMatch = station.fuel_types.includes(preferences.preferredFuel)
      ? 1
      : 0;
  }

  // Open status: 1 if 24h or active, 0.5 otherwise
  const openStatus =
    station.is_24h || station.status === 'active' ? 1 : 0.5;

  const score =
    proximity * WEIGHT_PROXIMITY +
    fuelMatch * WEIGHT_FUEL_MATCH +
    openStatus * WEIGHT_OPEN_STATUS;

  return {
    station,
    score: Math.round(score * 1000) / 1000,
    breakdown: {
      proximity: Math.round(proximity * 1000) / 1000,
      fuelMatch,
      openStatus,
    },
  };
}

export function rankStations(
  stations: NearbyStation[],
  preferences: RankingPreferences,
): NearbyStation[] {
  return stations
    .map((s) => scoreStation(s, preferences))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.station);
}
