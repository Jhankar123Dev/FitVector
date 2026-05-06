/**
 * auth/employer-login.spec.ts
 *
 * Drives the employer side of the unified /login form.
 *
 * Verified against src/components/auth/login-form.tsx + src/lib/auth.ts:
 *   - One /login page; the "Recruiter" button toggles role state to "employer"
 *     before the credentials submit. The role string is sent alongside email/
 *     password to the credentials provider.
 *   - The credentials authorize() callback rejects when DB role !== posted role
 *     (except for superadmins). That's how seeker-creds + Recruiter-tab fails.
 *   - On success, the form's onSubmit reads session.user.role and redirects:
 *     "employer" → /employer (or /employer/onboarding if not completed).
 *
 * Coverage (4 tests):
 *   ✅ valid employer creds + Recruiter tab → /employer/onboarding (default
 *      ephemeralEmployer is onboarding_completed=false on the user row, but
 *      the company-membership-aware redirect lands on /employer regardless;
 *      we only assert that we left /login and reached an /employer/* path)
 *   ❌ valid employer creds + Job Seeker tab (default) → recruiter-mismatch error
 *   ❌ valid seeker creds + Recruiter tab           → recruiter-mismatch error
 *   ✅ session payload after login carries role=employer and a companyId
 */

import { test, expect } from "../support/fixtures";
import { getSession } from "../support/helpers/auth";

const RECRUITER_NOT_FOUND = /No recruiter account found with these credentials/i;

async function clickRecruiterTab(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: "Recruiter", exact: true }).click();
}

async function fillCreds(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
}

test.describe("Employer login (UI form)", () => {
  test("valid employer creds + Recruiter tab lands on an /employer/* page", async ({
    page,
    ephemeralEmployer,
  }) => {
    await page.goto("/login");
    await clickRecruiterTab(page);
    await fillCreds(page, ephemeralEmployer.user.email, ephemeralEmployer.user.password);

    await expect(page).toHaveURL(/\/employer/, { timeout: 20_000 });

    const session = await getSession(page);
    expect(session?.user.role).toBe("employer");
    expect(session?.user.email).toBe(ephemeralEmployer.user.email);
  });

  test("employer creds without flipping to Recruiter tab → recruiter-mismatch error", async ({
    page,
    ephemeralEmployer,
  }) => {
    // Default tab is "Job Seeker" — the form posts role=seeker, the authorize()
    // callback rejects because the DB row says employer. On the seeker tab the
    // form shows the seeker-specific error copy (not the employer-tab copy).
    await page.goto("/login");
    await fillCreds(page, ephemeralEmployer.user.email, ephemeralEmployer.user.password);

    await expect(
      page.getByText(/Invalid email or password/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    const session = await getSession(page);
    expect(session).toBeNull();
  });

  test("seeker creds + Recruiter tab → recruiter-mismatch error (no role-leak)", async ({
    page,
    ephemeralSeeker,
  }) => {
    await page.goto("/login");
    await clickRecruiterTab(page);
    await fillCreds(page, ephemeralSeeker.email, ephemeralSeeker.password);

    await expect(page.getByText(RECRUITER_NOT_FOUND)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    const session = await getSession(page);
    expect(session).toBeNull();
  });

  test("post-login session carries role=employer and a non-null companyId", async ({
    page,
    ephemeralEmployer,
  }) => {
    await page.goto("/login");
    await clickRecruiterTab(page);
    await fillCreds(page, ephemeralEmployer.user.email, ephemeralEmployer.user.password);

    await expect(page).toHaveURL(/\/employer/, { timeout: 20_000 });

    // jwt() callback fetches an active company_members row on initial sign-in
    // and stamps token.companyId — proves the membership chain is intact.
    const sessionRes = await page.request.get("/api/auth/session");
    const session = (await sessionRes.json()) as {
      user?: { role?: string; companyId?: string | null; email?: string };
    };
    expect(session?.user?.role).toBe("employer");
    expect(session?.user?.companyId).toBe(ephemeralEmployer.company.id);
  });
});
