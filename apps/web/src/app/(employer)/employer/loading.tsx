/**
 * Employer Dashboard — Loading Skeleton
 *
 * Mirrors the exact layout of (employer)/employer/page.tsx:
 *   1. Page header (title + subtitle)
 *   2. Stats row  — 4 cards (2-col mobile → 4-col desktop)
 *   3. Main grid  — Hiring Funnel chart (col-span-3) + Activity feed (col-span-2)
 *   4. Bottom row — Quick Actions (col-span-2) + Key Metrics + Plan card
 *
 * Uses animate-pulse + bg-surface-100/200 so it blends with the design system
 * in both light and dark mode.
 */
export default function EmployerDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 md:space-y-8">

      {/* ── 1. Page header ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-md bg-surface-200" />
        <div className="h-4 w-52 rounded-md bg-surface-100" />
      </div>

      {/* ── 2. Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-surface-200 bg-card p-3 sm:p-5"
          >
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <div className="hidden h-10 w-10 shrink-0 rounded-lg bg-surface-100 sm:block" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-14 rounded bg-surface-200" />
                <div className="h-3 w-24 rounded bg-surface-100" />
              </div>
              {/* Trend badge */}
              <div className="hidden h-5 w-12 rounded-full bg-surface-100 sm:block" />
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Main grid: chart + activity ─────────────────────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Hiring Funnel chart — col-span-3 */}
        <div className="rounded-lg border border-surface-200 bg-card p-5 lg:col-span-3">
          {/* Card header */}
          <div className="mb-5 h-5 w-36 rounded bg-surface-200" />
          {/* Chart area */}
          <div className="flex h-[220px] items-end gap-3 sm:h-[300px]">
            {[65, 90, 55, 40, 75, 35].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-surface-100"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          {/* X-axis labels */}
          <div className="mt-3 flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 flex-1 rounded bg-surface-100" />
            ))}
          </div>
        </div>

        {/* Recent Activity feed — col-span-2 */}
        <div className="rounded-lg border border-surface-200 bg-card p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-surface-200" />
            <div className="h-3 w-12 rounded bg-surface-100" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-surface-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-full rounded bg-surface-100" />
                  <div className="h-3 w-24 rounded bg-surface-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Bottom row: quick actions + metrics + plan ──────────── */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Quick Actions — col-span-2 */}
        <div className="rounded-lg border border-surface-200 bg-card p-5 lg:col-span-2">
          <div className="mb-5 h-5 w-32 rounded bg-surface-200" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-surface-200 p-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-28 rounded bg-surface-200" />
                  <div className="h-3 w-48 rounded bg-surface-100" />
                </div>
                <div className="h-4 w-4 shrink-0 rounded bg-surface-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: metrics + plan */}
        <div className="space-y-4">
          {/* Key Metrics card */}
          <div className="rounded-lg border border-surface-200 bg-card p-5">
            <div className="mb-5 h-5 w-24 rounded bg-surface-200" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-surface-100" />
                    <div className="h-4 w-32 rounded bg-surface-100" />
                  </div>
                  <div className="h-4 w-10 rounded bg-surface-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Plan card */}
          <div className="rounded-lg border border-surface-200 bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="h-4 w-10 rounded bg-surface-100" />
              <div className="h-5 w-16 rounded-full bg-surface-200" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-surface-100" />
              <div className="h-3 w-4/5 rounded bg-surface-100" />
            </div>
            <div className="mt-3 h-8 w-full rounded-md bg-surface-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
