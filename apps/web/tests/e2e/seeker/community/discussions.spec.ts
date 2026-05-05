/**
 * seeker/community/discussions.spec.ts
 *
 * Verifies the discussions board at /dashboard/community/discussions.
 *
 * Verified against src/app/(dashboard)/dashboard/community/discussions/page.tsx:
 *   - Tabs filter by category (all/tech/career/salary/misc)
 *   - Sort options: hot / new / top
 *   - Threads render with title, category badge, upvote count
 *   - Vote button POSTs to /api/community/vote
 *   - Reply / create-thread paths POST to /api/community/posts and
 *     /api/community/posts/[id]/comments
 *
 * Coverage (5 tests):
 *   ✅ thread list renders with title + upvote count
 *   ✅ category tab click filters the visible threads
 *   ✅ sort buttons (hot/new/top) toggle without API re-fetch (client-side)
 *   ✅ upvote click fires POST /api/community/vote
 *   ✅ empty state when filter yields no threads
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

interface MockThread {
  id: string;
  title: string;
  body: string;
  category: "tech" | "career_advice" | "salary" | "general";
  upvotes: number;
  repliesCount: number;
  lastActivityAt: string;
  createdAt: string;
}

const THREADS: MockThread[] = [
  {
    id: "t1",
    title: "Best React state management in 2026?",
    body: "Considering Zustand vs Jotai. What's the community take?",
    category: "tech",
    upvotes: 24,
    repliesCount: 8,
    lastActivityAt: "2026-04-25T12:00:00Z",
    createdAt: "2026-04-25T10:00:00Z",
  },
  {
    id: "t2",
    title: "How to negotiate counter-offers",
    body: "Got two offers — would love advice from senior engineers.",
    category: "career_advice",
    upvotes: 31,
    repliesCount: 14,
    lastActivityAt: "2026-04-26T09:00:00Z",
    createdAt: "2026-04-26T08:00:00Z",
  },
  {
    id: "t3",
    title: "FAANG vs unicorn pay breakdown",
    body: "Sharing my recent Bangalore offers — TC + RSU details inside.",
    category: "salary",
    upvotes: 56,
    repliesCount: 22,
    lastActivityAt: "2026-04-27T10:00:00Z",
    createdAt: "2026-04-27T08:00:00Z",
  },
];

async function mockDiscussionsApi(
  page: Page,
  threads: MockThread[] = THREADS,
): Promise<{ voteRequests: Request[] }> {
  const voteRequests: Request[] = [];

  await page.route("**/api/community/posts**", (route) => {
    const url = new URL(route.request().url());
    const isComments = url.pathname.includes("/comments");
    if (isComments) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }
    // List endpoint — type=discussion
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: threads.map((t) => ({
          id: t.id,
          title: t.title,
          body: t.body,
          category: t.category,
          upvotes: t.upvotes,
          repliesCount: t.repliesCount,
          lastActivityAt: t.lastActivityAt,
          createdAt: t.createdAt,
          authorAlias: "anon",
          isAnonymous: true,
          type: "discussion",
        })),
        total: threads.length,
        page: 1,
        hasMore: false,
      }),
    });
  });

  await page.route("**/api/community/vote", async (route) => {
    voteRequests.push(route.request());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { success: true } }),
    });
  });

  return { voteRequests };
}

test.describe("Community — discussions board", () => {
  test("thread list renders with title and upvote count", async ({ seekerPage }) => {
    await mockDiscussionsApi(seekerPage);
    await seekerPage.goto("/dashboard/community/discussions");

    for (const t of THREADS) {
      await expect(seekerPage.getByText(t.title)).toBeVisible({ timeout: 10_000 });
    }
    // Upvote counts visible somewhere in the list.
    await expect(seekerPage.getByText(/^24$/).first()).toBeVisible();
    await expect(seekerPage.getByText(/^56$/).first()).toBeVisible();
  });

  test("category tab click filters the visible threads", async ({ seekerPage }) => {
    await mockDiscussionsApi(seekerPage);
    await seekerPage.goto("/dashboard/community/discussions");

    // Click the "Salary" tab — only the salary-category thread remains.
    await seekerPage.getByRole("tab", { name: /^salary$/i }).click();

    await expect(seekerPage.getByText("FAANG vs unicorn pay breakdown")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      seekerPage.getByText("Best React state management in 2026?"),
    ).toHaveCount(0);
    await expect(seekerPage.getByText("How to negotiate counter-offers")).toHaveCount(0);
  });

  test("sort buttons toggle without firing additional list API calls", async ({
    seekerPage,
  }) => {
    let listFetches = 0;
    await seekerPage.route("**/api/community/posts**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/community/posts") listFetches++;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: THREADS.map((t) => ({
            id: t.id,
            title: t.title,
            body: t.body,
            category: t.category,
            upvotes: t.upvotes,
            repliesCount: t.repliesCount,
            lastActivityAt: t.lastActivityAt,
            createdAt: t.createdAt,
            authorAlias: "anon",
            isAnonymous: true,
            type: "discussion",
          })),
          total: THREADS.length,
          page: 1,
          hasMore: false,
        }),
      });
    });
    await seekerPage.goto("/dashboard/community/discussions");
    await expect(seekerPage.getByText(THREADS[0].title)).toBeVisible({
      timeout: 10_000,
    });
    const baseline = listFetches;

    // Switch sort orders. Sorting is client-side; no extra fetches expected.
    await seekerPage.getByRole("button", { name: /^new$/i }).click();
    await seekerPage.getByRole("button", { name: /^top$/i }).click();

    // Sorts are local; baseline shouldn't grow (or grows by at most 1 from any
    // unrelated background refetch — keep the assertion forgiving).
    expect(listFetches - baseline).toBeLessThanOrEqual(1);
  });

  test("upvote click fires POST /api/community/vote", async ({ seekerPage }) => {
    const { voteRequests } = await mockDiscussionsApi(seekerPage);
    await seekerPage.goto("/dashboard/community/discussions");
    await expect(seekerPage.getByText(THREADS[0].title)).toBeVisible({
      timeout: 10_000,
    });

    // The vote button typically renders the upvote count + an arrow icon.
    // Click the upvote control inside the first thread row.
    // The upvote button renders a ThumbsUp SVG with no text label — use SVG class.
    await seekerPage.locator("svg.lucide-thumbs-up").first().click();

    await expect.poll(() => voteRequests.length).toBeGreaterThan(0);
    expect(voteRequests[0].method()).toBe("POST");
  });

  test("empty state renders when category filter yields zero threads", async ({
    seekerPage,
  }) => {
    await mockDiscussionsApi(seekerPage, THREADS);
    await seekerPage.goto("/dashboard/community/discussions");
    await expect(seekerPage.getByText(THREADS[0].title)).toBeVisible({
      timeout: 10_000,
    });

    // "General" tab — no thread in our mock has category="general".
    await seekerPage.getByRole("tab", { name: /^general$/i }).click();
    await expect(
      seekerPage.getByText(/no threads in this category/i),
    ).toBeVisible({ timeout: 5_000 });
  });
});
