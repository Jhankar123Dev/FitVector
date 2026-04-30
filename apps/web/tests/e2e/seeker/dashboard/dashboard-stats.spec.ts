/**
 * seeker/dashboard/dashboard-stats.spec.ts
 *
 * Verifies that the four stat cards on the seeker home read straight from
 * /api/user/dashboard-stats and render the exact values the API returns.
 *
 * The route is mocked with page.route() in every test so the assertions
 * are deterministic regardless of the seed seeker's actual DB state.
 *
 * Verified against src/hooks/use-dashboard-stats.ts:
 *   GET /api/user/dashboard-stats
 *   → { data: { activeApplications, jobMatches, resumesCreated, messagesSent } }
 *
 * MASTER_PLAN's "resume strength widget" / "recent activity feed" don't
 * exist on the live page; those tests have been replaced with one stat
 * card each, matching real UI.
 *
 * Coverage (4 tests):
 *   ✅ activeApplications value renders
 *   ✅ jobMatches value renders
 *   ✅ resumesCreated value renders
 *   ✅ messagesSent value renders
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

interface StatsPayload {
  activeApplications: number;
  jobMatches: number;
  resumesCreated: number;
  messagesSent: number;
}

async function mockStats(page: Page, payload: StatsPayload): Promise<void> {
  await page.route("**/api/user/dashboard-stats", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: payload }),
    }),
  );
}

/**
 * Asserts the dashboard renders `value` next to a card labelled `label`.
 * Uses a label-anchored locator so we don't accidentally match the same
 * digit elsewhere on the page (e.g. nav badges).
 */
async function expectStat(page: Page, label: string, value: number): Promise<void> {
  const card = page.getByText(label, { exact: true }).locator("..");
  await expect(card.getByText(String(value), { exact: true })).toBeVisible();
}

test.describe("Dashboard stats (seeker)", () => {
  test("Active Applications value mirrors the API response", async ({ seekerPage }) => {
    await mockStats(seekerPage, {
      activeApplications: 17,
      jobMatches: 0,
      resumesCreated: 0,
      messagesSent: 0,
    });
    await seekerPage.goto("/dashboard");
    await expectStat(seekerPage, "Active Applications", 17);
  });

  test("Job Matches value mirrors the API response", async ({ seekerPage }) => {
    await mockStats(seekerPage, {
      activeApplications: 0,
      jobMatches: 42,
      resumesCreated: 0,
      messagesSent: 0,
    });
    await seekerPage.goto("/dashboard");
    await expectStat(seekerPage, "Job Matches", 42);
  });

  test("Resumes Created value mirrors the API response", async ({ seekerPage }) => {
    await mockStats(seekerPage, {
      activeApplications: 0,
      jobMatches: 0,
      resumesCreated: 9,
      messagesSent: 0,
    });
    await seekerPage.goto("/dashboard");
    await expectStat(seekerPage, "Resumes Created", 9);
  });

  test("Messages Sent value mirrors the API response", async ({ seekerPage }) => {
    await mockStats(seekerPage, {
      activeApplications: 0,
      jobMatches: 0,
      resumesCreated: 0,
      messagesSent: 23,
    });
    await seekerPage.goto("/dashboard");
    await expectStat(seekerPage, "Messages Sent", 23);
  });
});
