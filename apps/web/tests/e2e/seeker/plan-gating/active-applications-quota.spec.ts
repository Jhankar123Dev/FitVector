/**
 * seeker/plan-gating/active-applications-quota.spec.ts
 *
 * Server-enforced active-applications quota (the only quota that's a
 * stock count, not a window count — counts the user's currently-saved
 * applications, not actions per period).
 *
 * Verified via code-review-graph: tracker/route.ts:201 calls hasQuota
 * with feature="active_applications". POST /api/tracker creates a new
 * tracked row; the gate fires when active rows ≥ tier limit.
 *
 * Per-tier limits: free 10 · starter 50 · pro -1 · elite -1
 *
 * NB: this counter is **stock-based**, not period-based — `setUsageCounter`
 * inserts usage_log rows but the route's actual count comes from
 * `applications` (or `tracker_entries` depending on schema). The factory's
 * beforeEach reset is harmless here; real boundary verification depends on
 * the route counting `applications.user_id = X AND archived = false`.
 *
 * The "counter resets after 24h" fixme test on the factory does NOT apply
 * to this feature — active_applications is not time-windowed. The
 * factory still emits the test for consistency; treat it as an extra
 * placeholder that becomes meaningful only if the route changes.
 */

import { generatePlanGatingSuite } from "../../support/fixtures/plan-fixture";
import { seedApplications, clearApplications } from "../../support/helpers/db-helpers";

generatePlanGatingSuite({
  displayName: "active applications",
  feature: "active_applications",
  quotaByTier: { free: 10, starter: 50, pro: -1, elite: -1 },
  upgradeTo: "pro",
  setCounter: (userId, _feature, count) => seedApplications(userId, count),
  resetCounter: (userId, _feature) => clearApplications(userId),
  action: async (page) => {
    const r = await page.evaluate(
      async ([url]: [string]) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: "Software Engineer",
            companyName: "Acme",
            status: "saved",
          }),
        });
        return { status: res.status, body: await res.json().catch(() => null) };
      },
      [`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/api/tracker`],
    );
    return { status: () => r.status, json: async () => r.body };
  },
});
