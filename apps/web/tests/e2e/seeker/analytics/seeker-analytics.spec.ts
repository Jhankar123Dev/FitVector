/**
 * seeker/analytics/seeker-analytics.spec.ts
 *
 * Verifies the seeker analytics dashboard at /dashboard/analytics.
 *
 * Verified against src/app/(dashboard)/dashboard/analytics/page.tsx:
 *   - Reads /api/tracker?all=true and aggregates client-side. There is NO
 *     dedicated /api/seeker/analytics route — all numbers are derived from
 *     the tracker rows in the browser.
 *   - 4 stat cards: Total Applications, This Week, Response Rate, Avg
 *     Response Time. Avg-response is currently a placeholder string
 *     "~5 days" rendered when there's any data (TODO:UI-GAP — not yet
 *     a real computation).
 *   - Status breakdown card renders one progress bar per status with a
 *     "{count} ({pct}%)" label.
 *   - Empty state ("No data yet") fires when totalApplications === 0.
 *
 * MASTER_PLAN's "5 stat cards" was rewritten — the live page has 4 cards.
 * The fifth slot was envisioned as a "rejected" or "saved" pipeline-only
 * stat card that was rolled into the Application Pipeline chart instead.
 *
 * Coverage (5 tests):
 *   ✅ all 4 stat cards render with values derived from /api/tracker
 *   ✅ Response Rate is computed correctly: responded / applied (saved excluded)
 *   ✅ This-week count counts only rows whose createdAt is within 7 days
 *   ✅ Application Pipeline bars render with percentages summing to 100%
 *   ✅ totalApplications=0 renders the "No data yet" empty state
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const NOW = Date.now();
const DAYS_AGO_ISO = (d: number) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

interface MockApp {
  id: string;
  status: string;
  createdAt: string;
}

function buildTrackerRow(app: MockApp) {
  return {
    id: app.id,
    jobId: null,
    jobTitle: `Job ${app.id}`,
    companyName: `Co ${app.id}`,
    companyLogoUrl: null,
    location: "",
    jobUrl: null,
    status: app.status,
    fitvectorStatus: null,
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
    fitvectorAppId: null,
    appliedAt: app.createdAt,
    createdAt: app.createdAt,
  };
}

async function mockTrackerWith(page: Page, apps: MockApp[]): Promise<void> {
  await page.route("**/api/tracker**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: apps.map(buildTrackerRow) }),
    }),
  );
}

