/**
 * seeker/plan-gating/cold-email-quota.spec.ts
 *
 * Server-enforced cold-email quota.
 *
 * Verified via code-review-graph (callers_of hasQuota): the cold-email
 * route at apps/web/src/app/api/ai/cold-email/route.ts:35 calls
 * `hasQuota(planTier, "cold_email", currentUsage)`. Returns 429 +
 * `{ upgrade: true }` when over the per-tier limit.
 *
 * Per-tier limits (from packages/shared/src/constants/plan-limits.ts):
 *   free: 2 · starter: 15 · pro: 50 · elite: -1 (unlimited)
 *
 * Generates 5 tests via generatePlanGatingSuite() — see plan-fixture.ts
 * for the full boundary pattern. Test 5 is `test.fixme()` because the
 * backend uses a monthly window today (BUGS_FOUND.md gap #5).
 */

import { generatePlanGatingSuite } from "../../support/fixtures/plan-fixture";

generatePlanGatingSuite({
  displayName: "cold email",
  feature: "cold_email",
  quotaByTier: { free: 2, starter: 15, pro: 50, elite: -1 },
  upgradeTo: "pro",
  mockRoutePattern: "**/api/ai/cold-email",
  action: async (page) => {
    const r = await page.evaluate(
      async ([url]: [string]) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: "Software Engineer",
            companyName: "Acme",
            jobDescription:
              "Build great software for a great team. We use TypeScript, React, and Postgres.",
            tone: "professional",
          }),
        });
        return { status: res.status, body: await res.json().catch(() => null) };
      },
      [`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/api/ai/cold-email`],
    );
    return { status: () => r.status, json: async () => r.body };
  },
});
