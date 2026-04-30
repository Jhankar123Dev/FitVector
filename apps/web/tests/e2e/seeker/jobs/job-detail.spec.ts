/**
 * seeker/jobs/job-detail.spec.ts
 *
 * Verifies the dedicated detail page at /dashboard/jobs/[id].
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/jobs/[id]/page.tsx — useQuery on
 *     /api/jobs/{id}, renders <JobDetailPanel job={data.data} />.
 *   - src/components/jobs/job-detail.tsx — title <h2>, company line, salary,
 *     description, "Required Skills" list, ActionBar at the bottom.
 *   - src/components/jobs/action-bar.tsx — for FitVector jobs (sources
 *     includes "fitvector") shows "Apply via FitVector"; for external jobs
 *     shows an <a target="_blank">Apply</a> linking to job.url.
 *
 * Tests mock /api/jobs/{id} so they're deterministic and don't depend on
 * any DB rows.
 *
 * Coverage (4 tests):
 *   ✅ detail page loads and shows the title + company
 *   ✅ description, salary, and required-skills render
 *   ✅ FitVector job → "Apply via FitVector" + "Save" button visible
 *   ✅ External job → external "Apply" anchor with target=_blank visible
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page } from "@playwright/test";

interface MockJobOpts {
  id?: string;
  title?: string;
  companyName?: string;
  description?: string;
  fitvector?: boolean;
  externalUrl?: string;
}

function makeJob(opts: MockJobOpts = {}) {
  const id = opts.id ?? "job-mock-1";
  const isFitVector = opts.fitvector ?? true;
  return {
    id,
    title: opts.title ?? "Senior Frontend Engineer",
    companyName: opts.companyName ?? "Acme Corp",
    companyLogoUrl: null,
    location: "Bangalore",
    workMode: "remote",
    jobType: "fulltime",
    salaryMin: 2500000,
    salaryMax: 4500000,
    salaryCurrency: "INR",
    postedAt: new Date().toISOString(),
    sources: isFitVector ? ["fitvector"] : ["linkedin"],
    url: isFitVector ? "" : (opts.externalUrl ?? "https://example.com/job/123"),
    matchScore: null,
    matchBucket: null,
    decisionLabel: null,
    embeddingScore: null,
    deterministicScore: null,
    deterministicComponents: null,
    skillsRequired: ["TypeScript", "React", "GraphQL"],
    skillsNiceToHave: [],
    requiredExperienceYears: null,
    isEasyApply: isFitVector,
    isSaved: false,
    description: opts.description ?? "We're hiring a TypeScript engineer to lead the design system.",
    isDirect: isFitVector,
    jobPostId: id,
    applicationDeadline: null,
    openingsCount: 1,
  };
}

async function mockJobDetail(page: Page, job: ReturnType<typeof makeJob>): Promise<void> {
  await page.route(`**/api/jobs/${job.id}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: job }),
    });
  });
}

test.describe("Job detail page (/dashboard/jobs/[id])", () => {
  test("loads the job detail page and renders the title + company", async ({
    seekerPage,
  }) => {
    const job = makeJob({ id: "j-detail-1", title: "Staff Engineer", companyName: "Globex" });
    await mockJobDetail(seekerPage, job);

    const board = new JobBoardPage(seekerPage);
    await board.gotoDetail(job.id);

    // The detail panel renders <h2> with the title.
    await expect(seekerPage.locator("h2", { hasText: "Staff Engineer" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText("Globex")).toBeVisible();
  });

  test("description, salary, and required-skills all render in the detail panel", async ({
    seekerPage,
  }) => {
    const job = makeJob({
      id: "j-detail-2",
      description: "We need a Rustacean to build the next-gen vector DB.",
    });
    await mockJobDetail(seekerPage, job);

    const board = new JobBoardPage(seekerPage);
    await board.gotoDetail(job.id);

    await expect(
      seekerPage.getByText(/Rustacean to build the next-gen vector DB/i),
    ).toBeVisible({ timeout: 10_000 });
    // Salary formatter renders ₹25.0L - ₹45.0L / year for these values.
    await expect(seekerPage.getByText(/₹25\.0L\s*-\s*₹45\.0L/)).toBeVisible();
    // Required skills appear as their literal text in the panel.
    for (const skill of job.skillsRequired) {
      await expect(seekerPage.getByText(skill, { exact: true }).first()).toBeVisible();
    }
  });

  test("FitVector job shows 'Apply via FitVector' + Save button", async ({
    seekerPage,
  }) => {
    const job = makeJob({ id: "j-detail-fv", fitvector: true });
    await mockJobDetail(seekerPage, job);

    const board = new JobBoardPage(seekerPage);
    await board.gotoDetail(job.id);

    await expect(board.applyFitVectorButton).toBeVisible({ timeout: 10_000 });
    // External "Apply" anchor must NOT exist when sources is fitvector-only.
    await expect(board.applyExternalLink).toHaveCount(0);
    await expect(board.saveButton).toBeVisible();
  });

  test("external job shows an external 'Apply' anchor with target=_blank", async ({
    seekerPage,
  }) => {
    const job = makeJob({
      id: "j-detail-ext",
      fitvector: false,
      externalUrl: "https://linkedin.com/jobs/12345",
    });
    await mockJobDetail(seekerPage, job);

    const board = new JobBoardPage(seekerPage);
    await board.gotoDetail(job.id);

    const apply = board.applyExternalLink;
    await expect(apply).toBeVisible({ timeout: 10_000 });
    await expect(apply).toHaveAttribute("target", "_blank");
    await expect(apply).toHaveAttribute("href", job.url);
    // The FitVector apply button must NOT show for external jobs.
    await expect(board.applyFitVectorButton).toHaveCount(0);
  });
});
