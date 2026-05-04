/**
 * seeker/companies/browse.spec.ts
 *
 * Verifies the company directory at /dashboard/companies.
 *
 * Verified against src/app/(dashboard)/dashboard/companies/page.tsx:
 *   - Search input + button → updates query state, paginates from page 1
 *   - GET /api/companies/search?q=&page=&limit=12 returns
 *     { data, total, page, limit, hasMore }
 *   - "Load more" button visible while hasMore=true
 *   - Each card → Link href="/dashboard/companies/{id}"
 *   - Empty state: "No companies found" with optional Clear button
 *
 * Coverage (5 tests):
 *   ✅ default landing fetches /api/companies/search and renders cards
 *   ✅ Search submit re-fetches with ?q= param
 *   ✅ Load more fires page=2 and appends new rows
 *   ✅ Each card links to /dashboard/companies/[id]
 *   ✅ Empty results render the "No companies found" state
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

interface MockCompany {
  id: string;
  name: string;
  industry?: string | null;
  description?: string | null;
  activeJobCount?: number;
  locations?: { city?: string }[];
  companySize?: string | null;
  logoUrl?: string | null;
}

function makeCompany(opts: MockCompany): MockCompany {
  return {
    industry: "Technology",
    description: "A company description.",
    activeJobCount: 0,
    locations: [{ city: "Bangalore" }],
    companySize: "51-200",
    logoUrl: null,
    ...opts,
  };
}

async function mockSearch(
  page: Page,
  pageOne: MockCompany[],
  pageTwo: MockCompany[] = [],
): Promise<{ requests: Request[] }> {
  const requests: Request[] = [];
  await page.route("**/api/companies/search**", async (route) => {
    requests.push(route.request());
    const url = new URL(route.request().url());
    const pg = Number(url.searchParams.get("page") || "1");
    const data = pg === 1 ? pageOne : pageTwo;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        total: pageOne.length + pageTwo.length,
        page: pg,
        limit: 12,
        hasMore: pg === 1 && pageTwo.length > 0,
      }),
    });
  });
  return { requests };
}

test.describe("Companies — browse directory", () => {
  test("default landing fetches /api/companies/search and renders cards", async ({
    seekerPage,
  }) => {
    await mockSearch(seekerPage, [
      makeCompany({ id: "co-1", name: "Acme Corp", industry: "SaaS" }),
      makeCompany({ id: "co-2", name: "Globex", industry: "Fintech" }),
    ]);
    await seekerPage.goto("/dashboard/companies");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /companies/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText("Acme Corp")).toBeVisible();
    await expect(seekerPage.getByText("Globex")).toBeVisible();
    await expect(seekerPage.getByText(/2 companies found/i)).toBeVisible();
  });

  test("Search submit re-fetches with ?q= param", async ({ seekerPage }) => {
    const { requests } = await mockSearch(seekerPage, [
      makeCompany({ id: "co-1", name: "Acme Corp" }),
    ]);
    await seekerPage.goto("/dashboard/companies");
    await expect(seekerPage.getByText("Acme Corp")).toBeVisible({ timeout: 10_000 });

    await seekerPage
      .getByPlaceholder(/search.*compan/i)
      .fill("acme");
    await seekerPage.getByRole("button", { name: /^search$/i }).click();

    await expect.poll(() => requests.length).toBeGreaterThanOrEqual(2);
    const last = new URL(requests[requests.length - 1].url());
    expect(last.searchParams.get("q")).toBe("acme");
  });

  test("Load more fires page=2 and appends new rows", async ({ seekerPage }) => {
    const { requests } = await mockSearch(
      seekerPage,
      [
        makeCompany({ id: "co-1", name: "Page1Co1" }),
        makeCompany({ id: "co-2", name: "Page1Co2" }),
      ],
      [makeCompany({ id: "co-3", name: "Page2Co1" })],
    );
    await seekerPage.goto("/dashboard/companies");
    await expect(seekerPage.getByText("Page1Co1")).toBeVisible({ timeout: 10_000 });

    await seekerPage.getByRole("button", { name: /load more/i }).click();

    await expect(seekerPage.getByText("Page2Co1")).toBeVisible({ timeout: 10_000 });
    const pages = new Set(
      requests.map((r) => new URL(r.url()).searchParams.get("page") || "1"),
    );
    expect(pages.has("1") && pages.has("2")).toBe(true);
  });

  test("each company card links to /dashboard/companies/[id]", async ({ seekerPage }) => {
    await mockSearch(seekerPage, [
      makeCompany({ id: "co-link-1", name: "LinkCo" }),
    ]);
    await seekerPage.goto("/dashboard/companies");

    const link = seekerPage.getByRole("link", { name: /LinkCo/ });
    await expect(link).toHaveAttribute("href", "/dashboard/companies/co-link-1");
  });

  test("zero results render the 'No companies found' empty state", async ({
    seekerPage,
  }) => {
    await mockSearch(seekerPage, []);
    await seekerPage.goto("/dashboard/companies");

    await expect(
      seekerPage.getByRole("heading", { name: /no companies found/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
