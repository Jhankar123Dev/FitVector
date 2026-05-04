export default function AnalyticsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-5 w-36 rounded bg-muted" />
            <div className="h-56 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
      {/* Wide chart */}
      <div className="animate-pulse rounded-xl border border-border bg-card p-5">
        <div className="mb-4 h-5 w-40 rounded bg-muted" />
        <div className="h-64 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
