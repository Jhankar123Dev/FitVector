/**
 * seeker/jobs/apply.spec.ts
 *
 * Drives the FitVector apply flow from the seeker board.
 *
 * Verified against:
 *   - src/components/jobs/action-bar.tsx — for sources.includes("fitvector"),
 *     renders <Button>Apply via FitVector</Button> (NOT an anchor).
 *   - src/components/jobs/fitvector-apply-modal.tsx — opens a modal with:
 *       • Resume tile picker (must be selected for submit to enable)
 *       • Optional screening Q&A (required Qs gate the Submit button)
 *       • Optional cover note <Textarea>
 *       • <Button>Submit Application</Button>
 *   - src/hooks/use-fitvector-apply.ts → POST /api/apply/fitvector/[jobPostId]
 *   - On success: phase becomes "success", confetti renders, parent calls
 *     onSubmitted() which closes the modal.
 *   - The action-bar reads `alreadyApplied` (passed from the parent page,
 *     which derives it from useFitVectorApplications). When true the
 *     "Apply via FitVector" button is replaced with an "Applied" badge.
 *
 * MASTER_PLAN's "external Apply hits an ATS" was confirmed as redirect-only
 * (anchor target=_blank) — already covered in job-detail.spec.ts. This spec
 * focuses on the FitVector internal apply flow.
 *
 * Coverage (5 tests):
 *   ✅ Apply via FitVector opens the modal
 *   ✅ Submit button is disabled until a resume is selected
 *   ✅ Submit POSTs /api/apply/fitvector/[jobPostId] with the chosen resumeId
 *   ✅ a 409 "already applied" response surfaces an inline alreadyApplied panel
 *   ✅ when useFitVectorApplications already lists the job, "Applied" badge
 *      replaces the apply button (no modal trigger)
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page, Request } from "@playwright/test";

const FV_JOB_ID = "fv-apply-1";
const RESUME_ID = "11111111-1111-4111-8111-111111111111";

function jobsSearchResponse() {
  return {
    data: {
      jobs: [
        {
          id: FV_JOB_ID,
          title: "Senior Frontend Engineer",
          companyName: "Acme Apply Co",
          companyLogoUrl: null,
          location: "Bangalore",
          workMode: "remote",
          jobType: "fulltime",
          salaryMin: 2500000,
          salaryMax: 4500000,
          salaryCurrency: "INR",
          postedAt: new Date().toISOString(),
          sources: ["fitvector"],
          url: "",
          matchScore: null,
          matchBucket: null,
          decisionLabel: null,
          embeddingScore: null,
          deterministicScore: null,
          deterministicComponents: null,
          skillsRequired: ["TypeScript"],
          skillsNiceToHave: [],
          requiredExperienceYears: null,
          isEasyApply: true,
          isSaved: false,
          description: "Internal apply description",
          isDirect: true,
          jobPostId: FV_JOB_ID,
          applicationDeadline: null,
          openingsCount: 1,
        },
      ],
      total: 1,
      page: 1,
      usage: { used: 1, limit: 10 },
    },
  };
}

interface ApplyMocks {
  /** Pre-existing FitVector applications visible to the page. */
  applications?: Array<{ id?: string; jobId: string; employerJobPostId?: string }>;
  /** Resume options to expose to the modal. */
  resumes?: Array<{ id: string; versionName: string }>;
  /** Status to return from POST /api/apply/fitvector/[jobPostId]. */
  applyStatus?: number;
  /** Body to return from the apply POST. */
  applyBody?: Record<string, unknown>;
}

async function mockApplyChain(
  page: Page,
  opts: ApplyMocks = {},
): Promise<{ applyRequests: Request[] }> {
  const apps = opts.applications ?? [];
  const resumes = opts.resumes ?? [
    { id: RESUME_ID, versionName: "Base Resume" },
  ];
  const applyRequests: Request[] = [];

  await page.route("**/api/jobs/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(jobsSearchResponse()),
    }),
  );

  await page.route("**/api/applications/fitvector", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: apps }),
    }),
  );

  // The apply modal lists tailored_resumes — best-effort common shapes.
  await page.route("**/api/seeker/resumes**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: resumes }),
    }),
  );
  await page.route("**/api/user/resumes**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: resumes }),
    }),
  );

  await page.route(`**/api/apply/fitvector/${FV_JOB_ID}`, async (route) => {
    applyRequests.push(route.request());
    await route.fulfill({
      status: opts.applyStatus ?? 201,
      contentType: "application/json",
      body: JSON.stringify(
        opts.applyBody ?? {
          data: { id: "fv-app-1", applicantId: "applicant-1", status: "applied" },
        },
      ),
    });
  });

  return { applyRequests };
}

