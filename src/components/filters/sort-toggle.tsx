'use client';

import { useTranslations } from 'next-intl';
import { ArrowDownNarrowWide, Star, Type } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useFilterStore, type SortMode } from '@/stores/use-filter-store';

const SORT_OPTIONS: { value: SortMode; labelKey: string; icon: typeof Star }[] = [
  { value: 'distance', labelKey: 'sortNearest', icon: ArrowDownNarrowWide },
  { value: 'rank', labelKey: 'sortBestMatch', icon: Star },
  { value: 'name', labelKey: 'sortName', icon: Type },
];

export function SortToggle() {
  const t = useTranslations('common');
  const sort = useFilterStore((s) => s.sort);
  const setSort = useFilterStore((s) => s.setSort);

  return (
    <div className="flex gap-1">
      {SORT_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setSort(value)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
            sort === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          <Icon className="size-3" />
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
