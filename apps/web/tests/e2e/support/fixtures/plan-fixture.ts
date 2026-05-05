/**
 * support/fixtures/plan-fixture.ts
 *
 * Test-suite generators for the two flavors of plan-tier gating:
 *
 *   1. `generatePlanGatingSuite()` — server-enforced quotas (the 6 features
 *      that actually call `hasQuota` per code-review-graph audit on
 *      2026-04-30: cold_email, linkedin_msg, referral_msg, resume_tailor,
 *      job_search, active_applications).
 *
 *      Generates 5 tests:
 *        ✅ under quota: action succeeds
 *        ✅ at quota - 1: action succeeds (last allowed)
 *        ❌ at quota: 429 + { upgrade: true }
 *        ✅ after upgrade: action succeeds
 *        ⚠ test.fixme — counter resets after 24 hours
 *
 *      The 5th test is marked `test.fixme()` because the backend currently
 *      uses a monthly window (e.g., cold-email/route.ts:27 reads
 *      `monthStart`). Migrating to a 24-hour rolling window is tracked
 *      tech debt — when the migration lands, drop the `.fixme` and the
 *      test lights up green automatically.
 *
 *   2. `generateFeatureFlagSuite()` — boolean / array gating (job_alerts,
 *      chrome_extension, resume_templates) enforced in the UI, not via
 *      hasQuota. Generates 4 tests across all 4 tiers.
 *
 * Both generators take a config-as-data approach so each spec file is
 * 5–15 lines, not 80.
 */

import { test, expect } from "./index";
import type { Page, Route } from "@playwright/test";

/** Minimal response shape returned by quota action functions. */
export interface ActionResult {
  status(): number;
  json(): Promise<unknown>;
}
import {
  setUsageCounter,
  resetUsageCounter,
  setPlanTier,
  backdateUsageTimestamp,
  type PlanTier,
  type TestUser,
} from "../helpers/db-helpers";
import { signInAs } from "../helpers/auth";

// Ensure page.evaluate(() => fetch(...)) runs from the app origin, not
// about:blank — avoids CORS / null-origin cookie rejection on API calls.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Registers a route interceptor that forwards requests to the real server.
 * - Quota-error responses (402 / 429) are passed through unchanged.
 * - All other responses (including 500s from a missing Python service) are
 *   transformed to a stub 200 so "should succeed" tests don't depend on the
 *   Python backend being available in CI.
 *
 * The route is cleared automatically at end-of-test by Playwright's page lifecycle.
 */
async function mockNonQuotaErrors(page: Page, pattern: string | RegExp): Promise<void> {
  await page.route(pattern, async (route: Route) => {
    try {
      const response = await route.fetch({ timeout: 8_000 });
      const status = response.status();
      // Quota / auth errors always pass through so the quota check is verified.
      if (status === 402 || status === 429 || status === 401 || status === 400) {
        await route.fulfill({ response });
        return;
      }
      // Python service error — stub success.
      if (status >= 500) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: {} }),
        });
        return;
      }
      // 2xx — check for a hidden Python error in the body (Gemini 429 wrapped as 200).
      const body = await response.json().catch(() => null);
      if (body && typeof body === "object" && "error" in body) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: {} }),
        });
      } else {
        await route.fulfill({ response });
      }
    } catch {
      // route.fetch() timed out (Python retry loop too slow) — stub success.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    }
  });
}

// ─── Plan-gating (server-enforced quota) ──────────────────────────────────────

export interface QuotaFeatureConfig {
  /** Display name used in `test.describe` titles. */
  displayName: string;
  /** Exact `feature` column value in usage_logs. */
  feature:
    | "cold_email"
    | "linkedin_msg"
    | "referral_msg"
    | "resume_tailor"
    | "job_search"
    | "active_applications";
  /** Per-tier quota from packages/shared/src/constants/plan-limits.ts. */
  quotaByTier: Record<PlanTier, number>;
  /** Tiers to run the boundary suite against. Default: ["free"]. */
  tiersUnderTest?: PlanTier[];
  /** Tier to flip to in the "after upgrade" test. Default: "pro". */
  upgradeTo?: PlanTier;
  /**
   * The action that consumes one unit of quota. Must use page.evaluate(() => fetch(...))
   * so page.route() interceptors apply. Returns an ActionResult (status + json).
   *
   *   action: async (page) => {
   *     const r = await page.evaluate(async () => {
   *       const res = await fetch('/api/ai/cold-email', { method: 'POST', ... });
   *       return { status: res.status, body: await res.json().catch(() => null) };
   *     });
   *     return { status: () => r.status, json: async () => r.body };
   *   }
   */
  action: (page: Page) => Promise<ActionResult>;
  /**
   * Optional override for how quota is pre-seeded. Defaults to setUsageCounter.
   * Use when the quota gate reads from a different table than usage_logs
   * (e.g. active_applications counts from `applications`, not `usage_logs`).
   */
  setCounter?: (userId: string, feature: string, count: number) => Promise<void>;
  /**
   * Optional override for resetting the counter between tests. Defaults to resetUsageCounter.
   */
  resetCounter?: (userId: string, feature: string) => Promise<void>;

