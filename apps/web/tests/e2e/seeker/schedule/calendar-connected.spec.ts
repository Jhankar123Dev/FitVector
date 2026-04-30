/**
 * seeker/schedule/calendar-connected.spec.ts
 *
 * Verifies the populated state of /dashboard/schedule when Google Calendar
 * is connected.
 *
 * Verified against src/app/(dashboard)/dashboard/schedule/page.tsx:
 *   - Fetches GET /api/user/calendar/events → { data: CalendarEvent[] }.
 *   - Groups by date with headers "Today" / "Tomorrow" / "{Weekday}, …".
 *   - Each card renders title, time range "h:mm AM/PM – h:mm AM/PM · N min",
 *     "All day" badge for isAllDay events, "Video call" badge when meetLink
 *     is set, "Join Call" button targeting meetLink in a new tab,
 *     "Open in Google Calendar" link targeting htmlLink.
 *
 * NB: Google Calendar API is NOT hit during these tests — we mock
 * /api/user/calendar/events directly, which is the route our page consumes.
 * The live OAuth callback at /api/calendar/google/callback and any
 * googleapis client traffic are server-side only.
 *
 * Coverage (5 tests):
 *   ✅ events grouped by date — Today / Tomorrow / weekday-formatted headers
 *   ✅ time format renders "h:mm AM/PM – h:mm AM/PM · N min"
 *   ✅ "Video call" badge appears when meetLink is set
 *   ✅ "All day" treatment renders for isAllDay events
 *   ✅ "Join Call" button targets meetLink with target=_blank
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isAllDay?: boolean;
  location?: string;
  meetLink?: string;
  htmlLink?: string;
}

/**
 * Build a calendar event whose start/end are anchored to a specific local
 * day offset from today. Times are stamped as ISO strings — toLocaleTimeString
 * in the page handles the rendering format.
 */
function eventOnDay(
  daysFromToday: number,
  startHour: number,
  startMin: number,
  durationMin: number,
  overrides: Partial<CalendarEvent>,
): CalendarEvent {
  const day = new Date();
  day.setDate(day.getDate() + daysFromToday);
  day.setHours(startHour, startMin, 0, 0);
  const start = new Date(day);
  const end = new Date(day.getTime() + durationMin * 60_000);
  return {
    id: overrides.id ?? `evt-${daysFromToday}-${startHour}`,
    title: overrides.title ?? "Mock Event",
    start: start.toISOString(),
    end: end.toISOString(),
    isAllDay: false,
    ...overrides,
  };
}

function allDayEventOnDay(daysFromToday: number, title: string): CalendarEvent {
  const day = new Date();
  day.setDate(day.getDate() + daysFromToday);
  day.setHours(0, 0, 0, 0);
  const start = new Date(day);
  const end = new Date(day);
  end.setDate(end.getDate() + 1);
  return {
    id: `allday-${daysFromToday}`,
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    isAllDay: true,
  };
}

async function mockEvents(page: Page, events: CalendarEvent[]): Promise<void> {
  await page.route("**/api/user/calendar/events", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: events }),
    }),
  );
}

