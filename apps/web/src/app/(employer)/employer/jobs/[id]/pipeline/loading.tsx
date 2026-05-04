export default function PipelineLoading() {
  return (
    <div className="flex h-full flex-col gap-4" aria-busy="true">
      {/* Top bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-muted" />
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
      {/* Kanban columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-6 animate-pulse rounded-full bg-muted" />
            </div>
            {Array.from({ length: col === 1 ? 4 : col === 2 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-28 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-5 w-14 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
