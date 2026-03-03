'use client';

import { Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface NavigateButtonProps {
  latitude: number;
  longitude: number;
  stationName: string;
}

export function NavigateButton({ latitude, longitude, stationName }: NavigateButtonProps) {
  const t = useTranslations('station');

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(stationName)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button onClick={handleNavigate} className="flex-1 gap-2">
      <Navigation className="size-4" />
      {t('navigate')}
    </Button>
  );
}
