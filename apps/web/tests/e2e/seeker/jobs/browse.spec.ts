/**
 * seeker/jobs/browse.spec.ts
 *
 * Verifies the job board's render path under deterministic, mocked search
 * results — no live Python scraping, no real Supabase rows required.
 *
 * Verified against src/app/(dashboard)/dashboard/jobs/page.tsx +
 * src/components/jobs/job-list.tsx:
 *   - First load shows the "Start your job search" EmptyState — there is NO
 *     browse-on-load list.
 *   - Submitting a search via the role input → button kicks off
 *     useJobSearch which GETs /api/jobs/search?role=…&page=1.
 *   - "Load More" is INFINITE SCROLL via IntersectionObserver on a sentinel
 *     div at the bottom of the list. The sentinel triggers fetchNextPage()
 *     when scrolled into view; React Query then GETs page=2.
 *   - Empty results render an EmptyState "No jobs found".
 *
 * Coverage (4 tests):
 *   ✅ first paint shows the empty "Start your job search" state
 *   ✅ search renders one job card per result with title + companyName
 *   ✅ infinite-scroll sentinel triggers a page=2 fetch when revealed
 *   ✅ empty result set renders the "No jobs found" empty state
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page, Route, Request } from "@playwright/test";

interface FakeJob {
  id: string;
  title: string;
  companyName: string;
}

function buildSearchResponse(jobs: FakeJob[], page = 1, total?: number) {
  return {
    data: {
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        companyName: j.companyName,
        companyLogoUrl: null,
        location: "Bangalore",
        workMode: "remote",
        jobType: "fulltime",
        salaryMin: 1500000,
        salaryMax: 3000000,
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
        description: `Description for ${j.title}`,
        isDirect: true,
        jobPostId: j.id,
        applicationDeadline: null,
        openingsCount: 1,
      })),
      total: total ?? jobs.length,
      page,
      usage: { used: 1, limit: 10 },
    },
  };
}

/**
 * Stand up a /api/jobs/search interceptor that returns `pageOne` jobs on
 * page=1 and `pageTwo` jobs on page=2. We can read req.url() to inspect
 * the actual paging param the client sent.
 */
async function mockPagedSearch(
  page: Page,
  pageOne: FakeJob[],
  pageTwo: FakeJob[],
): Promise<{ requests: Request[] }> {
  const requests: Request[] = [];
  await page.route("**/api/jobs/search**", async (route: Route) => {
    requests.push(route.request());
    const url = new URL(route.request().url());
    const pg = Number(url.searchParams.get("page") || "1");
    const body =
      pg === 1
        ? buildSearchResponse(pageOne, 1, pageOne.length + pageTwo.length)
        : buildSearchResponse(pageTwo, pg, pageOne.length + pageTwo.length);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  return { requests };
}

async function runSearch(board: JobBoardPage, query: string): Promise<void> {
  await board.searchInput.fill(query);
  await board.searchButton.click();
}

test.describe("Jobs board — browse", () => {
  test("first paint shows the 'Start your job search' empty state", async ({
    seekerPage,
  }) => {
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    await expect(board.startSearchEmptyState).toBeVisible();
    // No cards rendered before a search is triggered.
    await expect(board.jobCards).toHaveCount(0);
  });

  test("search renders one card per result with the job title and company", async ({
    seekerPage,
  }) => {
    await mockPagedSearch(
      seekerPage,
      [
        { id: "j-1", title: "Frontend Engineer", companyName: "Acme Corp" },
        { id: "j-2", title: "Senior Frontend Engineer", companyName: "Globex" },
        { id: "j-3", title: "Frontend Lead",     companyName: "Initech" },
      ],
      [],
    );

    const board = new JobBoardPage(seekerPage);
    await board.goto();
    await runSearch(board, "frontend");

    await expect(board.resultsCount).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText("Frontend Engineer", { exact: true })).toBeVisible();
    await expect(seekerPage.getByText("Senior Frontend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Frontend Lead")).toBeVisible();
    await expect(seekerPage.getByText("Acme Corp")).toBeVisible();
  });

  test("infinite-scroll sentinel triggers a page=2 fetch when revealed", async ({
    seekerPage,
  }) => {
    const { requests } = await mockPagedSearch(
      seekerPage,
      // First page: enough jobs to fill the viewport, then the sentinel sits below.
      Array.from({ length: 6 }, (_, i) => ({
        id: `j1-${i}`,
        title: `Backend Engineer ${i + 1}`,
        companyName: `Company ${i + 1}`,
      })),
      // Second page jobs — only fetched when the sentinel scrolls into view.
      [{ id: "j2-1", title: "Backend Engineer Page Two", companyName: "Page2 Co" }],
    );

    const board = new JobBoardPage(seekerPage);
    await board.goto();
    await runSearch(board, "backend");

    // First page lands.
    await expect(seekerPage.getByText("Backend Engineer 1")).toBeVisible({
      timeout: 10_000,
    });

    // Scroll the sentinel into view so the IntersectionObserver fires.
    await seekerPage
      .getByText("Backend Engineer 6")
      .scrollIntoViewIfNeeded();

    // The second-page card should land once page=2 resolves.
    await expect(seekerPage.getByText("Backend Engineer Page Two")).toBeVisible({
      timeout: 15_000,
    });

    // Two distinct page params should have been requested across all calls.
    const pages = new Set(
      requests.map((r) => new URL(r.url()).searchParams.get("page") || "1"),
    );
    expect(
      pages.size,
      `expected at least 2 distinct page params, got ${[...pages].join(",")}`,
    ).toBeGreaterThanOrEqual(2);
  });

  test("zero results from the API renders the 'No jobs found' empty state", async ({
    seekerPage,
  }) => {
    await mockPagedSearch(seekerPage, [], []);
    const board = new JobBoardPage(seekerPage);
    await board.goto();
    await runSearch(board, "queryThatMatchesNothing");

    await expect(board.noJobsFound).toBeVisible({ timeout: 10_000 });
    await expect(board.jobCards).toHaveCount(0);
  });
});
