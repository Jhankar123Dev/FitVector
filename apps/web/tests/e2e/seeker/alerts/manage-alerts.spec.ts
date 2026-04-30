/**
 * seeker/alerts/manage-alerts.spec.ts
 *
 * MASTER_PLAN expects: list, toggle off, delete.
 *
 * REALITY: same as create-alert — the alerts feature is not built. See
 * BUGS_FOUND.md gap #15 for the full context.
 *
 * Coverage (3 tests, all fixme):
 *   ⚠ list renders existing alerts
 *   ⚠ toggle disables the alert (PUT)
 *   ⚠ delete removes the alert (DELETE)
 */

import { test } from "../../support/fixtures";

test.describe("Job alerts — manage (NOT YET BUILT)", () => {
  test.fixme(
    "alerts list renders existing rows (TODO: ship /dashboard/alerts + /api/user/alerts GET)",
    async () => {
      // await seekerPage.goto("/dashboard/alerts");
      // await expect(alertRow("Frontend Engineer")).toBeVisible();
    },
  );

  test.fixme(
    "toggle off PUTs /api/user/alerts/[id] with active=false",
    async () => {
      // await alertRow.toggle.click();
      // expect(putRequests[0].postDataJSON()).toMatchObject({ active: false });
    },
  );

  test.fixme(
    "delete removes the alert via DELETE /api/user/alerts/[id]",
    async () => {
      // await alertRow.deleteBtn.click();
      // await alertRow.confirmDeleteBtn.click();
      // expect(deleteRequests[0].url()).toContain("/api/user/alerts/");
    },
  );
});
