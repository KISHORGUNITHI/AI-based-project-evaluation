export function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 w-8 bg-muted rounded-xl" />
      </div>
      <div className="h-8 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b last:border-0 animate-pulse">
      <div className="h-4 bg-muted rounded flex-1" />
      <div className="h-4 bg-muted rounded w-20" />
      <div className="h-4 bg-muted rounded w-16" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-1/3 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div className="rounded-2xl border bg-card p-6 animate-pulse">
          <div className="h-5 bg-muted rounded w-1/3 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </div>
  )
}
