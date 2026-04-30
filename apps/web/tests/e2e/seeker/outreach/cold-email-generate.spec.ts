/**
 * seeker/outreach/cold-email-generate.spec.ts
 *
 * Drives the Cold Email outreach flow.
 *
 * REALITY: outreach generation is NOT initiated from /dashboard/outreach
 * (that page is the read-only history). Cold email + LinkedIn + Referral
 * are all triggered from the action bar on a job card detail panel inside
 * /dashboard/jobs.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/jobs/page.tsx::generateOutreach —
 *     POSTs to /api/ai/cold-email with { jobTitle, companyName, jobDescription, tone }
 *     then opens a right-hand <Sheet> with <OutreachPreview type="cold_email" …>.
 *   - src/components/outreach/outreach-preview.tsx — renders subject (cold
 *     email only), subjectAlternatives chips, body, copy buttons, Gmail/Outlook
 *     deeplinks.
 *   - W1 fixtures: MOCK_COLD_EMAIL_RESPONSE + mockAi({ coldEmail: true })
 *     and { coldEmail: "quota-exceeded" } produce a 429 with `upgrade: true`.
 *
 * MASTER_PLAN's "tone selector" doesn't exist on the live page — tone is
 * hardcoded to "professional" in jobs/page.tsx:152. Documented as a UI gap.
 *
 * Coverage (4 tests):
 *   ✅ Cold Email button POSTs /api/ai/cold-email with the job context + tone="professional"
 *   ✅ Sheet renders the subject, alternatives, body, and copy buttons
 *   ✅ subject-alternative badge click swaps the rendered subject
 *   ❌ quota-exceeded (429) surfaces inline in the Sheet
 *   ⚠ test.fixme — UI tone selector (TODO: jobs/page.tsx hardcodes "professional")
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import { mockAi } from "../../support/fixtures/mock-fixture";
import { MOCK_COLD_EMAIL_RESPONSE } from "../../support/mocks/ai-responses";
import type { Page, Request } from "@playwright/test";

const FV_JOB_ID = "outreach-job-1";
const FV_JOB_TITLE = "Senior Backend Engineer";
const FV_JOB_COMPANY = "OutreachCo";

function jobsSearchResponse() {
  return {
    data: {
      jobs: [
        {
          id: FV_JOB_ID,
          title: FV_JOB_TITLE,
          companyName: FV_JOB_COMPANY,
          companyLogoUrl: null,
          location: "Bangalore",
          workMode: "remote",
          jobType: "fulltime",
          salaryMin: 2_000_000,
          salaryMax: 3_500_000,
          salaryCurrency: "INR",
          postedAt: new Date().toISOString(),
          sources: ["fitvector"],
          url: "",
          matchScore: null,
          matchBucket: null,
          decisionLabel: null,
          embeddingScore: null,
          deterministicScore: null,
          deterministicComponents: null,
          skillsRequired: ["Node.js", "PostgreSQL"],
          skillsNiceToHave: [],
          requiredExperienceYears: null,
          isEasyApply: true,
          isSaved: false,
          description: "Backend engineer role focused on Node.js + Postgres at scale.",
          isDirect: true,
          jobPostId: FV_JOB_ID,
          applicationDeadline: null,
          openingsCount: 1,
        },
      ],
      total: 1,
      page: 1,
      usage: { used: 1, limit: 10 },
    },
  };
}

async function searchAndOpenJob(seekerPage: Page): Promise<JobBoardPage> {
  await seekerPage.route("**/api/jobs/search**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(jobsSearchResponse()),
    }),
  );
  await seekerPage.route("**/api/applications/fitvector", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    }),
  );
  const board = new JobBoardPage(seekerPage);
  await board.goto();
  await board.searchInput.fill("backend");
  await board.searchButton.click();
  await seekerPage.getByText(FV_JOB_TITLE).first().click();
  return board;
}

test.describe("Outreach — cold email generation", () => {
  test("Cold Email button POSTs /api/ai/cold-email with job context + tone=professional", async ({
    seekerPage,
  }) => {
    const requests: Request[] = [];
    await seekerPage.route("**/api/ai/cold-email", async (route) => {
      requests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_COLD_EMAIL_RESPONSE),
      });
    });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^cold email$/i }).click();

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const req = requests[0];
    expect(req.method()).toBe("POST");
    const body = req.postDataJSON() as Record<string, unknown>;
    expect(body.jobTitle).toBe(FV_JOB_TITLE);
    expect(body.companyName).toBe(FV_JOB_COMPANY);
    expect(body.tone).toBe("professional");
    expect(typeof body.jobDescription).toBe("string");
  });

  test("Sheet renders subject, body, and copy buttons after a successful generate", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { coldEmail: true });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^cold email$/i }).click();

    // Sheet title — "Cold Email · {company}"
    await expect(
      seekerPage.getByRole("heading", { name: /cold email/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Subject (cold email only) renders the mock subject text.
    await expect(
      seekerPage.getByText(MOCK_COLD_EMAIL_RESPONSE.data.subject),
    ).toBeVisible();
    // Body fragment from the mock (the templated greeting).
    await expect(seekerPage.getByText(/I came across the Software Engineer/i)).toBeVisible();

    // Copy buttons (subject + message).
    await expect(
      seekerPage.getByRole("button", { name: /copy subject/i }),
    ).toBeVisible();
    await expect(
      seekerPage.getByRole("button", { name: /copy message/i }),
    ).toBeVisible();
  });

  test("clicking a subject alternative badge swaps the rendered subject", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { coldEmail: true });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^cold email$/i }).click();
    await expect(
      seekerPage.getByText(MOCK_COLD_EMAIL_RESPONSE.data.subject),
    ).toBeVisible({ timeout: 10_000 });

    const alt = MOCK_COLD_EMAIL_RESPONSE.data.subjectAlternatives[0];
    await seekerPage.getByText(alt, { exact: false }).first().click();

    // The selected subject pill above the alternatives now shows the alt text.
    // Both the original and the alt remain in the DOM (alt as a chip), so
    // we look for the alt text inside the bg-muted subject paragraph.
    await expect(
      seekerPage.locator("p.rounded.bg-muted", { hasText: alt }),
    ).toBeVisible();
  });

  test("quota exhausted (429) surfaces 'limit reached' inline in the Sheet", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { coldEmail: "quota-exceeded" });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^cold email$/i }).click();

    // The page builds an inline error: "⚠️ Monthly cold email limit reached…".
    await expect(
      seekerPage.getByText(/monthly cold email limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test.fixme(
    "UI tone selector lets the user choose professional/conversational/confident (TODO:UI-GAP — jobs/page.tsx hardcodes tone='professional', no UI selector)",
    async () => {
      // When a tone selector lands in the action bar or in a popover above
      // the outreach buttons, switch this fixme to a real test that:
      //   1. selects "conversational"
      //   2. clicks Cold Email
      //   3. asserts the POST body's tone === "conversational"
    },
  );
});
