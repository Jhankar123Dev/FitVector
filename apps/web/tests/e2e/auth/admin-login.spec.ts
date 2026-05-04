/**
 * auth/admin-login.spec.ts
 *
 * Drives the superadmin login through the unified /login form.
 *
 * Why we don't use an ephemeral admin: the DB role CHECK constraint only
 * permits 'seeker' | 'employer' (per migration 20260330000001), so superadmin
 * status is applied out-of-band. The seed user `superadmin@seed.fitvector.dev`
 * (provisioned by scripts/seed.ts) is the only superadmin in the test
 * database.
 *
 * Verified behavior (src/lib/auth.ts):
 *   - The credentials authorize() callback bypasses the role-toggle check for
 *     superadmins: `if (user.role !== "superadmin" && user.role !== posted)`.
 *     So login works regardless of which UI tab is active.
 *   - On success, the form reads session.user.role and pushes to /admin.
 *   - Middleware (authorized callback) redirects non-superadmins away from
 *     /admin to /dashboard, but superadmins bypass all role checks.
 *
 * Coverage (3 tests):
 *   ✅ default Job Seeker tab + superadmin creds → /admin
 *   ✅ Recruiter tab + superadmin creds          → /admin (toggle bypassed)
 *   ✅ session payload carries role=superadmin
 */

import { test, expect } from "../support/fixtures";
import { getSession } from "../support/helpers/auth";

const SUPERADMIN_EMAIL =
  process.env.PLAYWRIGHT_SUPERADMIN_EMAIL ?? "superadmin@seed.fitvector.dev";
const SUPERADMIN_PASSWORD =
  process.env.PLAYWRIGHT_SUPERADMIN_PASSWORD ?? "jhankar123";

async function fillCreds(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

test.describe("Superadmin login (UI form)", () => {
  // Each test uses a clean context — no storageState — to guarantee we're
  // really exercising the login path, not consuming a cached cookie.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("default tab + superadmin creds → /admin", async ({ page }) => {
    await page.goto("/login");
    await fillCreds(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    await page.waitForURL("**/admin**", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("Recruiter tab + superadmin creds → /admin (toggle bypassed server-side)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Recruiter", exact: true }).click();
    await fillCreds(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

    // The credentials provider ignores the posted role for superadmins, the
    // session callback sees role=superadmin, and the form redirects to /admin.
    await page.waitForURL("**/admin**", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("post-login session carries role=superadmin", async ({ page }) => {
    await page.goto("/login");
    await fillCreds(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
    await page.waitForURL("**/admin**", { timeout: 20_000 });

    const session = await getSession(page);
    expect(session?.user.email).toBe(SUPERADMIN_EMAIL);
    expect(session?.user.role).toBe("superadmin");
  });
});
