/**
 * auth/invalid-credentials.spec.ts
 *
 * Negative paths through /login that don't fit cleanly into the seeker- or
 * employer-specific files: client-side zod validation and wrong-password.
 *
 * Verified against src/components/auth/login-form.tsx:
 *   - loginSchema = { email: email(), password: min(8) } — react-hook-form +
 *     zodResolver renders inline `<p class="text-xs text-destructive">…</p>`
 *     beneath each field on validation failure.
 *   - On a malformed input the client never POSTs to /api/auth/callback/…
 *
 * Verified against src/lib/auth.ts:
 *   - authorize() returns null on (a) zod parse failure, (b) email not found,
 *     (c) bcrypt mismatch, (d) role mismatch. The form maps null → the
 *     generic "Invalid email or password" copy for the seeker tab.
 *
 * Coverage (4 tests):
 *   ❌ malformed email          → client zod error, no network call
 *   ❌ short password (<8 chars) → client zod error, no network call
 *   ❌ both fields empty         → both zod errors render
 *   ❌ valid format + wrong pw   → server returns null → "Invalid email or password"
 */

import { test, expect } from "../support/fixtures";
import { getSession } from "../support/helpers/auth";

const INVALID_CREDS_ERROR = /Invalid email or password/i;

test.describe("Login — invalid credentials & client validation", () => {
  test("malformed email shows the inline zod error and does not hit the API", async ({
    page,
  }) => {
    let calledCredentials = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/callback/credentials")) calledCredentials = true;
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("longenoughpw");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
    expect(calledCredentials, "credentials POST must not fire on client-side zod fail").toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test("password shorter than 8 characters shows the inline zod error", async ({
    page,
  }) => {
    let calledCredentials = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/callback/credentials")) calledCredentials = true;
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    expect(calledCredentials).toBe(false);
  });

  test("submitting with both fields empty surfaces both zod errors", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid format but wrong password → generic invalid-credentials error", async ({
    page,
    ephemeralSeeker,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ephemeralSeeker.email);
    await page.getByLabel("Password").fill("definitely_not_the_real_password");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(INVALID_CREDS_ERROR)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    const session = await getSession(page);
    expect(session).toBeNull();
  });
});