test.describe("Schedule — calendar connected", () => {
  test("events grouped by date — Today / Tomorrow / weekday headers", async ({
    seekerPage,
  }) => {
    await mockEvents(seekerPage, [
      eventOnDay(0, 14, 30, 30, {
        id: "today-1",
        title: "Standup with Engineering",
      }),
      eventOnDay(1, 10, 0, 60, { id: "tomorrow-1", title: "1:1 with Manager" }),
      // 3 days from today — weekday header.
      eventOnDay(3, 16, 0, 30, { id: "weekday-1", title: "Career Coaching" }),
    ]);
    await seekerPage.goto("/dashboard/schedule");

    await expect(
      seekerPage.getByRole("heading", { level: 2, name: /^Today$/ }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByRole("heading", { level: 2, name: /^Tomorrow$/ }),
    ).toBeVisible();

    // The 3-day-out header renders as "{Weekday}, {Month} {Day}". We accept
    // any weekday name to keep the test robust against current calendar date.
    const weekdayHeader = seekerPage
      .getByRole("heading", { level: 2 })
      .filter({ hasText: /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/ });
    await expect(weekdayHeader).toBeVisible();

    // All three event titles in their respective groups.
    await expect(seekerPage.getByText("Standup with Engineering")).toBeVisible();
    await expect(seekerPage.getByText("1:1 with Manager")).toBeVisible();
    await expect(seekerPage.getByText("Career Coaching")).toBeVisible();
  });

  test("time format renders 'h:mm AM/PM – h:mm AM/PM · N min'", async ({ seekerPage }) => {
    await mockEvents(seekerPage, [
      eventOnDay(0, 14, 30, 30, { id: "fmt-1", title: "Format Test Event" }),
    ]);
    await seekerPage.goto("/dashboard/schedule");

    // Card row contains both the time range and "30 min" duration.
    const card = seekerPage.locator("div", { hasText: "Format Test Event" }).first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    // 14:30 → "2:30 PM"; 15:00 → "3:00 PM".
    await expect(seekerPage.getByText(/2:30 PM\s*–\s*3:00 PM/)).toBeVisible();
    await expect(seekerPage.getByText(/30 min/)).toBeVisible();
  });

  test("'Video call' badge renders when meetLink is set", async ({ seekerPage }) => {
    await mockEvents(seekerPage, [
      eventOnDay(0, 11, 0, 30, {
        id: "video-1",
        title: "Zoom — Coffee Chat",
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
      // Control: another event WITHOUT a meet link must not have the badge.
      eventOnDay(0, 13, 0, 30, {
        id: "novideo-1",
        title: "Lunch Block",
      }),
    ]);
    await seekerPage.goto("/dashboard/schedule");

    // The "Video call" badge text appears.
    await expect(seekerPage.getByText("Video call", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    // It belongs to the video-1 card. Use a card-scoped locator.
    const videoCard = seekerPage
      .locator("div.rounded-lg, div.rounded-xl")
      .filter({ hasText: "Zoom — Coffee Chat" })
      .first();
    await expect(videoCard.getByText("Video call", { exact: true })).toBeVisible();

    // Lunch Block card should NOT contain a Video call badge.
    const lunchCard = seekerPage
      .locator("div.rounded-lg, div.rounded-xl")
      .filter({ hasText: "Lunch Block" })
      .first();
    await expect(
      lunchCard.getByText("Video call", { exact: true }),
    ).toHaveCount(0);
  });

  test("all-day events render the 'All day' treatment instead of a time range", async ({
    seekerPage,
  }) => {
    await mockEvents(seekerPage, [
      allDayEventOnDay(0, "Company Holiday"),
    ]);
    await seekerPage.goto("/dashboard/schedule");

    const card = seekerPage
      .locator("div.rounded-lg, div.rounded-xl")
      .filter({ hasText: "Company Holiday" })
      .first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    // The card carries "All day" copy. (Both the time row and badge use it.)
    await expect(card.getByText("All day", { exact: true }).first()).toBeVisible();
  });

  test("'Join Call' button targets meetLink in a new tab", async ({ seekerPage }) => {
    const meetUrl = "https://meet.google.com/test-link-123";
    await mockEvents(seekerPage, [
      eventOnDay(0, 9, 0, 30, {
        id: "join-1",
        title: "Interview Round 2",
        meetLink: meetUrl,
        htmlLink: "https://calendar.google.com/event?eid=abc",
      }),
    ]);
    await seekerPage.goto("/dashboard/schedule");

    const joinLink = seekerPage.getByRole("link", { name: /join call/i });
    await expect(joinLink).toBeVisible({ timeout: 10_000 });
    await expect(joinLink).toHaveAttribute("href", meetUrl);
    await expect(joinLink).toHaveAttribute("target", "_blank");
  });
});
