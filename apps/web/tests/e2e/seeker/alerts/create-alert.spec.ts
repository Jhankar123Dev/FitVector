/**
 * seeker/alerts/create-alert.spec.ts
 *
 * MASTER_PLAN expects: create alert (Pro/Elite), validation, list update,
 * Free shows upgrade CTA.
 *
 * REALITY (verified via code-review-graph: query "alerts" returned 0 nodes
 * matching "File" kind; no /dashboard/alerts route, no /api/alerts route,
 * no AlertForm/JobAlert component anywhere in the tree):
 *
 *   The "Job Alerts" feature is **not built yet**. The Starter plan card on
 *   /dashboard/settings/plan lists "Job alerts" as a benefit, but the actual
 *   UI + API don't exist. This is documented as a UI gap in BUGS_FOUND.md.
 *
 * All four tests are scaffolded as test.fixme() so they auto-light when
 * the feature ships. Each has a TODO and a suggested API surface.
 *
 * Coverage (4 tests, all fixme):
 *   ⚠ Pro/Elite seeker can create an alert
 *   ⚠ form requires keyword + location (validation gate)
 *   ⚠ created alert appears in the list
 *   ⚠ Free seeker sees an upgrade CTA instead of the form
 */

import { test } from "../../support/fixtures";

test.describe("Job alerts — create (NOT YET BUILT)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.use({ ephemeralSeekerOptions: { onboardingCompleted: true } });
  test.fixme(
    "Pro/Elite seeker can create a new job alert (TODO: build /dashboard/alerts page + /api/user/alerts route — feature listed on Starter plan card but not implemented)",
    async () => {
      // Future shape:
      //   await seekerPage.goto("/dashboard/alerts");
      //   await seekerPage.getByRole("button", { name: /create alert/i }).click();
      //   await seekerPage.getByLabel(/keyword/i).fill("Frontend Engineer");
      //   await seekerPage.getByLabel(/location/i).fill("Bangalore");
      //   await seekerPage.getByRole("button", { name: /save alert/i }).click();
      //   // POST /api/user/alerts captured + new alert appears in the list
    },
  );

  test.fixme(
    "form gate: keyword + location are required (TODO: build form validation when alerts page lands)",
    async () => {
      // await alertForm.saveBtn.click();
      // await expect(alertForm.keywordError).toBeVisible();
      // await expect(alertForm.locationError).toBeVisible();
    },
  );

  test.fixme(
    "created alert immediately appears in the alerts list (TODO: wire mutation invalidation when feature lands)",
    async () => {
      // await alertForm.fill("Frontend", "Bangalore"); await alertForm.saveBtn.click();
      // await expect(alertList.row("Frontend")).toBeVisible();
    },
  );

  test.fixme(
    "Free-tier seekers see an upgrade CTA instead of the form (TODO: plan-gating for alerts)",
    async () => {
      // test.use({ ephemeralSeekerOptions: { planTier: "free" } });
      // await expect(seekerPage.getByText(/upgrade to starter/i)).toBeVisible();
      // await expect(seekerPage.getByRole("button", { name: /create alert/i })).toHaveCount(0);
    },
  );
});
