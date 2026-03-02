'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { FUEL_TYPES } from '@/lib/constants';
import { useFilterStore } from '@/stores/use-filter-store';
import type { FuelType } from '@/types/station';

const FUEL_DOT_COLORS: Record<FuelType, string> = {
  '95': 'bg-blue-500',
  '98': 'bg-purple-500',
  diesel: 'bg-amber-500',
  lpg: 'bg-green-500',
};

export function FuelTypeFilter() {
  const t = useTranslations();
  const fuelTypes = useFilterStore((s) => s.fuelTypes);
  const toggleFuelType = useFilterStore((s) => s.toggleFuelType);

  const allActive = fuelTypes.length === 0;

  const clearFuelTypes = () => {
    fuelTypes.forEach((type) => toggleFuelType(type));
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={clearFuelTypes}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
          allActive
            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700'
            : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80',
        )}
      >
        {t('common.allFuels')}
      </button>

      {FUEL_TYPES.map((type) => {
        const isActive = fuelTypes.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => toggleFuelType(type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700'
                : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80',
            )}
          >
            <span className={cn('size-2 rounded-full', FUEL_DOT_COLORS[type])} />
            {t(`fuel.${type}`)}
          </button>
        );
      })}
    </div>
  );
}
