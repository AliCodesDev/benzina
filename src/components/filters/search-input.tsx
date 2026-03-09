'use client';

import { Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useFilterStore } from '@/stores/use-filter-store';

interface Suggestion {
  slug: string;
  name_en: string;
  name_ar: string | null;
  brand: string | null;
  address_en: string | null;
  address_ar: string | null;
}

export function SearchInput() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    abortRef.current?.abort();

    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = new URL('/api/stations', window.location.origin);
      url.searchParams.set('q', query);
      url.searchParams.set('radius', '200');
      url.searchParams.set('limit', '5');

      const res = await fetch(url.toString(), { signal: controller.signal });
      if (!res.ok) return;

      const data = await res.json();
      const items: Suggestion[] = (data.stations ?? []).map(
        (s: Suggestion & Record<string, unknown>) => ({
          slug: s.slug,
          name_en: s.name_en,
          name_ar: s.name_ar,
          brand: s.brand,
          address_en: s.address_en,
          address_ar: s.address_ar,
        }),
      );
      setSuggestions(items);
      setShowDropdown(items.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchSuggestions]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function handleSelect(slug: string) {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/station/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex].slug);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function handleBlur(e: React.FocusEvent) {
    // Close dropdown only if focus leaves the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={t('searchPlaceholder')}
        className="w-full rounded-lg border border-border bg-background py-2 ps-9 pe-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
        }
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setSuggestions([]);
            setShowDropdown(false);
          }}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute z-50 inset-x-0 top-full mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => {
            const name =
              locale === 'ar' && s.name_ar ? s.name_ar : s.name_en;
            const address =
              locale === 'ar' && s.address_ar
                ? s.address_ar
                : s.address_en;

            return (
              <li
                key={s.slug}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s.slug);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                  i === activeIndex
                    ? 'bg-amber-50 dark:bg-amber-950'
                    : 'hover:bg-muted/50'
                }`}
              >
                <p className="font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[s.brand || 'Independent', address].filter(Boolean).join(' · ')}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
