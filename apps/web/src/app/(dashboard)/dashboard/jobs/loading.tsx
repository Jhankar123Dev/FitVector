export default function JobsLoading() {
  return (
    <div className="flex h-full flex-col space-y-4" aria-busy="true">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-20 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {[80, 96, 72, 88].map((w, i) => (
          <div key={i} className={`h-7 w-${w} animate-pulse rounded-full bg-muted`} />
        ))}
      </div>

      {/* Job list skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-20 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
