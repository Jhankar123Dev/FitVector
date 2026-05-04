/**
 * /api/test/email-sink
 *
 * In-memory email capture endpoint for E2E tests. Mounted ONLY when the
 * NEXTAUTH_TEST_MODE environment flag is set to "true" — every method
 * returns 404 in any other environment, so it cannot leak into production.
 *
 * Wiring: app code that sends email (e.g., the Resend wrapper in
 * `lib/email.ts`) should detect `NEXTAUTH_TEST_MODE=true` and POST to this
 * endpoint instead of (or in addition to) the real provider. That wiring
 * lives outside this file — tracked separately as a W1 follow-up.
 *
 * Methods:
 *   POST   /api/test/email-sink         → append a captured email
 *   GET    /api/test/email-sink         → list all captured emails
 *   GET    /api/test/email-sink?to=foo  → filter by recipient
 *   DELETE /api/test/email-sink         → wipe the buffer
 *
 * Capacity: 100 most-recent emails (ring buffer). Older entries are
 * silently dropped — tests should call DELETE before each scenario.
 */

import { NextResponse } from "next/server";

const MAX_EMAILS = 100;

interface CapturedEmail {
  to: string;
  from: string;
  subject: string;
  body: string;
  template?: string;
  receivedAt: string;
}

// Module-scoped buffer. Survives across requests within the same Node
// process, which is what we want for `clear → trigger → assert` flows.
const emailBuffer: CapturedEmail[] = [];

function isEnabled(): boolean {
  return process.env.NEXTAUTH_TEST_MODE === "true";
}

function notFound(): NextResponse {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isEnabled()) return notFound();

  let payload: Partial<CapturedEmail>;
  try {
    payload = (await req.json()) as Partial<CapturedEmail>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.to || !payload.subject || !payload.body) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, body" },
      { status: 400 },
    );
  }

  const captured: CapturedEmail = {
    to: payload.to,
    from: payload.from ?? "noreply@fitvector.com",
    subject: payload.subject,
    body: payload.body,
    template: payload.template,
    receivedAt: new Date().toISOString(),
  };

  emailBuffer.push(captured);
  // Drop oldest entries if we've exceeded capacity.
  if (emailBuffer.length > MAX_EMAILS) {
    emailBuffer.splice(0, emailBuffer.length - MAX_EMAILS);
  }

  return NextResponse.json({ ok: true, captured }, { status: 201 });
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isEnabled()) return notFound();

  const url = new URL(req.url);
  const to = url.searchParams.get("to");

  const emails = to ? emailBuffer.filter((e) => e.to === to) : [...emailBuffer];

  return NextResponse.json({ emails });
}

export async function DELETE(): Promise<NextResponse> {
  if (!isEnabled()) return notFound();

  emailBuffer.length = 0;
  return NextResponse.json({ ok: true });
}
