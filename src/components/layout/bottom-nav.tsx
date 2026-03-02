'use client';

import { DollarSign, List, Map, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/lib/utils';

type Tab = 'map' | 'list' | 'prices' | 'settings';

const TABS: { key: Tab; icon: typeof Map }[] = [
  { key: 'map', icon: Map },
  { key: 'list', icon: List },
  { key: 'prices', icon: DollarSign },
  { key: 'settings', icon: Settings },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const [active, setActive] = useState<Tab>('map');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white dark:bg-neutral-950 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
              active === key
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            <span>{t(key)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
