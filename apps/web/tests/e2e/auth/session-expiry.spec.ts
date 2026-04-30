/**
 * auth/session-expiry.spec.ts
 *
 * Verifies the configured session lifetime and the unauthenticated-redirect
 * path that fires once the session is gone.
 *
 * Verified against src/lib/auth.ts:
 *   - session.maxAge = 30 * 24 * 60 * 60   → 30 days
 *   - authorized() callback redirects unauthenticated requests to protected
 *     routes (/dashboard, /onboarding, /employer, /admin) back to /login.
 *
 * We can't fast-forward real wall-clock time in Playwright without breaking
 * the JWT signature, so the "30 day" assertion is on the cookie's expires
 * timestamp and on the session JSON's `expires` field — both derive from the
 * same maxAge. Tampering with maxAge would shift both, which is what we want
 * to catch in regression.
 *
 * Coverage (3 tests):
 *   ✅ /api/auth/session.expires is ≈30 days from now (±1 day tolerance)
 *   ✅ session cookie expires ≈30 days from now (cookie persisted, not session-only)
 *   ❌ deleting the session cookie → /dashboard redirects to /login
 */

import { test, expect } from "../support/fixtures";
import { signInAs } from "../support/helpers/auth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_PATTERN = /^(?:__Secure-)?(?:authjs|next-auth)\.session-token$/;

test.describe("Session lifetime & expiry", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("session JSON .expires lands ~30 days in the future", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const res = await page.request.get("/api/auth/session");
    const session = (await res.json()) as { expires?: string };
    expect(session?.expires).toBeTruthy();

    const expiresAt = new Date(session.expires!).getTime();
    const now = Date.now();
    const delta = Math.abs(expiresAt - (now + THIRTY_DAYS_MS));
    // ±1 day to cover both clock skew and the small gap between issuing the
    // token and reading session.expires.
    expect(delta).toBeLessThan(24 * 60 * 60 * 1000);
  });

  test("session cookie is persisted with a ~30-day expiry (not a session cookie)", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => SESSION_COOKIE_PATTERN.test(c.name));
    expect(sessionCookie, "session-token cookie missing").toBeDefined();

    // Playwright reports cookie.expires as Unix seconds; -1 means "session"
    // (browser-close), which would mean we lose the user on tab close — wrong.
    expect(sessionCookie!.expires).toBeGreaterThan(0);

    const expiresMs = sessionCookie!.expires * 1000;
    const delta = Math.abs(expiresMs - (Date.now() + THIRTY_DAYS_MS));
    expect(delta).toBeLessThan(24 * 60 * 60 * 1000);
  });

  test("deleting the session cookie redirects /dashboard requests to /login", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    // Surgically drop ONLY the session-token cookie — keep csrf/callback-url
    // cookies in place to mimic a "session expired in place" scenario rather
    // than a full logout.
    const before = await page.context().cookies();
    const keep = before.filter((c) => !SESSION_COOKIE_PATTERN.test(c.name));
    await page.context().clearCookies();
    if (keep.length > 0) {
      await page.context().addCookies(
        keep.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          expires: c.expires,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite,
        })),
      );
    }

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
