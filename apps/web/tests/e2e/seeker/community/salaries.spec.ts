/**
 * seeker/community/salaries.spec.ts
 *
 * Verifies the salary insights page at /dashboard/community/salaries.
 *
 * Verified against src/app/(dashboard)/dashboard/community/salaries/page.tsx:
 *   - Header h1 "Salary Insights" + roles count
 *   - Default location is "Bangalore"; selectors switch to Mumbai / Remote
 *   - Roles list comes from /api/salary/roles via useSalaryRoles
 *
 * Coverage (2 tests):
 *   ✅ Salary Insights heading + 15+ roles count render
 *   ✅ Bangalore / Mumbai / Remote location filters are present
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Engineer",
  "Engineering Manager",
  "Product Manager",
  "Data Scientist",
  "ML Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full-stack Engineer",
  "DevOps Engineer",
  "QA Engineer",
  "Designer",
  "Technical Writer",
  "Recruiter",
  "Analytics Engineer",
];

async function mockRoles(page: Page): Promise<void> {
  await page.route("**/api/salary/roles**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: ROLES }),
    }),
  );
  // Salary data endpoint — empty array is safe; the page renders the location
  // selectors from a static list, not from data.
  await page.route("**/api/salary**", (route) => {
    if (route.request().url().includes("/roles")) return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

test.describe("Community — salary insights", () => {
  test("Salary Insights heading + roles count render", async ({ seekerPage }) => {
    await mockRoles(seekerPage);
    await seekerPage.goto("/dashboard/community/salaries");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /salary insights/i }),
    ).toBeVisible({ timeout: 10_000 });
    // Roles count appears in the subheader copy (e.g. "16 roles" since we
    // seed 16 mocked roles).
    await expect(seekerPage.getByText(/\b16\s+roles/i)).toBeVisible();
  });

  test("Bangalore / Mumbai / Remote location filters are present", async ({
    seekerPage,
  }) => {
    await mockRoles(seekerPage);
    await seekerPage.goto("/dashboard/community/salaries");

    // The page initialises location to "Bangalore". Mumbai + Remote are
    // selectable via the location control. Check all three render somewhere
    // on the page (selector chips OR options).
    for (const loc of ["Bangalore", "Mumbai", "Remote"]) {
      // Location values live as <option> elements inside a native <select> —
      // they are in the DOM but not visible. Use toBeAttached() instead.
      await expect(
        seekerPage.locator(`select option:has-text("${loc}")`).first(),
      ).toBeAttached({ timeout: 10_000 });
    }
  });
});
