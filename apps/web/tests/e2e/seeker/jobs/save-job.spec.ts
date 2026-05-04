/**
 * seeker/jobs/save-job.spec.ts
 *
 * Verifies the Save flow on the search results detail panel.
 *
 * Verified against src/app/(dashboard)/dashboard/jobs/page.tsx::handleToggleSave:
 *
 *   - Click "Save" → POST /api/tracker { status: "saved", jobTitle, companyName, ... }
 *   - 200 → button label flips to "Saved" (BookmarkCheck icon) and toast
 *     "Saved to tracker" fires.
 *   - Click "Saved" again → toggle is LOCAL ONLY (no DELETE /api/tracker
 *     call); the chip flips back optimistically with toast "Removed from saved".
 *   - The savedJobIds Set is component-state and is NOT persisted across
 *     reloads — see TODO:BUG below.
 *
 * Coverage (3 tests + 1 fixme):
 *   ✅ click Save → POST /api/tracker fires; UI flips to "Saved"
 *   ✅ click Saved again → button flips back to "Save"; NO DELETE call fires
 *   ⚠ TODO:BUG (test.fixme) — saved state is lost on reload because
 *      savedJobIds is component-local state, not derived from /api/tracker.
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page, Request } from "@playwright/test";

const SAMPLE_JOBS = [
  {
    id: "save-job-1",
    title: "Backend Engineer",
    companyName: "SaveCo",
  },
];

function searchResponse(jobs: typeof SAMPLE_JOBS) {
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
        salaryMin: 1000000,
        salaryMax: 2000000,
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
        skillsRequired: ["Node.js"],
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
      total: jobs.length,
      page: 1,
      usage: { used: 1, limit: 10 },
    },
  };
}

async function mockJobsAndSelectFirst(page: Page): Promise<JobBoardPage> {
  await page.route("**/api/jobs/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResponse(SAMPLE_JOBS)),
    }),
  );
  const board = new JobBoardPage(page);
  await board.goto();

  await board.searchInput.fill("backend");
  await board.searchButton.click();

  // Click the first card so the detail panel (with the Save button) opens.
  await page.getByText("Backend Engineer").first().click();
  await expect(board.saveButton.or(board.savedButton)).toBeVisible({ timeout: 10_000 });
  return board;
}

test.describe("Saving a job from the detail panel", () => {
  test("clicking Save POSTs /api/tracker and the button flips to Saved", async ({
    seekerPage,
  }) => {
    const trackerCalls: Request[] = [];
    await seekerPage.route("**/api/tracker", async (route) => {
      trackerCalls.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "tracker-row-1", alreadyExists: false } }),
      });
    });

    const board = await mockJobsAndSelectFirst(seekerPage);

    await board.saveButton.click();

    // Wait for the POST to land and the optimistic toggle to settle.
    await expect.poll(() => trackerCalls.length).toBeGreaterThan(0);
    expect(trackerCalls[0].method()).toBe("POST");

    const body = trackerCalls[0].postDataJSON() as Record<string, unknown>;
    expect(body.status).toBe("saved");
    expect(body.jobTitle).toBe("Backend Engineer");
    expect(body.companyName).toBe("SaveCo");

    await expect(board.savedButton).toBeVisible({ timeout: 5_000 });
  });

  test("clicking Saved again toggles back to Save WITHOUT firing a DELETE (toggle-off is local-only)", async ({
    seekerPage,
  }) => {
    const trackerCalls: Request[] = [];
    await seekerPage.route("**/api/tracker", async (route) => {
      trackerCalls.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: "tracker-row-1", alreadyExists: false } }),
      });
    });

    const board = await mockJobsAndSelectFirst(seekerPage);

    await board.saveButton.click();
    await expect(board.savedButton).toBeVisible({ timeout: 5_000 });

    // Toggle off — should NOT hit the API per current implementation.
    const callsBefore = trackerCalls.length;
    await board.savedButton.click();
    await expect(board.saveButton).toBeVisible({ timeout: 5_000 });

    // Brief settle window in case the implementation changes — the assertion
    // is "no NEW network calls fired", verified after the optimistic toggle.
    await seekerPage.waitForTimeout(300);
    expect(
      trackerCalls.length,
      "toggling Saved → Save must not fire a network call today",
    ).toBe(callsBefore);
  });

  test.fixme(
    "saved state survives a reload (TODO:BUG — savedJobIds is local component state, not derived from /api/tracker)",
    async ({ seekerPage }) => {
      // Wired once /api/jobs/search responses honor saved state from the
      // tracker, OR once the page derives savedJobIds from a fresh
      // /api/tracker GET on mount. Today, refreshing the page wipes the
      // local Set and the button reverts to "Save".
      void seekerPage;
    },
  );
});
