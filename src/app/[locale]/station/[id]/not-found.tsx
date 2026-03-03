import { MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function StationNotFound() {
  const t = await getTranslations('station');

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">{t('notFound')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('notFoundDescription')}
      </p>
      <Button asChild className="mt-6">
        <Link href="/">{t('backToMap')}</Link>
      </Button>
    </div>
  );
}
