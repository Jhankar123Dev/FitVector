/**
 * seeker/interviews/error-states.spec.ts
 *
 * Verifies the error paths on the seeker interview-report page.
 *
 * Verified against src/app/(dashboard)/dashboard/interviews/[id]/page.tsx:
 *   - useEffect → fetch /api/seeker/interviews/{id}; on !res.ok the page
 *     renders an AlertTriangle card with `json.error || "Report not found."`
 *     and a "Go Back" button bound to router.back().
 *   - Loading state shows a centered spinner.
 *
 * Coverage (2 tests + 1 fixme):
 *   ❌ 404 from the API renders the alert card with "Report not found."
 *   ✅ "Go Back" button navigates to the previous page
 *   ⚠ test.fixme — live interview UI mic/camera permission grant
 *      (out of scope: live UI lives at /interview/[token], anon flow;
 *      placeholder for when we cover that surface in a future batch)
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const INTERVIEW_ID = "interview-error-1";

async function mockReport404(page: Page): Promise<void> {
  await page.route(`**/api/seeker/interviews/${INTERVIEW_ID}`, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "Report not found." }),
    }),
  );
}

test.describe("Seeker interview report — error states", () => {
  test("404 from /api/seeker/interviews/[id] renders the alert card", async ({
    seekerPage,
  }) => {
    await mockReport404(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    // Error card content: "Report not found." copy + "Go Back" button.
    await expect(
      seekerPage.getByText(/report not found/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByRole("button", { name: /go back/i }),
    ).toBeVisible();
  });

  test("'Go Back' button navigates to the previous page", async ({ seekerPage }) => {
    // Establish a prior URL so router.back() has somewhere to go.
    await seekerPage.goto("/dashboard");
    await mockReport404(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);
    await expect(seekerPage).toHaveURL(new RegExp(`/interviews/${INTERVIEW_ID}`));

    await seekerPage.getByRole("button", { name: /go back/i }).click();

    // History pop should land us on /dashboard.
    await expect(seekerPage).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  });

  test.fixme(
    "live interview UI mic/camera permission grant (TODO: out-of-scope here — covered when /interview/[token] UI specs land. Pattern: await context.grantPermissions(['microphone','camera'], { origin: BASE_URL }); then mock POST /api/interview/[token]/message with MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE and MOCK_INTERVIEW_COMPLETE_RESPONSE)",
    async () => {
      // Future shape, when wiring the live UI:
      //   await page.context().grantPermissions(["microphone", "camera"], {
      //     origin: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
      //   });
      //   await mockAi(page, { interviewMessage: "next" });
      //   await page.goto(`/interview/${liveToken}`);
      //   await page.getByRole("button", { name: /start interview/i }).click();
      //   // …drive turns…
      //   await mockAi(page, { interviewMessage: "complete" });
      //   await page.getByRole("button", { name: /end interview/i }).click();
    },
  );
});
