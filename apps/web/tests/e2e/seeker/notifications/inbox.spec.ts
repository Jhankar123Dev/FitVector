/**
 * seeker/notifications/inbox.spec.ts
 *
 * REALITY: there is no /dashboard/notifications inbox page (UI gap #16).
 * Notifications surface as a **bell-button dropdown** in the dashboard
 * navbar — rendered by NotificationDropdown when the bell is clicked.
 *
 * MASTER_PLAN's "list renders / unread count badge / mark-as-read / delete"
 * are reframed against the dropdown:
 *
 * Verified against:
 *   - src/components/layout/navbar.tsx — Bell icon button toggles the dropdown
 *   - src/components/layout/notification-dropdown.tsx — renders list with
 *     border-l color per type + an unread-dot, "Mark all read" header button,
 *     and footer link to /dashboard/settings/notifications.
 *   - src/hooks/use-notifications.ts → useNotifications + useMarkAllRead
 *   - src/app/api/user/notifications/route.ts — GET list + PATCH mark-read.
 *
 * Coverage (4 tests):
 *   ✅ bell button visible in the navbar
 *   ✅ click bell opens dropdown with mocked notifications + unread count
 *   ✅ "Mark all read" fires PATCH /api/user/notifications
 *   ✅ empty state renders "No notifications yet"
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

interface MockNotif {
  id: string;
  type: "status_change" | "interview_invite" | "offer" | "rejection" | "general";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}

const SEED_NOTIFS: MockNotif[] = [
  {
    id: "n1",
    type: "interview_invite",
    title: "Interview invite from Acme",
    message: "Schedule your AI interview for the Senior Backend Engineer role.",
    isRead: false,
    actionUrl: "/interview/abc-123",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n2",
    type: "status_change",
    title: "Application moved to Screening",
    message: "Globex moved your application to Screening.",
    isRead: false,
    actionUrl: "/dashboard/tracker",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n3",
    type: "general",
    title: "Welcome to FitVector",
    message: "Tip: upload your resume to get tailored job matches.",
    isRead: true,
    actionUrl: "/dashboard/resume",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

async function mockNotifs(
  page: Page,
  notifs: MockNotif[],
): Promise<{ patchRequests: Request[] }> {
  const patchRequests: Request[] = [];
  await page.route("**/api/user/notifications", async (route) => {
    if (route.request().method() === "PATCH") {
      patchRequests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: notifs }),
    });
  });
  return { patchRequests };
}

async function clickBell(page: Page): Promise<void> {
  // The navbar bell button doesn't have a label — find it by the Bell icon's
  // location inside the header. The simplest reliable selector: locate the
  // <button> whose only child is the Bell SVG (lucide adds class="lucide-bell").
  const bell = page
    .locator("header button, nav button")
    .filter({ has: page.locator("svg.lucide-bell, svg[class*='lucide-bell']") })
    .first();

  // Fallback: get-by-role on a button containing an SVG with title-less
  // accessible name "Notifications" if added later.
  const fallback = page.getByRole("button", { name: /notification/i }).first();

  if (await bell.isVisible().catch(() => false)) {
    await bell.click();
    return;
  }
  await fallback.click();
}

test.describe("Notifications — bell dropdown", () => {
  test("bell button is visible in the dashboard navbar", async ({ seekerPage }) => {
    // Run at mobile width so the bell button (lg:hidden on desktop) is visible.
    await seekerPage.setViewportSize({ width: 375, height: 812 });
    await mockNotifs(seekerPage, SEED_NOTIFS);
    await seekerPage.goto("/dashboard");

    const bell = seekerPage
      .locator("header button, nav button")
      .filter({ has: seekerPage.locator("svg.lucide-bell, svg[class*='lucide-bell']") })
      .first();
    await expect(bell).toBeVisible({ timeout: 10_000 });
  });

  test("clicking the bell opens the dropdown with notifications + unread count", async ({
    seekerPage,
  }) => {
    await mockNotifs(seekerPage, SEED_NOTIFS);
    await seekerPage.goto("/dashboard");

    await clickBell(seekerPage);

    // Dropdown header.
    await expect(
      seekerPage.getByRole("heading", { name: /^Notifications$/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Unread count = 2 (n1 + n2 both isRead=false).
    await expect(seekerPage.getByText(/^2$/).first()).toBeVisible();

    // Notif titles render.
    await expect(seekerPage.getByText("Interview invite from Acme")).toBeVisible();
    await expect(seekerPage.getByText("Application moved to Screening")).toBeVisible();
  });

  test("'Mark all read' fires PATCH /api/user/notifications", async ({ seekerPage }) => {
    const { patchRequests } = await mockNotifs(seekerPage, SEED_NOTIFS);
    await seekerPage.goto("/dashboard");
    await clickBell(seekerPage);

    await seekerPage.getByRole("button", { name: /mark all read/i }).click();

    await expect.poll(() => patchRequests.length).toBeGreaterThan(0);
    expect(patchRequests[0].method()).toBe("PATCH");
    expect(patchRequests[0].url()).toContain("/api/user/notifications");
  });

  test("zero notifications renders the 'No notifications yet' empty state", async ({
    seekerPage,
  }) => {
    await mockNotifs(seekerPage, []);
    await seekerPage.goto("/dashboard");
    await clickBell(seekerPage);

    await expect(
      seekerPage.getByText(/no notifications yet/i),
    ).toBeVisible({ timeout: 10_000 });
    // No "Mark all read" button when there are no unread items.
    await expect(
      seekerPage.getByRole("button", { name: /mark all read/i }),
    ).toHaveCount(0);
  });
});
