/**
 * auth/employer-signup.spec.ts
 *
 * Drives the employer-side of the unified <SignupForm /> at /signup/employer
 * (which renders <SignupForm defaultRole="employer" />).
 *
 * What the form does (src/components/auth/signup-form.tsx):
 *   1. POST /api/auth/signup/employer with { name, email, password }
 *   2. On 200, auto-signs-in via signIn("credentials", { role: "employer", … })
 *   3. window.location.href = "/employer/onboarding"
 *
 * What the API does (src/app/api/auth/signup/employer/route.ts):
 *   - Inserts users row with role='employer', auth_provider='credentials',
 *     plan_tier='free', status='onboarding', onboarding_completed=false
 *   - Returns 409 if email exists; copy branches on existing row's role:
 *       existing.role === 'seeker'  → "already registered as a job seeker account"
 *       existing.role === 'employer' → "An account with this email already exists"
 *
 * Coverage (4 tests):
 *   ✅ happy path → DB row + redirect to /employer/onboarding
 *   ✅ DB row defaults verified (role/plan/status/onboarding_completed)
 *   ❌ duplicate employer email → 409 + employer-already-exists copy
 *   ❌ duplicate-but-as-seeker email → 409 + already-a-seeker copy
 */

import { test, expect } from "../support/fixtures";
import {
  getAdminClient,
  TEST_PREFIX,
  deleteTestUser,
  createTestUser,
} from "../support/helpers/db-helpers";
import { randomUUID } from "node:crypto";

const PASSWORD = "jhankar123_signup";

function uniqueEmployerEmail(label: string): string {
  return `${TEST_PREFIX}empsignup_${label}_${randomUUID().slice(0, 8)}@e2e.fitvector.dev`;
}

async function fillEmployerSignupForm(
  page: import("@playwright/test").Page,
  opts: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/signup/employer");
  await page.getByLabel("Full Name").fill(opts.name);
  // Employer mode renders the email label as "Work Email", seeker as "Email"
  // — match either with a partial regex that handles both.
  await page.getByLabel(/^(Work )?Email$/i).fill(opts.email);
  await page.getByLabel("Password", { exact: true }).fill(opts.password);
  await page.getByLabel("Confirm Password").fill(opts.password);
  await page.getByRole("button", { name: /create recruiter account/i }).click();
}

test.describe("Employer signup (UI form)", () => {
  test("happy path: creates account, auto-signs-in, redirects to /employer/onboarding", async ({
    page,
  }) => {
    const email = uniqueEmployerEmail("happy");
    let createdUserId: string | undefined;

    try {
      await fillEmployerSignupForm(page, {
        name: "Test Recruiter",
        email,
        password: PASSWORD,
      });

      await page.waitForURL("**/employer/onboarding", { timeout: 20_000 });
      await expect(page).toHaveURL(/\/employer\/onboarding/);

      const sessionRes = await page.request.get("/api/auth/session");
      const session = (await sessionRes.json()) as {
        user?: { email?: string; role?: string };
      };
      expect(session?.user?.email).toBe(email);
      expect(session?.user?.role).toBe("employer");

      const supabase = getAdminClient();
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      createdUserId = data?.id as string | undefined;
    } finally {
      if (createdUserId) await deleteTestUser(createdUserId);
    }
  });

  test("DB row has the correct employer defaults (provider, role, plan, status)", async ({
    page,
  }) => {
    const email = uniqueEmployerEmail("dbcheck");
    let createdUserId: string | undefined;

    try {
      await fillEmployerSignupForm(page, {
        name: "DB Check Recruiter",
        email,
        password: PASSWORD,
      });
      await page.waitForURL("**/employer/onboarding", { timeout: 20_000 });

      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, auth_provider, role, plan_tier, status, onboarding_completed, password_hash")
        .eq("email", email)
        .single();

      expect(error, `DB lookup failed: ${error?.message}`).toBeNull();
      expect(data?.auth_provider).toBe("credentials");
      expect(data?.role).toBe("employer");
      expect(data?.plan_tier).toBe("free");
      expect(data?.status).toBe("onboarding");
      expect(data?.onboarding_completed).toBe(false);
      // Defence-in-depth: same bcrypt cost-10 invariant as seeker signup.
      expect(data?.password_hash as string | undefined).toMatch(/^\$2[aby]\$10\$.{53}$/);

      createdUserId = data?.id as string | undefined;
    } finally {
      if (createdUserId) await deleteTestUser(createdUserId);
    }
  });

  test("duplicate employer email returns 409 with the employer-already-exists copy", async ({
    page,
    ephemeralEmployer,
  }) => {
    await fillEmployerSignupForm(page, {
      name: "Duplicate Recruiter",
      email: ephemeralEmployer.user.email,
      password: PASSWORD,
    });

    await expect(
      page.getByText(/An account with this email already exists/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/signup/);
  });

  test("duplicate-but-as-seeker email shows the already-a-seeker 409 copy", async ({ page }) => {
    const seeker = await createTestUser({
      role: "seeker",
      onboardingCompleted: true,
      status: "active",
    });

    try {
      await fillEmployerSignupForm(page, {
        name: "Crossover Recruiter",
        email: seeker.email,
        password: PASSWORD,
      });

      await expect(
        page.getByText(/already registered as a job seeker account/i),
      ).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/signup/);
    } finally {
      await deleteTestUser(seeker.id);
    }
  });
});
