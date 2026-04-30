/**
 * seeker/outreach/linkedin-msg-generate.spec.ts
 *
 * Drives the LinkedIn ("InMail") outreach flow. Same plumbing as cold email
 * — initiated from the job-detail action bar, opens a Sheet with the
 * <OutreachPreview type="linkedin" …>. Difference: no subject (LinkedIn
 * messages don't have one), so the preview renders body + copy only.
 *
 * Verified against:
 *   - src/app/(dashboard)/dashboard/jobs/page.tsx — POST /api/ai/linkedin-msg
 *   - src/components/outreach/outreach-preview.tsx — `type === "linkedin"`
 *     renders the body block with one CopyButton, NO subject section.
 *   - W1 mock: MOCK_LINKEDIN_MSG_RESPONSE.
 *
 * Coverage (3 tests):
 *   ✅ InMail button POSTs /api/ai/linkedin-msg with the job context
 *   ✅ Sheet renders the body and a Copy message button (no Subject)
 *   ❌ quota-exceeded (429) surfaces inline in the Sheet
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import { mockAi } from "../../support/fixtures/mock-fixture";
import { MOCK_LINKEDIN_MSG_RESPONSE } from "../../support/mocks/ai-responses";
import type { Page, Request } from "@playwright/test";

const FV_JOB_ID = "linkedin-job-1";
const FV_JOB_TITLE = "Frontend Lead";
const FV_JOB_COMPANY = "InMailCo";

function jobsSearchResponse() {
  return {
    data: {
      jobs: [
        {
          id: FV_JOB_ID,
          title: FV_JOB_TITLE,
          companyName: FV_JOB_COMPANY,
          companyLogoUrl: null,
          location: "Remote",
          workMode: "remote",
          jobType: "fulltime",
          salaryMin: 3_000_000,
          salaryMax: 5_000_000,
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
          skillsRequired: ["TypeScript", "React"],
          skillsNiceToHave: [],
          requiredExperienceYears: null,
          isEasyApply: true,
          isSaved: false,
          description: "Lead the frontend platform team building our design system.",
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

async function searchAndOpenJob(seekerPage: Page): Promise<void> {
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
  await board.searchInput.fill("frontend");
  await board.searchButton.click();
  await seekerPage.getByText(FV_JOB_TITLE).first().click();
}

test.describe("Outreach — LinkedIn message generation", () => {
  test("InMail button POSTs /api/ai/linkedin-msg with the job context", async ({
    seekerPage,
  }) => {
    const requests: Request[] = [];
    await seekerPage.route("**/api/ai/linkedin-msg", async (route) => {
      requests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LINKEDIN_MSG_RESPONSE),
      });
    });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^inmail$/i }).click();

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const body = requests[0].postDataJSON() as Record<string, unknown>;
    expect(body.jobTitle).toBe(FV_JOB_TITLE);
    expect(body.companyName).toBe(FV_JOB_COMPANY);
    expect(typeof body.jobDescription).toBe("string");
  });

  test("Sheet renders the body and a Copy button — no Subject section", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { linkedinMsg: true });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^inmail$/i }).click();

    // Sheet title shows "LinkedIn Message".
    await expect(
      seekerPage.getByRole("heading", { name: /linkedin message/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    // Body fragment from MOCK_LINKEDIN_MSG_RESPONSE.
    await expect(
      seekerPage.getByText(/I noticed Acme is hiring a Software Engineer/i),
    ).toBeVisible();
    // Copy message button visible; subject copy button absent.
    await expect(
      seekerPage.getByRole("button", { name: /copy message/i }),
    ).toBeVisible();
    await expect(
      seekerPage.getByRole("button", { name: /copy subject/i }),
    ).toHaveCount(0);
  });

  test("quota exhausted (429) surfaces 'limit reached' inline in the Sheet", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { linkedinMsg: "quota-exceeded" });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /^inmail$/i }).click();

    await expect(
      seekerPage.getByText(/monthly linkedin message limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
