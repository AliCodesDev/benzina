import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="flex flex-col h-[calc(100dvh-53px)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar skeleton */}
        <aside className="hidden md:flex w-[420px] shrink-0 flex-col border-e bg-background">
          <div className="p-4 border-b space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
            </div>
          </div>
          <div className="px-4 py-2">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex-1 px-4 space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border">
                <div className="flex items-start gap-2">
                  <Skeleton className="mt-1.5 size-2.5 rounded-full" />
                  <div className="flex-1">
                    <div className="flex justify-between">
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
            ))}
          </div>
        </aside>

        {/* Map area skeleton */}
        <main className="flex-1 relative">
          <Skeleton className="absolute inset-0 rounded-none" />
        </main>
      </div>
    </div>
  );
}
