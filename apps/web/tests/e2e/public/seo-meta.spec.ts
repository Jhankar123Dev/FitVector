/**
 * public/seo-meta.spec.ts
 *
 * Verifies the SEO basics on public pages. We don't have a Next.js metadata
 * audit tool wired, so we check the rendered <head> directly.
 *
 * Coverage (4 tests):
 *   ✅ landing has a non-empty <title>
 *   ✅ landing has an og:title meta tag
 *   ⚠ test.fixme — pricing canonical URL (pricing is a #anchor, not its own
 *      route, so a separate canonical URL doesn't apply yet)
 *   ⚠ test.fixme — /login has noindex (currently NOT configured in metadata —
 *      tracked separately as a follow-up; leaving as a fixme so it surfaces
 *      when the fix lands)
 */

import { test, expect } from "../support/fixtures";

test.describe("Public SEO meta tags", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("landing page has a non-empty <title>", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.trim().length, "expected a non-empty <title>").toBeGreaterThan(0);
    // FitVector branding should appear somewhere in the title (defensive against
    // the title getting accidentally cleared in a metadata refactor).
    expect(title).toMatch(/fitvector/i);
  });

  test("landing page has an og:title meta tag", async ({ page }) => {
    await page.goto("/");
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .first()
      .getAttribute("content");
    expect(ogTitle, "expected og:title meta to be set").toBeTruthy();
    expect(ogTitle!.length).toBeGreaterThan(0);
  });

  test.fixme(
    "pricing has a canonical URL (BLOCKED: pricing is /#pricing anchor, not a separate route — revisit if /pricing route ever ships)",
    async ({ page }) => {
      await page.goto("/pricing");
      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute("href");
      expect(canonical).toMatch(/\/pricing$/);
    },
  );

  test.fixme(
    "/login has a noindex meta tag (TODO: not currently configured in metadata; add to (auth)/login/page.tsx)",
    async ({ page }) => {
      await page.goto("/login");
      const robots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute("content");
      expect(robots).toMatch(/noindex/i);
    },
  );
});
