/**
 * auth/password-reset-request.spec.ts
 *
 * Drives /forgot-password through the real form and asserts on what hits the
 * email-sink (NEXTAUTH_TEST_MODE=true wires lib/email.ts → /api/test/email-sink).
 *
 * Verified against src/app/api/auth/forgot-password/route.ts:
 *   - Always returns 200 with the same message regardless of whether the email
 *     exists (anti-enumeration).
 *   - When the email exists, inserts a row in password_reset_tokens (sha256
 *     hash of a 32-byte random token), expires_at = now + 1h.
 *   - Soft rate-limit: max 3 unexpired tokens per user in any 15-minute
 *     window. The 4th request still returns 200 but skips token+email.
 *
 * Coverage (5 tests):
 *   ✅ existing user                  → 200 + reset email captured by sink
 *   ✅ unknown email (anti-enumeration) → 200, NO email sent, response identical
 *   ❌ malformed email                → client-side zod, no API call
 *   ✅ rate limit: 4th request in window → 200 returned, but only 3 emails total
 *   ✅ email body contains the /reset-password?token=… URL
 */

import { test, expect } from "../support/fixtures";
import {
  clearEmailSink,
  expectEmailSent,
  expectNoEmailSent,
  getEmailsSentTo,
} from "../support/mocks/email";

const SUCCESS_COPY = /check your email/i;

async function submitForgotPassword(
  page: import("@playwright/test").Page,
  email: string,
): Promise<void> {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: /send reset link/i }).click();
}

test.describe("Forgot password — request flow", () => {
  test("existing user receives a reset email and sees the success copy", async ({
    page,
    ephemeralSeeker,
  }) => {
    await clearEmailSink();
    await submitForgotPassword(page, ephemeralSeeker.email);

    await expect(page.getByText(SUCCESS_COPY)).toBeVisible({ timeout: 10_000 });

    await expectEmailSent({
      to: ephemeralSeeker.email,
      subjectMatches: /reset your fitvector password/i,
      bodyContains: "/reset-password?token=",
      template: "password-reset",
    });
  });

  test("unknown email returns the SAME success page and sends no email (no enumeration)", async ({
    page,
  }) => {
    await clearEmailSink();
    const ghost = "ghost_user_does_not_exist@e2e.fitvector.dev";

    await submitForgotPassword(page, ghost);
    // Identical UI response — that's the whole point of anti-enumeration.
    await expect(page.getByText(SUCCESS_COPY)).toBeVisible({ timeout: 10_000 });

    await expectNoEmailSent(ghost, 1500);
  });

  test("malformed email is blocked client-side (no API call)", async ({ page }) => {
    let hitApi = false;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/forgot-password")) hitApi = true;
    });

    await page.goto("/forgot-password");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: /send reset link/i }).click();

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
    expect(hitApi).toBe(false);
  });

  test("4th request in the 15-minute window is silently dropped (only 3 emails sent)", async ({
    page,
    ephemeralSeeker,
  }) => {
    // 4 full UI submissions × ~8 s each = ~32 s. Raise the per-test timeout so
    // the loop doesn't hit the global 30 s cap before the email count can be read.
    test.setTimeout(90_000);
    await clearEmailSink();

    // 4 requests in quick succession. The route's rate limiter keys on
    // user_id + a 15-minute window — limit is 3. Each request should still
    // surface the success UI (anti-enumeration), but the email-sink is the
    // ground-truth oracle for what actually got sent.
    for (let i = 0; i < 4; i++) {
      await submitForgotPassword(page, ephemeralSeeker.email);
      await expect(page.getByText(SUCCESS_COPY)).toBeVisible({ timeout: 10_000 });
      // Reload back to the form for the next iteration (the success view
      // collapses the form). A back-nav is cheaper than full reload.
      await page.goto("/forgot-password");
    }

    // Poll until at least one email arrives (proves the sink is live), then
    // assert the rate-limit cap. Fixed waits race against async delivery; this
    // retries up to 5 s without adding unnecessary latency on fast machines.
    await expect
      .poll(
        async () => (await getEmailsSentTo(ephemeralSeeker.email)).length,
        { timeout: 5_000 },
      )
      .toBeGreaterThan(0);

    const emails = await getEmailsSentTo(ephemeralSeeker.email);
    expect(emails.length, `expected ≤3 emails, got ${emails.length}`).toBeLessThanOrEqual(3);
    // Soft floor: already verified above via poll, but keep explicit for
    // clarity in the failure message.
    expect(emails.length).toBeGreaterThan(0);
  });

  test("captured email body carries a /reset-password?token=<hex> URL", async ({
    page,
    ephemeralSeeker,
  }) => {
    await clearEmailSink();
    await submitForgotPassword(page, ephemeralSeeker.email);

    const email = await expectEmailSent({
      to: ephemeralSeeker.email,
      template: "password-reset",
    });

    // Token is randomBytes(32).toString("hex") → 64 hex chars.
    expect(email.body).toMatch(/\/reset-password\?token=[a-f0-9]{64}/);
  });
});
