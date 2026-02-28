import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() =>
    Promise.resolve({
      rpc: mockRpc,
    }),
  ),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/stations');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/stations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stations for default params', async () => {
    const mockStations = [
      {
        id: '1',
        name_en: 'Test Station',
        brand: 'medco',
        distance_km: 1.5,
        lat: 33.89,
        lng: 35.5,
      },
    ];
    mockRpc.mockResolvedValue({ data: mockStations, error: null });

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stations).toEqual(mockStations);
    expect(body.count).toBe(1);
    expect(body.params.lat).toBe(33.8938);
    expect(body.params.lng).toBe(35.5018);
    expect(body.params.radius).toBe(5);
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=60');
  });

  it('returns 400 for invalid lat', async () => {
    const response = await GET(makeRequest({ lat: '999' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid lat');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid lng', async () => {
    const response = await GET(makeRequest({ lng: '999' }));

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid radius', async () => {
    const response = await GET(makeRequest({ radius: '-1' }));

    expect(response.status).toBe(400);
  });

  it('passes fuel filter to RPC', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await GET(makeRequest({ fuel: '95,diesel' }));

    expect(mockRpc).toHaveBeenCalledWith('nearby_stations', expect.objectContaining({
      lat: 33.8938,
      lng: 35.5018,
      radius_km: 5,
      result_limit: 50,
      fuel_filter: ['95', 'diesel'],
    }));
  });

  it('filters by search query', async () => {
    const mockStations = [
      { id: '1', name_en: 'Medco Downtown', brand: 'medco', distance_km: 1 },
      { id: '2', name_en: 'IPT Highway', brand: 'ipt', distance_km: 2 },
    ];
    mockRpc.mockResolvedValue({ data: mockStations, error: null });

    const response = await GET(makeRequest({ q: 'medco' }));
    const body = await response.json();

    expect(body.stations).toHaveLength(1);
    expect(body.stations[0].name_en).toBe('Medco Downtown');
  });

  it('returns 500 on Supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
  });
});
