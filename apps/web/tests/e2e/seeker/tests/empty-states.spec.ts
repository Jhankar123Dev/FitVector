/**
 * seeker/tests/empty-states.spec.ts
 *
 * Verifies the empty-state copy on both tabs of /dashboard/tests.
 *
 * Verified against src/app/(dashboard)/dashboard/tests/page.tsx::EmptyState:
 *   - "No pending tests" / "No completed tests" h3
 *   - Description copy differs per tab.
 *
 * Coverage (2 tests):
 *   ✅ no tests at all → both tabs show their respective empty state
 *   ✅ pending-only → Completed tab shows "No completed tests"
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

async function mockTests(page: Page, tests: unknown[]): Promise<void> {
  await page.route("**/api/user/tests", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: tests }),
    }),
  );
}

test.describe("Tests — empty states", () => {
  test("zero tests at all → 'No pending tests' on default tab", async ({ seekerPage }) => {
    await mockTests(seekerPage, []);
    await seekerPage.goto("/dashboard/tests");

    await expect(
      seekerPage.getByRole("heading", { name: /no pending tests/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByText(/when employers invite you to take assessments/i),
    ).toBeVisible();

    // Switch to Completed tab → second empty state.
    await seekerPage.getByRole("button", { name: /^completed/i }).first().click();
    await expect(
      seekerPage.getByRole("heading", { name: /no completed tests/i }),
    ).toBeVisible();
    await expect(
      seekerPage.getByText(/your submitted or graded tests will appear here/i),
    ).toBeVisible();
  });

  test("pending-only inventory → Completed tab shows the empty state", async ({
    seekerPage,
  }) => {
    await mockTests(seekerPage, [
      {
        id: "test-invited-1",
        assessmentName: "Frontend MCQ",
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
    ]);
    await seekerPage.goto("/dashboard/tests");

    // Pending tab populated.
    await expect(seekerPage.getByText("Frontend MCQ")).toBeVisible({
      timeout: 10_000,
    });

    await seekerPage.getByRole("button", { name: /^completed/i }).first().click();
    await expect(
      seekerPage.getByRole("heading", { name: /no completed tests/i }),
    ).toBeVisible();
  });
});
