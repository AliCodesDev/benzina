'use client';

import { FuelTypeFilter } from '@/components/filters/fuel-type-filter';
import { RadiusFilter } from '@/components/filters/radius-filter';
import { SearchInput } from '@/components/filters/search-input';

export function FilterBar() {
  return (
    <div className="flex flex-col gap-3">
      <SearchInput />
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FuelTypeFilter />
        <div className="h-4 w-px shrink-0 bg-border" />
        <RadiusFilter />
      </div>
    </div>
  );
}
