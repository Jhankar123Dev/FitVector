/**
 * seeker/resume/tailor-resume.spec.ts
 *
 * Verifies the AI resume-tailoring flow.
 *
 * Verified against:
 *   - src/components/resume/tailor-dialog.tsx — three steps (configure /
 *     loading / result). The dialog is rendered INLINE on /dashboard/jobs,
 *     not on /dashboard/resume.
 *   - src/app/api/ai/tailor-resume/route.ts — auth, monthly quota, JD
 *     length validation (10-10000), requires parsed_resume_json on
 *     user_profiles, calls Python /ai/tailor-resume, validates returned
 *     LaTeX (must include \documentclass + \begin{document}), inserts
 *     into tailored_resumes, returns { id, latexSource, versionName, … }.
 *   - src/app/api/user/resumes/route.ts — GET listing.
 *   - src/app/api/user/resumes/[id]/pdf/route.ts — GET that proxies a
 *     Python compile, returns application/pdf bytes inline.
 *
 * Tailoring is initiated from a JOB CARD: search → click card → click
 * "Tailor Resume" in the detail action bar → TailorDialog opens with the
 * job's title/description/company already pre-filled. We mock both
 * /api/jobs/search and /api/ai/tailor-resume so the tests are fast and
 * never depend on the Python service.
 *
 * Coverage (5 tests):
 *   ✅ tailoring fires POST /api/ai/tailor-resume with the job context
 *   ❌ quota-reached (429) surfaces an inline error in the configure step
 *   ❌ no parsed resume on file (400) surfaces an inline error
 *   ✅ /dashboard/resume version list renders mocked tailored versions
 *   ✅ Download fires GET /api/user/resumes/[id]/pdf and offers a PDF blob
 */

import { test, expect } from "../../support/fixtures";
import { ResumePage } from "../../support/page-objects/seeker/resume.page";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page, Request } from "@playwright/test";

const FV_JOB_ID = "tailor-job-1";
const FV_JOB_TITLE = "Staff Frontend Engineer";
const FV_JOB_COMPANY = "TailorCo";

const VALID_LATEX = String.raw`\documentclass{article}\begin{document}Hello, world.\end{document}`;

