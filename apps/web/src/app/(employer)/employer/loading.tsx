import {
  SkeletonStatCard,
  SkeletonBarChart,
  SkeletonLineChart,
  Skeleton,
  SkeletonCircle,
} from "@/components/ui/skeleton";

/**
 * Employer Dashboard — Loading Skeleton
 * Mirrors the exact layout of employer/page.tsx:
 *   1. Page header
 *   2. Stats row — 4 cards
 *   3. Main grid — Hiring Funnel chart (col-span-3) + Activity feed (col-span-2)
 *   4. Bottom row — Quick Actions (col-span-2) + Key Metrics + Plan card
 */
export default function EmployerDashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8">

      {/* ── 1. Page header ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-52 opacity-60" />
      </div>

      {/* ── 2. Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* ── 3. Main grid: chart + activity ─────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Hiring Funnel bar chart — col-span-3 */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-20 opacity-60" />
          </div>
          {/* Chart bars + y-axis labels */}
          <div className="flex gap-3">
            {/* Y-axis */}
            <div className="flex flex-col justify-between py-1">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-2.5 w-6 opacity-50" />
              ))}
            </div>
            {/* Bars */}
            <div className="flex-1">
              <SkeletonBarChart
                bars={7}
                heights={[90, 72, 55, 44, 32, 20, 12]}
                className="h-[220px] sm:h-[280px]"
              />
              {/* X-axis labels */}
              <div className="mt-3 flex gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-2.5 flex-1 opacity-50" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity feed — col-span-2 */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-12 opacity-60" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <SkeletonCircle className="mt-0.5 h-7 w-7 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full opacity-70" />
                  <Skeleton className="h-3 w-20 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Bottom row: quick actions + metrics + plan ──────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Quick Actions — col-span-2 */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <Skeleton className="mb-5 h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-border p-4"
              >
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-48 opacity-60" />
                </div>
                <div className="h-4 w-4 animate-pulse rounded bg-muted/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: metrics + plan */}
        <div className="space-y-4">
          {/* Key Metrics card */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Skeleton className="mb-5 h-5 w-24" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    <Skeleton className="h-4 w-32 opacity-70" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>

          {/* Plan card */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-4 w-10 opacity-60" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full opacity-60" />
              <Skeleton className="h-3 w-4/5 opacity-60" />
            </div>
            <Skeleton className="mt-3 h-8 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
