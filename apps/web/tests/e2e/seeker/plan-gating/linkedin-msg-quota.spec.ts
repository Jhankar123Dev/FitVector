/**
 * seeker/plan-gating/linkedin-msg-quota.spec.ts
 *
 * Server-enforced LinkedIn-message quota.
 *
 * Verified via code-review-graph: linkedin-msg/route.ts:26 calls hasQuota
 * with feature="linkedin_msg". Returns 429 + { upgrade: true } over limit.
 *
 * Per-tier limits: free 2 · starter 15 · pro 50 · elite -1
 */

import { generatePlanGatingSuite } from "../../support/fixtures/plan-fixture";

generatePlanGatingSuite({
  displayName: "linkedin message",
  feature: "linkedin_msg",
  quotaByTier: { free: 2, starter: 15, pro: 50, elite: -1 },
  upgradeTo: "pro",
  mockRoutePattern: "**/api/ai/linkedin-msg",
  action: async (page) => {
    const r = await page.evaluate(
      async ([url]: [string]) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobTitle: "Senior Engineer",
            companyName: "Globex",
            jobDescription:
              "Lead the platform team. We use Go, Kafka, and a service mesh in Kubernetes.",
            tone: "professional",
          }),
        });
        return { status: res.status, body: await res.json().catch(() => null) };
      },
      [`${process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"}/api/ai/linkedin-msg`],
    );
    return { status: () => r.status, json: async () => r.body };
  },
});
