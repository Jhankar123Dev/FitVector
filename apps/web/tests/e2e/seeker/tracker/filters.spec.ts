/**
 * seeker/tracker/filters.spec.ts
 *
 * Verifies the filter bar above the Applied-via-FitVector tab.
 *
 * Verified against src/app/(dashboard)/dashboard/tracker/page.tsx:
 *   - filterStatus  ∈ {all, applied, under_review, interview_invited,
 *                       interviewed, offered, rejected}
 *   - filterCompany ∈ {all, ...distinct company names}
 *   - filterRange   ∈ {all, 7d, 30d, 90d}
 *   - "Clear filters" link appears when any filter !== "all" and resets
 *     all three to "all".
 *   - Filtering happens CLIENT-SIDE on the appliedApps array — no extra
 *     /api/tracker call fires per filter change.
 *
 * Coverage (4 tests):
 *   ✅ status filter narrows visible cards
 *   ✅ company filter narrows visible cards
 *   ✅ date-range filter narrows by appliedAt cutoff
 *   ✅ Clear filters resets all three back to "all"
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

function makeRow(overrides: {
  id: string;
  jobTitle: string;
  companyName: string;
  fitvectorStatus: string;
  appliedAt: string;
}) {
  return {
    id: overrides.id,
    jobId: null,
    jobTitle: overrides.jobTitle,
    companyName: overrides.companyName,
    companyLogoUrl: null,
    location: "",
    jobUrl: null,
    status: "applied",
    fitvectorStatus: overrides.fitvectorStatus,
    rawPipelineStage: null,
    isTransparentPipeline: false,
    matchScore: null,
    interviewLink: null,
    statusHistory: [],
    notes: null,
    nextFollowupDate: null,
    positionOrder: 1,
    contactName: null,
    contactEmail: null,
    contactRole: null,
    tailoredResumeId: null,
    fitvectorAppId: `fv-${overrides.id}`,
    appliedAt: overrides.appliedAt,
    createdAt: overrides.appliedAt,
  };
}

const NOW = new Date();
const DAYS_AGO = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const ROWS = [
  makeRow({
    id: "r1",
    jobTitle: "Backend Engineer",
    companyName: "Acme",
    fitvectorStatus: "applied",
    appliedAt: DAYS_AGO(2),
  }),
  makeRow({
    id: "r2",
    jobTitle: "Frontend Engineer",
    companyName: "Globex",
    fitvectorStatus: "interview_invited",
    appliedAt: DAYS_AGO(15),
  }),
  makeRow({
    id: "r3",
    jobTitle: "Staff Engineer",
    companyName: "Globex",
    fitvectorStatus: "offered",
    appliedAt: DAYS_AGO(60),
  }),
  makeRow({
    id: "r4",
    jobTitle: "Old Role",
    companyName: "Initech",
    fitvectorStatus: "rejected",
    appliedAt: DAYS_AGO(100),
  }),
];

async function mockTracker(page: Page): Promise<void> {
  await page.route("**/api/tracker**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: ROWS }),
    });
  });
}

test.describe("Tracker — Applied tab filters", () => {
  test("status filter narrows cards to the chosen fitvectorStatus", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage);
    await seekerPage.goto("/dashboard/tracker");
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible({
      timeout: 10_000,
    });

    // Filter by interview_invited — only Frontend Engineer (r2) should remain.
    const statusSelect = seekerPage
      .locator("select")
      .filter({ hasText: "All Statuses" });
    await statusSelect.selectOption("interview_invited");

    await expect(seekerPage.getByText("Frontend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Backend Engineer")).toHaveCount(0);
    await expect(seekerPage.getByText("Staff Engineer")).toHaveCount(0);
  });

  test("company filter narrows cards to the chosen company", async ({ seekerPage }) => {
    await mockTracker(seekerPage);
    await seekerPage.goto("/dashboard/tracker");
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible({
      timeout: 10_000,
    });

    const companySelect = seekerPage
      .locator("select")
      .filter({ hasText: "All Companies" });
    await companySelect.selectOption("Globex");

    // Both Globex rows visible, neither Acme nor Initech.
    await expect(seekerPage.getByText("Frontend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Staff Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Backend Engineer")).toHaveCount(0);
    await expect(seekerPage.getByText("Old Role")).toHaveCount(0);
  });

  test("date-range filter narrows by appliedAt cutoff (last 7 days)", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage);
    await seekerPage.goto("/dashboard/tracker");
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible({
      timeout: 10_000,
    });

    const rangeSelect = seekerPage
      .locator("select")
      .filter({ hasText: "All Time" });
    await rangeSelect.selectOption("7d");

    // Only Backend Engineer (2 days ago) remains. Others are 15/60/100 days.
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Frontend Engineer")).toHaveCount(0);
    await expect(seekerPage.getByText("Staff Engineer")).toHaveCount(0);
    await expect(seekerPage.getByText("Old Role")).toHaveCount(0);
  });

  test("'Clear filters' link resets all three filters to 'all'", async ({
    seekerPage,
  }) => {
    await mockTracker(seekerPage);
    await seekerPage.goto("/dashboard/tracker");
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible({
      timeout: 10_000,
    });

    // Apply two filters to make the Clear-filters link appear.
    const statusSelect = seekerPage
      .locator("select")
      .filter({ hasText: "All Statuses" });
    await statusSelect.selectOption("offered");
    const companySelect = seekerPage
      .locator("select")
      .filter({ hasText: "All Companies" });
    await companySelect.selectOption("Globex");

    // Only Staff Engineer matches "offered" + "Globex".
    await expect(seekerPage.getByText("Staff Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Backend Engineer")).toHaveCount(0);

    // Click "Clear filters".
    await seekerPage.getByRole("button", { name: /clear filters/i }).click();

    // All four rows visible again.
    await expect(seekerPage.getByText("Backend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Frontend Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Staff Engineer")).toBeVisible();
    await expect(seekerPage.getByText("Old Role")).toBeVisible();
  });
});
