/**
 * auth/session-cookies.spec.ts
 *
 * Verifies that NextAuth sets the session cookie correctly on credentials
 * login, that the session payload carries our custom JWT claims, and that
 * sign-out clears the cookie.
 *
 * Verified against src/lib/auth.ts:
 *   - session.strategy = "jwt" → cookie value is a JWT, not a DB session id.
 *   - session.user contains { id, email, role, planTier, onboardingCompleted,
 *     companyId } via the session() callback.
 *
 * NextAuth v5 cookie naming:
 *   - dev (http)   → `authjs.session-token`        (v5 default)
 *                  → `next-auth.session-token`     (v4 legacy fallback)
 *   - prod (https) → `__Secure-authjs.session-token`
 *
 * Coverage (3 tests):
 *   ✅ session-token cookie exists with httpOnly=true after login
 *   ✅ /api/auth/session returns the full custom payload (id, role, planTier, …)
 *   ❌ after clearing cookies, /api/auth/session has no user
 */

import { test, expect } from "../support/fixtures";
import { signInAs, signOut, getSession } from "../support/helpers/auth";

const SESSION_COOKIE_PATTERN = /^(?:__Secure-)?(?:authjs|next-auth)\.session-token$/;

test.describe("Session cookies & JWT claims", () => {
  // Each test starts cookie-free so we know any cookie observed comes from
  // the action under test.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("session-token cookie is set with httpOnly after credentials login", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => SESSION_COOKIE_PATTERN.test(c.name));
    expect(
      sessionCookie,
      `expected a (__Secure-)?(authjs|next-auth).session-token cookie. Got: ${cookies.map((c) => c.name).join(", ")}`,
    ).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.value.length).toBeGreaterThan(20);
  });

  test("session payload carries the full custom JWT claims", async ({
    page,
    ephemeralSeeker,
  }) => {
    await signInAs(page.context(), ephemeralSeeker);

    const sessionRes = await page.request.get("/api/auth/session");
    const session = (await sessionRes.json()) as {
      user?: {
        id?: string;
        email?: string;
        role?: string;
        planTier?: string;
        onboardingCompleted?: boolean;
        companyId?: string | null;
      };
    };

    expect(session?.user?.id).toBe(ephemeralSeeker.id);
    expect(session?.user?.email).toBe(ephemeralSeeker.email);
    expect(session?.user?.role).toBe("seeker");
    expect(session?.user?.planTier).toBe("free");
    expect(session?.user?.onboardingCompleted).toBe(false);
    // Seekers always have companyId=null per the jwt callback.
    expect(session?.user?.companyId ?? null).toBeNull();
  });

  test("clearing cookies invalidates the session", async ({ page, ephemeralSeeker }) => {
    await signInAs(page.context(), ephemeralSeeker);
    expect(await getSession(page)).not.toBeNull();

    await signOut(page.context());
    expect(await getSession(page)).toBeNull();

    // And a protected route now redirects back to /login.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
