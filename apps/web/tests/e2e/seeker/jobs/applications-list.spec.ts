/**
 * seeker/jobs/applications-list.spec.ts
 *
 * NB: There is NO standalone /dashboard/applications route. The seeker side
 * surfaces FitVector applications via:
 *   - the tracker page at /dashboard/tracker (renders the Applied tab from
 *     useFitVectorApplications), and
 *   - the data hook itself: useFitVectorApplications → GET /api/applications/fitvector.
 *
 * This spec verifies the API contract end-to-end. The MASTER_PLAN's
 * "list renders / status badges / sort by date / empty state" map cleanly
 * onto the API response shape because the page literally renders what the
 * route returns.
 *
 * Verified against src/app/api/applications/fitvector/route.ts:
 *   GET, requires auth() session.
 *   Selects fitvector_applications + nested job_posts/companies.
 *   Returns: data: [{
 *     id, jobId, jobTitle, companyName, companyLogoUrl, location,
 *     resumeName, status: `fv_${row.status}`, statusTimeline,
 *     appliedAt (= row.created_at), updatedAt
 *   }, ...] sorted by created_at DESC.
 *
 * Coverage (4 tests):
 *   ✅ authed seeker GET returns the seeker's FitVector apps
 *   ✅ status field is prefixed with "fv_" in the response
 *   ✅ rows are sorted newest-first by appliedAt (created_at DESC)
 *   ✅ no apps for this user → data: []
 */

import { test, expect } from "../../support/fixtures";
import { signInAs } from "../../support/helpers/auth";
import {
  getAdminClient,
  createTestUser,
  deleteTestUser,
  createTestCompany,
  deleteTestCompany,
  createTestJob,
  deleteTestJob,
  type TestUser,
  type TestCompany,
  type TestJob,
} from "../../support/helpers/db-helpers";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

interface AppRow {
  applicant_user_id: string;
  job_post_id: string;
  applicant_id: string;
  status: "applied" | "screening" | "shortlisted" | "interviewing" | "offer" | "hired" | "rejected";
  created_at?: string;
  status_timeline?: Array<{ status: string; label: string; timestamp: string }>;
}

interface Harness {
  seeker: TestUser;
  employer: TestUser;
  company: TestCompany;
  job: TestJob;
  cleanup: () => Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const employer = await createTestUser({
    role: "employer",
    onboardingCompleted: true,
    status: "active",
  });
  const company = await createTestCompany();
  const job = await createTestJob({
    source: "job_posts",
    companyId: company.id,
    createdBy: employer.id,
  });
  const seeker = await createTestUser({
    role: "seeker",
    onboardingCompleted: true,
    status: "active",
  });
  return {
    seeker,
    employer,
    company,
    job,
    cleanup: async () => {
      await deleteTestJob(job.id, "job_posts");
      await deleteTestCompany(company.id);
      await deleteTestUser(seeker.id);
      await deleteTestUser(employer.id);
    },
  };
}

async function seedApplication(h: Harness, overrides: Partial<AppRow> = {}): Promise<string> {
  const supabase = getAdminClient();

  // Need an applicants row first (FK).
  const { data: applicant, error: applicantErr } = await supabase
    .from("applicants")
    .insert({
      job_post_id: h.job.id,
      user_id: h.seeker.id,
      name: h.seeker.fullName,
      email: h.seeker.email,
      source: "fitvector_organic",
      pipeline_stage: "applied",
    })
    .select("id")
    .single();
  if (applicantErr || !applicant) {
    throw new Error(`seedApplication: applicant insert failed: ${applicantErr?.message}`);
  }

  const row: AppRow & { applicant_id: string } = {
    applicant_user_id: h.seeker.id,
    job_post_id: h.job.id,
    applicant_id: applicant.id,
    status: overrides.status ?? "applied",
    created_at: overrides.created_at,
    status_timeline: overrides.status_timeline ?? [
      { status: "fv_applied", label: "Applied via FitVector", timestamp: new Date().toISOString() },
    ],
  };
  // Strip undefined created_at so DB default fills in.
  const insert: Record<string, unknown> = { ...row };
  if (insert.created_at === undefined) delete insert.created_at;

  const { data: fv, error: fvErr } = await supabase
    .from("fitvector_applications")
    .insert(insert)
    .select("id")
    .single();
  if (fvErr || !fv) {
    throw new Error(`seedApplication: fitvector_applications insert failed: ${fvErr?.message}`);
  }
  return fv.id;
}

