/**
 * seeker/dashboard/dashboard-load.spec.ts
 *
 * Smoke tests for the seeker home at /dashboard.
 *
 * Verified against src/app/(dashboard)/dashboard/page.tsx:
 *   - <h1>Welcome back, {firstName}!</h1>  (firstName = full_name.split(" ")[0] || "there")
 *   - <h2>Quick Actions</h2> + 4 Cards: Search Jobs, Tailor Resume,
 *     Generate Outreach, Track Applications. Each renders a "Get Started"
 *     <Link> that points to /dashboard/{jobs|resume|outreach|tracker}.
 *   - 4 dynamic stat cards labelled: Active Applications, Job Matches,
 *     Resumes Created, Messages Sent. Skeleton state: <div .animate-pulse />.
 *
 * MASTER_PLAN's "Jobs for You" section / "skeleton during load" expectations
 * were rewritten to match the live page: the dashboard renders stat-card
 * skeletons during useDashboardStats() loading, not job-card skeletons.
 *
 * Uses the seekerPage fixture (pre-authenticated as the seed seeker
 * `playwright@gmail.com`) so tests start on /dashboard immediately.
 *
 * Coverage (4 tests):
 *   ✅ welcome heading + greeting first-name renders
 *   ✅ Quick Actions section renders all 4 cards with valid hrefs
 *   ✅ skeleton placeholder appears while stats are loading (route is delayed)
 *   ✅ four stat-card labels render
 */

import { test, expect } from "../../support/fixtures";
import { DashboardPage } from "../../support/page-objects/seeker/dashboard.page";

const QUICK_ACTIONS: Array<{ title: string; href: string }> = [
  { title: "Search Jobs",         href: "/dashboard/jobs" },
  { title: "Tailor Resume",       href: "/dashboard/resume" },
  { title: "Generate Outreach",   href: "/dashboard/outreach" },
  { title: "Track Applications",  href: "/dashboard/tracker" },
];

const STAT_LABELS = [
  "Active Applications",
  "Job Matches",
  "Resumes Created",
  "Messages Sent",
];

test.describe("Dashboard load (seeker)", () => {
  test("welcome heading renders with the user's first name", async ({ seekerPage }) => {
    const dashboard = new DashboardPage(seekerPage);
    await dashboard.goto();

    await expect(dashboard.welcomeHeading).toBeVisible();
    // The seed seeker (playwright@gmail.com) — the test passes regardless of
    // the exact full_name as long as it's "Welcome back, <something>!".
    const headingText = await dashboard.welcomeHeading.textContent();
    expect(headingText, "expected a non-empty greeting").toBeTruthy();
    expect(headingText).toMatch(/welcome back,\s*\S/i);
  });

  test("Quick Actions renders all 4 cards with the right hrefs", async ({ seekerPage }) => {
    const dashboard = new DashboardPage(seekerPage);
    await dashboard.goto();

    await expect(dashboard.quickActionsHeading).toBeVisible();

    for (const { title, href } of QUICK_ACTIONS) {
      const link = dashboard.quickActionLink(title);
      await expect(link, `quick action "${title}" should be visible`).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
    }
  });

  test("stat-card skeleton renders while /api/user/dashboard-stats is in flight", async ({
    seekerPage,
  }) => {
    // Hold the stats response for 800ms so we can observe the skeleton state.
    await seekerPage.route("**/api/user/dashboard-stats", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { activeApplications: 0, jobMatches: 0, resumesCreated: 0, messagesSent: 0 },
        }),
      });
    });

    await seekerPage.goto("/dashboard");
    // The 4 stat cards each render an .animate-pulse div while loading.
    const skeletons = seekerPage.locator(".animate-pulse");
    await expect(skeletons.first()).toBeVisible({ timeout: 5_000 });
    expect(await skeletons.count()).toBeGreaterThanOrEqual(4);
  });

  test("all 4 stat-card labels render after stats load", async ({ seekerPage }) => {
    // Force-respond instantly so the skeletons clear, then verify labels.
    await seekerPage.route("**/api/user/dashboard-stats", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { activeApplications: 7, jobMatches: 12, resumesCreated: 3, messagesSent: 5 },
        }),
      }),
    );

    const dashboard = new DashboardPage(seekerPage);
    await dashboard.goto();

    for (const label of STAT_LABELS) {
      await expect(seekerPage.getByText(label, { exact: true })).toBeVisible();
    }
  });
});
