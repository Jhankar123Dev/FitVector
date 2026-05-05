/**
 * support/helpers/db-helpers.ts
 *
 * Direct Supabase admin client wrappers for E2E test setup/teardown.
 *
 * All helpers use SUPABASE_SERVICE_ROLE_KEY which bypasses Row-Level Security
 * — this is intentional and ONLY for the test suite. The same key powers our
 * server-side API routes, so no test gets more access than production code.
 *
 * Conventions baked into every helper:
 *   1. Ephemeral string fields are prefixed with `TEST_PREFIX` ("test_playwright_")
 *      so stale records from crashed runs are identifiable and bulk-purgeable.
 *   2. Cleanup functions never throw — they log and continue. afterAll hooks
 *      must remain robust even when the DB is in an unexpected state.
 *   3. Foreign-key cascades on `users` ON DELETE CASCADE handle most child rows
 *      (user_profiles, applications, usage_logs, notification_log, etc.) so
 *      deleteTestUser is sufficient for seeker cleanup.
 *   4. Companies do NOT cascade-delete on user removal — `created_by` is
 *      ON DELETE SET NULL — so deleteTestEmployer must clean the company too.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID, createHash } from "node:crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TEST_PREFIX = "test_playwright_";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "SUPABASE_SERVICE_ROLE_KEY in .env.test before running E2E tests.",
  );
}

// ─── Singleton admin client ───────────────────────────────────────────────────
// Re-use one client across all helpers in the same process — connection-pool
// friendly and matches the pattern used by `lib/supabase/admin.ts`.

let _admin: SupabaseClient | undefined;

export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _admin;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanTier = "free" | "starter" | "pro" | "elite";
export type UserRole = "seeker" | "employer" | "admin";
export type CompanyMemberRole =
  | "admin"
  | "recruiter"
  | "hiring_manager"
  | "viewer";

export interface CreateTestUserOptions {
  role?: UserRole;
  email?: string;
  password?: string;
  fullName?: string;
  planTier?: PlanTier;
  onboardingCompleted?: boolean;
  status?: "onboarding" | "active" | "suspended";
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface CreateTestJobOptions {
  /**
   * Whether to create a row in `jobs` (scraped board) or `job_posts`
   * (employer-created board). Defaults to `jobs`.
   */
  source?: "jobs" | "job_posts";
  title?: string;
  companyName?: string;
  location?: string;
  workMode?: "onsite" | "remote" | "hybrid";
  jobType?: "fulltime" | "parttime" | "contract" | "internship";
  description?: string;
  skillsRequired?: string[];
  /**
   * For job_posts only — required FK to companies.id.
   */
  companyId?: string;
  createdBy?: string;
}

export interface TestJob {
  id: string;
  source: "jobs" | "job_posts";
  title: string;
  companyName: string;
}

export interface CreateTestCompanyOptions {
  name?: string;
  industry?: string;
  companySize?: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  createdBy?: string;
}

export interface TestCompany {
  id: string;
  name: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Generates a deterministic-prefix + random-suffix value so failed runs can be
 * vacuumed via `DELETE WHERE field LIKE 'test_playwright_%'`.
 */
function uniq(label: string): string {
  return `${TEST_PREFIX}${label}_${randomUUID().slice(0, 8)}`;
}

function uniqueEmail(label = "seeker"): string {
  return `${TEST_PREFIX}${label}_${randomUUID().slice(0, 8)}@e2e.fitvector.dev`;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Creates a fresh users row with bcrypt-hashed password (cost 10, matching
 * production auth). Returns enough information for the test to immediately
 * sign in via `/api/auth/callback/credentials`.
 */
export async function createTestUser(
  options: CreateTestUserOptions = {},
): Promise<TestUser> {
  const supabase = getAdminClient();

  const role: UserRole = options.role ?? "seeker";
  const email = options.email ?? uniqueEmail(role);
  const password = options.password ?? "jhankar123";
  const fullName = options.fullName ?? `${TEST_PREFIX}${role}_user`;
  const planTier: PlanTier = options.planTier ?? "free";
  const onboardingCompleted = options.onboardingCompleted ?? false;
  const status = options.status ?? "onboarding";

  const passwordHash = await bcrypt.hash(password, 10);

  // Schema migration 20260330000001 replaced `user_type TEXT[]` with `role TEXT`.
  // The CHECK constraint allows 'seeker' | 'employer'; superadmin status is
  // applied via a separate mechanism, so admin TestUsers are seeded as 'seeker'
  // for the role column. The `role: 'admin'` field on TestUser is retained for
  // test ergonomics — callers checking it work correctly even though the DB row
  // says 'seeker'.
  const dbRole = role === "employer" ? "employer" : "seeker";

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      full_name: fullName,
      auth_provider: "credentials",
      password_hash: passwordHash,
      email_verified: true,
      role: dbRole,
      plan_tier: planTier,
      status,
      onboarding_completed: onboardingCompleted,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `createTestUser failed for ${email}: ${error?.message ?? "no data returned"}`,
    );
  }

