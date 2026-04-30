/**
 * support/fixtures/index.ts
 *
 * Custom Playwright fixtures for FitVector Pro E2E tests.
 *
 * Two fixture categories:
 *
 *   1. Authenticated browser contexts (`seekerPage`, `employerPage`, `adminPage`)
 *      Load the cached storageState produced by `setup/<role>.setup.ts` and
 *      hand the spec a pre-authenticated `Page`. Specs that simply need
 *      "I'm logged in as a seeker" should use these.
 *
 *   2. Ephemeral DB records (`ephemeralSeeker`, `ephemeralEmployer`,
 *      `ephemeralJob`, `ephemeralCompany`)
 *      Worker-scoped (default) — created in `beforeEach`-equivalent, deleted
 *      in `afterEach`-equivalent. Specs that mutate state should use these
 *      instead of the persistent seed accounts so each test starts clean.
 *
 * Usage:
 *
 *   import { test, expect } from "../support/fixtures";
 *
 *   test("seeker can save a job", async ({ seekerPage, ephemeralJob }) => {
 *     await seekerPage.goto(`/dashboard/jobs/${ephemeralJob.id}`);
 *     await seekerPage.getByRole("button", { name: "Save Job" }).click();
 *     // …assertions…
 *     // No cleanup needed — ephemeralJob is auto-deleted on teardown.
 *   });
 *
 * NB: The `ephemeralEmployer` fixture creates a USER + COMPANY + ADMIN
 * MEMBERSHIP, but it does NOT log that user in. To drive tests as the
 * ephemeral employer, sign in via the direct NextAuth API (see
 * setup/employer.setup.ts) inside the spec, or pair with a custom page
 * fixture that calls `signInAs(ephemeralEmployer.user)`.
 */

import { test as base, type Page, type BrowserContext } from "@playwright/test";
import path from "node:path";
import {
  createTestUser,
  deleteTestUser,
  createTestJob,
  deleteTestJob,
  createTestCompany,
  deleteTestCompany,
  createEmployerWithCompany,
  type TestUser,
  type TestJob,
  type TestCompany,
  type CreateTestUserOptions,
  type CreateTestJobOptions,
  type CreateTestCompanyOptions,
  type CompanyMemberRole,
} from "../helpers/db-helpers";

// ─── StorageState paths ───────────────────────────────────────────────────────
// Resolved from this file's location so the fixtures work regardless of where
// `playwright.config.ts` is invoked from.

const AUTH_DIR = path.resolve(__dirname, "../../.auth");
const SEEKER_STATE = path.join(AUTH_DIR, "seeker.json");
const EMPLOYER_STATE = path.join(AUTH_DIR, "employer.json");
const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");

// ─── Fixture types ────────────────────────────────────────────────────────────

interface AuthenticatedFixtures {
  /**
   * Authenticated as the persistent seed seeker (`playwright@gmail.com`).
   * Cookies are loaded from `.auth/seeker.json`. Read-only flows only —
   * for state-mutating tests, use `ephemeralSeeker` + a fresh login.
   */
  seekerPage: Page;
  seekerContext: BrowserContext;

  /**
   * Authenticated as the persistent seed employer admin
   * (`employer_1@seed.fitvector.dev`).
   */
  employerPage: Page;
  employerContext: BrowserContext;

  /**
   * Authenticated as the persistent superadmin
   * (`superadmin@seed.fitvector.dev`).
   */
  adminPage: Page;
  adminContext: BrowserContext;
}

interface EphemeralFixtureOptions {
  /**
   * Override the default options passed to `createTestUser` /
   * `createTestJob` / etc. Set in a spec via:
   *
   *   test.use({ ephemeralSeekerOptions: { planTier: "pro", onboardingCompleted: true } });
   */
  ephemeralSeekerOptions: CreateTestUserOptions;
  ephemeralEmployerOptions: CreateTestUserOptions & {
    companyName?: string;
    memberRole?: CompanyMemberRole;
  };
  ephemeralJobOptions: CreateTestJobOptions;
  ephemeralCompanyOptions: CreateTestCompanyOptions;
}

