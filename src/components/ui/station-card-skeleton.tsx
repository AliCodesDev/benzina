import { Skeleton } from '@/components/ui/skeleton';

export function StationCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1.5 size-2.5 rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-48 mt-1.5" />
          <div className="flex gap-1.5 mt-2">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
