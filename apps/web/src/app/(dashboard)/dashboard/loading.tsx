/**
 * Job Seeker Dashboard — Loading Skeleton
 *
 * Mirrors the exact layout of (dashboard)/dashboard/page.tsx:
 *   1. Page header       (welcome title + subtitle)
 *   2. Quick Actions     (label + 4 cards in 2-col → 4-col grid)
 *   3. Stats row         (4 stat cards in 2-col → 4-col grid)
 *
 * Uses animate-pulse + bg-surface-100/200 tokens — works in light and dark
 * mode without any extra dark: overrides.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">

      {/* ── 1. Welcome header ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-md bg-surface-200" />
        <div className="h-4 w-56 rounded-md bg-surface-100" />
      </div>

      {/* ── 2. Quick Actions ───────────────────────────────────────── */}
      <div>
        {/* Section label */}
        <div className="mb-4 h-5 w-32 rounded bg-surface-200" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-surface-200 bg-card p-5"
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-xl bg-surface-100" />
              {/* Title */}
              <div className="mt-4 h-5 w-28 rounded bg-surface-200" />
              {/* Description lines */}
              <div className="mt-2 space-y-1.5">
                <div className="h-3 w-full rounded bg-surface-100" />
                <div className="h-3 w-4/5 rounded bg-surface-100" />
              </div>
              {/* Button */}
              <div className="mt-4 h-8 w-24 rounded-md bg-surface-100" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Stats row ───────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-surface-200 bg-card p-6"
          >
            <div className="h-4 w-36 rounded bg-surface-100" />
            <div className="mt-2 h-9 w-16 rounded bg-surface-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
