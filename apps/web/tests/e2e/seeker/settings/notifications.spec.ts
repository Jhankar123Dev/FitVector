/**
 * seeker/settings/notifications.spec.ts
 *
 * Verifies the notification-preferences page at
 * /dashboard/settings/notifications.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/notifications/page.tsx:
 *   - 7 toggle rows split across "Email Notifications" + "Push Notifications" cards.
 *   - **BUG (TODO:BUG #4)**: The toggles are uncontrolled `<input
 *     type="checkbox" defaultChecked>` — no `onChange`, no save handler, and
 *     NO PUT/PATCH endpoint exists for notification preferences. Toggling a
 *     row updates the DOM (the peer-checked CSS) but the change is never
 *     persisted. This entire flow is a stub.
 *
 * Coverage (3 tests + 1 fixme):
 *   ✅ Email + Push section headers render
 *   ✅ All 7 toggle rows render with their labels
 *   ✅ A toggle's checked state can be flipped (DOM-only — no API)
 *   ⚠ test.fixme — "save persists across reloads" (TODO:BUG — no save handler exists)
 */

import { test, expect } from "../../support/fixtures";

const TOGGLE_LABELS = [
  // Email
  "Daily job digest",
  "Application status changes",
  "Follow-up reminders",
  "Weekly analytics",
  // Push
  "New job matches",
  "Status updates",
];

test.describe("Settings — notification preferences", () => {
  test("Email + Push section headers render", async ({ seekerPage }) => {
    await seekerPage.goto("/dashboard/settings/notifications");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /notifications/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText(/email notifications/i)).toBeVisible();
    await expect(seekerPage.getByText(/push notifications/i).first()).toBeVisible();
  });

  test("all toggle-row labels render", async ({ seekerPage }) => {
    await seekerPage.goto("/dashboard/settings/notifications");

    for (const label of TOGGLE_LABELS) {
      await expect(seekerPage.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("a toggle can be flipped in the DOM (uncontrolled — no API)", async ({
    seekerPage,
  }) => {
    await seekerPage.goto("/dashboard/settings/notifications");

    // First toggle in the page = "Daily job digest" (defaultChecked=true).
    const firstCheckbox = seekerPage.locator('input[type="checkbox"]').first();
    await expect(firstCheckbox).toBeChecked();

    // The visible UI toggle is a styled <label> wrapping the checkbox.
    // Clicking the label toggles the checkbox in the DOM. The page does not
    // wire any change handler, so we only assert the DOM-level flip.
    await firstCheckbox.click({ force: true });
    await expect(firstCheckbox).not.toBeChecked();
  });

  test.fixme(
    "save persists across reload (TODO:BUG #4 — no onChange, no PUT route, no persistence; toggle the checkbox, reload, expect same state)",
    async ({ seekerPage }) => {
      // Future shape, when persistence ships:
      //   const labelText = "Weekly analytics";
      //   await seekerPage.goto("/dashboard/settings/notifications");
      //   const target = seekerPage.locator('input[type="checkbox"]').nth(3);
      //   await target.click();
      //   await seekerPage.reload();
      //   await expect(target).toBeChecked(); // or not, depending on default
      void seekerPage;
    },
  );
});
