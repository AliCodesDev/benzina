'use client';

import { DollarSign, List, Map, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Tab = 'map' | 'list' | 'prices' | 'settings';

const TABS: { key: Tab; href: string; icon: typeof Map }[] = [
  { key: 'map', href: '/', icon: Map },
  { key: 'list', href: '/', icon: List },
  { key: 'prices', href: '/prices', icon: DollarSign },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  function isActive(tab: Tab) {
    if (tab === 'map' || tab === 'list') return pathname === '/';
    return pathname.startsWith(`/${tab}`);
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white dark:bg-neutral-950 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2">
        {TABS.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] min-w-[44px] text-xs transition-colors',
              isActive(key)
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="size-5" />
            <span>{t(key)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
