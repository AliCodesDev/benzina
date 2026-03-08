'use client';

import { RadiusFilter } from '@/components/filters/radius-filter';
import { SearchInput } from '@/components/filters/search-input';

export function FilterBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <SearchInput />
      </div>
      <RadiusFilter />
    </div>
  );
}