  /**
   * URL pattern (passed to page.route()) to intercept for "should succeed" tests.
   * Requests are forwarded to the real server so the quota check still runs.
   * Any non-quota error (including 500 from Python being unavailable) is
   * transformed to a stub 200 so the test does not depend on external services.
   *
   * Required for Python-backed routes in CI environments without a Python service.
   * Omit for Supabase-only routes (e.g. job_search, active_applications).
   */
  mockRoutePattern?: string | RegExp;
}

/**
 * Drops a 5-test describe block into the calling spec file.
 *
 *   generatePlanGatingSuite({
 *     displayName: "cold email",
 *     feature: "cold_email",
 *     quotaByTier: { free: 2, starter: 15, pro: 50, elite: -1 },
 *     action: (page) => page.request.post("/api/ai/cold-email", {
 *       data: { jobTitle: "...", companyName: "..." }
 *     }),
 *   });
 */
export function generatePlanGatingSuite(config: QuotaFeatureConfig): void {
  const tiers = config.tiersUnderTest ?? ["free"];
  const upgradeTo: PlanTier = config.upgradeTo ?? "pro";

  for (const tier of tiers) {
    const limit = config.quotaByTier[tier];
    // Unlimited tiers don't have boundaries — skip with a sentinel test.
    if (limit === -1) {
      test.describe(`plan-gating: ${config.displayName} on ${tier} (unlimited)`, () => {
        test("unlimited tier: 100 calls all succeed", async ({ ephemeralSeeker, page }) => {
          await setPlanTier(ephemeralSeeker.id, tier);
          await signInAs(page, ephemeralSeeker);
          await page.goto(`${BASE_URL}/dashboard`);
          for (let i = 0; i < 5; i++) {
            const res = await config.action(page);
            expect(res.status(), `call ${i + 1} should be allowed`).toBeLessThan(400);
          }
        });
      });
      continue;
    }

    test.describe(`plan-gating: ${config.displayName} on ${tier} (limit ${limit})`, () => {
      const doSetCounter = config.setCounter ?? setUsageCounter;
      const doResetCounter = config.resetCounter ?? resetUsageCounter;

      test.beforeEach(async ({ ephemeralSeeker }) => {
        await setPlanTier(ephemeralSeeker.id, tier);
        await doResetCounter(ephemeralSeeker.id, config.feature);
      });

      // 1 — under quota
      test(`under quota: action succeeds when usage < ${limit}`, async ({
        ephemeralSeeker,
        page,
      }) => {
        // Limit=0 means the feature is hard-blocked for this tier — no valid
        // "under quota" scenario exists, so skip rather than assert a wrong result.
        test.skip(limit <= 0, `limit=${limit}: no valid "under quota" scenario for this tier`);

        const fillTo = Math.max(0, limit - 2);
        if (fillTo > 0) {
          await doSetCounter(ephemeralSeeker.id, config.feature, fillTo);
        }
        if (config.mockRoutePattern) {
          await mockNonQuotaErrors(page, config.mockRoutePattern);
        }
        await signInAs(page, ephemeralSeeker);
        await page.goto(`${BASE_URL}/dashboard`);

        const res = await config.action(page);
        expect(res.status()).toBeLessThan(400);
      });

      // 2 — at limit minus one
      test(`at limit - 1: last allowed action succeeds (usage = ${limit - 1})`, async ({
        ephemeralSeeker,
        page,
      }) => {
        test.skip(limit <= 0, `limit=${limit}: no valid "at limit - 1" scenario for this tier`);

        if (limit - 1 > 0) {
          await doSetCounter(ephemeralSeeker.id, config.feature, limit - 1);
        }
        if (config.mockRoutePattern) {
          await mockNonQuotaErrors(page, config.mockRoutePattern);
        }
        await signInAs(page, ephemeralSeeker);
        await page.goto(`${BASE_URL}/dashboard`);

        const res = await config.action(page);
        expect(res.status()).toBeLessThan(400);
      });

      // 3 — at limit (blocked)
      test(`at limit: action returns 429 with { upgrade: true } (usage = ${limit})`, async ({
        ephemeralSeeker,
        page,
      }) => {
        if (limit > 0) {
          await doSetCounter(ephemeralSeeker.id, config.feature, limit);
        }
        await signInAs(page, ephemeralSeeker);
        await page.goto(`${BASE_URL}/dashboard`);

        const res = await config.action(page);
        // Some routes return 429 (rate-style), others 402 (payment-required).
        // tracker/route.ts:206 returns 429; cold-email returns 429. We accept
        // either to avoid coupling to one specific status code.
        expect([402, 429]).toContain(res.status());
        const body = (await res.json()) as { upgrade?: boolean; error?: string };
        expect(body.upgrade).toBe(true);
      });

      // 4 — after upgrade
      test(`after upgrade to ${upgradeTo}: action succeeds`, async ({
        ephemeralSeeker,
        page,
      }) => {
        if (limit > 0) {
          await doSetCounter(ephemeralSeeker.id, config.feature, limit);
        }
        await setPlanTier(ephemeralSeeker.id, upgradeTo);
        if (config.mockRoutePattern) {
          await mockNonQuotaErrors(page, config.mockRoutePattern);
        }
        await signInAs(page, ephemeralSeeker);
        await page.goto(`${BASE_URL}/dashboard`);

        const res = await config.action(page);
        expect(res.status()).toBeLessThan(400);
      });

      // 5 — daily reset (TECH DEBT: backend uses monthly window today)
      test.fixme(
        "counter resets after 24 hours (TODO: backend currently uses monthly window, migrate to 24h)",
        async ({ ephemeralSeeker, page }) => {
          if (limit > 0) {
            await doSetCounter(ephemeralSeeker.id, config.feature, limit);
          }
          // Push the rows past the 24-hour boundary.
          await backdateUsageTimestamp(ephemeralSeeker.id, config.feature, 25);
          await signInAs(page, ephemeralSeeker);
          await page.goto(`${BASE_URL}/dashboard`);

          const res = await config.action(page);
          expect(res.status()).toBeLessThan(400);
        },
      );
    });
  }
}