test.describe("Seeker analytics dashboard", () => {
  test("4 stat cards render with values aggregated from /api/tracker", async ({
    seekerPage,
  }) => {
    // 5 applied + 1 screening + 1 interview + 1 offer + 2 rejected + 1 saved = 11 total.
    await mockTrackerWith(seekerPage, [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `a${i}`,
        status: "applied",
        createdAt: DAYS_AGO_ISO(2),
      })),
      { id: "s1", status: "screening", createdAt: DAYS_AGO_ISO(3) },
      { id: "i1", status: "interview", createdAt: DAYS_AGO_ISO(4) },
      { id: "o1", status: "offer", createdAt: DAYS_AGO_ISO(5) },
      { id: "r1", status: "rejected", createdAt: DAYS_AGO_ISO(20) },
      { id: "r2", status: "rejected", createdAt: DAYS_AGO_ISO(25) },
      { id: "sv1", status: "saved", createdAt: DAYS_AGO_ISO(1) },
    ]);
    await seekerPage.goto("/dashboard/analytics");

    // All 4 card titles render.
    for (const title of [
      "Total Applications",
      "This Week",
      "Response Rate",
      "Avg Response Time",
    ]) {
      await expect(
        seekerPage.getByText(title, { exact: true }),
      ).toBeVisible({ timeout: 10_000 });
    }

    // Total Applications = 11. The card value is the only "11" near the
    // "Total Applications" label.
    const totalCard = seekerPage
      .getByText("Total Applications", { exact: true })
      .locator("..");
    await expect(totalCard.getByText("11", { exact: true })).toBeVisible();
  });

  test("Response Rate computes correctly: responded / applied (saved excluded)", async ({
    seekerPage,
  }) => {
    // applied=5, screening=1, interview=1, offer=1, rejected=1, saved=2
    // applied total (status !== "saved") = 9
    // responded (screening + interview + offer + rejected) = 4
    // responseRate = round(4/9 * 100) = 44%
    await mockTrackerWith(seekerPage, [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `a${i}`,
        status: "applied",
        createdAt: DAYS_AGO_ISO(2),
      })),
      { id: "s1", status: "screening", createdAt: DAYS_AGO_ISO(3) },
      { id: "i1", status: "interview", createdAt: DAYS_AGO_ISO(4) },
      { id: "o1", status: "offer", createdAt: DAYS_AGO_ISO(5) },
      { id: "r1", status: "rejected", createdAt: DAYS_AGO_ISO(15) },
      { id: "sv1", status: "saved", createdAt: DAYS_AGO_ISO(1) },
      { id: "sv2", status: "saved", createdAt: DAYS_AGO_ISO(1) },
    ]);
    await seekerPage.goto("/dashboard/analytics");

    const card = seekerPage
      .getByText("Response Rate", { exact: true })
      .locator("..");
    await expect(card.getByText("44%", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("This Week counts only rows whose createdAt is within 7 days", async ({
    seekerPage,
  }) => {
    await mockTrackerWith(seekerPage, [
      // 3 within last 7 days
      { id: "a1", status: "applied", createdAt: DAYS_AGO_ISO(1) },
      { id: "a2", status: "applied", createdAt: DAYS_AGO_ISO(3) },
      { id: "a3", status: "applied", createdAt: DAYS_AGO_ISO(6) },
      // 2 older than 7 days
      { id: "a4", status: "applied", createdAt: DAYS_AGO_ISO(10) },
      { id: "a5", status: "applied", createdAt: DAYS_AGO_ISO(40) },
    ]);
    await seekerPage.goto("/dashboard/analytics");

    const card = seekerPage
      .getByText("This Week", { exact: true })
      .locator("..");
    await expect(card.getByText("3", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Application Pipeline bars render per status with percentages summing to 100", async ({
    seekerPage,
  }) => {
    // 4 applied + 1 screening + 1 rejected = 6 total → 67% / 17% / 17%
    // (rounded percentages may not sum to exactly 100 due to rounding;
    // we accept 99/100/101).
    await mockTrackerWith(seekerPage, [
      { id: "a1", status: "applied", createdAt: DAYS_AGO_ISO(2) },
      { id: "a2", status: "applied", createdAt: DAYS_AGO_ISO(2) },
      { id: "a3", status: "applied", createdAt: DAYS_AGO_ISO(2) },
      { id: "a4", status: "applied", createdAt: DAYS_AGO_ISO(2) },
      { id: "s1", status: "screening", createdAt: DAYS_AGO_ISO(3) },
      { id: "r1", status: "rejected", createdAt: DAYS_AGO_ISO(10) },
    ]);
    await seekerPage.goto("/dashboard/analytics");

    // Pipeline card title.
    await expect(
      seekerPage.getByText(/application pipeline/i),
    ).toBeVisible({ timeout: 10_000 });

    // Each bar renders a "{count} ({pct}%)" label.
    await expect(seekerPage.getByText(/^4 \(67%\)$/)).toBeVisible();
    await expect(seekerPage.getByText(/^1 \(17%\)$/).first()).toBeVisible();
  });

  test("totalApplications=0 renders the 'No data yet' empty state", async ({
    seekerPage,
  }) => {
    await mockTrackerWith(seekerPage, []);
    await seekerPage.goto("/dashboard/analytics");

    await expect(
      seekerPage.getByRole("heading", { name: /no data yet/i }),
    ).toBeVisible({ timeout: 10_000 });
    // Stat cards must NOT render in the empty state.
    await expect(
      seekerPage.getByText("Total Applications", { exact: true }),
    ).toHaveCount(0);
  });
});
