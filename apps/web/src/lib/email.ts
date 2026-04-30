/**
 * lib/email.ts
 *
 * Centralised email-sending wrapper. Two delivery modes:
 *
 *   1. Production / dev: Resend → real inbox (when RESEND_API_KEY is set)
 *   2. Test mode (NEXTAUTH_TEST_MODE=true): forks to /api/test/email-sink
 *      so E2E tests can assert on the captured payload. The real Resend
 *      call is skipped — we never want test runs hitting real recipients.
 *
 * Always log a single line per send so dev workflows without an API key
 * can grab links from the console.
 */

import { Resend } from "resend";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  /**
   * Optional template label captured by the email-sink for assertion
   * convenience (e.g., "password-reset", "interview-invite").
   */
  template?: string;
  /**
   * Override the default From address. Defaults to EMAIL_FROM env var,
   * or "FitVector <noreply@fitvector.pro>" if neither is set.
   */
  from?: string;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM ?? "FitVector <noreply@fitvector.pro>";

function isTestMode(): boolean {
  return process.env.NEXTAUTH_TEST_MODE === "true";
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}

/**
 * Sends an email. In test mode, forks to the email-sink endpoint instead
 * of calling Resend. Returns true if the send was attempted (regardless of
 * provider response — the caller should not block UX on email delivery).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const from = payload.from ?? DEFAULT_FROM;

  if (isTestMode()) {
    // Test-mode fork: capture only, never hit Resend. The sink is mounted
    // at /api/test/email-sink and gated by the same NEXTAUTH_TEST_MODE flag.
    try {
      await fetch(`${appBaseUrl()}/api/test/email-sink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: payload.to,
          from,
          subject: payload.subject,
          body: payload.html,
          template: payload.template,
        }),
      });
      return true;
    } catch (err) {
      console.error("[email] test-sink fork failed:", err);
      return false;
    }
  }

  // Real-mode send. If no API key is configured (e.g., local dev without
  // .env.local), log the payload and return — the route still completes.
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[email] No RESEND_API_KEY set — would have sent to ${payload.to}: ${payload.subject}`,
    );
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    return true;
  } catch (err) {
    console.error("[email] Resend send failed:", err);
    return false;
  }
}
