import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LBP_USD_RATE } from '@/lib/constants';
import { createServerClient } from '@/lib/supabase/server';
import type { FuelType } from '@/types/station';
import type { FuelPrice } from '@/types/price';

const FUEL_CARD_STYLES: Record<FuelType, { border: string; bg: string; text: string }> = {
  '95': {
    border: 'border-t-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-300',
  },
  '98': {
    border: 'border-t-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-300',
  },
  diesel: {
    border: 'border-t-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-300',
  },
  lpg: {
    border: 'border-t-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
  },
};

async function getPrices() {
  const supabase = await createServerClient();

  const { data: prices } = await supabase
    .from('fuel_prices')
    .select('*')
    .order('effective_date', { ascending: false })
    .order('fuel_type');

  // Deduplicate: keep only the latest entry per fuel_type
  const latestPrices = Object.values(
    (prices ?? []).reduce<Record<string, FuelPrice>>((acc, price) => {
      if (!acc[price.fuel_type]) {
        acc[price.fuel_type] = price as FuelPrice;
      }
      return acc;
    }, {}),
  );

  const lastUpdated =
    latestPrices.length > 0 ? latestPrices[0].effective_date : null;

  return { prices: latestPrices, lastUpdated };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Fuel Prices in Lebanon - Benzina',
    description:
      'Current fuel prices in Lebanon set by the Directorate General of Oil (DGO). Gasoline 95, 98, Diesel, and LPG prices updated weekly.',
    openGraph: {
      title: 'Fuel Prices in Lebanon - Benzina',
      description:
        'Current fuel prices in Lebanon set by the Directorate General of Oil (DGO). Updated weekly.',
    },
  };
}

export default async function PricesPage() {
  const { prices, lastUpdated } = await getPrices();
  const t = await getTranslations('prices');
  const tFuel = await getTranslations('fuel');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-6">
      <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-instrument-serif)]">
        {t('title')}
      </h1>

      {prices.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {prices.map((price) => {
              const style =
                FUEL_CARD_STYLES[price.fuel_type as FuelType] ??
                FUEL_CARD_STYLES['95'];

              return (
                <div
                  key={price.id}
                  className={`rounded-lg border border-t-4 ${style.border} ${style.bg} p-4 space-y-2`}
                >
                  <p className={`text-sm font-semibold ${style.text}`}>
                    {tFuel(price.fuel_type as FuelType)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {price.price_lbp.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      LBP
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ~${(price.price_lbp / LBP_USD_RATE).toFixed(2)} USD
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('perUnit', { unit: price.price_unit })}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            {lastUpdated && (
              <p>
                {t('effectiveDate', {
                  date: new Date(lastUpdated).toLocaleDateString(),
                })}
              </p>
            )}
            <p>{t('source')}</p>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">{t('note')}</p>
      )}

      <p className="text-xs text-muted-foreground border-t pt-4">
        {t('note')}
      </p>
    </div>
  );
}
