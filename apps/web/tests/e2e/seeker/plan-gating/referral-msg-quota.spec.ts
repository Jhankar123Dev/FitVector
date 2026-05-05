/**
 * seeker/plan-gating/referral-msg-quota.spec.ts
 *
 * Server-enforced referral-request quota.
 *
 * Verified via code-review-graph: referral-msg/route.ts:26 calls hasQuota
 * with feature="referral_msg".
 *
 * Per-tier limits: free 0 (HARD-BLOCKED) · starter 5 · pro 30 · elite -1
 *
 * NB: Free has 0 quota — the "under quota" + "at limit-1" branches are
 * skipped by the factory when limit ≤ 0. The "at limit" test fires the
 * 429 path on the very first attempt for Free seekers, which is the
 * canonical anti-spam invariant for referral asks.
 */

import { generatePlanGatingSuite } from "../../support/fixtures/plan-fixture";

generatePlanGatingSuite({
  displayName: "referral message",
  feature: "referral_msg",
  // Free has 0 — the boundary tests collapse onto the "first attempt → 429" path.
  quotaByTier: { free: 0, starter: 5, pro: 30, elite: -1 },
  upgradeTo: "pro",
  mockRoutePattern: "**/api/ai/referral-msg",
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
              "Join our distributed-systems team — Go, Kafka, Spanner. We invest heavily in mentorship.",
            tone: "professional",
          }),
        });
        return { status: res.status, body: await res.json().catch(() => null) };
      },
      [`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/api/ai/referral-msg`],
    );
    return { status: () => r.status, json: async () => r.body };
  },
});
