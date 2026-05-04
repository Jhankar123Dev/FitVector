/**
 * auth/seeker-signup.spec.ts
 *
 * Drives the seeker signup flow through the real UI form at /signup.
 *
 * What the form does (verified against src/components/auth/signup-form.tsx):
 *   1. POST /api/auth/signup with { name, email, password }
 *   2. On 200/201, auto-signs-in via signIn("credentials", …)
 *   3. window.location.href = "/onboarding"
 *
 * What the API does (verified against src/app/api/auth/signup/route.ts):
 *   - Creates row with auth_provider='credentials', role='seeker',
 *     plan_tier='free', status='onboarding', onboarding_completed=false
 *   - Password hashed with bcrypt (cost 10)
 *   - Returns 409 if email is taken (separate copy for seeker vs employer)
 *
 * Coverage (6 tests, per MASTER_PLAN.md §7):
 *   ✅ valid signup → 201 + redirect to /onboarding
 *   ✅ DB row has auth_provider=credentials, role=seeker, plan_tier=free, status=onboarding
 *   ✅ password stored as bcrypt cost-10 hash (never plaintext)
 *   ❌ duplicate seeker email → 409 + "An account with this email already exists"
 *   ❌ duplicate-but-as-employer → 409 + "registered as a recruiter account"
 *   ⚠ test.fixme — welcome email captured by sink (backend not wired yet)
 */

import { test, expect } from "../support/fixtures";
import {
  getAdminClient,
  TEST_PREFIX,
  deleteTestUser,
  createTestUser,
} from "../support/helpers/db-helpers";
import {
  clearEmailSink,
  expectEmailSent,
} from "../support/mocks/email";
import { randomUUID } from "node:crypto";

const PASSWORD = "jhankar123_signup";

function uniqueSignupEmail(label: string): string {
  return `${TEST_PREFIX}signup_${label}_${randomUUID().slice(0, 8)}@e2e.fitvector.dev`;
}

async function fillSignupForm(
  page: import("@playwright/test").Page,
  opts: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Full Name").fill(opts.name);
  await page.getByLabel("Email", { exact: true }).fill(opts.email);
  await page.getByLabel("Password", { exact: true }).fill(opts.password);
  await page.getByLabel("Confirm Password").fill(opts.password);
  await page.getByRole("button", { name: /create account/i }).click();
}

test.describe("Seeker signup (UI form)", () => {
  test("happy path: creates account, auto-signs-in, redirects to /onboarding", async ({ page }) => {
    const email = uniqueSignupEmail("happy");
    let createdUserId: string | undefined;

    try {
      await fillSignupForm(page, {
        name: "Test Signup User",
        email,
        password: PASSWORD,
      });

      // After signup the form auto-logs-in and pushes to /onboarding.
      await page.waitForURL("**/onboarding", { timeout: 20_000 });
      await expect(page).toHaveURL(/\/onboarding/);

      // Confirm the session is real, not a UI-only optimistic redirect.
      const sessionRes = await page.request.get("/api/auth/session");
      const session = (await sessionRes.json()) as {
        user?: { email?: string; role?: string };
      };
      expect(session?.user?.email).toBe(email);

      // Capture the id for cleanup.
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

  test("DB row has the correct seeker defaults (provider, role, plan, status)", async ({ page }) => {
    const email = uniqueSignupEmail("dbcheck");
    let createdUserId: string | undefined;

    try {
      await fillSignupForm(page, {
        name: "DB Check User",
        email,
        password: PASSWORD,
      });
      await page.waitForURL("**/onboarding", { timeout: 20_000 });

      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("id, auth_provider, role, plan_tier, status, onboarding_completed, password_hash")
        .eq("email", email)
        .single();

      expect(error, `DB lookup failed: ${error?.message}`).toBeNull();
      expect(data?.auth_provider).toBe("credentials");
      expect(data?.role).toBe("seeker");
      expect(data?.plan_tier).toBe("free");
      expect(data?.status).toBe("onboarding");
      expect(data?.onboarding_completed).toBe(false);

      createdUserId = data?.id as string | undefined;
    } finally {
      if (createdUserId) await deleteTestUser(createdUserId);
    }
  });

  test("password is stored as a bcrypt cost-10 hash (never plaintext)", async ({ page }) => {
    const email = uniqueSignupEmail("bcrypt");
    let createdUserId: string | undefined;

    try {
      await fillSignupForm(page, {
        name: "Bcrypt Check User",
        email,
        password: PASSWORD,
      });
      await page.waitForURL("**/onboarding", { timeout: 20_000 });

      const supabase = getAdminClient();
      const { data } = await supabase
        .from("users")
        .select("id, password_hash")
        .eq("email", email)
        .single();

      const hash = data?.password_hash as string | undefined;
      expect(hash, "password_hash should be set").toBeTruthy();
      expect(hash, "must not be plaintext").not.toBe(PASSWORD);
      // bcrypt cost-10 format: $2a$10$… or $2b$10$… (60 chars total)
      expect(hash).toMatch(/^\$2[aby]\$10\$.{53}$/);

      createdUserId = data?.id as string | undefined;
    } finally {
      if (createdUserId) await deleteTestUser(createdUserId);
    }
  });

  test("duplicate seeker email returns 409 with the seeker-specific copy", async ({
    page,
    ephemeralSeeker,
  }) => {
    // ephemeralSeeker is already a credentials seeker — try to sign up again
    // with the same email and confirm we get the "already exists" copy.
    await fillSignupForm(page, {
      name: "Duplicate Attempt",
      email: ephemeralSeeker.email,
      password: PASSWORD,
    });

    await expect(
      page.getByText(/An account with this email already exists/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/signup/);
  });

  test("duplicate-but-as-employer email shows the recruiter-specific 409 copy", async ({ page }) => {
    // Pre-seed an employer user with a known email, then try to sign up as
    // a seeker with the same address. API should branch on the existing
    // role and emit the recruiter-specific message.
    const employer = await createTestUser({
      role: "employer",
      onboardingCompleted: true,
      status: "active",
    });

    try {
      await fillSignupForm(page, {
        name: "Crossover Attempt",
        email: employer.email,
        password: PASSWORD,
      });

      await expect(
        page.getByText(/registered as a recruiter account/i),
      ).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/signup/);
    } finally {
      await deleteTestUser(employer.id);
    }
  });

  test.fixme(
    "welcome email captured by email-sink (TODO: backend signup route does not currently send welcome email — wire lib/email.ts in /api/auth/signup)",
    async ({ page }) => {
      const email = uniqueSignupEmail("welcome");
      let createdUserId: string | undefined;

      try {
        await clearEmailSink();
        await fillSignupForm(page, {
          name: "Welcome Email User",
          email,
          password: PASSWORD,
        });
        await page.waitForURL("**/onboarding", { timeout: 20_000 });

        // Once the backend is wired, this should pass without further changes.
        await expectEmailSent({
          to: email,
          subjectMatches: /welcome to fitvector|verify your email/i,
          template: "welcome",
        });

        const supabase = getAdminClient();
        const { data } = await supabase.from("users").select("id").eq("email", email).single();
        createdUserId = data?.id as string | undefined;
      } finally {
        if (createdUserId) await deleteTestUser(createdUserId);
      }
    },
  );
});
