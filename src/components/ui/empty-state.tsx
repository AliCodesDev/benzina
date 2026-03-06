import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  suggestion?: string;
}

export function EmptyState({ message, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-6 text-muted-foreground" />
      </div>
      <p className="mt-3 text-sm font-medium">{message}</p>
      {suggestion && (
        <p className="mt-1 text-xs text-muted-foreground">{suggestion}</p>
      )}
    </div>
  );
}