  return { id: data.id, email, password, fullName, role };
}

/**
 * Hard-deletes a test user. Cascades to user_profiles, applications,
 * usage_logs, notification_log, generated_outreach, tailored_resumes, and
 * job_matches via `ON DELETE CASCADE`.
 *
 * Never throws — afterAll hooks must keep running even if cleanup fails.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      console.warn(`[db-helpers] deleteTestUser(${userId}) soft-failed: ${error.message}`);
    }
  } catch (e) {
    console.warn(`[db-helpers] deleteTestUser(${userId}) threw:`, e);
  }
}

/**
 * Updates plan_tier on an existing user. Used by planGatingFixture to flip a
 * tier mid-test (e.g., simulate "after upgrade" branch).
 */
export async function setPlanTier(
  userId: string,
  tier: PlanTier,
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ plan_tier: tier })
    .eq("id", userId);

  if (error) {
    throw new Error(`setPlanTier(${userId}, ${tier}) failed: ${error.message}`);
  }
}

// ─── Companies + employer membership ──────────────────────────────────────────

/**
 * Creates a `companies` row, optionally seeding a `company_members` admin row
 * for `createdBy`. Most employer tests want both — use `createEmployerWithCompany`
 * for that combined flow.
 */
export async function createTestCompany(
  options: CreateTestCompanyOptions = {},
): Promise<TestCompany> {
  const supabase = getAdminClient();
  const name = options.name ?? uniq("company");

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      industry: options.industry ?? "Software",
      company_size: options.companySize ?? "11-50",
      created_by: options.createdBy ?? null,
      plan_tier: "starter",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestCompany failed: ${error?.message ?? "no data"}`);
  }
  return { id: data.id, name };
}

/**
 * Cascades to company_members + job_posts + assessments etc. via FK ON DELETE CASCADE.
 */
export async function deleteTestCompany(companyId: string): Promise<void> {
  if (!companyId) return;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("companies").delete().eq("id", companyId);
    if (error) {
      console.warn(`[db-helpers] deleteTestCompany(${companyId}) soft-failed: ${error.message}`);
    }
  } catch (e) {
    console.warn(`[db-helpers] deleteTestCompany(${companyId}) threw:`, e);
  }
}

/**
 * Adds a user to a company with a specified role. Idempotent on
 * (company_id, user_id) UNIQUE constraint — re-calling updates role.
 */
export async function addCompanyMember(
  companyId: string,
  userId: string,
  role: CompanyMemberRole = "admin",
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("company_members")
    .upsert(
      {
        company_id: companyId,
        user_id: userId,
        role,
        status: "active",
      },
      { onConflict: "company_id,user_id" },
    );
  if (error) {
    throw new Error(
      `addCompanyMember(${companyId}, ${userId}, ${role}) failed: ${error.message}`,
    );
  }
}

/**
 * Convenience: create employer user + company + admin membership in one call.
 * Returns everything the test will need for cleanup.
 */
export async function createEmployerWithCompany(
  options: CreateTestUserOptions & { companyName?: string; memberRole?: CompanyMemberRole } = {},
): Promise<{ user: TestUser; company: TestCompany; memberRole: CompanyMemberRole }> {
  const user = await createTestUser({
    ...options,
    role: "employer",
    onboardingCompleted: options.onboardingCompleted ?? true,
    status: options.status ?? "active",
  });
  const company = await createTestCompany({
    name: options.companyName,
    createdBy: user.id,
  });
  const memberRole = options.memberRole ?? "admin";
  await addCompanyMember(company.id, user.id, memberRole);
  return { user, company, memberRole };
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * Creates a job row in either:
 *   - `jobs` (scraped board, requires UNIQUE fingerprint) — default
 *   - `job_posts` (employer-created, requires company_id + created_by)
 *
 * The fingerprint for `jobs` is a deterministic SHA-256 of the test prefix +
 * uuid suffix, so duplicate inserts are impossible across parallel test runs.
 */
export async function createTestJob(
  options: CreateTestJobOptions = {},
): Promise<TestJob> {
  const supabase = getAdminClient();
  const source = options.source ?? "jobs";
  const title = options.title ?? uniq("job");
  const companyName = options.companyName ?? uniq("co");

  if (source === "jobs") {
    // Scraped jobs board — required: source, fingerprint (UNIQUE), url, description.
    const fingerprint = createHash("sha256")
      .update(`${TEST_PREFIX}${randomUUID()}`)
      .digest("hex");
    const url = `https://e2e.fitvector.dev/jobs/${fingerprint.slice(0, 12)}`;

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        source: "fitvector",
        fingerprint,
        url,
        title,
        company_name: companyName,
        location: options.location ?? "Bangalore",
        work_mode: options.workMode ?? "hybrid",
        job_type: options.jobType ?? "fulltime",
        description: options.description ?? `${TEST_PREFIX}description for ${title}`,
        skills_required: options.skillsRequired ?? ["TypeScript", "React"],
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`createTestJob(jobs) failed: ${error?.message ?? "no data"}`);
    }
    return { id: data.id, source: "jobs", title, companyName };
  }

  // Employer-created job_posts — required FKs.
  if (!options.companyId || !options.createdBy) {
    throw new Error(
      "createTestJob(job_posts) requires companyId and createdBy in options.",
    );
  }

  const { data, error } = await supabase
    .from("job_posts")
    .insert({
      company_id: options.companyId,
      created_by: options.createdBy,
      title,
      status: "active",
      location: options.location ?? "Bangalore",
      work_mode: options.workMode ?? "hybrid",
      job_type: options.jobType ?? "fulltime",
      description: options.description ?? `${TEST_PREFIX}description for ${title}`,
      required_skills: options.skillsRequired ?? ["TypeScript", "React"],
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`createTestJob(job_posts) failed: ${error?.message ?? "no data"}`);
  }
  return { id: data.id, source: "job_posts", title, companyName };
}

