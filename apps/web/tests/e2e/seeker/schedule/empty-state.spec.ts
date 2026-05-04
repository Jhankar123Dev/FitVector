/**
 * seeker/schedule/empty-state.spec.ts
 *
 * Verifies the empty state on /dashboard/schedule when the calendar IS
 * connected but has no events in the next 30 days.
 *
 * Verified against src/app/(dashboard)/dashboard/schedule/page.tsx:
 *   - When the API returns 200 with `data: []`, the page renders an
 *     EmptyState card with:
 *       • CalendarX icon
 *       • "No upcoming events" copy
 *       • "Your Google Calendar has no events in the next 30 days." subcopy
 *
 * Coverage (1 test):
 *   ✅ data:[] renders the "No upcoming events" empty state
 */

import { test, expect } from "../../support/fixtures";

test.describe("Schedule — empty state", () => {
  test("zero events from the API renders the 'No upcoming events' empty state", async ({
    seekerPage,
  }) => {
    await seekerPage.route("**/api/user/calendar/events", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      }),
    );
    await seekerPage.goto("/dashboard/schedule");

    await expect(
      seekerPage.getByText(/^No upcoming events$/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByText(/your google calendar has no events/i),
    ).toBeVisible();

    // No event cards rendered.
    await expect(seekerPage.getByRole("link", { name: /join call/i })).toHaveCount(0);
  });
});
