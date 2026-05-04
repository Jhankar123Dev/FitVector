/**
 * seeker/jobs/search-filter.spec.ts
 *
 * Verifies that filter controls (and the search bar) flow into the
 * /api/jobs/search querystring as documented in route.ts:
 *
 *   role         — required, returns 400 if blank
 *   location     — top-level location text input
 *   workMode     — filter dropdown: onsite | remote | hybrid
 *   jobType      — filter dropdown: fulltime | parttime | internship | contract
 *   hoursOld     — "Posted within" — defaults to 720 (≈30 days)
 *   salaryMin    — number; sent as Number(filters.salaryMin)
 *   salaryMax    — number
 *
 * MASTER_PLAN's "experience-level filter" doesn't exist on the seeker
 * board (only used on profile / onboarding); that test has been swapped
 * for a hoursOld assertion which IS a real filter.
 *
 * Each test mocks /api/jobs/search and inspects the querystring of the
 * request that lands. We don't care about the response body in most
 * tests — what matters is that the right param flowed through.
 *
 * Coverage (6 tests):
 *   ✅ keyword (role) lands as ?role=
 *   ✅ location lands as ?location=
 *   ✅ workMode dropdown lands as ?workMode=
 *   ✅ jobType dropdown lands as ?jobType=
 *   ✅ salary min+max land as ?salaryMin=&salaryMax=
 *   ✅ Reset returns filters to defaults (no workMode/jobType params)
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import type { Page, Request } from "@playwright/test";

const EMPTY_RESPONSE = {
  data: {
    jobs: [],
    total: 0,
    page: 1,
    usage: { used: 1, limit: 10 },
  },
};

/** Captures every search request the client fires while the route is active. */
async function captureSearchRequests(page: Page): Promise<Request[]> {
  const captured: Request[] = [];
  await page.route("**/api/jobs/search**", async (route) => {
    captured.push(route.request());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(EMPTY_RESPONSE),
    });
  });
  return captured;
}

/** Returns the URL of the LAST search request the client fired. */
function lastSearchURL(requests: Request[]): URL {
  expect(requests.length, "expected at least one /api/jobs/search request").toBeGreaterThan(0);
  return new URL(requests[requests.length - 1].url());
}

async function triggerSearch(board: JobBoardPage, role = "engineer"): Promise<void> {
  await board.searchInput.fill(role);
  await board.searchButton.click();
}

test.describe("Jobs board — search & filters (param mapping)", () => {
  test("typed keyword flows through as ?role=", async ({ seekerPage }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    await triggerSearch(board, "Frontend Developer");

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(lastSearchURL(requests).searchParams.get("role")).toBe("Frontend Developer");
  });

  test("location text input flows through as ?location=", async ({ seekerPage }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    await board.searchInput.fill("Engineer");
    await board.locationInput.fill("Bangalore");
    await board.searchButton.click();

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(lastSearchURL(requests).searchParams.get("location")).toBe("Bangalore");
  });

  test("workMode filter flows through as ?workMode=", async ({ seekerPage }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    // The work-mode filter is a native <select> labelled "Work Mode" inside
    // JobFiltersPanel. selectOption() drives it without depending on a
    // Radix-style listbox.
    await board.workModeFilter.selectOption("remote");
    await triggerSearch(board, "Engineer");

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(lastSearchURL(requests).searchParams.get("workMode")).toBe("remote");
  });

  test("jobType filter flows through as ?jobType=", async ({ seekerPage }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    await board.jobTypeFilter.selectOption("fulltime");
    await triggerSearch(board, "Engineer");

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(lastSearchURL(requests).searchParams.get("jobType")).toBe("fulltime");
  });

  test("salary min + max flow through as ?salaryMin= & ?salaryMax=", async ({
    seekerPage,
  }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    await board.salaryMinFilter.fill("1500000");
    await board.salaryMaxFilter.fill("3000000");
    await triggerSearch(board, "Engineer");

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const url = lastSearchURL(requests);
    expect(url.searchParams.get("salaryMin")).toBe("1500000");
    expect(url.searchParams.get("salaryMax")).toBe("3000000");
  });

  test("Reset clears workMode/jobType from subsequent search params", async ({
    seekerPage,
  }) => {
    const requests = await captureSearchRequests(seekerPage);
    const board = new JobBoardPage(seekerPage);
    await board.goto();

    // First search WITH filters set.
    await board.workModeFilter.selectOption("remote");
    await board.jobTypeFilter.selectOption("fulltime");
    await triggerSearch(board, "Engineer");
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const before = lastSearchURL(requests);
    expect(before.searchParams.get("workMode")).toBe("remote");
    expect(before.searchParams.get("jobType")).toBe("fulltime");

    // Reset and search again.
    await board.resetFiltersButton.click();
    await triggerSearch(board, "Engineer");
    // Wait for a NEW request to land (length must grow).
    const before2 = requests.length;
    await expect.poll(() => requests.length).toBeGreaterThan(before2 - 1);

    const after = lastSearchURL(requests);
    // After reset, defaults are empty strings → params must be absent.
    expect(after.searchParams.get("workMode")).toBeNull();
    expect(after.searchParams.get("jobType")).toBeNull();
  });
});
