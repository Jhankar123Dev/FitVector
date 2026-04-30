/**
 * support/helpers/auth.ts
 *
 * Programmatic NextAuth credential sign-in for ephemeral users.
 *
 * The persistent seed accounts get cookies pre-baked into storageState files
 * by the `setup/<role>.setup.ts` projects. Ephemeral users (created via
 * `createTestUser`) need to sign in at runtime — that's what this is for.
 *
 * Flow mirrors the seeker.setup.ts pattern (verified working 3/3 in prod):
 *   1. GET  /api/auth/csrf                  → grab csrfToken
 *   2. POST /api/auth/callback/credentials  → sign in, sets session cookie
 *   3. GET  /api/auth/session               → verify the session was created
 */

import type { Page, BrowserContext } from "@playwright/test";
import type { TestUser } from "./db-helpers";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export interface SignInOptions {
  /**
   * Override the role sent to the credentials provider. Defaults to the
   * user's `role` field. Useful when you want to drive the login as
   * "employer" but the user row says "seeker" (negative-test scenarios).
   */
  asRole?: "seeker" | "employer";
  /**
   * URL to land on after sign-in completes. Default: /dashboard.
   */
  callbackUrl?: string;
}

/**
 * Signs in as the given user and verifies the session cookie was issued.
 * Use the `Page` overload most of the time — it shares a context with the
 * test, so subsequent navigations are already authenticated.
 *
 *   const seeker = await createTestUser({ planTier: "pro" });
 *   await signInAs(page, seeker);
 *   await page.goto("/dashboard");  // already authed
 */
export async function signInAs(
  pageOrContext: Page | BrowserContext,
  user: TestUser,
  options: SignInOptions = {},
): Promise<void> {
  const request =
    "request" in pageOrContext ? pageOrContext.request : pageOrContext.request;

  const role = options.asRole ?? (user.role === "admin" ? "seeker" : user.role);
  const callbackUrl = options.callbackUrl ?? `${BASE_URL}/dashboard`;

  // Step 1 — CSRF token. NextAuth requires this on the credentials callback.
  const csrfRes = await request.get(`${BASE_URL}/api/auth/csrf`);
  if (!csrfRes.ok()) {
    throw new Error(
      `signInAs: CSRF endpoint returned ${csrfRes.status()}. Is the dev server running at ${BASE_URL}?`,
    );
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // Step 2 — credentials login. Form-encoded, json:true sentinel asks
  // NextAuth to respond with JSON instead of redirecting.
  await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email: user.email,
      password: user.password,
      role,
      callbackUrl,
      json: "true",
    },
  });

  // Step 3 — session probe. If the credentials were rejected (wrong
  // password, role mismatch, suspended user) the session JSON has no user
  // field. Fail fast with the exact reason instead of a vague timeout
  // later when a "logged in" page redirects to /login.
  const sessionRes = await request.get(`${BASE_URL}/api/auth/session`);
  const session = (await sessionRes.json()) as {
    user?: { email?: string; role?: string };
  };
  if (!session?.user?.email) {
    throw new Error(
      `signInAs: NextAuth rejected credentials for ${user.email}. ` +
        `Session response: ${JSON.stringify(session)}. ` +
        `Verify auth_provider=credentials and password_hash matches.`,
    );
  }
}

/**
 * Clears all auth cookies for a context. Useful at the start of tests that
 * exercise unauthenticated flows (e.g., asserting a redirect to /login).
 */
export async function signOut(context: BrowserContext): Promise<void> {
  await context.clearCookies();
}

/**
 * Returns the current session payload (or null if signed out). Lightweight
 * way to assert "the user really is logged in" without driving the UI.
 */
export async function getSession(
  pageOrContext: Page | BrowserContext,
): Promise<{ user: { id: string; email: string; role: string } } | null> {
  const request =
    "request" in pageOrContext ? pageOrContext.request : pageOrContext.request;
  const res = await request.get(`${BASE_URL}/api/auth/session`);
  if (!res.ok()) return null;
  const json = (await res.json()) as {
    user?: { id: string; email: string; role: string };
  };
  return json?.user ? { user: json.user } : null;
}
