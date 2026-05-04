/**
 * seeker/tests/list-completed.spec.ts
 *
 * Verifies the Completed tab on /dashboard/tests.
 *
 * Verified against src/app/(dashboard)/dashboard/tests/page.tsx:
 *   - COMPLETED_STATUSES = ["submitted", "graded", "expired"]
 *   - Score column: finalScore when graded, autoScore otherwise; "--" if null.
 *     Pass/Fail badges added when score >= passingScore (or < passingScore).
 *   - Action column: "View Results" Link → /assessments/take/{id} for graded.
 *     submitted/expired render no action button.
 *   - Date column: submittedAt ?? startedAt ?? createdAt.
 *
 * Coverage (4 tests):
 *   ✅ Completed tab renders only submitted/graded/expired
 *   ✅ score formatted as "{N}%" with Passed badge when score >= passingScore
 *   ✅ Failed badge renders when score < passingScore
 *   ✅ "View Results" links to /assessments/take/[id] only for graded rows
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

const TESTS: MockTest[] = [
  // Pending — must NOT show on completed tab.
  {
    id: "test-invited-1",
    assessmentName: "Pending MCQ",
    assessmentType: "mcq_quiz",
    jobTitle: "Frontend Engineer",
    status: "invited",
    finalScore: null,
    autoScore: null,
    passingScore: 70,
    timeLimit: 30,
    startedAt: null,
    submittedAt: null,
    createdAt: "2026-04-29T10:00:00Z",
  },
  // Graded + passed.
  {
    id: "test-graded-pass",
    assessmentName: "Frontend Skills Quiz",
    assessmentType: "mcq_quiz",
    jobTitle: "Senior Frontend Engineer",
    status: "graded",
    finalScore: 85,
    autoScore: 85,
    passingScore: 70,
    timeLimit: 30,
    startedAt: "2026-04-25T10:00:00Z",
    submittedAt: "2026-04-25T10:30:00Z",
    createdAt: "2026-04-24T10:00:00Z",
  },
  // Graded + failed.
  {
    id: "test-graded-fail",
    assessmentName: "DSA Coding Test",
    assessmentType: "coding_test",
    jobTitle: "Backend Engineer",
    status: "graded",
    finalScore: 50,
    autoScore: 50,
    passingScore: 70,
    timeLimit: 60,
    startedAt: "2026-04-20T10:00:00Z",
    submittedAt: "2026-04-20T11:00:00Z",
    createdAt: "2026-04-19T10:00:00Z",
  },
  // Submitted but not yet graded — no Pass/Fail badge.
  {
    id: "test-submitted-1",
    assessmentName: "System Design Case Study",
    assessmentType: "case_study",
    jobTitle: "Staff Engineer",
    status: "submitted",
    finalScore: null,
    autoScore: null,
    passingScore: null,
    timeLimit: 90,
    startedAt: "2026-04-22T10:00:00Z",
    submittedAt: "2026-04-22T11:30:00Z",
    createdAt: "2026-04-21T10:00:00Z",
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

async function gotoCompletedTab(page: Page): Promise<void> {
  await page.goto("/dashboard/tests");
  // Tab is rendered as <button>completed</button> (capitalised by CSS).
  await page.getByRole("button", { name: /^completed/i }).first().click();
}

test.describe("Tests — Completed tab", () => {
  test("Completed tab renders only submitted/graded/expired tests", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, TESTS);
    await gotoCompletedTab(seekerPage);

    await expect(seekerPage.getByText("Frontend Skills Quiz")).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText("DSA Coding Test")).toBeVisible();
    await expect(seekerPage.getByText("System Design Case Study")).toBeVisible();
    // Pending row must NOT appear here.
    await expect(seekerPage.getByText("Pending MCQ")).toHaveCount(0);
  });

  test("graded row shows '{N}%' score with Passed badge when score >= passingScore", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, TESTS);
    await gotoCompletedTab(seekerPage);

    const passRow = seekerPage
      .locator("tr", { hasText: "Frontend Skills Quiz" });
    await expect(passRow.getByText("85%", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(passRow.getByText("Passed", { exact: true })).toBeVisible();
    await expect(passRow.getByText("Failed", { exact: true })).toHaveCount(0);
  });

  test("graded row shows Failed badge when score < passingScore", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, TESTS);
    await gotoCompletedTab(seekerPage);

    const failRow = seekerPage
      .locator("tr", { hasText: "DSA Coding Test" });
    await expect(failRow.getByText("50%", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(failRow.getByText("Failed", { exact: true })).toBeVisible();
    await expect(failRow.getByText("Passed", { exact: true })).toHaveCount(0);
  });

  test("'View Results' link points to /assessments/take/[id] only for graded rows", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, TESTS);
    await gotoCompletedTab(seekerPage);

    // Graded passed row → "View Results" link.
    const passRow = seekerPage
      .locator("tr", { hasText: "Frontend Skills Quiz" });
    const viewLink = passRow.getByRole("link", { name: /view results/i });
    await expect(viewLink).toHaveAttribute(
      "href",
      "/assessments/take/test-graded-pass",
    );

    // Submitted (not graded) row → NO action button.
    const submittedRow = seekerPage
      .locator("tr", { hasText: "System Design Case Study" });
    await expect(
      submittedRow.getByRole("link", { name: /view results/i }),
    ).toHaveCount(0);
    await expect(
      submittedRow.getByRole("link", { name: /take test/i }),
    ).toHaveCount(0);
  });
});
