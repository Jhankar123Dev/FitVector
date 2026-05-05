import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Auth cookie check (Edge-compatible) ─────────────────────────────────────
// The auth() wrapper from @/lib/auth pulls in createAdminClient()
// → @supabase/supabase-js which is Node.js-only and hangs the Edge runtime.
// Instead we do a lightweight cookie-existence check for page route protection.
// JWT signature is not re-verified here; that happens in API routes via the
// full auth() call. This guard only prevents unauthenticated page loads.

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/onboarding", "/employer", "/admin"];

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
  const { pathname } = req.nextUrl;

  // ── Page route protection ────────────────────────────────────────────────────
  // Redirect unauthenticated requests to protected pages back to /login.
  // Cookie existence is a sufficient guard here — the JWT is verified
  // cryptographically whenever the session is actually consumed by an API route.
  if (PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const hasSession = SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Skip rate limiting when Redis is not configured (local dev without Upstash)
  if (!limiters) return NextResponse.next();
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
// API routes: rate limiting. Protected page routes: auth guard.
export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/employer/:path*",
    "/admin/:path*",
  ],
};
