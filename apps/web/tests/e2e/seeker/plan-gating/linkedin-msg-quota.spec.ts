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
  action: (page) =>
    page.request.post("/api/ai/linkedin-msg", {
      data: {
        jobTitle: "Senior Engineer",
        companyName: "Globex",
        jobDescription:
          "Lead the platform team. We use Go, Kafka, and a service mesh in Kubernetes.",
        tone: "professional",
      },
    }),
});
