/**
 * seeker/tests/list-pending.spec.ts
 *
 * Verifies the Pending tab on /dashboard/tests.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/tests/page.tsx —
 *     PENDING_STATUSES = ["invited", "started"], split into "pending" tab.
 *     Status badges: "Invited" (blue) | "In Progress" (amber).
 *     "Take Test" Button → asChild Link → /assessments/take/{id}.
 *   - src/app/api/user/tests/route.ts — GET returns:
 *       { data: [{ id, assessmentName, assessmentType, jobTitle, status,
 *                  finalScore, autoScore, passingScore, timeLimit,
 *                  startedAt, submittedAt, createdAt }] }
 *
 * Test-taking itself happens at /assessments/take/{id} which is anonymous +
 * already covered by W2's anon/assessment-take.spec.ts. Per the W4b
 * constraint, JDoodle code execution is mocked there via mockCodeExecute()
 * — we don't re-run that surface here, just verify the link target.
 *
 * Coverage (4 tests):
 *   ✅ Pending tab renders only invited/started tests
 *   ✅ status badges: "Invited" (invited) / "In Progress" (started)
 *   ✅ time-limit row shows "{N} min" beneath the assessment name
 *   ✅ "Take Test" action links to /assessments/take/[id]
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

interface MockTest {
  id: string;
  assessmentName: string;
  assessmentType: string;
  jobTitle: string;
  status: "invited" | "started" | "submitted" | "graded" | "expired";
  finalScore: number | null;
  autoScore: number | null;
  passingScore: number | null;
  timeLimit: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

const PENDING_TESTS: MockTest[] = [
  {
    id: "test-invited-1",
    assessmentName: "Frontend MCQ Quiz",
    assessmentType: "mcq_quiz",
    jobTitle: "Frontend Engineer",
    status: "invited",
    finalScore: null,
    autoScore: null,
    passingScore: 70,
    timeLimit: 30,
    startedAt: null,
    submittedAt: null,
    createdAt: "2026-04-25T10:00:00Z",
  },
  {
    id: "test-started-1",
    assessmentName: "Backend Coding Test",
    assessmentType: "coding_test",
    jobTitle: "Backend Engineer",
    status: "started",
    finalScore: null,
    autoScore: null,
    passingScore: 70,
    timeLimit: 60,
    startedAt: "2026-04-26T10:00:00Z",
    submittedAt: null,
    createdAt: "2026-04-25T10:00:00Z",
  },
  // A completed one — must NOT appear on the Pending tab.
  {
    id: "test-graded-1",
    assessmentName: "System Design Quiz",
    assessmentType: "mcq_quiz",
    jobTitle: "Staff Engineer",
    status: "graded",
    finalScore: 85,
    autoScore: 85,
    passingScore: 70,
    timeLimit: 45,
    startedAt: "2026-04-20T10:00:00Z",
    submittedAt: "2026-04-20T11:00:00Z",
    createdAt: "2026-04-19T10:00:00Z",
  },
];

async function mockTests(page: Page, tests: MockTest[]): Promise<void> {
  await page.route("**/api/user/tests", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: tests }),
    }),
  );
}

test.describe("Tests — Pending tab", () => {
  test("Pending tab renders only invited + started tests", async ({ seekerPage }) => {
    await mockTests(seekerPage, PENDING_TESTS);
    await seekerPage.goto("/dashboard/tests");

    // Both pending rows visible.
    await expect(seekerPage.getByText("Frontend MCQ Quiz")).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText("Backend Coding Test")).toBeVisible();
    // The graded row must NOT appear on the Pending tab.
    await expect(seekerPage.getByText("System Design Quiz")).toHaveCount(0);
  });

  test("status badges render 'Invited' and 'In Progress' correctly", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, PENDING_TESTS);
    await seekerPage.goto("/dashboard/tests");

    // The Invited row: badge text "Invited" near the assessment name row.
    const invitedRow = seekerPage
      .locator("tr", { hasText: "Frontend MCQ Quiz" });
    await expect(invitedRow.getByText("Invited", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // The Started row: badge "In Progress".
    const startedRow = seekerPage
      .locator("tr", { hasText: "Backend Coding Test" });
    await expect(
      startedRow.getByText("In Progress", { exact: true }),
    ).toBeVisible();
  });

  test("time-limit shows '{N} min' beneath the assessment name", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, PENDING_TESTS);
    await seekerPage.goto("/dashboard/tests");

    // 30 min on the first row, 60 min on the second.
    const invitedRow = seekerPage
      .locator("tr", { hasText: "Frontend MCQ Quiz" });
    await expect(invitedRow.getByText(/^30 min$/)).toBeVisible({ timeout: 10_000 });

    const startedRow = seekerPage
      .locator("tr", { hasText: "Backend Coding Test" });
    await expect(startedRow.getByText(/^60 min$/)).toBeVisible();
  });

  test("'Take Test' action links to /assessments/take/[id]", async ({ seekerPage }) => {
    await mockTests(seekerPage, PENDING_TESTS);
    await seekerPage.goto("/dashboard/tests");

    // Both pending rows render a "Take Test" link.
    const invitedRow = seekerPage
      .locator("tr", { hasText: "Frontend MCQ Quiz" });
    const takeLink = invitedRow.getByRole("link", { name: /take test/i });
    await expect(takeLink).toBeVisible({ timeout: 10_000 });
    await expect(takeLink).toHaveAttribute("href", "/assessments/take/test-invited-1");

    const startedRow = seekerPage
      .locator("tr", { hasText: "Backend Coding Test" });
    await expect(
      startedRow.getByRole("link", { name: /take test/i }),
    ).toHaveAttribute("href", "/assessments/take/test-started-1");
  });
});
