/**
 * seeker/notifications/realtime.spec.ts
 *
 * Verifies that the bell dropdown reflects fresh data when /api/user/notifications
 * returns updated rows. The page does NOT use Supabase realtime (subscribed
 * channels) today — useNotifications is a plain useQuery with no
 * refetchInterval. Updates require a manual refetch (e.g., another bell open
 * after the data changes).
 *
 * Coverage (1 test + 1 fixme):
 *   ✅ refetching the API after a server-side change updates the unread count
 *   ⚠ test.fixme — true realtime push (Supabase channel) updates the badge
 *      without reload (TODO: not implemented; useNotifications has no
 *      refetchInterval and no Supabase channel subscription)
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

interface MockNotif {
  id: string;
  type: "general";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}

async function mockNotifsMutable(
  page: Page,
): Promise<{ setBatch: (rows: MockNotif[]) => void }> {
  let current: MockNotif[] = [];
  await page.route("**/api/user/notifications", async (route) => {
    if (route.request().method() === "PATCH") {
      current = current.map((n) => ({ ...n, isRead: true }));
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
      body: JSON.stringify({ data: current }),
    });
  });
  return { setBatch: (rows) => { current = rows; } };
}

async function openBell(page: Page): Promise<void> {
  const bell = page
    .locator("header button, nav button")
    .filter({ has: page.locator("svg") })
    .first();
  await bell.click();
}

test.describe("Notifications — refetch / realtime behavior", () => {
  test("updating the API and re-opening the bell reflects the new unread count", async ({
    seekerPage,
  }) => {
    const { setBatch } = await mockNotifsMutable(seekerPage);
    setBatch([
      {
        id: "n1",
        type: "general",
        title: "First notification",
        message: "Hello.",
        isRead: false,
        actionUrl: "#",
        createdAt: new Date().toISOString(),
      },
    ]);
    await seekerPage.goto("/dashboard");
    await openBell(seekerPage);
    await expect(seekerPage.getByText("First notification")).toBeVisible({
      timeout: 10_000,
    });
    // Unread count "1" appears in the header pill.
    await expect(seekerPage.getByText(/^1$/).first()).toBeVisible();

    // Add a second notification on the server side.
    setBatch([
      {
        id: "n1",
        type: "general",
        title: "First notification",
        message: "Hello.",
        isRead: false,
        actionUrl: "#",
        createdAt: new Date().toISOString(),
      },
      {
        id: "n2",
        type: "general",
        title: "Second notification (new)",
        message: "Brand new.",
        isRead: false,
        actionUrl: "#",
        createdAt: new Date().toISOString(),
      },
    ]);

    // Force a refetch by reloading the page (no Supabase channel today).
    await seekerPage.reload();
    await openBell(seekerPage);
    await expect(seekerPage.getByText("Second notification (new)")).toBeVisible({
      timeout: 10_000,
    });
    // Unread count grew to 2.
    await expect(seekerPage.getByText(/^2$/).first()).toBeVisible();
  });

  test.fixme(
    "true realtime: a new notification appears in the bell without reload (TODO: useNotifications has no refetchInterval and no Supabase channel subscription)",
    async ({ seekerPage }) => {
      // Future shape, when realtime ships:
      //   1. subscribe to supabase.channel('seeker:notifications').on('INSERT', …)
      //   2. fire a fake INSERT event from the test
      //   3. assert the badge count increments without a manual refetch
      void seekerPage;
    },
  );
});
