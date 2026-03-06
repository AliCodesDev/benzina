'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Fuel,
  MapPin,
  Activity,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface BrandCount {
  brand: string;
  count: number;
}

interface DashboardData {
  totalStations: number;
  brandCounts: BrandCount[];
  prices: { fuel_type: string; price_lbp: number; effective_date: string }[];
  lastScrape: {
    scraper_name: string;
    status: string;
    records_found: number;
    records_updated: number;
    duration_ms: number | null;
    created_at: string;
    error_message: string | null;
  } | null;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [stationsRes, pricesRes] = await Promise.all([
          fetch('/api/stations?limit=10000&lat=33.8938&lng=35.5018&radius=200'),
          fetch('/api/prices'),
        ]);

        const stationsJson = await stationsRes.json();
        const pricesJson = await pricesRes.json();

        const stations = stationsJson.stations ?? [];

        // Count by brand
        const brandMap: Record<string, number> = {};
        for (const s of stations) {
          const brand = s.brand || 'Unknown';
          brandMap[brand] = (brandMap[brand] || 0) + 1;
        }
        const brandCounts = Object.entries(brandMap)
          .map(([brand, count]) => ({ brand, count }))
          .sort((a, b) => b.count - a.count);

        setData({
          totalStations: stations.length,
          brandCounts,
          prices: pricesJson.prices ?? [],
          lastScrape: null, // Will be fetched from admin API later
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Benzina management panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<MapPin className="h-5 w-5" />}
          label="Total Stations"
          value={data.totalStations}
        />
        <StatCard
          icon={<Fuel className="h-5 w-5" />}
          label="Fuel Types"
          value={data.prices.length}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Brands"
          value={data.brandCounts.length}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Last Scrape"
          value={
            data.lastScrape
              ? new Date(data.lastScrape.created_at).toLocaleDateString()
              : '—'
          }
        />
      </div>

      {/* Stations by Brand */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stations by Brand</h2>
        <div className="rounded-lg border border-border">
          {data.brandCounts.map((item, i) => (
            <div
              key={item.brand}
              className={`flex items-center justify-between px-4 py-3 ${
                i !== data.brandCounts.length - 1
                  ? 'border-b border-border'
                  : ''
              }`}
            >
              <span className="text-sm capitalize">{item.brand}</span>
              <span className="text-sm font-medium text-muted-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Fuel Prices */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Latest Fuel Prices</h2>
        <div className="rounded-lg border border-border">
          {data.prices.map((price, i) => (
            <div
              key={price.fuel_type}
              className={`flex items-center justify-between px-4 py-3 ${
                i !== data.prices.length - 1
                  ? 'border-b border-border'
                  : ''
              }`}
            >
              <span className="text-sm uppercase">{price.fuel_type}</span>
              <div className="text-end">
                <span className="text-sm font-medium">
                  {price.price_lbp.toLocaleString()} LBP
                </span>
                <span className="ms-2 text-xs text-muted-foreground">
                  {price.effective_date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Last Scrape Log */}
      {data.lastScrape && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Last Scrape Log</h2>
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scraper</span>
              <span>{data.lastScrape.scraper_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={
                  data.lastScrape.status === 'success'
                    ? 'text-green-600'
                    : 'text-red-500'
                }
              >
                {data.lastScrape.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Records Found</span>
              <span>{data.lastScrape.records_found}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Records Updated</span>
              <span>{data.lastScrape.records_updated}</span>
            </div>
            {data.lastScrape.duration_ms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{data.lastScrape.duration_ms}ms</span>
              </div>
            )}
            {data.lastScrape.error_message && (
              <div className="mt-2 rounded bg-red-50 p-2 text-red-600 dark:bg-red-950 dark:text-red-400">
                {data.lastScrape.error_message}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Management Links */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Management</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="admin/stations"
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Stations</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="admin/prices"
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Prices</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
