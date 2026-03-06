import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  message: string;
  suggestion?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, suggestion, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      {suggestion && (
        <p className="mt-1 text-xs text-muted-foreground">{suggestion}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
