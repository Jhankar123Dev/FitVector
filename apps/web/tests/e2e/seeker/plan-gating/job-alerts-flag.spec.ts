/**
 * seeker/plan-gating/job-alerts-flag.spec.ts
 *
 * Per-tier job-alerts availability:
 *   free    → false
 *   starter → true
 *   pro     → true
 *   elite   → true
 *
 * REALITY: the entire Job Alerts feature is missing — see BUGS_FOUND.md
 * gap #15. There's no /dashboard/alerts page, no /api/user/alerts route,
 * and no UI surface that reads `job_alerts` from PLAN_LIMITS.
 *
 * MASTER_PLAN expected this spec to assert "Free shows upgrade CTA on
 * /dashboard/settings/notifications or /dashboard/alerts" — neither
 * surface implements the gate today. All 4 tier tests are `test.fixme`'d.
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ free → "Upgrade to Starter" CTA visible; alerts surface absent
 *   ⚠ starter → alerts surface accessible
 *   ⚠ pro → alerts surface accessible
 *   ⚠ elite → alerts surface accessible
 */

import { test } from "../../support/fixtures";

test.describe("Plan-gating — job alerts flag (FEATURE NOT BUILT)", () => {
  test.fixme(
    "free tier sees an upgrade CTA where the alerts UI would live (TODO:UI-GAP #15 — feature absent; no /dashboard/alerts page or /api/user/alerts endpoint)",
    async () => {
      // await setPlanTier(seeker.id, "free");
      // await page.goto("/dashboard/alerts");
      // await expect(page.getByText(/upgrade to starter/i)).toBeVisible();
    },
  );

  test.fixme(
    "starter tier can access the alerts UI",
    async () => {
      // await setPlanTier(seeker.id, "starter");
      // await page.goto("/dashboard/alerts");
      // await expect(page.getByRole("heading", { name: /^job alerts$/i })).toBeVisible();
    },
  );

  test.fixme(
    "pro tier can access the alerts UI",
    async () => {
      // Same as starter — gate inverts on the boolean flag.
    },
  );

  test.fixme(
    "elite tier can access the alerts UI",
    async () => {
      // Same as pro.
    },
  );
});
