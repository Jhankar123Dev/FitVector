/**
 * auth/seeker-login.spec.ts
 *
 * Drives the seeker login flow through the real UI form at /login.
 *
 * No storageState (the `auth` Playwright project has no setup dependency)
 * — every test starts in a clean browser context. Ephemeral users are
 * created in the DB via the `ephemeralSeeker` fixture and torn down
 * after the test.
 *
 * Coverage (5 tests, per MASTER_PLAN.md §7):
 *   ✅ valid credentials → /dashboard
 *   ✅ onboarding_completed=false → redirected to /onboarding
 *   ✅ onboarding_completed=true → lands on /dashboard
 *   ❌ wrong password → generic invalid-credentials error
 *   ❌ unknown email → same generic error (no enumeration)
 */

import { test, expect } from "../support/fixtures";
import { getSession } from "../support/helpers/auth";
import { getAdminClient } from "../support/helpers/db-helpers";

// The login form copy: "Invalid email or password. If you signed up as
// a Recruiter, switch to the Recruiter tab." — match the prefix only,
// the helper-tail evolves with copy edits.
const INVALID_CREDS_ERROR = /Invalid email or password/i;

/**
 * Marks an ephemeral seeker as fully onboarded so they bypass the
 * /onboarding redirect. Returns nothing — fails the test on DB error.
 */
async function markOnboardingComplete(userId: string): Promise<void> {
  const { error } = await getAdminClient()
    .from("users")
    .update({ onboarding_completed: true, status: "active" })
    .eq("id", userId);
  if (error) throw new Error(`markOnboardingComplete failed: ${error.message}`);
}

/**
 * Drives the login form. Selectors verified against
 * src/components/auth/login-form.tsx.
 */
async function fillLoginForm(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("Seeker login (UI form)", () => {
  test("valid credentials lands a fully-onboarded seeker on /dashboard", async ({
    page,
    ephemeralSeeker,
  }) => {
    await markOnboardingComplete(ephemeralSeeker.id);

    await fillLoginForm(page, ephemeralSeeker.email, ephemeralSeeker.password);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

    const session = await getSession(page);
    expect(session?.user.email).toBe(ephemeralSeeker.email);
    expect(session?.user.role).toBe("seeker");
  });

  test("onboarding_completed=false routes the seeker to /onboarding", async ({
    page,
    ephemeralSeeker,
  }) => {
    // Default ephemeralSeeker is onboarding_completed=false, status='onboarding'.
    await fillLoginForm(page, ephemeralSeeker.email, ephemeralSeeker.password);

    // Middleware may route either directly to /onboarding or via /dashboard.
    // Wait for the URL to settle on /onboarding regardless of intermediate hops.
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test("onboarding_completed=true bypasses /onboarding entirely", async ({
    page,
    ephemeralSeeker,
  }) => {
    await markOnboardingComplete(ephemeralSeeker.id);

    await fillLoginForm(page, ephemeralSeeker.email, ephemeralSeeker.password);

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/onboarding/);
  });

  test("wrong password shows the generic invalid-credentials error", async ({
    page,
    ephemeralSeeker,
  }) => {
    await fillLoginForm(page, ephemeralSeeker.email, "definitely_not_the_real_password");

    await expect(page.getByText(INVALID_CREDS_ERROR)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    const session = await getSession(page);
    expect(session).toBeNull();
  });

  test("unknown email returns the SAME generic error (no enumeration)", async ({ page }) => {
    await fillLoginForm(page, "does_not_exist_test@example.invalid", "anything12345");

    await expect(page.getByText(INVALID_CREDS_ERROR)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
