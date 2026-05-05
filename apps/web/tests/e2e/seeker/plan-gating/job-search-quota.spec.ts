/**
 * seeker/plan-gating/job-search-quota.spec.ts
 *
 * Server-enforced job-search quota.
 *
 * Verified via code-review-graph: jobs/search/route.ts:174 calls hasQuota
 * with feature="job_search". Note this route is **GET**, not POST — the
 * factory's action signature accepts any APIResponse so we just use
 * page.request.get instead.
 *
 * Per-tier limits: free 3 · starter 10 · pro -1 · elite -1
 *
 * The route requires `?role=` to be non-empty (returns 400 otherwise).
 * We always pass role="engineer" so we exercise the quota branch, not
 * the validation branch. The route doesn't gate the "fitvector" view
 * (only external/all hits the counter), so we use the default view.
 */

import { generatePlanGatingSuite } from "../../support/fixtures/plan-fixture";

generatePlanGatingSuite({
  displayName: "job search",
  feature: "job_search",
  quotaByTier: { free: 3, starter: 10, pro: -1, elite: -1 },
  upgradeTo: "pro",
  mockRoutePattern: "**/api/jobs/search**",
  action: async (page) => {
    const r = await page.evaluate(
      async ([url]: [string]) => {
        const res = await fetch(url);
        return { status: res.status, body: await res.json().catch(() => null) };
      },
      [`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/api/jobs/search?role=engineer&page=1`],
    );
    return { status: () => r.status, json: async () => r.body };
  },
});
