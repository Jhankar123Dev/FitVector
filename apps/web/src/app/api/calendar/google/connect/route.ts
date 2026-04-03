import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { auth } from "@/lib/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

/**
 * Generates a signed CSRF state token.
 * Format (base64url): userId:expiry:HMAC(userId:expiry, secret)
 */
function generateState(userId: string): string {
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  const payload = `${userId}:${expiry}`;
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
  const hmac = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export async function GET(req: NextRequest) {
  // Must be logged in to initiate calendar sync
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const state = generateState(session.user.id);
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/calendar/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: CALENDAR_SCOPES,
    access_type: "offline",
    prompt: "consent", // force consent so we always get a refresh_token
    state,
  });

  const response = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params}`);

  // Store state in httpOnly cookie — verified in the callback to prevent CSRF
  response.cookies.set("cal_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/calendar/google/callback",
    maxAge: 600, // 10 minutes, matches state expiry
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
