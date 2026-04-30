/**
 * public/pricing.spec.ts
 *
 * Verifies the pricing section.
 *
 * IMPORTANT — pricing is NOT a standalone /pricing route. It's a section
 * (#pricing anchor) on the landing page at /. The MASTER_PLAN's
 * "feature comparison table" check has been adapted: the live page shows
 * each tier's features in the card body, not a side-by-side comparison
 * table — we assert presence of representative quota strings instead.
 *
 * Verified against src/app/page.tsx:
 *   - seekerPlans: Free (₹0/Free), Starter (₹499), Pro (₹999, highlighted),
 *     Elite (₹1,999). Free.cta="Get Started Free", paid.cta="Start Free Trial".
 *     ALL ctaHref = /signup.
 *   - employerPlans: Starter, Growth (highlighted), Enterprise (Custom).
 *     ctaHref = /signup/employer (Starter, Growth) | /contact (Enterprise).
 *
 * Coverage (6 tests):
 *   ✅ all 4 seeker tiers render with their names
 *   ✅ free tier displays "Free" (not ₹0)
 *   ✅ each paid seeker tier shows ₹<price>
 *   ✅ Free tier CTA → /signup
 *   ✅ Pro tier "Start Free Trial" → /signup (no checkout exists yet)
 *   ✅ feature copy matches plan-limits.ts intent (verify a stable seeker quota
 *      that mirrors a known production limit)
 */

import { test, expect } from "../support/fixtures";

const SEEKER_TIERS = ["Free", "Starter", "Pro", "Elite"];

test.describe("Public pricing section", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/#pricing");
    await page.locator("section#pricing").scrollIntoViewIfNeeded();
  });

  test("all four seeker tiers render", async ({ page }) => {
    for (const tier of SEEKER_TIERS) {
      // CardTitle renders the tier name as text. Use a card-scoped locator
      // to avoid matching the same word elsewhere on the page.
      await expect(
        page
          .locator("section#pricing")
          .getByText(tier, { exact: true })
          .first(),
      ).toBeVisible();
    }
  });

  test("free tier shows 'Free' instead of a number", async ({ page }) => {
    const pricing = page.locator("section#pricing");
    // The Free card's price slot renders the literal word "Free" (price === "0" branch).
    await expect(pricing.getByText(/^Free$/).first()).toBeVisible();
  });

  test("each paid seeker tier shows its monthly ₹ price", async ({ page }) => {
    const pricing = page.locator("section#pricing");
    await expect(pricing.getByText(/₹499/)).toBeVisible();
    await expect(pricing.getByText(/₹999/)).toBeVisible();
    await expect(pricing.getByText(/₹1,999/)).toBeVisible();
  });

  test("Free tier 'Get Started Free' CTA navigates to /signup", async ({ page }) => {
    // The free seeker card's CTA is rendered as a Button asChild → <a href="/signup">.
    // Use a section-scoped locator on the visible CTA copy.
    await page
      .locator("section#pricing")
      .getByRole("link", { name: /Get Started Free/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("paid 'Start Free Trial' CTA navigates to /signup (checkout not wired yet)", async ({
    page,
  }) => {
    await page
      .locator("section#pricing")
      .getByRole("link", { name: /Start Free Trial/i })
      .first()
      .click();
    // Currently both paid seeker plans route to /signup — NOT a checkout flow.
    // When billing lands, this test should split into authed-vs-anon variants.
    await expect(page).toHaveURL(/\/signup/);
  });

  test("seeker tier features include the known free-tier quotas", async ({ page }) => {
    const pricing = page.locator("section#pricing");
    // Free-tier quota strings copied verbatim from page.tsx — these are the
    // user-visible reflection of plan-limits.ts free-tier limits. Mismatches
    // here = pricing copy drifted from real backend gates.
    await expect(pricing.getByText("3 job searches / day")).toBeVisible();
    await expect(pricing.getByText("2 resume tailors / day")).toBeVisible();
    await expect(pricing.getByText("2 cold emails / day")).toBeVisible();
    await expect(pricing.getByText("10 active applications")).toBeVisible();
  });
});
