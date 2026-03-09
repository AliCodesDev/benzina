'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { LBP_USD_RATE } from '@/lib/constants';
import type { FuelPrice } from '@/types/price';
import type { FuelType } from '@/types/station';

export function PriceTicker() {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const tFuel = useTranslations('fuel');

  useEffect(() => {
    fetch('/api/prices')
      .then((res) => res.json())
      .then((data) => {
        if (data.prices) setPrices(data.prices);
      })
      .catch(() => {
        // silently fail — ticker is non-critical
      });
  }, []);

  if (prices.length === 0) return null;

  const tickerItems = prices.map((p, i) => (
    <span key={p.fuel_type}>
      {i > 0 && <span className="text-white/40">  ·  </span>}
      <span className="text-amber-400">{tFuel(p.fuel_type as FuelType)}:</span>{' '}
      <span className="text-white">{p.price_lbp.toLocaleString()} LBP / ${(p.price_lbp / LBP_USD_RATE).toFixed(2)}</span>
    </span>
  ));

  return (
    <div className="bg-[oklch(0.145_0_0)] overflow-hidden h-8 flex items-center text-sm font-medium">
      <div className="animate-ticker flex whitespace-nowrap">
        <span className="px-4">{tickerItems}</span>
        <span className="px-4">{tickerItems}</span>
      </div>
    </div>
  );
}
