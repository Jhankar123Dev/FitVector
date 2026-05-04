export default function TrackerLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* 2-tab switcher: Applied via FitVector | Personal Tracker */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted/50" />
      </div>

      {/* Application card rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 rounded bg-muted" />
                  <div className="h-5 w-20 rounded-full bg-muted" />
                </div>
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="flex gap-3">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-3 w-14 rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
