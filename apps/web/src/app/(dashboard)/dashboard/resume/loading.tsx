export default function ResumeLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </div>

      {/* Base resume upload card */}
      <div className="animate-pulse rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="h-8 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      {/* How it works info box */}
      <div className="animate-pulse rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="h-3 w-4/6 rounded bg-muted" />
      </div>

      {/* Tailored resume version rows */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="flex gap-3">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
