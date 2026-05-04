/**
 * seeker/dashboard/dashboard-empty.spec.ts
 *
 * Verifies the dashboard's zero-state behavior. The live page renders the
 * stat values straight from useDashboardStats — there are no separate empty-
 * state CTAs (the Quick Actions section already serves that role).
 *
 * MASTER_PLAN's "brand-new user empty state" / "zero applications" / "zero
 * saved jobs" have been adapted: zeros are the empty state. We assert that
 * 0 renders for each card and that the Quick Actions remain available so
 * the user has a path forward.
 *
 * Coverage (3 tests):
 *   ✅ all 4 stat cards show "0" when the API returns all zeros
 *   ✅ Quick Actions section is still visible in the empty state (path forward)
 *   ✅ stat error → values fall back to 0 (useDashboardStats default)
 */

import { test, expect } from "../../support/fixtures";

test.describe("Dashboard empty state (seeker)", () => {
  test("zero stats: every card renders '0'", async ({ seekerPage }) => {
    await seekerPage.route("**/api/user/dashboard-stats", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { activeApplications: 0, jobMatches: 0, resumesCreated: 0, messagesSent: 0 },
        }),
      }),
    );
    await seekerPage.goto("/dashboard");

    // Each stat label sits in a card whose value cell renders the number.
    for (const label of [
      "Active Applications",
      "Job Matches",
      "Resumes Created",
      "Messages Sent",
    ]) {
      const card = seekerPage.getByText(label, { exact: true }).locator("..");
      await expect(card.getByText("0", { exact: true })).toBeVisible();
    }
  });

  test("Quick Actions remain visible so the user has a clear path forward", async ({
    seekerPage,
  }) => {
    await seekerPage.route("**/api/user/dashboard-stats", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { activeApplications: 0, jobMatches: 0, resumesCreated: 0, messagesSent: 0 },
        }),
      }),
    );
    await seekerPage.goto("/dashboard");

    await expect(seekerPage.getByRole("heading", { name: /quick actions/i })).toBeVisible();
    // Two of the most discoverable CTAs — proves the section actually rendered.
    await expect(
      seekerPage.getByRole("heading", { name: /^Search Jobs$/ }),
    ).toBeVisible();
    await expect(
      seekerPage.getByRole("heading", { name: /^Tailor Resume$/ }),
    ).toBeVisible();
  });

  test("stats endpoint failure falls back to '0' (useDashboardStats default)", async ({
    seekerPage,
  }) => {
    // Simulate a backend error — the hook's `data?.activeApplications ?? 0`
    // pattern means the UI should still render zeros instead of crashing.
    await seekerPage.route("**/api/user/dashboard-stats", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "boom" }) }),
    );
    await seekerPage.goto("/dashboard");

    const activeAppsCard = seekerPage
      .getByText("Active Applications", { exact: true })
      .locator("..");
    // Tolerate either an immediate "0" or a brief skeleton — assert with a
    // generous timeout that the value cell eventually shows "0".
    await expect(activeAppsCard.getByText("0", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });
});