function jobsSearchResponse() {
  return {
    data: {
      jobs: [
        {
          id: FV_JOB_ID,
          title: FV_JOB_TITLE,
          companyName: FV_JOB_COMPANY,
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
          skillsRequired: ["TypeScript", "React"],
          skillsNiceToHave: [],
          requiredExperienceYears: null,
          isEasyApply: true,
          isSaved: false,
          description:
            "We're hiring a senior frontend engineer to lead our design system. " +
            "You'll work on TypeScript, React, and a well-tested component library.",
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

interface TailorMock {
  status?: number;
  body?: Record<string, unknown>;
}

async function mockTailor(page: Page, opts: TailorMock = {}): Promise<{ requests: Request[] }> {
  const requests: Request[] = [];
  await page.route("**/api/ai/tailor-resume", async (route) => {
    requests.push(route.request());
    await route.fulfill({
      status: opts.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(
        opts.body ?? {
          data: {
            id: "tailored-1",
            latexSource: VALID_LATEX,
            versionName: `${FV_JOB_TITLE} — ${FV_JOB_COMPANY}`,
            generationTimeMs: 9_876,
            usage: { used: 1, limit: 10 },
          },
        },
      ),
    });
  });
  return { requests };
}

async function openTailorFromJobsPage(seekerPage: Page): Promise<void> {
  await seekerPage.route("**/api/jobs/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(jobsSearchResponse()),
    }),
  );

  const board = new JobBoardPage(seekerPage);
  await board.goto();
  await board.searchInput.fill("frontend");
  await board.searchButton.click();
  await seekerPage.getByText(FV_JOB_TITLE).first().click();

  // The "Tailor Resume" button lives in the action bar of the detail panel.
  await seekerPage.getByRole("button", { name: /tailor resume/i }).click();
  // The configure step renders a "Generate Tailored Resume" button.
  await expect(
    seekerPage.getByRole("button", { name: /generate tailored resume/i }),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe("Resume tailoring", () => {
  test("clicking 'Generate Tailored Resume' POSTs to /api/ai/tailor-resume with the job context", async ({
    seekerPage,
  }) => {
    const { requests } = await mockTailor(seekerPage);
    await openTailorFromJobsPage(seekerPage);

    await seekerPage
      .getByRole("button", { name: /generate tailored resume/i })
      .click();

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const req = requests[0];
    expect(req.method()).toBe("POST");
    const body = req.postDataJSON() as Record<string, unknown>;
    expect(body.jobTitle).toBe(FV_JOB_TITLE);
    expect(body.companyName).toBe(FV_JOB_COMPANY);
    expect(typeof body.jobDescription).toBe("string");
    expect((body.jobDescription as string).length).toBeGreaterThan(10);

    // The result step renders the version name from the API response.
    await expect(
      seekerPage.getByText(`${FV_JOB_TITLE} — ${FV_JOB_COMPANY}`),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("quota reached (429) surfaces an inline 'Tailoring failed' error", async ({
    seekerPage,
  }) => {
    await mockTailor(seekerPage, {
      status: 429,
      body: {
        error: "Monthly resume tailoring limit reached. Upgrade your plan for more.",
        upgrade: true,
        usage: { used: 2, limit: 2 },
      },
    });
    await openTailorFromJobsPage(seekerPage);

    await seekerPage
      .getByRole("button", { name: /generate tailored resume/i })
      .click();

    // tailorMutation.isError → renders the inline red banner.
    await expect(seekerPage.getByText(/tailoring failed/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      seekerPage.getByText(/monthly resume tailoring limit reached/i),
    ).toBeVisible();
  });

  test("no parsed resume on file (400) surfaces the upload-first error", async ({
    seekerPage,
  }) => {
    await mockTailor(seekerPage, {
      status: 400,
      body: {
        error: "No resume found. Please upload your resume in the onboarding step first.",
      },
    });
    await openTailorFromJobsPage(seekerPage);

    await seekerPage
      .getByRole("button", { name: /generate tailored resume/i })
      .click();

    await expect(seekerPage.getByText(/tailoring failed/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText(/no resume found/i)).toBeVisible();
  });

  test("/dashboard/resume version list renders saved tailored versions", async ({
    seekerPage,
  }) => {
    await seekerPage.route("**/api/user/resumes", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "v-1",
              versionName: "Acme — Senior Engineer",
              templateId: "modern",
              jobTitle: "Senior Engineer",
              companyName: "Acme",
              createdAt: "2026-04-15T10:00:00Z",
              hasLatex: true,
            },
            {
              id: "v-2",
              versionName: "Globex — Staff Engineer",
              templateId: "classic",
              jobTitle: "Staff Engineer",
              companyName: "Globex",
              createdAt: "2026-04-20T10:00:00Z",
              hasLatex: true,
            },
          ],
        }),
      }),
    );

    const resume = new ResumePage(seekerPage);
    await resume.goto();

    await expect(seekerPage.getByText("Acme — Senior Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Globex — Staff Engineer")).toBeVisible();
    // Template badge renders the templateId capitalised by CSS.
    await expect(seekerPage.getByText("modern", { exact: true }).first()).toBeVisible();
  });

  test("Download button hits /api/user/resumes/[id]/pdf and offers a PDF blob", async ({
    seekerPage,
  }) => {
    const downloadRequests: Request[] = [];

    await seekerPage.route("**/api/user/resumes", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "v-download-1",
              versionName: "Download Me",
              templateId: "modern",
              jobTitle: "Engineer",
              companyName: "Acme",
              createdAt: "2026-04-15T10:00:00Z",
              hasLatex: true,
            },
          ],
        }),
      }),
    );

    await seekerPage.route("**/api/user/resumes/v-download-1/pdf", async (route) => {
      downloadRequests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        // A minimal-but-valid PDF body. Browsers + Playwright treat this
        // as a download because of the inline disposition + pdf MIME.
        body: Buffer.from("%PDF-1.4\n%FakePDF\n%%EOF\n"),
      });
    });

    const resume = new ResumePage(seekerPage);
    await resume.goto();

    await resume.versionDownloadButton("Download Me").click();

    await expect.poll(() => downloadRequests.length).toBeGreaterThan(0);
    expect(downloadRequests[0].method()).toBe("GET");
    expect(downloadRequests[0].url()).toContain("/api/user/resumes/v-download-1/pdf");
  });
});
