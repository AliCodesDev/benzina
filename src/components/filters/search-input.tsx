'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useFilterStore } from '@/stores/use-filter-store';

export function SearchInput() {
  const t = useTranslations('common');
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-lg border border-border bg-background py-2 ps-9 pe-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
