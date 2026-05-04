/**
 * seeker/plan-gating/upgrade-prompt.spec.ts
 *
 * Verifies the shared <UpgradePrompt /> component that renders in every
 * surface that hits a 429 with `{ upgrade: true }`.
 *
 * Verified against src/components/shared/upgrade-prompt.tsx:
 *   - Inline Card (NOT a modal/dialog) — message + optional feature line
 *   - "Upgrade" button is a Link asChild → /dashboard/settings/plan
 *
 * NB: MASTER_PLAN named this spec "upgrade modal" — the live component is
 * actually an inline card that the parent page conditionally renders when
 * an action returns 429. There is no global modal popup. We test:
 *   1. Jobs search 429 (route: GET /api/jobs/search) → UpgradePrompt
 *      renders inside the jobs page with the correct copy + Upgrade link.
 *   2. Tracker manual-add 429 → UpgradePrompt renders on /dashboard/tracker.
 *   3. The Upgrade Link's href is /dashboard/settings/plan.
 *   4. Outreach 429 (cold email): different surface — the page renders an
 *      inline ⚠️ error in the outreach Sheet, NOT the UpgradePrompt
 *      component. We assert that path explicitly so the differing UX is
 *      documented (and surfaces if a regression unifies them).
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

async function mock429(page: Page, urlPattern: string, body: Record<string, unknown>): Promise<void> {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ upgrade: true, ...body }),
    }),
  );
}

test.describe("UpgradePrompt — surfaces and link target", () => {
  test("jobs/search 429 → UpgradePrompt with 'daily search limit' message + Upgrade link", async ({
    seekerPage,
  }) => {
    await mock429(seekerPage, "**/api/jobs/search**", {
      error:
        "Daily limit reached. You've used 3/3 searches today. Upgrade to Starter for 10/day.",
    });
    await seekerPage.goto("/dashboard/jobs");
    await seekerPage
      .getByPlaceholder(/job title/i)
      .fill("engineer");
    await seekerPage.getByRole("button", { name: /^Search$/ }).click();

    // The page renders <UpgradePrompt message="You've reached your daily search limit." feature="unlimited job searches" />
    await expect(
      seekerPage.getByText(/you've reached your daily search limit/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByText(/upgrade to unlock unlimited job searches/i),
    ).toBeVisible();
  });

  test("UpgradePrompt's 'Upgrade' link navigates to /dashboard/settings/plan", async ({
    seekerPage,
  }) => {
    await mock429(seekerPage, "**/api/jobs/search**", {
      error: "Daily limit reached.",
    });
    await seekerPage.goto("/dashboard/jobs");
    await seekerPage
      .getByPlaceholder(/job title/i)
      .fill("engineer");
    await seekerPage.getByRole("button", { name: /^Search$/ }).click();

    const upgradeLink = seekerPage.getByRole("link", { name: /^Upgrade$/i });
    await expect(upgradeLink).toBeVisible({ timeout: 10_000 });
    await expect(upgradeLink).toHaveAttribute("href", "/dashboard/settings/plan");
  });

  test("tracker manual-add 429 → inline 'Active application limit reached' UpgradePrompt", async ({
    seekerPage,
  }) => {
    // Empty list seed to keep the page tidy.
    await seekerPage.route("**/api/tracker**", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            upgrade: true,
            error: "Active application limit reached (10). Upgrade for more.",
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    await seekerPage.goto("/dashboard/tracker");
    await seekerPage
      .getByRole("button", { name: /personal tracker/i })
      .click();
    await seekerPage.getByRole("button", { name: /add manually/i }).click();
    await seekerPage.getByLabel(/job title/i).fill("Engineer");
    await seekerPage.getByLabel(/company/i).fill("LimitCo");
    await seekerPage.getByRole("button", { name: /^Add$/i }).click();

    await expect(
      seekerPage.getByText(/active application limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("outreach 429 surfaces inline in the Sheet (NOT via UpgradePrompt) — documented divergence", async ({
    seekerPage,
  }) => {
    // /dashboard/jobs outreach buttons render the upgrade error as a
    // ⚠️-prefixed string inside the OutreachPreview Sheet, not via the
    // shared UpgradePrompt component. This test pins that behavior so a
    // future "unify upgrade UX" refactor surfaces here as a failure.
    await seekerPage.route("**/api/jobs/search**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            jobs: [
              {
                id: "j-cold-1",
                title: "Engineer",
                companyName: "LimitedCo",
                companyLogoUrl: null,
                location: "Remote",
                workMode: "remote",
                jobType: "fulltime",
                salaryMin: null,
                salaryMax: null,
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
                skillsRequired: [],
                skillsNiceToHave: [],
                requiredExperienceYears: null,
                isEasyApply: true,
                isSaved: false,
                description: "Description.",
                isDirect: true,
                jobPostId: "j-cold-1",
                applicationDeadline: null,
                openingsCount: 1,
              },
            ],
            total: 1,
            page: 1,
            usage: { used: 1, limit: 10 },
          },
        }),
      }),
    );
    await seekerPage.route("**/api/applications/fitvector", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      }),
    );
    await mock429(seekerPage, "**/api/ai/cold-email", {
      error: "Monthly cold email limit reached.",
    });

    await seekerPage.goto("/dashboard/jobs");
    await seekerPage.getByPlaceholder(/job title/i).fill("engineer");
    await seekerPage.getByRole("button", { name: /^Search$/ }).click();
    await seekerPage.getByText("Engineer").first().click();
    await seekerPage.getByRole("button", { name: /^cold email$/i }).click();

    // Inline ⚠️-prefixed error inside the Sheet, NOT a redirect to /plan.
    await expect(
      seekerPage.getByText(/monthly cold email limit reached/i),
    ).toBeVisible({ timeout: 10_000 });
    // The shared UpgradePrompt component renders a Link "Upgrade" button.
    // For outreach, that component is NOT used — there should be no such
    // link inside the Sheet. (Other Upgrade links may exist in the navbar
    // or elsewhere on the page; we scope to the Sheet.)
    const sheet = seekerPage.locator('[role="dialog"]');
    await expect(sheet.getByRole("link", { name: /^Upgrade$/i })).toHaveCount(0);
  });
});