export async function deleteTestJob(
  jobId: string,
  source: "jobs" | "job_posts" = "jobs",
): Promise<void> {
  if (!jobId) return;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from(source).delete().eq("id", jobId);
    if (error) {
      console.warn(
        `[db-helpers] deleteTestJob(${jobId}, ${source}) soft-failed: ${error.message}`,
      );
    }
  } catch (e) {
    console.warn(`[db-helpers] deleteTestJob(${jobId}) threw:`, e);
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Wipes all notification_log rows for a user. Used by tests that need to
 * assert "exactly one new notification was created".
 */
export async function clearNotifications(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("notification_log")
      .delete()
      .eq("user_id", userId);
    if (error) {
      console.warn(
        `[db-helpers] clearNotifications(${userId}) soft-failed: ${error.message}`,
      );
    }
  } catch (e) {
    console.warn(`[db-helpers] clearNotifications(${userId}) threw:`, e);
  }
}

// ─── Usage / quota manipulation ───────────────────────────────────────────────

/**
 * Inserts N rows into usage_logs to push a user up to (or over) a quota
 * boundary. Use this instead of calling the real API N times.
 *
 *   await setUsageCounter(userId, "cold_email", 2)  // free tier hits limit
 */
export async function setUsageCounter(
  userId: string,
  feature: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;
  const supabase = getAdminClient();
  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    feature,
    metadata: { source: "e2e_test" },
  }));
  const { error } = await supabase.from("usage_logs").insert(rows);
  if (error) {
    throw new Error(
      `setUsageCounter(${userId}, ${feature}, ${count}) failed: ${error.message}`,
    );
  }
}

/**
 * Removes all usage_logs rows for (user, feature). Use between tests to reset
 * counters without re-creating the user.
 */
export async function resetUsageCounter(
  userId: string,
  feature: string,
): Promise<void> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("usage_logs")
    .delete()
    .eq("user_id", userId)
    .eq("feature", feature);
  if (error) {
    throw new Error(
      `resetUsageCounter(${userId}, ${feature}) failed: ${error.message}`,
    );
  }
}

/**
 * Returns the current count of usage_logs rows in the **last 24 hours** for
 * (user, feature). Mirrors the eventual server-side daily-window check the
 * team is migrating to (see MASTER_PLAN.md Resolved Decisions §1).
 *
 * Note: production code today still uses a monthly window for some features
 * (e.g., cold_email reads `monthStart`). Tests that depend on the daily
 * boundary should rely on `backdateUsageTimestamp` to push rows out of the
 * window rather than this helper's window assumption.
 */
export async function getUsageCounter(
  userId: string,
  feature: string,
): Promise<number> {
  const supabase = getAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", since);
  if (error) {
    throw new Error(
      `getUsageCounter(${userId}, ${feature}) failed: ${error.message}`,
    );
  }
  return count ?? 0;
}

