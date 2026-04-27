import {
  SkeletonStatCard,
  SkeletonBarChart,
  Skeleton,
  SkeletonCircle,
} from "@/components/ui/skeleton";

/**
 * Job Seeker Dashboard — Loading Skeleton
 * Mirrors the exact layout of dashboard/page.tsx:
 *   1. Welcome header
 *   2. Quick Actions — 4 cards in 2→4 col grid
 *   3. Stats row — 4 stat cards
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">

      {/* ── 1. Welcome header ──────────────────────────────────────── */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-56 opacity-60" />
      </div>

      {/* ── 2. Quick Actions ───────────────────────────────────────── */}
      <div>
        <Skeleton className="mb-4 h-5 w-32" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5">
              {/* Icon square */}
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
              {/* Title */}
              <Skeleton className="mt-4 h-5 w-28" />
              {/* Description */}
              <div className="mt-2 space-y-1.5">
                <Skeleton className="h-3 w-full opacity-60" />
                <Skeleton className="h-3 w-4/5 opacity-60" />
              </div>
              {/* Button */}
              <Skeleton className="mt-4 h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Stats row ───────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6">
            <Skeleton className="h-4 w-36 opacity-60" />
            <Skeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