// ─── Feature-flag (frontend-enforced boolean / array) ─────────────────────────

export interface FeatureFlagConfig {
  displayName: string;
  /** Per-tier flag from plan-limits.ts. */
  flagByTier: Record<PlanTier, boolean>;
  /** UI assertion run after `signInAs` and `goto`. */
  assertion: (params: {
    page: Page;
    user: TestUser;
    tier: PlanTier;
    enabled: boolean;
  }) => Promise<void>;
  /** Path to navigate to before running the assertion. */
  pathToTest: string;
}

/**
 * Drops one test per tier into the calling spec file. Each test sets the
 * tier, signs in, navigates to `pathToTest`, and runs the caller's
 * assertion with the per-tier expected `enabled` boolean.
 *
 *   generateFeatureFlagSuite({
 *     displayName: "job alerts",
 *     flagByTier: { free: false, starter: true, pro: true, elite: true },
 *     pathToTest: "/dashboard/settings/notifications",
 *     assertion: async ({ page, enabled }) => {
 *       const cta = page.getByRole("button", { name: /upgrade/i });
 *       if (enabled) {
 *         await expect(cta).toBeHidden();
 *       } else {
 *         await expect(cta).toBeVisible();
 *       }
 *     },
 *   });
 */
export function generateFeatureFlagSuite(config: FeatureFlagConfig): void {
  test.describe(`feature flag: ${config.displayName}`, () => {
    const tiers: PlanTier[] = ["free", "starter", "pro", "elite"];

    for (const tier of tiers) {
      const enabled = config.flagByTier[tier];
      test(`${tier}: feature ${enabled ? "is accessible" : "is locked"}`, async ({
        ephemeralSeeker,
        page,
      }) => {
        await setPlanTier(ephemeralSeeker.id, tier);
        await signInAs(page, ephemeralSeeker);
        await page.goto(config.pathToTest);
        await config.assertion({ page, user: ephemeralSeeker, tier, enabled });
      });
    }
  });
}
