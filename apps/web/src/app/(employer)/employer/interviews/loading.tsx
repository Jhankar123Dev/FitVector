export default function InterviewsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/4 rounded bg-muted" />
              </div>
              <div className="h-6 w-24 rounded-full bg-muted" />
              <div className="h-8 w-28 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
