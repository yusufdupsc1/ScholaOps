function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-72 w-full" />;
}

export function TableSkeleton() {
  return <Skeleton className="h-96 w-full" />;
}
