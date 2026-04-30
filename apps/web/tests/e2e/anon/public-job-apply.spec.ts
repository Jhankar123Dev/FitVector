/**
 * anon/public-job-apply.spec.ts
 *
 * NB: despite living under anon/, /api/apply/fitvector/[jobPostId] is NOT
 * anonymous — `await auth()` is called at the top of the handler. The MASTER_PLAN
 * documents this exception. The spec runs WITHOUT pre-auth (so we can verify the
 * 401 path) and uses signInAs() directly when an authenticated path is needed.
 *
 * Verified against src/app/api/apply/fitvector/[jobPostId]/route.ts:
 *   - 401 if no session
 *   - 400 if body.resumeId is present but not a UUID
 *   - 404 if job post missing or status != 'active'
 *   - 409 on second apply for the same { applicant_user_id, job_post_id }
 *   - 201 on success: returns { id, applicantId, status: 'applied' }
 *     and inserts rows in BOTH `applicants` (pipeline_stage='applied') AND
 *     `fitvector_applications`. PDF generation is best-effort and skipped
 *     entirely when body.resumeId is omitted.
 *
 * Coverage (6 tests):
 *   ✅ authed seeker apply (no resumeId) → 201 with applicantId
 *   ✅ creates rows in applicants (pipeline_stage='applied') AND fitvector_applications
 *   ❌ second apply same job → 409
 *   ❌ no session → 401
 *   ❌ invalid resumeId UUID → 400
 *   ❌ non-existent job post → 404
 */

import { test, expect } from "../support/fixtures";
import { signInAs } from "../support/helpers/auth";
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
} from "../support/helpers/db-helpers";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

interface ApplyHarness {
  seeker: TestUser;
  company: TestCompany;
  job: TestJob;
  cleanup: () => Promise<void>;
}

/**
 * Builds a complete apply chain: company + employer (job creator) +
 * job_posts row + a fresh seeker with onboarding completed. Returns a
 * cleanup() that tears it all down.
 */
async function buildApplyHarness(): Promise<ApplyHarness> {
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

test.describe("FitVector apply endpoint contract", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("authenticated seeker apply (no resumeId) → 201 with applicantId", async ({
    page,
  }) => {
    const h = await buildApplyHarness();
    try {
      await signInAs(page.context(), h.seeker);

      const res = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: {} },
      );
      expect(res.status()).toBe(201);

      const json = (await res.json()) as {
        data: { id: string; applicantId: string; status: string };
      };
      expect(json.data.applicantId).toBeTruthy();
      expect(json.data.id).toBeTruthy();
      expect(json.data.status).toBe("applied");
    } finally {
      await h.cleanup();
    }
  });

  test("creates rows in applicants (pipeline_stage=applied) AND fitvector_applications", async ({
    page,
  }) => {
    const h = await buildApplyHarness();
    try {
      await signInAs(page.context(), h.seeker);

      const res = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: {} },
      );
      expect(res.status()).toBe(201);

      const supabase = getAdminClient();
      const { data: applicantRow } = await supabase
        .from("applicants")
        .select("id, pipeline_stage, job_post_id, user_id")
        .eq("job_post_id", h.job.id)
        .eq("user_id", h.seeker.id)
        .single();
      expect(applicantRow?.pipeline_stage).toBe("applied");

      const { data: fvRow } = await supabase
        .from("fitvector_applications")
        .select("id, status, applicant_user_id, job_post_id, applicant_id")
        .eq("job_post_id", h.job.id)
        .eq("applicant_user_id", h.seeker.id)
        .single();
      expect(fvRow?.status).toBe("applied");
      expect(fvRow?.applicant_id).toBe(applicantRow?.id);
    } finally {
      await h.cleanup();
    }
  });

  test("second apply to the same job → 409 already-applied", async ({ page }) => {
    const h = await buildApplyHarness();
    try {
      await signInAs(page.context(), h.seeker);

      const first = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: {} },
      );
      expect(first.status()).toBe(201);

      const second = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: {} },
      );
      expect(second.status()).toBe(409);
      const json = (await second.json()) as { error: string };
      expect(json.error).toMatch(/already applied/i);
    } finally {
      await h.cleanup();
    }
  });

  test("no session → 401", async ({ page }) => {
    const h = await buildApplyHarness();
    try {
      // Deliberately do NOT signInAs — anonymous request.
      const res = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: {} },
      );
      expect(res.status()).toBe(401);
    } finally {
      await h.cleanup();
    }
  });

  test("invalid resumeId (not a UUID) → 400", async ({ page }) => {
    const h = await buildApplyHarness();
    try {
      await signInAs(page.context(), h.seeker);

      const res = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${h.job.id}`,
        { data: { resumeId: "res-001" } }, // legacy mock-id format
      );
      expect(res.status()).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toMatch(/invalid resume id/i);
    } finally {
      await h.cleanup();
    }
  });

  test("non-existent job post → 404", async ({ page }) => {
    const seeker = await createTestUser({
      role: "seeker",
      onboardingCompleted: true,
      status: "active",
    });
    try {
      await signInAs(page.context(), seeker);

      // Random valid UUID that won't match any row.
      const ghostJobId = "00000000-0000-4000-8000-000000000000";
      const res = await page.request.post(
        `${BASE_URL}/api/apply/fitvector/${ghostJobId}`,
        { data: {} },
      );
      expect(res.status()).toBe(404);
    } finally {
      await deleteTestUser(seeker.id);
    }
  });
});
