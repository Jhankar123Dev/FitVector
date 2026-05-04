/**
 * auth/signup-validation.spec.ts
 *
 * Pure client-side validation coverage for <SignupForm />. These tests run
 * against /signup (defaultRole=seeker) — the schema is identical for the
 * employer variant, so we don't double-cover at /signup/employer.
 *
 * signupSchema (src/components/auth/signup-form.tsx):
 *   name:            string min(2)
 *   email:           string email()
 *   password:        string min(8)
 *   confirmPassword: refine(password === confirmPassword) — message at confirmPassword
 *
 * react-hook-form + zodResolver renders the message in a
 * <p class="text-xs text-destructive">…</p> right under the offending field.
 * Submission is blocked client-side, so /api/auth/signup never gets called.
 *
 * Coverage (5 tests):
 *   ❌ name shorter than 2 chars        → "Name must be at least 2 characters"
 *   ❌ malformed email                  → "Please enter a valid email address"
 *   ❌ password shorter than 8 chars    → "Password must be at least 8 characters"
 *   ❌ confirmPassword mismatch         → "Passwords don't match"
 *   ✅ all fields valid                 → form submits (positive control)
 */

import { test, expect } from "../support/fixtures";
import { TEST_PREFIX, deleteTestUser, getAdminClient } from "../support/helpers/db-helpers";
import { randomUUID } from "node:crypto";

function uniqueEmail(): string {
  return `${TEST_PREFIX}validate_${randomUUID().slice(0, 8)}@e2e.fitvector.dev`;
}

async function expectNoSignupCall(
  page: import("@playwright/test").Page,
  action: () => Promise<void>,
): Promise<void> {
  let posted = false;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/api/auth/signup")) posted = true;
  });
  await action();
  expect(posted, "signup POST must be blocked when client validation fails").toBe(false);
}

test.describe("Signup — client-side validation", () => {
  test("name shorter than 2 characters → name zod error", async ({ page }) => {
    await page.goto("/signup");
    await expectNoSignupCall(page, async () => {
      await page.getByLabel("Full Name").fill("J");
      await page.getByLabel("Email", { exact: true }).fill(uniqueEmail());
      await page.getByLabel("Password", { exact: true }).fill("longenoughpw");
      await page.getByLabel("Confirm Password").fill("longenoughpw");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible();
    });
  });

  test("malformed email → email zod error", async ({ page }) => {
    await page.goto("/signup");
    await expectNoSignupCall(page, async () => {
      await page.getByLabel("Full Name").fill("Ada Lovelace");
      await page.getByLabel("Email", { exact: true }).fill("not-an-email");
      await page.getByLabel("Password", { exact: true }).fill("longenoughpw");
      await page.getByLabel("Confirm Password").fill("longenoughpw");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
    });
  });

  test("password shorter than 8 characters → password zod error", async ({ page }) => {
    await page.goto("/signup");
    await expectNoSignupCall(page, async () => {
      await page.getByLabel("Full Name").fill("Ada Lovelace");
      await page.getByLabel("Email", { exact: true }).fill(uniqueEmail());
      await page.getByLabel("Password", { exact: true }).fill("short");
      await page.getByLabel("Confirm Password").fill("short");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });
  });

  test("confirmPassword mismatch → 'Passwords don't match' on the confirm field", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expectNoSignupCall(page, async () => {
      await page.getByLabel("Full Name").fill("Ada Lovelace");
      await page.getByLabel("Email", { exact: true }).fill(uniqueEmail());
      await page.getByLabel("Password", { exact: true }).fill("longenoughpw");
      await page.getByLabel("Confirm Password").fill("differentpw123");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/passwords don.?t match/i)).toBeVisible();
    });
  });

  test("all fields valid → form submits and account is created (positive control)", async ({
    page,
  }) => {
    const email = uniqueEmail();
    let createdUserId: string | undefined;

    try {
      await page.goto("/signup");
      await page.getByLabel("Full Name").fill("Valid User");
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).fill("longenoughpw");
      await page.getByLabel("Confirm Password").fill("longenoughpw");
      await page.getByRole("button", { name: /create account/i }).click();

      await page.waitForURL("**/onboarding", { timeout: 20_000 });
      await expect(page).toHaveURL(/\/onboarding/);

      const supabase = getAdminClient();
      const { data } = await supabase.from("users").select("id").eq("email", email).single();
      createdUserId = data?.id as string | undefined;
      expect(createdUserId).toBeTruthy();
    } finally {
      if (createdUserId) await deleteTestUser(createdUserId);
    }
  });
});
