/**
 * auth/google-oauth-redirect.spec.ts
 *
 * Verifies the Google OAuth entry-point. We can't fully round-trip through
 * Google in CI without breaking determinism, so we only assert the kickoff:
 * clicking the Google button initiates a NextAuth signIn("google") and
 * either (a) hits /api/auth/signin/google or (b) navigates to a
 * accounts.google.com URL.
 *
 * Verified against src/components/auth/social-buttons.tsx:
 *   - Renders Google + LinkedIn buttons; both call signIn(provider, { callbackUrl }).
 *   - Visible only on the Job Seeker tab (employer signups are credentials-only).
 *
 * Verified against src/lib/auth.ts:
 *   - Google + LinkedIn providers configured.
 *   - signIn callback upserts new OAuth users as role='seeker'; existing
 *     employer rows reject OAuth login.
 *
 * Coverage (2 tests):
 *   ✅ Google button on /login → request fires to /api/auth/signin/google
 *   ✅ Google button on /signup → same kickoff
 *
 * NOTE: We assert on the request, not the final URL, because Google's domain
 * may vary (accounts.google.com vs accounts.google.co.<tld>) and the test
 * shouldn't be coupled to that. We DO want to confirm a redirect was
 * triggered — otherwise a regression that silently no-ops the click goes
 * unnoticed.
 */

import { test, expect } from "../support/fixtures";

test.describe("Google OAuth — redirect kickoff", () => {
  // Anonymous browser context — no storageState — so we exercise the public
  // login/signup paths.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("clicking Google on /login fires a NextAuth signin request", async ({ page }) => {
    await page.goto("/login");

    // Default tab is Job Seeker, so the Google button is visible.
    const signinRequest = page.waitForRequest(
      (req) => req.url().includes("/api/auth/signin/google"),
      { timeout: 10_000 },
    );

    await page.getByRole("button", { name: /^google$/i }).click();
    const req = await signinRequest;
    expect(req.url()).toContain("/api/auth/signin/google");
  });

  test("clicking Google on /signup fires a NextAuth signin request", async ({ page }) => {
    await page.goto("/signup");

    const signinRequest = page.waitForRequest(
      (req) => req.url().includes("/api/auth/signin/google"),
      { timeout: 10_000 },
    );

    await page.getByRole("button", { name: /^google$/i }).click();
    const req = await signinRequest;
    expect(req.url()).toContain("/api/auth/signin/google");
  });
});
