import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for FitVector Pro (apps/web).
 *
 * Folder layout
 * ─────────────
 * tests/e2e/
 *   setup/          ← one auth-setup file per role (runs first)
 *   seeker/         ← Job Seeker specs
 *   employer/       ← Employer / Recruiter specs
 *   admin/          ← Superadmin specs
 *   auth/           ← login / signup / password-reset / OAuth specs
 *   public/         ← landing / pricing / SEO (unauthenticated, no setup)
 *   anon/           ← token-gated assessment + interview flows (no session)
 *   api/            ← rate-limit / middleware / contract tests
 *   support/        ← shared fixtures, page objects, mocks (NOT tests)
 *   .auth/          ← cached sessions written by setup files (gitignored)
 *
 * Project execution order
 * ───────────────────────
 *   1. setup:seeker / setup:employer / setup:admin (parallel)  → write .auth/<role>.json
 *   2. seeker / employer / admin                                → consume cached sessions
 *   3. auth / public / anon / api                               → no auth dependency
 *
 * Targeted runs (examples)
 * ────────────────────────
 *   npx playwright test --project=seeker
 *   npx playwright test --project=auth
 *   npx playwright test seeker/onboarding
 *   npx playwright test                          ← full suite
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* support/ holds helpers, not specs — never treat them as tests */
  testIgnore: ['**/support/**'],

  /* DB-mutating tests must not run concurrently */
  fullyParallel: false,
  workers: 1,

  /* Prevent accidental .only() from reaching CI */
  forbidOnly: !!process.env.CI,

  /* One automatic retry in CI for transient flakiness */
  retries: process.env.CI ? 1 : 0,

  /* JUnit + JSON for CI ingest, HTML for human review, list for stdout */
  reporter: process.env.CI
    ? [
        ['list'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ],

  /* Auto-start the dev server before tests (only when not already running) */
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NEXTAUTH_TEST_MODE: 'true',
        },
      },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /* Generous timeouts — AI parse endpoint + window.location redirects */
    actionTimeout: 15_000,
    navigationTimeout: 20_000,

    /* Default desktop Chrome for every project unless overridden */
    ...devices['Desktop Chrome'],
  },

  projects: [

    // ── Auth setup (runs before role-scoped specs) ──────────────────────────

    {
      name: 'setup:seeker',
      testMatch: /setup\/seeker\.setup\.ts/,
    },
    {
      name: 'setup:employer',
      testMatch: /setup\/employer\.setup\.ts/,
    },
    {
      name: 'setup:admin',
      testMatch: /setup\/admin\.setup\.ts/,
    },

    // ── Role-scoped specs (consume cached storageState) ─────────────────────

    {
      name: 'seeker',
      testMatch: /seeker\/.*\.spec\.ts/,
      use: { storageState: 'tests/e2e/.auth/seeker.json' },
      dependencies: ['setup:seeker'],
    },
    {
      name: 'employer',
      testMatch: /employer\/.*\.spec\.ts/,
      use: { storageState: 'tests/e2e/.auth/employer.json' },
      dependencies: ['setup:employer'],
    },
    {
      name: 'admin',
      testMatch: /admin\/.*\.spec\.ts/,
      use: { storageState: 'tests/e2e/.auth/admin.json' },
      dependencies: ['setup:admin'],
    },

    // ── No-auth specs ───────────────────────────────────────────────────────
    // auth/  ← exercises login/signup/reset themselves, must not pre-auth
    // public/ ← landing, pricing, SEO
    // anon/  ← token-gated assessment + interview (programmatic tokens via
    //          support/helpers/token.ts — no browser session required)
    // api/   ← rate-limit, middleware, contract tests via request fixture

    {
      name: 'auth',
      testMatch: /auth\/.*\.spec\.ts/,
    },
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
    },
    {
      name: 'anon',
      testMatch: /anon\/.*\.spec\.ts/,
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
    },

  ],
});