/**
 * Pushes existing usage_logs rows for (user, feature) backwards in time so
 * they fall outside the reset window. Used by the "counter resets after 24h"
 * boundary test in every quota spec.
 *
 *   // Before: 2 rows at created_at=NOW (free tier at cold_email limit)
 *   await backdateUsageTimestamp(userId, "cold_email", 25)
 *   // After: 2 rows at created_at=NOW-25h → outside daily window → action allowed
 *
 * `hoursAgo` accepts any positive number — pass 25 for daily reset, 745 for
 * monthly reset, etc.
 */
export async function backdateUsageTimestamp(
  userId: string,
  feature: string,
  hoursAgo: number,
): Promise<void> {
  if (hoursAgo <= 0) {
    throw new Error("backdateUsageTimestamp: hoursAgo must be > 0");
  }
  const supabase = getAdminClient();
  const newTimestamp = new Date(
    Date.now() - hoursAgo * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase
    .from("usage_logs")
    .update({ created_at: newTimestamp })
    .eq("user_id", userId)
    .eq("feature", feature);

  if (error) {
    throw new Error(
      `backdateUsageTimestamp(${userId}, ${feature}, ${hoursAgo}h) failed: ${error.message}`,
    );
  }
}

// ─── Applications (tracker rows) ─────────────────────────────────────────────

/**
 * Seeds N rows into the `applications` table to simulate the active_applications
 * stock quota. The tracker POST route counts `applications WHERE user_id=X AND
 * is_archived=false` — NOT usage_logs — so setUsageCounter has no effect.
 *
 * Each row gets a unique job_title (TEST_PREFIX + uuid) to avoid UNIQUE conflicts.
 */
export async function seedApplications(userId: string, count: number): Promise<void> {
  if (count <= 0) return;
  const supabase = getAdminClient();
  const rows = Array.from({ length: count }, (_, i) => ({
    user_id: userId,
    job_title: `${TEST_PREFIX}app_seed_${i}_${randomUUID().slice(0, 6)}`,
    company_name: `${TEST_PREFIX}co_seed_${i}`,
    status: "saved",
    is_archived: false,
    position_order: i + 1,
    status_history: [{ status: "saved", changed_at: new Date().toISOString() }],
  }));
  const { error } = await supabase.from("applications").insert(rows);
  if (error) {
    throw new Error(`seedApplications(${userId}, ${count}) failed: ${error.message}`);
  }
}

/**
 * Removes test-seeded application rows for a user (identified by TEST_PREFIX).
 * Called by active-applications-quota spec's resetCounter override.
 */
export async function clearApplications(userId: string): Promise<void> {
  const supabase = getAdminClient();
  try {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("user_id", userId)
      .like("job_title", `${TEST_PREFIX}%`);
    if (error) {
      console.warn(`[db-helpers] clearApplications(${userId}) soft-failed: ${error.message}`);
    }
  } catch (e) {
    console.warn(`[db-helpers] clearApplications(${userId}) threw:`, e);
  }
}

// ─── Bulk purge (for stuck records from crashed runs) ─────────────────────────

/**
 * Manual rescue tool. Run from a script, not from a test:
 *   node -e "require('./db-helpers').purgeAllTestArtifacts().then(console.log)"
 *
 * Wipes every row whose identifying string column starts with `test_playwright_`.
 * Cascades through users → profiles/applications/usage_logs/etc.
 */
export async function purgeAllTestArtifacts(): Promise<{
  users: number;
  companies: number;
  jobs: number;
  jobPosts: number;
}> {
  const supabase = getAdminClient();
  const stats = { users: 0, companies: 0, jobs: 0, jobPosts: 0 };

  const { data: users } = await supabase
    .from("users")
    .delete()
    .like("email", `${TEST_PREFIX}%`)
    .select("id");
  stats.users = users?.length ?? 0;

  const { data: companies } = await supabase
    .from("companies")
    .delete()
    .like("name", `${TEST_PREFIX}%`)
    .select("id");
  stats.companies = companies?.length ?? 0;

  const { data: jobs } = await supabase
    .from("jobs")
    .delete()
    .like("title", `${TEST_PREFIX}%`)
    .select("id");
  stats.jobs = jobs?.length ?? 0;

  const { data: jobPosts } = await supabase
    .from("job_posts")
    .delete()
    .like("title", `${TEST_PREFIX}%`)
    .select("id");
  stats.jobPosts = jobPosts?.length ?? 0;

  return stats;
}
