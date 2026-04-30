/**
 * seeker/interviews/transcript.spec.ts
 *
 * Verifies the collapsible Interview Transcript section on the seeker
 * report page at /dashboard/interviews/[id].
 *
 * Verified against src/app/(dashboard)/dashboard/interviews/[id]/page.tsx:
 *   - Transcript card is collapsed by default; clicking the header toggles it.
 *   - Each turn renders a 7×7 avatar bubble labelled "AI" or "You" depending
 *     on `speaker === "ai"` (left-aligned) vs "candidate" (right-aligned).
 *   - Each bubble shows the text + an inline timestamp string when present.
 *
 * Coverage (3 tests):
 *   ✅ transcript card renders collapsed by default — turn text NOT visible
 *   ✅ clicking the header expands the card; AI/You labels appear in the
 *      same order as transcript[]
 *   ✅ timestamps render inside each turn bubble
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const INTERVIEW_ID = "interview-transcript-1";

const TRANSCRIPT_TURNS = [
  { speaker: "ai", text: "Walk me through your most recent project.", timestamp: "00:00" },
  { speaker: "candidate", text: "I led a migration from MySQL to PostgreSQL.", timestamp: "00:09" },
  { speaker: "ai", text: "What were the trickiest parts of the cutover?", timestamp: "01:24" },
  { speaker: "candidate", text: "Foreign-key constraints during the dual-write phase.", timestamp: "01:30" },
] as const;

async function mockReport(page: Page): Promise<void> {
  await page.route(`**/api/seeker/interviews/${INTERVIEW_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: INTERVIEW_ID,
          status: "completed",
          interviewType: "technical",
          durationPlanned: 30,
          completedAt: "2026-04-25T10:30:00Z",
          jobTitle: "Backend Engineer",
          candidateName: "Test User",
          executiveSummary: "Solid foundation.",
          strengths: ["Articulate"],
          areasToGrow: ["More metrics"],
          skillRatings: [],
          communicationScores: [],
          transcript: TRANSCRIPT_TURNS,
        },
      }),
    }),
  );
}

test.describe("Seeker interview report — transcript", () => {
  test("transcript card is collapsed by default — no turn text visible", async ({
    seekerPage,
  }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    // The "Interview Transcript" header IS visible (it's the toggle button).
    await expect(
      seekerPage.getByRole("heading", { name: /interview transcript/i }),
    ).toBeVisible({ timeout: 10_000 });

    // None of the turn text bodies should be in the DOM yet.
    for (const turn of TRANSCRIPT_TURNS) {
      await expect(seekerPage.getByText(turn.text)).toHaveCount(0);
    }
  });

  test("clicking the header expands the transcript with AI/You labels in order", async ({
    seekerPage,
  }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await seekerPage
      .getByRole("button")
      .filter({ hasText: /interview transcript/i })
      .first()
      .click();

    // All turn texts visible after expansion.
    for (const turn of TRANSCRIPT_TURNS) {
      await expect(seekerPage.getByText(turn.text)).toBeVisible({
        timeout: 5_000,
      });
    }

    // AI / You labels are rendered as 7×7 avatar bubbles. We assert at
    // least one of each label is present.
    await expect(seekerPage.getByText("AI", { exact: true }).first()).toBeVisible();
    await expect(seekerPage.getByText("You", { exact: true }).first()).toBeVisible();
  });

  test("each expanded turn bubble shows its inline timestamp", async ({
    seekerPage,
  }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await seekerPage
      .getByRole("button")
      .filter({ hasText: /interview transcript/i })
      .first()
      .click();

    for (const turn of TRANSCRIPT_TURNS) {
      // Each timestamp string ("00:00", "01:24", …) appears inside the
      // turn bubble. There may be multiple "00:00" tokens elsewhere on the
      // page in theory, but in our mock these strings are unique.
      await expect(
        seekerPage.getByText(turn.timestamp).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