interface EphemeralFixtures {
  /**
   * Fresh seeker user created before each test, hard-deleted after.
   * Cascades through user_profiles, applications, usage_logs, etc.
   */
  ephemeralSeeker: TestUser;

  /**
   * Fresh employer user + company + admin membership, all torn down after.
   */
  ephemeralEmployer: {
    user: TestUser;
    company: TestCompany;
    memberRole: CompanyMemberRole;
  };

  /**
   * Fresh job in the scraped `jobs` table by default. To create an
   * employer-side `job_posts` row, set `test.use({ ephemeralJobOptions: {
   * source: "job_posts", companyId, createdBy } })`.
   */
  ephemeralJob: TestJob;

  /**
   * Standalone company with no members. Most tests should use
   * `ephemeralEmployer` instead — this fixture exists for cases that
   * need a company without an associated user.
   */
  ephemeralCompany: TestCompany;
}

type Fixtures = AuthenticatedFixtures &
  EphemeralFixtures &
  EphemeralFixtureOptions;

// ─── Fixture implementation ───────────────────────────────────────────────────

export const test = base.extend<Fixtures>({
  // ── Option holders (no-op defaults; overridden via `test.use({ … })`) ──────
  ephemeralSeekerOptions: [{}, { option: true }],
  ephemeralEmployerOptions: [{}, { option: true }],
  ephemeralJobOptions: [{}, { option: true }],
  ephemeralCompanyOptions: [{}, { option: true }],

  // ── Authenticated contexts ──────────────────────────────────────────────────
  // Each role gets its own isolated context so cookies from one role can never
  // leak into another spec running in the same worker.

  seekerContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: SEEKER_STATE });
    await use(context);
    await context.close();
  },

  seekerPage: async ({ seekerContext }, use) => {
    const page = await seekerContext.newPage();
    await use(page);
    // Page is closed when the context closes — no explicit close needed.
  },

  employerContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: EMPLOYER_STATE });
    await use(context);
    await context.close();
  },

  employerPage: async ({ employerContext }, use) => {
    const page = await employerContext.newPage();
    await use(page);
  },

  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: ADMIN_STATE });
    await use(context);
    await context.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
  },

  // ── Ephemeral DB records ────────────────────────────────────────────────────
  // Each fixture follows the strict create → use → delete pattern. Cleanup
  // runs even when the test throws, because Playwright always invokes the
  // post-`use` portion of the fixture.

  ephemeralSeeker: async ({ ephemeralSeekerOptions }, use) => {
    const seeker = await createTestUser({
      ...ephemeralSeekerOptions,
      role: "seeker",
    });
    try {
      await use(seeker);
    } finally {
      await deleteTestUser(seeker.id);
    }
  },

  ephemeralEmployer: async ({ ephemeralEmployerOptions }, use) => {
    const employer = await createEmployerWithCompany(ephemeralEmployerOptions);
    try {
      await use(employer);
    } finally {
      // Delete user first so the company's created_by FK becomes NULL safely;
      // then delete the company. Cascades handle company_members.
      await deleteTestUser(employer.user.id);
      await deleteTestCompany(employer.company.id);
    }
  },

  ephemeralJob: async ({ ephemeralJobOptions }, use) => {
    const job = await createTestJob(ephemeralJobOptions);
    try {
      await use(job);
    } finally {
      await deleteTestJob(job.id, job.source);
    }
  },

  ephemeralCompany: async ({ ephemeralCompanyOptions }, use) => {
    const company = await createTestCompany(ephemeralCompanyOptions);
    try {
      await use(company);
    } finally {
      await deleteTestCompany(company.id);
    }
  },
});

export { expect } from "@playwright/test";