test.describe("/api/applications/fitvector — seeker applications list", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("authed seeker GET returns rows with the expected shape", async ({ page }) => {
    const h = await buildHarness();
    try {
      await seedApplication(h, { status: "applied" });
      await signInAs(page.context(), h.seeker);

      const res = await page.request.get(`${BASE_URL}/api/applications/fitvector`);
      expect(res.status()).toBe(200);

      const json = (await res.json()) as {
        data: Array<{
          id: string;
          jobTitle: string;
          companyName: string;
          status: string;
          appliedAt: string;
        }>;
      };

      expect(json.data.length).toBeGreaterThanOrEqual(1);
      const first = json.data[0];
      expect(first.id).toBeTruthy();
      expect(first.appliedAt).toBeTruthy();
      // Job/company are joined from job_posts / companies — confirm both shapes.
      expect(first.jobTitle).toBe(h.job.title);
      expect(first.companyName).toBe(h.company.name);
    } finally {
      await h.cleanup();
    }
  });

  test("status field is prefixed with 'fv_' in the response", async ({ page }) => {
    const h = await buildHarness();
    try {
      await seedApplication(h, { status: "applied" });
      await signInAs(page.context(), h.seeker);

      const res = await page.request.get(`${BASE_URL}/api/applications/fitvector`);
      const json = (await res.json()) as { data: Array<{ status: string }> };
      // Route prepends fv_ to every row's status.
      expect(json.data[0]?.status).toMatch(/^fv_/);
    } finally {
      await h.cleanup();
    }
  });

  test("rows are sorted newest-first by appliedAt (created_at DESC)", async ({ page }) => {
    const h = await buildHarness();
    try {
      // Two apps with explicit timestamps. Need a second job_post since the
      // table has a unique (applicant_user_id, job_post_id) covering index.
      const supabase = getAdminClient();
      const job2 = await createTestJob({
        source: "job_posts",
        companyId: h.company.id,
        createdBy: h.employer.id,
      });

      // Older one.
      await seedApplication(h, {
        created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
      });

      // Newer one — manually attach to job2.
      const { data: applicant2 } = await supabase
        .from("applicants")
        .insert({
          job_post_id: job2.id,
          user_id: h.seeker.id,
          name: h.seeker.fullName,
          email: h.seeker.email,
          source: "fitvector_organic",
          pipeline_stage: "applied",
        })
        .select("id")
        .single();
      await supabase.from("fitvector_applications").insert({
        applicant_user_id: h.seeker.id,
        job_post_id: job2.id,
        applicant_id: applicant2!.id,
        status: "applied",
        created_at: new Date("2026-04-01T00:00:00Z").toISOString(),
      });

      try {
        await signInAs(page.context(), h.seeker);
        const res = await page.request.get(`${BASE_URL}/api/applications/fitvector`);
        const json = (await res.json()) as {
          data: Array<{ jobId: string; appliedAt: string }>;
        };
        expect(json.data.length).toBe(2);
        const [first, second] = json.data;
        expect(new Date(first.appliedAt).getTime()).toBeGreaterThan(
          new Date(second.appliedAt).getTime(),
        );
      } finally {
        await deleteTestJob(job2.id, "job_posts");
      }
    } finally {
      await h.cleanup();
    }
  });

  test("seeker with no FitVector applications gets data: []", async ({ page }) => {
    const seeker = await createTestUser({
      role: "seeker",
      onboardingCompleted: true,
      status: "active",
    });
    try {
      await signInAs(page.context(), seeker);

      const res = await page.request.get(`${BASE_URL}/api/applications/fitvector`);
      expect(res.status()).toBe(200);
      const json = (await res.json()) as { data: unknown[] };
      expect(json.data).toEqual([]);
    } finally {
      await deleteTestUser(seeker.id);
    }
  });
});
