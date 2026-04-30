/**
 * support/mocks/email.ts
 *
 * Helpers for asserting on emails captured by the test-only email-sink
 * endpoint at /api/test/email-sink.
 *
 * The sink is mounted ONLY when NEXTAUTH_TEST_MODE=true (see route.ts).
 * App code should fork email delivery to the sink in test mode (TODO:
 * wire `lib/email.ts` to do this; tracked separately).
 *
 * Usage:
 *
 *   import { clearEmailSink, getEmailsSentTo, expectEmailSent } from
 *     "../support/mocks/email";
 *
 *   test("forgot password sends reset email", async ({ page }) => {
 *     await clearEmailSink();
 *     await page.goto("/forgot-password");
 *     await page.getByLabel("Email").fill("user@example.com");
 *     await page.getByRole("button", { name: /send reset/i }).click();
 *
 *     await expectEmailSent({
 *       to: "user@example.com",
 *       subjectMatches: /reset your password/i,
 *       bodyContains: "/reset-password?token=",
 *     });
 *   });
 */

import { expect } from "@playwright/test";

export interface CapturedEmail {
  to: string;
  from: string;
  subject: string;
  body: string;
  template?: string;
  receivedAt: string;
}

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const SINK_URL = `${BASE_URL}/api/test/email-sink`;

/**
 * Wipes the in-memory email buffer. Call before triggering a flow that should
 * send a single email — tests stay deterministic across re-runs.
 */
export async function clearEmailSink(): Promise<void> {
  const res = await fetch(SINK_URL, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(
      `clearEmailSink failed: ${res.status} ${res.statusText}. ` +
        `Is NEXTAUTH_TEST_MODE=true and the dev server running?`,
    );
  }
}

/**
 * Returns all emails sent to a recipient since the last clear.
 * Empty array if none.
 */
export async function getEmailsSentTo(recipient: string): Promise<CapturedEmail[]> {
  const url = new URL(SINK_URL);
  url.searchParams.set("to", recipient);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(
      `getEmailsSentTo failed: ${res.status} ${res.statusText}. ` +
        `Is NEXTAUTH_TEST_MODE=true?`,
    );
  }
  const json = (await res.json()) as { emails: CapturedEmail[] };
  return json.emails;
}

/**
 * Returns ALL captured emails (any recipient). Useful for asserting "no
 * email was sent" or for inspecting the buffer during debugging.
 */
export async function getAllEmails(): Promise<CapturedEmail[]> {
  const res = await fetch(SINK_URL);
  if (!res.ok) {
    throw new Error(`getAllEmails failed: ${res.status} ${res.statusText}.`);
  }
  const json = (await res.json()) as { emails: CapturedEmail[] };
  return json.emails;
}

export interface ExpectEmailOptions {
  to: string;
  subjectMatches?: RegExp | string;
  bodyContains?: string | string[];
  template?: string;
  /**
   * How long to poll the sink before failing. Email delivery happens
   * server-side and may not be synchronous with the API response that
   * triggered it. Default: 5 seconds.
   */
  timeoutMs?: number;
}

/**
 * Polls the sink until an email matching the criteria appears, then asserts.
 * Fails the test if no matching email arrives within the timeout.
 */
export async function expectEmailSent(options: ExpectEmailOptions): Promise<CapturedEmail> {
  const timeout = options.timeoutMs ?? 5000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const emails = await getEmailsSentTo(options.to);
    const match = emails.find((email) => emailMatches(email, options));
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const all = await getAllEmails();
  throw new Error(
    `expectEmailSent: no email matching criteria arrived within ${timeout}ms.\n` +
      `Criteria: ${JSON.stringify(options, null, 2)}\n` +
      `Buffer at timeout: ${JSON.stringify(all, null, 2)}`,
  );
}

/**
 * Asserts NO email was sent to a recipient within the wait window.
 * Use sparingly — false-negatives become real if you set the wait too short.
 */
export async function expectNoEmailSent(
  recipient: string,
  waitMs = 2000,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const emails = await getEmailsSentTo(recipient);
  expect(
    emails,
    `Expected no email to ${recipient}, got ${emails.length}: ${JSON.stringify(emails)}`,
  ).toHaveLength(0);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function emailMatches(email: CapturedEmail, options: ExpectEmailOptions): boolean {
  if (email.to !== options.to) return false;

  if (options.subjectMatches) {
    const matcher = options.subjectMatches;
    if (matcher instanceof RegExp) {
      if (!matcher.test(email.subject)) return false;
    } else if (!email.subject.includes(matcher)) {
      return false;
    }
  }

  if (options.bodyContains) {
    const fragments = Array.isArray(options.bodyContains)
      ? options.bodyContains
      : [options.bodyContains];
    if (!fragments.every((f) => email.body.includes(f))) return false;
  }

  if (options.template && email.template !== options.template) return false;

  return true;
}
