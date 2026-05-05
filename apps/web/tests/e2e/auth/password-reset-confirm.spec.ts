/**
 * auth/password-reset-confirm.spec.ts
 *
 * Drives /reset-password?token=<rawToken> end-to-end, using the
 * `issuePasswordResetToken` helper to seed tokens directly so we don't have
 * to round-trip through email-sink in every test.
 *
 * Verified against src/app/api/auth/reset-password/route.ts:
 *   - Looks up token_hash = sha256(rawToken) in password_reset_tokens.
 *   - 400 if (a) row missing, (b) used_at != null, (c) expires_at in the past.
 *   - 400 if password.length < 8.
 *   - On success: bcrypt-hashes the new password, updates users.password_hash,
 *     stamps used_at on the token row.
 *
 * Verified against src/components/auth/reset-password-form.tsx:
 *   - Reads ?token= from query string. If missing → "Invalid link" view.
 *   - On success → "Password updated" view + link to /login.
 *
 * Coverage (5 tests):
 *   ✅ valid token → password updated, login works with new password
 *   ❌ expired token → "expired" error message
 *   ❌ already-used token → "already been used" error message
 *   ❌ unknown/garbage token → "invalid or has already been used" error message
 *   ❌ new password shorter than 8 chars → client-side zod, no API call
 */

import { test, expect } from "../support/fixtures";
import {
  issuePasswordResetToken,
  type IssuedPasswordResetToken,
} from "../support/helpers/token";
import { signInAs } from "../support/helpers/auth";

const NEW_PASSWORD = "new_jhankar_pw_456";

async function fillResetForm(
  page: import("@playwright/test").Page,
  password: string,
): Promise<void> {
  await page.getByLabel("New Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm New Password").fill(password);
  await page.getByRole("button", { name: /update password/i }).click();
}

test.describe("Password reset — confirm flow", () => {
  test("valid token updates the password and the user can sign in with it", async ({
    page,
    ephemeralSeeker,
  }) => {
    let issued: IssuedPasswordResetToken | undefined;
    try {
      issued = await issuePasswordResetToken(ephemeralSeeker.id);

      await page.goto(`/reset-password?token=${issued.rawToken}`);
      await fillResetForm(page, NEW_PASSWORD);

      await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 30_000 });

      // The new password works — proves the bcrypt update actually landed.
      await signInAs(page.context(), {
        ...ephemeralSeeker,
        password: NEW_PASSWORD,
      });
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("expired token surfaces the expired-link error", async ({
    page,
    ephemeralSeeker,
  }) => {
    let issued: IssuedPasswordResetToken | undefined;
    try {
      // -3600s = expired one hour ago.
      issued = await issuePasswordResetToken(ephemeralSeeker.id, {
        expiresInSeconds: -3600,
      });

      await page.goto(`/reset-password?token=${issued.rawToken}`);
      await fillResetForm(page, NEW_PASSWORD);

      await expect(
        page.getByText(/this reset link has expired/i),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("already-used token cannot be replayed", async ({ page, ephemeralSeeker }) => {
    let issued: IssuedPasswordResetToken | undefined;
    try {
      issued = await issuePasswordResetToken(ephemeralSeeker.id, {
        usedAt: new Date(Date.now() - 60_000), // used 1 minute ago
      });

      await page.goto(`/reset-password?token=${issued.rawToken}`);
      await fillResetForm(page, NEW_PASSWORD);

      await expect(
        page.getByText(/already been used/i),
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("unknown/garbage token shows the invalid-link error", async ({ page }) => {
    // 64 hex chars to match the production token shape — guarantees we exercise
    // the lookup miss branch, not a request-shape rejection.
    const garbage = "deadbeef".repeat(8);

    await page.goto(`/reset-password?token=${garbage}`);
    await fillResetForm(page, NEW_PASSWORD);

    await expect(
      page.getByText(/invalid or has already been used/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("new password shorter than 8 chars is blocked client-side (no API call)", async ({
    page,
    ephemeralSeeker,
  }) => {
    let issued: IssuedPasswordResetToken | undefined;
    try {
      issued = await issuePasswordResetToken(ephemeralSeeker.id);

      let posted = false;
      page.on("request", (req) => {
        if (req.url().includes("/api/auth/reset-password")) posted = true;
      });

      await page.goto(`/reset-password?token=${issued.rawToken}`);
      await fillResetForm(page, "short");

      await expect(
        page.getByText(/password must be at least 8 characters/i),
      ).toBeVisible();
      expect(posted, "reset-password POST must be blocked by client zod").toBe(false);
    } finally {
      if (issued) await issued.cleanup();
    }
  });
});
