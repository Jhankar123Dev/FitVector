import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Upstash Redis & rate limiters ────────────────────────────────────────────
// Limiters are initialised once at module load — only when env vars are present.
// If UPSTASH_REDIS_REST_URL / TOKEN are not set (e.g. local dev without Redis)
// the module falls through and all requests are allowed, so nothing breaks.
//
// To enable rate limiting, add to .env.local:
//   UPSTASH_REDIS_REST_URL=https://...upstash.io
//   UPSTASH_REDIS_REST_TOKEN=...
//
// NOTE: The Upstash credentials in the Python service (upstash_redis_url /
// upstash_redis_token) are the same Redis instance — reuse them here.

const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Each route group gets its own Ratelimit instance with tuned limits.
// slidingWindow gives smooth protection — no burst at window boundary.
const limiters = redis
  ? {
      // Account creation — tight limit to block registration spam
      signup: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60s"),
        prefix: "@fv/rl:signup",
      }),
      // AI/LLM endpoints — expensive compute + API credit cost
      ai: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60s"),
        prefix: "@fv/rl:ai",
      }),
      // Code execution — JDoodle credits are limited (200/day on free tier)
      codeExecute: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "60s"),
        prefix: "@fv/rl:code",
      }),
      // Assessment submit — absolute max 3 per 10 min per token to block brute-force
      assessmentSubmit: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "600s"),
        prefix: "@fv/rl:submit",
      }),
      // Employer API — higher ceiling for normal dashboard use
      employer: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "60s"),
        prefix: "@fv/rl:employer",
      }),
      // General catch-all API protection
      general: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(200, "60s"),
        prefix: "@fv/rl:general",
      }),
    }
  : null;

// ─── IP extraction (Vercel-safe) ──────────────────────────────────────────────
// On Vercel, req.socket.remoteAddress returns the edge server IP — NOT the
// client. Always read x-forwarded-for (first entry = real client IP) or
// x-real-ip as fallback. This prevents accidentally rate-limiting your entire
// user base as a single IP address.
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ─── Rate limit rules (ordered — first match wins) ───────────────────────────
type LimiterKey = keyof NonNullable<typeof limiters>;

const RULES: Array<{
  pattern: RegExp;
  limiterKey: LimiterKey;
  // keyFn builds the per-request identifier passed to Ratelimit.limit()
  keyFn: (req: NextRequest, ip: string) => string;
}> = [
  {
    pattern: /^\/api\/auth\/signup/,
    limiterKey: "signup",
    keyFn: (_req, ip) => `ip:${ip}`,
  },
  {
    pattern: /^\/api\/ai\//,
    limiterKey: "ai",
    // Use user id from cookie if available, else IP — prevents bypassing with proxies
    keyFn: (req, ip) => {
      const tokenCookie = req.cookies.get("authjs.session-token")?.value
        ?? req.cookies.get("__Secure-authjs.session-token")?.value;
      return tokenCookie ? `session:${tokenCookie.slice(0, 32)}` : `ip:${ip}`;
    },
  },
  {
    pattern: /^\/api\/code\/execute/,
    limiterKey: "codeExecute",
    keyFn: (_req, ip) => `ip:${ip}`,
  },
  {
    // Matches /api/assessment/<token>/submit
    pattern: /^\/api\/assessment\/[^/]+\/submit$/,
    limiterKey: "assessmentSubmit",
    // Key on the submission token so each candidate gets 3 attempts regardless of IP
    keyFn: (req) => {
      const token = req.nextUrl.pathname.split("/")[3] ?? "unknown";
      return `token:${token}`;
    },
  },
  {
    pattern: /^\/api\/employer\//,
    limiterKey: "employer",
    keyFn: (req, ip) => {
      const tokenCookie = req.cookies.get("authjs.session-token")?.value
        ?? req.cookies.get("__Secure-authjs.session-token")?.value;
      return tokenCookie ? `session:${tokenCookie.slice(0, 32)}` : `ip:${ip}`;
    },
  },
  {
    // General catch-all for remaining API routes
    pattern: /^\/api\//,
    limiterKey: "general",
    keyFn: (_req, ip) => `ip:${ip}`,
  },
];

// ─── Middleware ───────────────────────────────────────────────────────────────
// Wraps NextAuth v5 auth() so the `authorized` callback in auth.ts still runs
// (handles protected route redirects + role checks). Our rate limiter runs
// BEFORE auth so abusive traffic is dropped before any DB lookups occur.
export default auth(async function rateLimitMiddleware(req: NextRequest) {
  // Only apply rate limiting when Redis is configured
  if (!limiters) return; // returning undefined lets NextAuth proceed normally

  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  for (const rule of RULES) {
    if (rule.pattern.test(pathname)) {
      const limiter = limiters[rule.limiterKey];
      const key = rule.keyFn(req, ip);

      const { success, limit, remaining, reset } = await limiter.limit(key);

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please slow down and try again." },
          {
            status: 429,
            headers: {
              "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
              "X-RateLimit-Limit":     String(limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset":     String(reset),
            },
          },
        );
      }

      // First matching rule wins — stop checking further rules
      break;
    }
  }

  // Return undefined → NextAuth continues with its authorized() callback
});

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Run middleware on all routes except Next.js internals and static assets.
// NextAuth's own route protection is handled inside the auth() wrapper above.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
