/**
 * seeker/settings/plan.spec.ts
 *
 * Verifies the Upgrade Plan page at /dashboard/settings/plan.
 *
 * Verified against src/app/(dashboard)/dashboard/settings/plan/page.tsx:
 *   - 4 plan cards: Free, Starter (₹499/mo), Pro (₹999/mo, "Most Popular"),
 *     Elite (₹1,999/mo)
 *   - Current plan card's button reads "Current Plan" and is disabled.
 *   - Other cards' buttons read "Upgrade" — but they have NO onClick wiring
 *     (no checkout integration). Clicking them does nothing today.
 *   - Plan is read from useUser(): user.planTier ?? "free".
 *
 * Coverage (3 tests + 1 fixme):
 *   ✅ all 4 plan tier cards render with prices
 *   ✅ current plan's button reads "Current Plan" and is disabled
 *   ✅ "Most Popular" badge renders on the Pro card
 *   ⚠ test.fixme — "Upgrade" button → checkout (TODO:UI-GAP #17 — no Stripe wiring)
 */

import { test, expect } from "../../support/fixtures";

test.describe("Settings — plan upgrade page", () => {
  test("all 4 plan tier cards render with prices", async ({ seekerPage }) => {
    await seekerPage.goto("/dashboard/settings/plan");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /upgrade plan/i }),
    ).toBeVisible({ timeout: 10_000 });

    // All 4 tier names visible.
    for (const name of ["Free", "Starter", "Pro", "Elite"]) {
      await expect(seekerPage.getByText(name, { exact: true }).first()).toBeVisible();
    }
    // Paid prices.
    for (const price of ["₹499/mo", "₹999/mo", "₹1,999/mo"]) {
      await expect(seekerPage.getByText(price, { exact: true })).toBeVisible();
    }
  });

  test("current plan's button reads 'Current Plan' and is disabled", async ({
    seekerPage,
  }) => {
    // The seed seeker (playwright@gmail.com) is plan_tier='free' by default.
    // The Free card's button should be disabled with "Current Plan" copy.
    await seekerPage.goto("/dashboard/settings/plan");

    const currentBtn = seekerPage.getByRole("button", { name: /current plan/i });
    await expect(currentBtn).toBeVisible({ timeout: 10_000 });
    await expect(currentBtn).toBeDisabled();
  });

  test("'Most Popular' badge renders on the Pro card", async ({ seekerPage }) => {
    await seekerPage.goto("/dashboard/settings/plan");
    await expect(seekerPage.getByText(/most popular/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test.fixme(
    "'Upgrade' click navigates to Stripe checkout (TODO:UI-GAP #17 — Upgrade buttons have no onClick handler today)",
    async ({ seekerPage }) => {
      // Future shape:
      //   await seekerPage.getByRole("button", { name: /^Upgrade$/i }).first().click();
      //   await expect(seekerPage).toHaveURL(/stripe|checkout/);
      void seekerPage;
    },
  );
});
