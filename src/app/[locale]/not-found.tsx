import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
        <MapPin className="size-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to map</Link>
      </Button>
    </div>
  );
}
