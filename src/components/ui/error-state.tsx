import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
