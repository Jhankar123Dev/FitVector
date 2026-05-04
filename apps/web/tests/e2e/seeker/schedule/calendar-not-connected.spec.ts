/**
 * seeker/schedule/calendar-not-connected.spec.ts
 *
 * Verifies the not-connected state of /dashboard/schedule.
 *
 * Verified against src/app/(dashboard)/dashboard/schedule/page.tsx:
 *   - The page treats `notConnected: true` on a non-200 response as a
 *     dedicated state (not a generic error). It renders:
 *       • "Google Calendar not connected" headline
 *       • Body copy linking to Settings
 *       • <Link href="/dashboard/settings">Go to Settings</Link>
 *
 * Coverage (2 tests):
 *   ✅ 401 + notConnected:true → "Google Calendar not connected" UI
 *   ✅ "Go to Settings" link points to /dashboard/settings
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

async function mockNotConnected(page: Page): Promise<void> {
  await page.route("**/api/user/calendar/events", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Calendar not connected",
        notConnected: true,
      }),
    }),
  );
}

test.describe("Schedule — calendar not connected", () => {
  test("not-connected response renders the dedicated 'Calendar not connected' state", async ({
    seekerPage,
  }) => {
    await mockNotConnected(seekerPage);
    await seekerPage.goto("/dashboard/schedule");

    await expect(
      seekerPage.getByText(/google calendar not connected/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByText(/connect your calendar from settings/i),
    ).toBeVisible();
  });

  test("'Go to Settings' link points to /dashboard/settings", async ({ seekerPage }) => {
    await mockNotConnected(seekerPage);
    await seekerPage.goto("/dashboard/schedule");

    const link = seekerPage.getByRole("link", { name: /go to settings/i });
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toHaveAttribute("href", "/dashboard/settings");
  });
});
