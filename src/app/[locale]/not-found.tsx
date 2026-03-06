'use client';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('description')}
      </p>
      <Button asChild className="mt-6">
        <Link href="/">{t('backToMap')}</Link>
      </Button>
    </div>
  );
}
