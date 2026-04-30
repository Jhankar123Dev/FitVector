/**
 * seeker/community/hub.spec.ts
 *
 * Verifies the community hub at /dashboard/community.
 *
 * Verified against src/app/(dashboard)/dashboard/community/page.tsx:
 *   - Header h1 "Community" + "Beta" badge
 *   - 4 quick-stat cards (Experiences / Discussions / Roles Covered /
 *     Community Posts)
 *   - 3 section cards linking to /dashboard/community/{interviews|discussions|salaries}
 *   - Stats sourced from useCommunityPosts hook → /api/community/posts?type=...
 *
 * Coverage (3 tests):
 *   ✅ Beta badge + 4 quick-stat cards render
 *   ✅ All 3 section cards link to their subpages
 *   ✅ Quick stats reflect mocked /api/community/posts totals
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

async function mockCommunityPosts(
  page: Page,
  totals: { interview: number; discussion: number },
): Promise<void> {
  await page.route("**/api/community/posts**", (route) => {
    const url = new URL(route.request().url());
    const type = url.searchParams.get("type");
    const total = type === "interview_experience" ? totals.interview : totals.discussion;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total, page: 1, hasMore: false }),
    });
  });
}

test.describe("Community hub", () => {
  test("Beta badge and 4 quick-stat cards render", async ({ seekerPage }) => {
    await mockCommunityPosts(seekerPage, { interview: 0, discussion: 0 });
    await seekerPage.goto("/dashboard/community");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /community/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText("Beta", { exact: true })).toBeVisible();

    for (const label of ["Experiences", "Discussions", "Roles Covered", "Community Posts"]) {
      await expect(seekerPage.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("3 section cards link to /interviews, /discussions, /salaries", async ({
    seekerPage,
  }) => {
    await mockCommunityPosts(seekerPage, { interview: 12, discussion: 7 });
    await seekerPage.goto("/dashboard/community");

    await expect(
      seekerPage.getByRole("link", { name: /interview experiences/i }),
    ).toHaveAttribute("href", "/dashboard/community/interviews");
    await expect(
      seekerPage.getByRole("link", { name: /^Discussions/ }),
    ).toHaveAttribute("href", "/dashboard/community/discussions");
    await expect(
      seekerPage.getByRole("link", { name: /salary insights/i }),
    ).toHaveAttribute("href", "/dashboard/community/salaries");
  });

  test("quick-stat values reflect /api/community/posts totals", async ({ seekerPage }) => {
    await mockCommunityPosts(seekerPage, { interview: 42, discussion: 17 });
    await seekerPage.goto("/dashboard/community");

    // Find the Experiences stat card and assert its value cell shows "42".
    const expCard = seekerPage.getByText("Experiences", { exact: true }).locator("..");
    await expect(expCard.getByText("42", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    const discCard = seekerPage.getByText("Discussions", { exact: true }).locator("..").first();
    await expect(discCard.getByText("17", { exact: true })).toBeVisible();
    // Community Posts = 42 + 17 = 59 (toLocaleString).
    const totalCard = seekerPage.getByText("Community Posts", { exact: true }).locator("..");
    await expect(totalCard.getByText("59", { exact: true })).toBeVisible();
  });
});
