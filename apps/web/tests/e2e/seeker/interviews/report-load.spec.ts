/**
 * seeker/interviews/report-load.spec.ts
 *
 * Verifies the seeker AI-interview *report* page at
 * /dashboard/interviews/[id].
 *
 * IMPORTANT: this is the post-interview *report* surface (read-only,
 * no audio/video, no live AI turns). The live interview UI lives at the
 * public /interview/[token] route — its API contract is already covered
 * by W2's anon/public-interview.spec.ts. The report is a pure data
 * render, so we mock GET /api/seeker/interviews/[id] and assert on the
 * sections that come back.
 *
 * Verified against src/app/(dashboard)/dashboard/interviews/[id]/page.tsx:
 *   Sections in the response shape: executiveSummary, strengths,
 *   areasToGrow, skillRatings (1–5 stars per skill + note),
 *   communicationScores (label + 1–5 score + note), transcript.
 *   Header chips: "Completed" badge + interview-type label
 *   ("Technical Screening" | "Behavioural" | "Role-Specific" | "General").
 *
 * Coverage (5 tests):
 *   ✅ Executive Summary card renders the summary text
 *   ✅ "Your Strengths" card lists every strength bullet
 *   ✅ "Areas to Develop" card lists every growth bullet
 *   ✅ "Skill Assessment" renders one row per skill with a "{N}/5" star bar
 *   ✅ "Communication" card renders one row per communication score
 */

import { test, expect } from "../../support/fixtures";
import type { Page } from "@playwright/test";

const INTERVIEW_ID = "interview-report-1";

const MOCK_REPORT = {
  id: INTERVIEW_ID,
  status: "completed",
  interviewType: "technical",
  durationPlanned: 30,
  completedAt: "2026-04-25T10:30:00Z",
  jobTitle: "Senior Backend Engineer",
  candidateName: "Test User",
  executiveSummary:
    "Strong technical foundation with clear, structured thinking. " +
    "Communication is concise and the candidate articulated trade-offs well.",
  strengths: [
    "Articulated complex distributed-systems concepts cleanly",
    "Proactively flagged trade-offs in proposed designs",
    "Strong fundamentals on PostgreSQL indexing",
  ],
  areasToGrow: [
    "Could deepen knowledge of consensus algorithms (Raft, Paxos)",
    "Add more concrete metrics to project impact statements",
  ],
  skillRatings: [
    { skill: "System Design", score: 4, note: "Good high-level decomposition." },
    { skill: "Coding (Backend)", score: 5, note: "Clean, idiomatic Node.js + Postgres." },
    { skill: "Problem Solving", score: 4, note: "Asked targeted clarifying questions." },
  ],
  communicationScores: [
    { label: "Clarity", score: 5, note: "Precise word choice." },
    { label: "Pacing", score: 4, note: "Steady — could pause more for emphasis." },
    { label: "Confidence", score: 4, note: "" },
  ],
  transcript: [
    { speaker: "ai", text: "Tell me about a recent project you led.", timestamp: "00:00" },
    { speaker: "candidate", text: "Most recently I led the migration of our…", timestamp: "00:08" },
  ],
};

async function mockReport(page: Page, body: unknown = MOCK_REPORT): Promise<void> {
  await page.route(`**/api/seeker/interviews/${INTERVIEW_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: body }),
    }),
  );
}

test.describe("Seeker interview report — sections", () => {
  test("Executive Summary card renders the full summary text", async ({ seekerPage }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await expect(
      seekerPage.getByRole("heading", { name: /overall summary/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      seekerPage.getByText(MOCK_REPORT.executiveSummary),
    ).toBeVisible();
  });

  test("'Your Strengths' card lists every strength bullet", async ({ seekerPage }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await expect(
      seekerPage.getByRole("heading", { name: /your strengths/i }),
    ).toBeVisible({ timeout: 10_000 });
    for (const strength of MOCK_REPORT.strengths) {
      await expect(seekerPage.getByText(strength)).toBeVisible();
    }
  });

  test("'Areas to Develop' card lists every growth bullet", async ({ seekerPage }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await expect(
      seekerPage.getByRole("heading", { name: /areas to develop/i }),
    ).toBeVisible({ timeout: 10_000 });
    for (const area of MOCK_REPORT.areasToGrow) {
      await expect(seekerPage.getByText(area)).toBeVisible();
    }
  });

  test("'Skill Assessment' card renders each skill with a {score}/5 label", async ({
    seekerPage,
  }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await expect(
      seekerPage.getByRole("heading", { name: /skill assessment/i }),
    ).toBeVisible({ timeout: 10_000 });

    for (const sr of MOCK_REPORT.skillRatings) {
      // Skill row contains the skill name AND the "N/5" label rendered by StarBar.
      const row = seekerPage.locator("div", { hasText: sr.skill }).first();
      await expect(row).toBeVisible();
      // StarBar renders "{score}/5" as inline text.
      await expect(
        seekerPage.getByText(`${sr.score}/5`).first(),
      ).toBeVisible();
    }
  });

  test("'Communication' card renders one row per communicationScores entry", async ({
    seekerPage,
  }) => {
    await mockReport(seekerPage);
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_ID}`);

    await expect(
      seekerPage.getByRole("heading", { name: /^communication$/i }),
    ).toBeVisible({ timeout: 10_000 });
    for (const cs of MOCK_REPORT.communicationScores) {
      await expect(seekerPage.getByText(cs.label, { exact: true })).toBeVisible();
    }
  });
});
