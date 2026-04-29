import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Why no auth() wrapper ────────────────────────────────────────────────────
// Next.js middleware runs on the Edge runtime which does NOT support Node.js
// APIs. The auth() wrapper from @/lib/auth pulls in createAdminClient()
// → @supabase/supabase-js which uses Node.js-specific code and causes the
// dev server to hang on startup. Route protection (redirects to /login etc.)
// is handled client-side via the existing session checks in each page/layout.
// This middleware handles rate limiting only — a pure Edge-compatible concern.

// ─── Upstash Redis & rate limiters ────────────────────────────────────────────
// Limiters are initialised once at module load — only when env vars are present.
// If UPSTASH_REDIS_REST_URL / TOKEN are not set the module falls through and all
// requests are allowed — nothing breaks.
//
// Add to .env.local to activate:
//   UPSTASH_REDIS_REST_URL=https://...upstash.io
//   UPSTASH_REDIS_REST_TOKEN=...

const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

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
      // Assessment submit — max 3 per 10 min per token to block brute-force
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
// client. Always read x-forwarded-for (first entry = real client IP).
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
    keyFn: (req, ip) => {
      const tokenCookie =
        req.cookies.get("authjs.session-token")?.value ??
        req.cookies.get("__Secure-authjs.session-token")?.value;
      return tokenCookie ? `session:${tokenCookie.slice(0, 32)}` : `ip:${ip}`;
    },
  },
  {
    pattern: /^\/api\/code\/execute/,
    limiterKey: "codeExecute",
    keyFn: (_req, ip) => `ip:${ip}`,
  },
  {
    pattern: /^\/api\/assessment\/[^/]+\/submit$/,
    limiterKey: "assessmentSubmit",
    keyFn: (req) => {
      const token = req.nextUrl.pathname.split("/")[3] ?? "unknown";
      return `token:${token}`;
    },
  },
  {
    pattern: /^\/api\/employer\//,
    limiterKey: "employer",
    keyFn: (req, ip) => {
      const tokenCookie =
        req.cookies.get("authjs.session-token")?.value ??
        req.cookies.get("__Secure-authjs.session-token")?.value;
      return tokenCookie ? `session:${tokenCookie.slice(0, 32)}` : `ip:${ip}`;
    },
  },
  {
    pattern: /^\/api\//,
    limiterKey: "general",
    keyFn: (_req, ip) => `ip:${ip}`,
  },
];

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  // Skip rate limiting when Redis is not configured (local dev without Upstash)
  if (!limiters) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  for (const rule of RULES) {
    if (rule.pattern.test(pathname)) {
      const limiter = limiters[rule.limiterKey];
      const key = rule.keyFn(req, ip);

      try {
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
      } catch {
        // Redis unreachable (network issue / bad credentials) — fail open:
        // allow the request through rather than blocking all traffic.
        // This is intentional: rate limiting is a best-effort defence, not a
        // hard gate. The request will still be served normally.
        console.warn("[middleware] Upstash rate-limit failed — allowing request through:", pathname);
      }

      break; // first matching rule wins
    }
  }

  return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Run only on API routes — no need to rate-limit page navigation.
export const config = {
  matcher: ["/api/:path*"],
};
