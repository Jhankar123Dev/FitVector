/**
 * seeker/plan-gating/chrome-extension-flag.spec.ts
 *
 * Per-tier chrome-extension availability:
 *   free    → false
 *   starter → false
 *   pro     → true
 *   elite   → true
 *
 * REALITY: grep `chrome_extension|chromeExtension` across apps/web/src
 * returns ZERO hits. The flag is defined in plan-limits.ts but no UI
 * surface reads it. There's no install / unlock UI and no API gate.
 *
 * Documented as UI gap #20 in BUGS_FOUND.md. All 4 tier tests are
 * `test.fixme`'d until the gate is implemented somewhere — most likely
 * a "Connect Chrome Extension" card on /dashboard/settings or a banner
 * on /dashboard with a download / unlock CTA.
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ free / starter → see locked CTA
 *   ⚠ pro / elite → see install / connect CTA
 */

import { test } from "../../support/fixtures";

test.describe("Plan-gating — chrome extension flag (FEATURE NOT BUILT)", () => {
  test.fixme(
    "free tier sees the chrome-extension locked CTA (TODO:UI-GAP #20 — flag defined in plan-limits.ts but never read by any UI surface)",
    async () => {
      // await setPlanTier(seeker.id, "free");
      // await page.goto("/dashboard");
      // await expect(page.getByText(/upgrade to pro for chrome extension/i)).toBeVisible();
    },
  );

  test.fixme(
    "starter tier still sees the chrome-extension locked CTA",
    async () => {
      // await setPlanTier(seeker.id, "starter");
      // await expect(page.getByText(/upgrade to pro for chrome extension/i)).toBeVisible();
    },
  );

  test.fixme(
    "pro tier sees the install / connect CTA (no upgrade prompt)",
    async () => {
      // await setPlanTier(seeker.id, "pro");
      // await expect(page.getByRole("link", { name: /install chrome extension/i })).toBeVisible();
    },
  );

  test.fixme(
    "elite tier sees the install / connect CTA",
    async () => {
      // Same as pro.
    },
  );
});
