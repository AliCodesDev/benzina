'use client';

import { Check, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const t = useTranslations('station');
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed — ignore
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [title, url]);

  return (
    <Button variant="outline" onClick={handleShare} className="flex-1 gap-2">
      {copied ? (
        <>
          <Check className="size-4" />
          {t('copied')}
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          {t('share')}
        </>
      )}
    </Button>
  );
}
