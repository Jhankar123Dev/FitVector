/**
 * public/landing.spec.ts
 *
 * Smoke tests for the marketing landing page at "/".
 *
 * Verified against src/app/page.tsx:
 *   - Hero, "For Job Seekers" (#for-seekers), "For Employers" (#for-employers),
 *     "How It Works", Pricing (#pricing), and Footer all render server-side.
 *   - Multiple "Get Started Free" CTAs that all link to /signup.
 *   - "Sign In" (Button asChild → Link href="/login") in the navbar.
 *
 * No auth required; runs in the `public` Playwright project (no storageState).
 *
 * Coverage (5 tests):
 *   ✅ hero, sections, footer render
 *   ✅ "Get Started Free" CTA → /signup
 *   ✅ "Sign In" → /login
 *   ✅ no critical console errors during initial load
 *   ⚠ test.fixme — basic axe a11y scan (requires @axe-core/playwright)
 */

import { test, expect } from "../support/fixtures";

test.describe("Public landing page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("hero, audience sections, and footer render", async ({ page }) => {
    await page.goto("/");

    // Hero headline — split across <span>s so we match a stable substring.
    await expect(
      page.getByRole("heading", { level: 1, name: /Where AI Connects/i }),
    ).toBeVisible();

    // The two audience-card H2s.
    await expect(page.getByRole("heading", { name: /I'm a Job Seeker/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /I'm an Employer/i })).toBeVisible();

    // Section anchors.
    await expect(page.locator("section#for-seekers")).toBeVisible();
    await expect(page.locator("section#for-employers")).toBeVisible();
    await expect(page.locator("section#pricing")).toBeVisible();

    // Footer (rendered by <Footer />).
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Get Started CTA navigates to /signup", async ({ page }) => {
    await page.goto("/");

    // Click the navbar "Get Started Free" — it's the most stable instance
    // (the in-card "Start Your Job Search" button also goes to /signup but
    // copy varies; use the navbar to keep this stable across copy edits).
    await page.getByRole("link", { name: /^Get Started Free$/ }).first().click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("Sign In in the navbar navigates to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^Sign In$/ }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("landing page emits no critical console errors during load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await page.goto("/", { waitUntil: "networkidle" });

    // Filter known noise: hydration warnings, source-map fetches, dev HMR pings.
    const critical = errors.filter(
      (e) =>
        !/hydration|hmr|source-?map|favicon\.ico|404 \(Not Found\)/i.test(e),
    );
    expect(critical, `unexpected console errors:\n${critical.join("\n")}`).toEqual([]);
  });

  test.fixme(
    "no critical axe a11y violations on landing (TODO: add @axe-core/playwright dep)",
    async ({ page }) => {
      await page.goto("/");
      // When wired:
      //   import AxeBuilder from "@axe-core/playwright";
      //   const results = await new AxeBuilder({ page }).analyze();
      //   expect(results.violations.filter(v => v.impact === "critical")).toHaveLength(0);
    },
  );
});
