import { cn } from "@/lib/utils";

/**
 * Base skeleton block — animate-pulse + bg-muted, adapts to light/dark automatically.
 * Compose these into content-shaped skeletons that mirror real page layouts.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-muted", className)} />
  );
}

/** Circle skeleton (avatars, icons) */
export function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-full bg-muted", className)} />
  );
}

/** Mimics a stat card: optional icon + big number + label */
export function SkeletonStatCard({ showIcon = true }: { showIcon?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {showIcon && (
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
        )}
        <div className="flex-1 space-y-2">
          <div className="h-7 w-14 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="h-5 w-10 animate-pulse rounded-full bg-muted/60" />
      </div>
    </div>
  );
}

/** Mimics a bar chart area */
export function SkeletonBarChart({
  bars = 6,
  heights = [65, 90, 50, 75, 40, 85],
  className,
}: {
  bars?: number;
  heights?: number[];
  className?: string;
}) {
  const h = heights.length >= bars ? heights : Array.from({ length: bars }, (_, i) => heights[i % heights.length] ?? 60);
  return (
    <div className={cn("flex h-full items-end gap-2 sm:gap-3", className)}>
      {h.slice(0, bars).map((pct, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t-sm bg-muted"
          style={{ height: `${pct}%` }}
        />
      ))}
    </div>
  );
}

/** Mimics a line chart area using an SVG wavy path */
export function SkeletonLineChart({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Fake grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-px w-full bg-muted" />
        ))}
      </div>
      {/* Fake line */}
      <svg
        viewBox="0 0 400 80"
        preserveAspectRatio="none"
        className="relative h-full w-full"
      >
        <path
          d="M0,60 C40,50 80,20 120,30 C160,40 200,15 240,25 C280,35 320,10 360,20 L400,15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="animate-pulse text-muted"
        />
        <path
          d="M0,60 C40,50 80,20 120,30 C160,40 200,15 240,25 C280,35 320,10 360,20 L400,15 L400,80 L0,80 Z"
          className="animate-pulse fill-muted/30"
        />
      </svg>
    </div>
  );
}

/** Mimics a generic list row: avatar + 2 text lines + 1-2 badges + action */
export function SkeletonListRow({ cols = 3 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <SkeletonCircle className="h-9 w-9 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
      </div>
      {cols >= 2 && (
        <div className="hidden space-y-1.5 sm:block">
          <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted/60" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        {cols >= 3 && (
          <div className="hidden h-5 w-16 animate-pulse rounded-full bg-muted/60 sm:block" />
        )}
      </div>
      <div className="h-7 w-14 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

/** Mimics a job row: title+badge / metadata / stats / action buttons */
export function SkeletonJobRow() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: job info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-muted/70" />
        </div>
        <div className="flex gap-4">
          <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
        </div>
      </div>
      {/* Middle: stats */}
      <div className="flex items-center gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="hidden space-y-1 text-center sm:block">
            <div className="mx-auto h-5 w-6 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-14 animate-pulse rounded bg-muted/60" />
          </div>
        ))}
      </div>
      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-14 animate-pulse rounded-md bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted/60" />
      </div>
    </div>
  );
}

/** Mimics a candidate row: avatar + name/role + score + badges + action */
export function SkeletonCandidateRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <SkeletonCircle className="h-9 w-9 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-36 animate-pulse rounded bg-muted/60" />
      </div>
      {/* Score circle */}
      <div className="hidden items-center gap-1 sm:flex">
        <SkeletonCircle className="h-8 w-8" />
      </div>
      {/* Bucket badge */}
      <div className="hidden h-5 w-18 animate-pulse rounded-full bg-muted sm:block" />
      {/* Stage badge */}
      <div className="hidden h-5 w-20 animate-pulse rounded-full bg-muted/70 lg:block" />
      {/* Action */}
      <div className="h-7 w-14 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

/** Mimics an interview row: avatar + name/job + score + rec badge + date + actions */
export function SkeletonInterviewRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:p-4">
      <SkeletonCircle className="h-9 w-9 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-40 animate-pulse rounded bg-muted/60" />
      </div>
      {/* Score */}
      <div className="hidden flex-col items-center gap-0.5 sm:flex">
        <div className="h-6 w-10 animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-8 animate-pulse rounded bg-muted/60" />
      </div>
      {/* Recommendation badge */}
      <div className="hidden h-5 w-24 animate-pulse rounded-full bg-muted sm:block" />
      {/* Status badge */}
      <div className="h-5 w-16 animate-pulse rounded-full bg-muted/70" />
      {/* Date */}
      <div className="hidden h-3 w-16 animate-pulse rounded bg-muted/60 lg:block" />
      {/* Actions */}
      <div className="flex gap-1.5">
        <div className="h-7 w-14 animate-pulse rounded-md bg-muted" />
        <div className="h-7 w-8 animate-pulse rounded-md bg-muted/60" />
      </div>
    </div>
  );
}
