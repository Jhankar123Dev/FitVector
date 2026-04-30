/**
 * seeker/outreach/referral-msg-generate.spec.ts
 *
 * Referral request flow — verified against:
 *   - src/app/(dashboard)/dashboard/jobs/page.tsx::generateOutreach (type="referral")
 *   - src/components/outreach/outreach-preview.tsx (type="referral" → body
 *     block + copy button, no subject, no Gmail/Outlook deeplinks).
 *
 * NB: the Free plan has 0 referral_msg quota per PLAN_LIMITS — every Free
 * user sees the 429 "limit reached" path on first attempt. We verify both
 * the success path (mocked, simulating a Pro+ session) and the explicit
 * 429 from the Free-tier behaviour.
 *
 * Coverage (3 tests):
 *   ✅ "Ask Referral" button POSTs /api/ai/referral-msg with the job context
 *   ✅ Sheet renders the referral body + copy button (no subject)
 *   ❌ Free-tier (or any quota-exceeded) returns 429 → inline error in Sheet
 */

import { test, expect } from "../../support/fixtures";
import { JobBoardPage } from "../../support/page-objects/seeker/job-board.page";
import { mockAi } from "../../support/fixtures/mock-fixture";
import { MOCK_REFERRAL_MSG_RESPONSE } from "../../support/mocks/ai-responses";
import type { Page, Request } from "@playwright/test";

const FV_JOB_ID = "referral-job-1";
const FV_JOB_TITLE = "Software Engineer III";
const FV_JOB_COMPANY = "ReferralCo";

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
          workMode: "hybrid",
          jobType: "fulltime",
          salaryMin: 2_500_000,
          salaryMax: 4_000_000,
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
          skillsRequired: ["Go", "Kafka"],
          skillsNiceToHave: [],
          requiredExperienceYears: null,
          isEasyApply: true,
          isSaved: false,
          description: "Build distributed systems for our event-streaming platform.",
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
  await board.searchInput.fill("software");
  await board.searchButton.click();
  await seekerPage.getByText(FV_JOB_TITLE).first().click();
}

test.describe("Outreach — referral request generation", () => {
  test("'Ask Referral' button POSTs /api/ai/referral-msg with the job context", async ({
    seekerPage,
  }) => {
    const requests: Request[] = [];
    await seekerPage.route("**/api/ai/referral-msg", async (route) => {
      requests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REFERRAL_MSG_RESPONSE),
      });
    });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /ask referral/i }).click();

    await expect.poll(() => requests.length).toBeGreaterThan(0);
    const body = requests[0].postDataJSON() as Record<string, unknown>;
    expect(body.jobTitle).toBe(FV_JOB_TITLE);
    expect(body.companyName).toBe(FV_JOB_COMPANY);
  });

  test("Sheet renders the referral body and a Copy button (no subject section)", async ({
    seekerPage,
  }) => {
    await mockAi(seekerPage, { referralMsg: true });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /ask referral/i }).click();

    await expect(
      seekerPage.getByRole("heading", { name: /referral request/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
    // Body fragment from MOCK_REFERRAL_MSG_RESPONSE.
    await expect(
      seekerPage.getByText(/Would you be open to a quick referral chat\?/i),
    ).toBeVisible();
    await expect(
      seekerPage.getByRole("button", { name: /copy message/i }),
    ).toBeVisible();
    await expect(
      seekerPage.getByRole("button", { name: /copy subject/i }),
    ).toHaveCount(0);
  });

  test("Free-tier 429 (or any quota-exceeded) renders the inline limit-reached error", async ({
    seekerPage,
  }) => {
    // PLAN_LIMITS.free.referral_msg === 0 — every Free seeker hits this on
    // the first try. We simulate that with the mockAi helper.
    await mockAi(seekerPage, { referralMsg: "quota-exceeded" });
    await searchAndOpenJob(seekerPage);

    await seekerPage.getByRole("button", { name: /ask referral/i }).click();

    await expect(
      seekerPage.getByText(/monthly referral.*limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
