'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

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

  const items = prices.map(
    (p) =>
      `${tFuel(p.fuel_type as FuelType)}: ${p.price_lbp.toLocaleString()} LBP`,
  );

  // Duplicate for seamless loop
  const tickerContent = items.join('  \u00B7  ');

  return (
    <div className="bg-[oklch(0.145_0_0)] text-amber-400 overflow-hidden h-8 flex items-center text-sm font-medium">
      <div className="animate-ticker flex whitespace-nowrap">
        <span className="px-4">{tickerContent}</span>
        <span className="px-4">{tickerContent}</span>
      </div>
    </div>
  );
}