async function searchAndOpenJob(board: JobBoardPage): Promise<void> {
  await board.goto();
  await board.searchInput.fill("frontend");
  await board.searchButton.click();
  await board.page
    .getByText("Senior Frontend Engineer")
    .first()
    .click();
}

test.describe("Apply flow — FitVector internal", () => {
  test("clicking 'Apply via FitVector' opens the apply modal", async ({
    seekerPage,
  }) => {
    await mockApplyChain(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await searchAndOpenJob(board);

    await board.applyFitVectorButton.click();
    // The modal renders the job title in its header AND a "Submit Application"
    // button — using the button as the unambiguous "modal opened" anchor.
    await expect(board.applyModalSubmitButton).toBeVisible({ timeout: 10_000 });
  });

  test("Submit Application is disabled until a resume is selected", async ({
    seekerPage,
  }) => {
    await mockApplyChain(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await searchAndOpenJob(board);

    await board.applyFitVectorButton.click();
    await expect(board.applyModalSubmitButton).toBeVisible({ timeout: 10_000 });
    // Modal opens with no resume selected — submit must be disabled.
    await expect(board.applyModalSubmitButton).toBeDisabled();
  });

  test("submitting fires POST /api/apply/fitvector/[jobPostId] with the chosen resumeId", async ({
    seekerPage,
  }) => {
    const { applyRequests } = await mockApplyChain(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await searchAndOpenJob(board);

    await board.applyFitVectorButton.click();
    await expect(board.applyModalSubmitButton).toBeVisible({ timeout: 10_000 });

    // Click the resume tile (rendered as a labelled button/option).
    await board.applyModalResumeOption("Base Resume").click();
    await expect(board.applyModalSubmitButton).toBeEnabled({ timeout: 5_000 });
    await board.applyModalSubmitButton.click();

    await expect.poll(() => applyRequests.length).toBeGreaterThan(0);
    const req = applyRequests[0];
    expect(req.method()).toBe("POST");
    expect(req.url()).toContain(`/api/apply/fitvector/${FV_JOB_ID}`);
    const body = req.postDataJSON() as Record<string, unknown>;
    // The modal sends resumeId in the body. Other fields (matchScore,
    // screeningAnswers, coverNote) are optional.
    expect(body.resumeId).toBe(RESUME_ID);
  });

  test("API 409 surfaces the 'already applied' inline messaging", async ({
    seekerPage,
  }) => {
    await mockApplyChain(seekerPage, {
      applyStatus: 409,
      applyBody: { error: "You have already applied to this job" },
    });
    const board = new JobBoardPage(seekerPage);
    await searchAndOpenJob(board);

    await board.applyFitVectorButton.click();
    await expect(board.applyModalSubmitButton).toBeVisible({ timeout: 10_000 });
    await board.applyModalResumeOption("Base Resume").click();
    await board.applyModalSubmitButton.click();

    // The 409 path is surfaced either by the inline already-applied panel OR
    // by an inline error banner — accept either, since both indicate the
    // user can't double-apply.
    await expect(
      seekerPage.getByText(/already applied|already submitted/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("when the job is already in useFitVectorApplications, the action bar shows the 'Applied' badge", async ({
    seekerPage,
  }) => {
    await mockApplyChain(seekerPage, {
      applications: [
        {
          id: "existing-app-1",
          jobId: FV_JOB_ID,
          employerJobPostId: FV_JOB_ID,
        },
      ],
    });
    const board = new JobBoardPage(seekerPage);
    await searchAndOpenJob(board);

    // The "Apply via FitVector" button is replaced by an "Applied" badge.
    await expect(board.appliedBadge).toBeVisible({ timeout: 10_000 });
    await expect(board.applyFitVectorButton).toHaveCount(0);
  });
});
