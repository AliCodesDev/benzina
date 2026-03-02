'use client';

import { cn } from '@/lib/utils';
import { RADIUS_OPTIONS } from '@/lib/constants';
import { useFilterStore } from '@/stores/use-filter-store';

export function RadiusFilter() {
  const radius = useFilterStore((s) => s.radius);
  const setRadius = useFilterStore((s) => s.setRadius);

  return (
    <div className="flex items-center gap-1.5">
      {RADIUS_OPTIONS.map((km) => (
        <button
          key={km}
          type="button"
          onClick={() => setRadius(km)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            radius === km
              ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700'
              : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80',
          )}
        >
          {km} km
        </button>
      ))}
    </div>
  );
}
