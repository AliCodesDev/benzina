import { Skeleton } from '@/components/ui/skeleton';

export default function PricesLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-6">
      <Skeleton className="h-8 w-48" />

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-t-4 border-t-muted p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  );
}
