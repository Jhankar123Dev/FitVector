import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";

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

        // ── Email delivery via Resend ─────────────────────────────────────
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const from = process.env.EMAIL_FROM ?? "FitVector <noreply@fitvector.pro>";
          await resend.emails.send({
            from,
            to: user.email,
            subject: "Reset your FitVector password",
            html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="padding:32px 32px 0;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Reset your password</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
            We received a request to reset the password for your FitVector account.
            Click the button below — this link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff;
                    font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
            Reset password
          </a>
          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
            If you didn't request this, you can safely ignore this email —
            your password will not be changed.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #f1f5f9;margin-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            Or copy this link: <a href="${resetUrl}" style="color:#2563eb;word-break:break-all;">${resetUrl}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          });
        }

        // ── Dev / no-key fallback: log the link ────────────────────────────
        if (process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY) {
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
