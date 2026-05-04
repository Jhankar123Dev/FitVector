/**
 * seeker/tracker/applied-tab.spec.ts
 *
 * Verifies the "Applied via FitVector" tab on /dashboard/tracker.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/tracker/page.tsx — split into appliedApps
 *     (fitvectorStatus !== null) and personalApps (fitvectorStatus === null).
 *   - src/components/tracker/applied-jobs-list.tsx renders the FitVector rows.
 *   - src/app/api/tracker/route.ts — GET returns rows enriched with
 *     fitvectorStatus, matchScore, interviewLink, etc.
 *
 * Coverage (3 tests):
 *   ✅ Applied tab renders ONLY rows with fitvectorStatus !== null
 *   ✅ Applied tab counter pill shows the number of FitVector apps
 *   ✅ Switching to Personal tab hides FitVector rows and shows manual ones
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const TRACKER_ROWS = [
  {
    id: "row-fv-1",
    jobId: null,
    jobTitle: "Senior Backend Engineer",
    companyName: "Acme",
    companyLogoUrl: null,
    location: "Bangalore",
    jobUrl: null,
    status: "applied",
    fitvectorStatus: "applied",
    rawPipelineStage: "applied",
    isTransparentPipeline: false,
    matchScore: 87,
    interviewLink: null,
    statusHistory: [],
    notes: null,
    nextFollowupDate: null,
    positionOrder: 1,
    contactName: null,
    contactEmail: null,
    contactRole: null,
    tailoredResumeId: null,
    fitvectorAppId: "fv-app-1",
    appliedAt: "2026-04-20T10:00:00Z",
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "row-fv-2",
    jobId: null,
    jobTitle: "Frontend Engineer",
    companyName: "Globex",
    companyLogoUrl: null,
    location: "Remote",
    jobUrl: null,
    status: "applied",
    fitvectorStatus: "interview_invited",
    rawPipelineStage: "ai_interview_pending",
    isTransparentPipeline: false,
    matchScore: 91,
    interviewLink: null,
    statusHistory: [],
    notes: null,
    nextFollowupDate: null,
    positionOrder: 2,
    contactName: null,
    contactEmail: null,
    contactRole: null,
    tailoredResumeId: null,
    fitvectorAppId: "fv-app-2",
    appliedAt: "2026-04-25T10:00:00Z",
    createdAt: "2026-04-25T10:00:00Z",
  },
  {
    id: "row-personal-1",
    jobId: null,
    jobTitle: "Staff Engineer",
    companyName: "Initech",
    companyLogoUrl: null,
    location: "San Francisco",
    jobUrl: null,
    status: "saved",
    fitvectorStatus: null,
    rawPipelineStage: null,
    isTransparentPipeline: false,
    matchScore: null,
    interviewLink: null,
    statusHistory: [],
    notes: null,
    nextFollowupDate: null,
    positionOrder: 3,
    contactName: null,
    contactEmail: null,
    contactRole: null,
    tailoredResumeId: null,
    fitvectorAppId: null,
    appliedAt: null,
    createdAt: "2026-04-22T10:00:00Z",
  },
];

async function mockTrackerRows(
  page: Page,
  rows: typeof TRACKER_ROWS = TRACKER_ROWS,
): Promise<void> {
  await page.route("**/api/tracker**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: rows }),
    });
  });
}

test.describe("Tracker — Applied via FitVector tab", () => {
  test("Applied tab renders ONLY rows with fitvectorStatus !== null", async ({
    seekerPage,
  }) => {
    await mockTrackerRows(seekerPage);
    await seekerPage.goto("/dashboard/tracker");

    // Default tab is "applied" — both FV rows visible.
    await expect(seekerPage.getByText("Senior Backend Engineer")).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText("Frontend Engineer")).toBeVisible();
    // Personal app must NOT appear on the Applied tab.
    await expect(seekerPage.getByText("Staff Engineer")).toHaveCount(0);
  });

  test("Applied-tab pill shows the number of FitVector apps", async ({ seekerPage }) => {
    await mockTrackerRows(seekerPage);
    await seekerPage.goto("/dashboard/tracker");

    // The pill is rendered inside the Applied tab button — value "2".
    const appliedTab = seekerPage.getByRole("button", {
      name: /applied via fitvector/i,
    });
    await expect(appliedTab).toContainText("2");
  });

  test("switching to Personal tab hides FitVector rows and shows manual ones", async ({
    seekerPage,
  }) => {
    await mockTrackerRows(seekerPage);
    await seekerPage.goto("/dashboard/tracker");

    await seekerPage
      .getByRole("button", { name: /personal tracker/i })
      .click();

    // Personal app now visible inside the Kanban.
    await expect(seekerPage.getByText("Staff Engineer")).toBeVisible({
      timeout: 10_000,
    });
    // FitVector rows are not on the Personal tab — kanban-board.tsx filters
    // them out via fitvectorStatus !== null guard. The titles must not
    // render in the kanban columns.
    await expect(seekerPage.getByText("Senior Backend Engineer")).toHaveCount(0);
    await expect(seekerPage.getByText("Frontend Engineer")).toHaveCount(0);
  });
});
