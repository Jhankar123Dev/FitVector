import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash, randomBytes } from "crypto";

// Rate limiting: max 3 requests per email per 15 minutes
// (enforced at DB level via token count check)
const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;
const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up user — respond identically whether user exists or not (prevent enumeration)
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (user) {
      // Soft rate-limit: count unexpired tokens in the last WINDOW_MINUTES
      const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("password_reset_tokens")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", windowStart);

      if ((count ?? 0) < MAX_REQUESTS_PER_WINDOW) {
        // Generate a cryptographically secure token
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

        await supabase.from("password_reset_tokens").insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;

        // ── Email delivery ────────────────────────────────────────────────
        // TODO: Replace this log with your email provider (e.g. Resend):
        //
        // import { Resend } from "resend";
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //   from: "FitVector <noreply@fitvector.pro>",
        //   to: user.email,
        //   subject: "Reset your FitVector password",
        //   html: `<p>Click the link below to reset your password (expires in 1 hour):</p>
        //          <p><a href="${resetUrl}">${resetUrl}</a></p>`,
        // });
        //
        // ── Dev mode: log the link so you can test without an email provider ──
        if (process.env.NODE_ENV !== "production") {
          console.log(`[forgot-password] Reset link for ${email}: ${resetUrl}`);
        }
      }
    }

    // Always return the same response — never reveal whether the email exists
    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgot-password] Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
