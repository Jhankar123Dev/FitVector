import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ─── Role → settings path ────────────────────────────────────────────────────

function settingsPath(role?: string): string {
  return role === "employer" ? "/employer/settings" : "/dashboard/settings";
}

// ─── State verification ───────────────────────────────────────────────────────

/**
 * Verifies the CSRF state token:
 *  1. Decodes base64url
 *  2. Checks userId matches the active session
 *  3. Checks the timestamp hasn't expired
 *  4. Recomputes HMAC and compares using a timing-safe comparison
 */
function verifyState(state: string, sessionUserId: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return false;

    const payload = decoded.slice(0, lastColon);        // "userId:expiry"
    const receivedHmac = decoded.slice(lastColon + 1);  // hex HMAC

    const [userId, expiryStr] = payload.split(":");
    if (!userId || !expiryStr) return false;

    // 1. userId must match the active session
    if (userId !== sessionUserId) return false;

    // 2. Must not be expired
    if (Date.now() > parseInt(expiryStr, 10)) return false;

    // 3. Recompute HMAC and compare — timingSafeEqual prevents timing attacks
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
    const expectedHmac = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const a = Buffer.from(receivedHmac, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error"); // user denied

  // Verify the user is still logged in
  const session = await auth();
  const role    = session?.user?.role;
  const base    = `${origin}${settingsPath(role)}`;

  // User clicked "Deny" on Google's consent screen
  if (error) {
    return NextResponse.redirect(`${base}?calendar=denied`);
  }

  // Missing params — shouldn't happen in normal flow
  if (!code || !state) {
    return NextResponse.redirect(`${base}?calendar=error`);
  }

  // Session must exist
  if (!session?.user?.id) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // ── CSRF check ──────────────────────────────────────────────────────────────
  const cookieState = req.cookies.get("cal_oauth_state")?.value;

  if (!cookieState || cookieState !== state) {
    console.warn("Calendar OAuth CSRF mismatch", {
      userId: session.user.id,
      hasCookie: !!cookieState,
    });
    return NextResponse.redirect(`${base}?calendar=error`);
  }

  if (!verifyState(state, session.user.id)) {
    console.warn("Calendar OAuth state verification failed", {
      userId: session.user.id,
    });
    return NextResponse.redirect(`${base}?calendar=error`);
  }

  // ── Exchange code for tokens ────────────────────────────────────────────────
  const redirectUri = `${origin}/api/calendar/google/callback`;

  let refreshToken: string | null = null;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.redirect(`${base}?calendar=error`);
    }

    const tokens = await tokenRes.json();
    refreshToken = tokens.refresh_token ?? null;

    // Google only returns a refresh_token when prompt=consent was used.
    // If it's missing the user somehow already has access — re-prompt.
    if (!refreshToken) {
      console.warn("No refresh_token returned from Google — prompt=consent should have forced one");
      return NextResponse.redirect(`${base}?calendar=error`);
    }
  } catch (err) {
    console.error("Calendar token exchange error:", err);
    return NextResponse.redirect(`${base}?calendar=error`);
  }

  // ── Persist to DB ───────────────────────────────────────────────────────────
  const supabase = createAdminClient();
  const { error: dbError } = await supabase
    .from("users")
    .update({
      google_refresh_token:    refreshToken,
      google_calendar_connected: true,
    })
    .eq("id", session.user.id);

  if (dbError) {
    console.error("Failed to save calendar token:", dbError);
    return NextResponse.redirect(`${base}?calendar=error`);
  }

  // ── Success — clear CSRF cookie and redirect ────────────────────────────────
  const response = NextResponse.redirect(`${base}?calendar=connected`);
  response.cookies.delete("cal_oauth_state");
  return response;
}
