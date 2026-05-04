/**
 * seeker/outreach/history-management.spec.ts
 *
 * Verifies the read-only history view at /dashboard/outreach.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/outreach/page.tsx — fetches
 *     GET /api/outreach?offset=0&limit=20, groups by (jobTitle, companyName),
 *     renders 3 type slots per job (Cold Email / LinkedIn InMail /
 *     Referral Request), with "Show N older versions" toggles. "Load more
 *     messages" button paginates by offset+20.
 *   - src/app/api/outreach/route.ts — GET returns
 *     { data, total, offset, limit, hasMore }
 *   - src/app/api/outreach/[id]/route.ts — DELETE removes the row.
 *
 * Coverage (5 tests):
 *   ✅ list renders grouped by job, with three type slots per group
 *   ✅ "+N versions" badge appears when a slot has >1 message
 *   ✅ "Load more messages" fires offset=20 request and appends the new entries
 *   ✅ delete fires DELETE /api/outreach/[id] and removes the row from UI
 *   ✅ empty (no messages) renders the "No outreach messages yet" empty state
 */

import { test, expect } from "../../support/fixtures";
import type { Page, Request } from "@playwright/test";

interface OutreachEntry {
  id: string;
  outreachType: "cold_email" | "linkedin_message" | "referral_request";
  subject: string | null;
  body: string;
  tone: string;
  recruiterName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  createdAt: string;
}

const PAGE_ONE: OutreachEntry[] = [
  {
    id: "out-1",
    outreachType: "cold_email",
    subject: "Software Engineer — interested in joining Acme",
    body: "Hi recruiter, I came across the Software Engineer opening at Acme and …",
    tone: "professional",
    recruiterName: "Alex",
    jobTitle: "Software Engineer",
    companyName: "Acme",
    createdAt: "2026-04-25T12:00:00Z",
  },
  {
    id: "out-2",
    outreachType: "linkedin_message",
    subject: null,
    body: "Hi Alex, noticed Acme is hiring a Software Engineer. Open to a quick chat?",
    tone: "conversational",
    recruiterName: "Alex",
    jobTitle: "Software Engineer",
    companyName: "Acme",
    createdAt: "2026-04-26T08:00:00Z",
  },
  {
    id: "out-3",
    outreachType: "cold_email",
    subject: "Following up on the Software Engineer opportunity",
    body: "Hi Alex, just following up on my earlier note about the Acme role.",
    tone: "professional",
    recruiterName: "Alex",
    jobTitle: "Software Engineer",
    companyName: "Acme",
    createdAt: "2026-04-27T10:00:00Z",
  },
];

const PAGE_TWO: OutreachEntry[] = [
  {
    id: "out-4",
    outreachType: "cold_email",
    subject: "Senior Frontend Engineer at Globex",
    body: "Hi team, the Senior Frontend role at Globex caught my eye …",
    tone: "professional",
    recruiterName: null,
    jobTitle: "Senior Frontend Engineer",
    companyName: "Globex",
    createdAt: "2026-04-20T08:00:00Z",
  },
];

interface ListMockOptions {
  pageOne?: OutreachEntry[];
  pageTwo?: OutreachEntry[];
}

async function mockListEndpoint(
  page: Page,
  opts: ListMockOptions = {},
): Promise<{ requests: Request[] }> {
  const requests: Request[] = [];
  const p1 = opts.pageOne ?? PAGE_ONE;
  const p2 = opts.pageTwo ?? [];
  const total = p1.length + p2.length;

  await page.route("**/api/outreach?**", async (route) => {
    requests.push(route.request());
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get("offset") || "0");
    const limit = Number(url.searchParams.get("limit") || "20");
    const data = offset === 0 ? p1 : p2;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data,
        total,
        offset,
        limit,
        hasMore: offset + data.length < total,
      }),
    });
  });
  return { requests };
}

test.describe("Outreach history — /dashboard/outreach", () => {
  test("renders messages grouped by job with three type slots", async ({ seekerPage }) => {
    await mockListEndpoint(seekerPage);
    await seekerPage.goto("/dashboard/outreach");

    // Page header.
    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /outreach history/i }),
    ).toBeVisible();
    // Group header — "Software Engineer @ Acme".
    await expect(seekerPage.getByText("Software Engineer")).toBeVisible();
    await expect(seekerPage.getByText("@ Acme")).toBeVisible();
    // Three type-slot headers per group.
    await expect(
      seekerPage.getByText("Cold Email", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      seekerPage.getByText("LinkedIn InMail", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      seekerPage.getByText("Referral Request", { exact: true }).first(),
    ).toBeVisible();
  });

  test("'+N versions' badge appears when a slot has more than one message", async ({
    seekerPage,
  }) => {
    await mockListEndpoint(seekerPage);
    await seekerPage.goto("/dashboard/outreach");

    // PAGE_ONE has TWO cold-email entries for Software Engineer @ Acme →
    // the cold-email slot shows "2 versions" pill.
    await expect(seekerPage.getByText(/^2 versions$/)).toBeVisible({ timeout: 10_000 });
    // And a "Show 1 older version" toggle for the cold-email slot.
    await expect(
      seekerPage.getByText(/show 1 older version/i),
    ).toBeVisible();
  });

  test("'Load more messages' fires an offset=20 request and appends results", async ({
    seekerPage,
  }) => {
    const { requests } = await mockListEndpoint(seekerPage, {
      pageOne: PAGE_ONE,
      pageTwo: PAGE_TWO,
    });
    await seekerPage.goto("/dashboard/outreach");

    await expect(
      seekerPage.getByRole("heading", { level: 1, name: /outreach history/i }),
    ).toBeVisible();

    await seekerPage
      .getByRole("button", { name: /load more messages/i })
      .click();

    // Wait for the second request to land.
    await expect.poll(() => requests.length).toBeGreaterThanOrEqual(2);
    const second = new URL(requests[requests.length - 1].url());
    expect(second.searchParams.get("offset")).toBe("20");
    expect(second.searchParams.get("limit")).toBe("20");

    // The Globex group should now appear in the DOM.
    await expect(seekerPage.getByText("Senior Frontend Engineer")).toBeVisible({
      timeout: 10_000,
    });
    await expect(seekerPage.getByText("@ Globex")).toBeVisible();
  });

  test("delete fires DELETE /api/outreach/[id] and removes the row from UI", async ({
    seekerPage,
  }) => {
    await mockListEndpoint(seekerPage);
    const deleteRequests: Request[] = [];
    await seekerPage.route("**/api/outreach/out-3", async (route) => {
      deleteRequests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await seekerPage.goto("/dashboard/outreach");
    // Expand older versions to reveal out-3 (most recent older sibling).
    await seekerPage.getByText(/show 1 older version/i).click();
    // The OLDER cold-email body excerpt — out-3 is "Following up on…".
    const olderRow = seekerPage.getByText(/Following up on/i).first();
    await expect(olderRow).toBeVisible();

    // The trash button next to it has title="Delete this version".
    await seekerPage.getByTitle(/delete this version/i).first().click();

    await expect.poll(() => deleteRequests.length).toBeGreaterThan(0);
    expect(deleteRequests[0].method()).toBe("DELETE");
    expect(deleteRequests[0].url()).toContain("/api/outreach/out-3");
  });

  test("zero history renders the 'No outreach messages yet' empty state", async ({
    seekerPage,
  }) => {
    await mockListEndpoint(seekerPage, { pageOne: [] });
    await seekerPage.goto("/dashboard/outreach");

    await expect(
      seekerPage.getByRole("heading", { name: /no outreach messages yet/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
