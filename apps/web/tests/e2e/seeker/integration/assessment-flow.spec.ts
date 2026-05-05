/**
 * seeker/integration/assessment-flow.spec.ts
 *
 * END-TO-END: handoff between the authenticated seeker dashboard and the
 * public token-gated assessment surface.
 *
 *   /dashboard/tests           ← seeker, authed
 *        │
 *        │ click "Take Test" (Link → /assessments/take/{id})
 *        ▼
 *   /assessments/take/{id}     ← (assessment) route group, no session needed
 *        │ GET    /api/assessment/{id}        — fetch questions
 *        │ POST   /api/assessment/{id}/start  — flip invited → started
 *        │ POST   /api/code/execute           — preview-test the coding question
 *        │ POST   /api/assessment/{id}/submit — submit + grade
 *        ▼
 *   results screen → "← Back to My Tests" Link
 *        ▼
 *   /dashboard/tests           ← Completed tab now lists the same id with score
 *
 * Mocking strategy:
 *   - /api/assessment/{id}        — pageRoute fulfills with a mixed assessment
 *     (1 MCQ + 1 coding) using stripCorrectAnswers'd shape.
 *   - /api/assessment/{id}/start  — 200.
 *   - /api/code/execute           — driven by mockCodeExecute(page, "all-passed").
 *   - /api/assessment/{id}/submit — 200 with finalScore=85 + status="graded".
 *   - /api/user/tests             — uses a closure-mutable `phase` so the
 *     same route returns "invited" on first load and "graded" after submit.
 *
 * Coverage (single end-to-end spec, multiple assertions):
 *   ✅ Pending tab shows the invited test
 *   ✅ "Take Test" link navigates to /assessments/take/{id}
 *   ✅ POST /api/assessment/{id}/start fires when "Start Assessment" clicked
 *   ✅ Coding question's "▶ Run Code" fires POST /api/code/execute
 *   ✅ Submit fires POST /api/assessment/{id}/submit with the candidate's answers
 *   ✅ Results screen renders the server-returned finalScore (85% → Passed)
 *   ✅ "← Back to My Tests" returns to /dashboard/tests
 *   ✅ Completed tab now lists the test with 85% + Passed badge
 */

import { test, expect } from "../../support/fixtures";
import { mockCodeExecute } from "../../support/fixtures/mock-fixture";
import type { Page, Request } from "@playwright/test";

const ASSESSMENT_ID = "00000000-0000-4000-8000-000000000001";

/** A row as returned by /api/user/tests — must match the route's shape exactly. */
interface UserTestRow {
  id: string;
  assessmentName: string;
  assessmentType: string;
  jobTitle: string;
  status: "invited" | "started" | "submitted" | "graded" | "expired";
  finalScore: number | null;
  autoScore: number | null;
  passingScore: number | null;
  timeLimit: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
}

const PRE_SUBMIT_ROW: UserTestRow = {
  id: ASSESSMENT_ID,
  assessmentName: "Frontend Mixed Assessment",
  assessmentType: "mixed",
  jobTitle: "Senior Frontend Engineer",
  status: "invited",
  finalScore: null,
  autoScore: null,
  passingScore: 70,
  timeLimit: 30,
  startedAt: null,
  submittedAt: null,
  createdAt: "2026-04-25T10:00:00Z",
};

const POST_SUBMIT_ROW: UserTestRow = {
  ...PRE_SUBMIT_ROW,
  status: "graded",
  finalScore: 85,
  autoScore: 85,
  startedAt: "2026-04-25T10:01:00Z",
  submittedAt: "2026-04-25T10:25:00Z",
};

/**
 * /api/assessment/[id] response shape — matches what the route returns
 * after stripCorrectAnswers(). Includes 1 MCQ + 1 coding question.
 */
function buildTakeResponse(status: "invited" | "started") {
  return {
    data: {
      id: ASSESSMENT_ID,
      status,
      startedAt: status === "started" ? new Date().toISOString() : null,
      expiresAt: null,
      candidateName: "Test Candidate",
      assessmentName: PRE_SUBMIT_ROW.assessmentName,
      assessmentType: "mixed",
      jobTitle: PRE_SUBMIT_ROW.jobTitle,
      timeLimitMinutes: 30,
      difficulty: "medium",
      passingScore: 70,
      questions: [
        {
          id: "q-mcq-1",
          type: "multiple_choice",
          prompt: "Which array method returns a NEW array without mutating the original?",
          options: ["push", "splice", "map", "sort"],
          points: 1,
          // correctAnswer stripped — never reaches the client.
        },
        {
          id: "q-code-1",
          type: "code",
          prompt: "Implement a function that returns the sum of two numbers.",
          starterCode: "function add(a, b) {\n  // your code here\n}",
          codeLanguage: "nodejs",
          points: 2,
          // testCases stripped — server fetches them when /api/code/execute fires.
        },
      ],
      settings: {
        proctoring: { tabSwitchDetection: false, copyPasteDetection: false },
        showResultsToCandidate: true,
      },
      questionCount: 2,
    },
  };
}

interface RouteCounts {
  start: number;
  submit: number;
}

/**
 * Wires up every route the take flow hits. The /api/user/tests handler
 * flips its response based on a closure flag so we can simulate the
 * pending-then-graded transition without re-mocking mid-test.
 */
async function mockAssessmentChain(page: Page): Promise<{
  counts: RouteCounts;
  submitRequests: Request[];
  setPhase: (phase: "pre" | "post") => void;
}> {
  let phase: "pre" | "post" = "pre";
  const counts: RouteCounts = { start: 0, submit: 0 };
  const submitRequests: Request[] = [];

  // 1. /api/user/tests — flips between pre and post.
  await page.route("**/api/user/tests", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [phase === "pre" ? PRE_SUBMIT_ROW : POST_SUBMIT_ROW],
      }),
    }),
  );

  // 2. GET /api/assessment/{id} — initial intro screen load.
  await page.route(`**/api/assessment/${ASSESSMENT_ID}`, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildTakeResponse("invited")),
    });
  });

  // 3. POST /api/assessment/{id}/start
  await page.route(
    `**/api/assessment/${ASSESSMENT_ID}/start`,
    async (route) => {
      counts.start += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: ASSESSMENT_ID, status: "started", startedAt: new Date().toISOString() },
          message: "Assessment started",
        }),
      });
    },
  );

  // 4. POST /api/code/execute — using the W1 mockCodeExecute helper.
  await mockCodeExecute(page, "all-passed");

  // 5. POST /api/assessment/{id}/submit → returns finalScore=85.
  await page.route(
    `**/api/assessment/${ASSESSMENT_ID}/submit`,
    async (route) => {
      counts.submit += 1;
      submitRequests.push(route.request());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: ASSESSMENT_ID,
            status: "graded",
            autoScore: 85,
            finalScore: 85,
            timeTaken: 24,
            wasLate: false,
            needsManualReview: false,
            gradedAnswers: [
              { questionId: "q-mcq-1", isCorrect: true, pointsEarned: 1, pointsMax: 1 },
              { questionId: "q-code-1", isCorrect: true, pointsEarned: 2, pointsMax: 2 },
            ],
          },
          message: "Assessment submitted successfully",
        }),
      });
    },
  );

  return {
    counts,
    submitRequests,
    setPhase: (next) => {
      phase = next;
    },
  };
}

test.describe("Integration — assessment hand-off (dashboard → take → dashboard)", () => {
  test("seeker takes a pending test, submits it, and the result syncs back to /dashboard/tests", async ({
    seekerPage,
  }) => {
    const { counts, submitRequests, setPhase } = await mockAssessmentChain(seekerPage);

    // ── 1. Land on /dashboard/tests, see the invited test in the Pending tab ──
    await seekerPage.goto("/dashboard/tests");
    await expect(
      seekerPage.getByText("Frontend Mixed Assessment"),
    ).toBeVisible({ timeout: 10_000 });

    // The "Take Test" link must point at the public take URL.
    const pendingRow = seekerPage
      .locator("tr", { hasText: "Frontend Mixed Assessment" });
    const takeLink = pendingRow.getByRole("link", { name: /take test/i });
    await expect(takeLink).toHaveAttribute(
      "href",
      `/assessments/take/${ASSESSMENT_ID}`,
    );

    // ── 2. Cross the boundary to the public take page ─────────────────────────
    await takeLink.click();
    await expect(seekerPage).toHaveURL(
      new RegExp(`/assessments/take/${ASSESSMENT_ID}$`),
      { timeout: 10_000 },
    );

    // Intro screen renders the assessment title + Start button.
    await expect(
      seekerPage.getByRole("heading", {
        name: /^Frontend Mixed Assessment$/,
        level: 1,
      }),
    ).toBeVisible();

    // ── 3. Start the assessment → POST /start fires + view flips to "test" ───
    await seekerPage.getByRole("button", { name: /start assessment/i }).click();
    await expect.poll(() => counts.start).toBeGreaterThan(0);

    // First question (MCQ) is now visible.
    await expect(
      seekerPage.getByText(
        /Which array method returns a NEW array without mutating the original/i,
      ),
    ).toBeVisible({ timeout: 10_000 });

    // ── 4. Answer the MCQ ────────────────────────────────────────────────────
    // Each option renders as a <button> with the option text inside a <span>.
    // Use a broad regex — option letter prefix format (e.g. "C. map", "C  map")
    // varies by UI; matching the option text alone is unambiguous since "map"
    // appears in exactly one of the four options (push / splice / map / sort).
    await seekerPage.getByRole("button", { name: /\bmap\b/i }).click();

    // Advance to the coding question via the "Next" / "Review & Submit" button.
    await seekerPage.getByRole("button", { name: /^Next$/i }).click();

    // ── 5. Coding question — drive "▶ Run Code" against the mocked endpoint ─
    await expect(
      seekerPage.getByText(/Implement a function that returns the sum of two numbers/i),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for the Monaco editor's textarea OR the answered-state heuristic
    // (the page treats code questions as "answered" if starter code is in the
    // editor, so we don't need to type anything to pass the answered check).
    // Fire the Run button — the request body carries the questionId +
    // submissionToken, both of which we don't strictly assert here. The win
    // is: the mock fires, the page renders the all-passed preview results.
    const runRequestPromise = seekerPage.waitForRequest(
      (req) =>
        req.url().includes("/api/code/execute") && req.method() === "POST",
      { timeout: 15_000 },
    );

    // The button label is "▶ Run" (mobile) or "▶ Run Code" (desktop). Use a
    // forgiving regex that matches either.
    await seekerPage.getByRole("button", { name: /run( code)?/i }).first().click();
    await runRequestPromise;

    // ── 6. Review & Submit → confirm dialog → Submit ────────────────────────
    await seekerPage
      .getByRole("button", { name: /review & submit/i })
      .click();
    await expect(
      seekerPage.getByRole("heading", { name: /submit assessment\?/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Inside the dialog, click the second "Submit" button (the destructive one).
    await seekerPage
      .getByRole("dialog")
      .getByRole("button", { name: /^Submit$/ })
      .click()
      .catch(async () => {
        // No dialog role on this confirm card — fall back to the visible Submit.
        await seekerPage
          .locator('button:has-text("Submit"):not(:has-text("Submit Assessment"))')
          .last()
          .click();
      });

    // Wait for the submit POST to fire.
    await expect.poll(() => counts.submit).toBeGreaterThan(0);
    expect(submitRequests[0].method()).toBe("POST");
    const submitBody = submitRequests[0].postDataJSON() as {
      answers: Array<{ questionId: string; selectedAnswer?: string }>;
    };
    // Both answers landed in the payload.
    expect(submitBody.answers.map((a) => a.questionId).sort()).toEqual(
      ["q-code-1", "q-mcq-1"],
    );

    // ── 7. Results screen renders the server's finalScore ────────────────────
    await expect(
      seekerPage.getByRole("heading", { name: /assessment passed/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(seekerPage.getByText("85%", { exact: true })).toBeVisible();

    // ── 8. Flip the /api/user/tests mock to the post-submit shape ───────────
    setPhase("post");

    // ── 9. Click "← Back to My Tests" → land back on /dashboard/tests ────────
    await seekerPage
      .getByRole("link", { name: /back to my tests/i })
      .click();
    await expect(seekerPage).toHaveURL(/\/dashboard\/tests$/, { timeout: 10_000 });

    // Reload to bust React Query's 30s staleTime cache — without this, the
    // in-memory cache still returns the pre-submit "invited" row and the
    // completed tab shows an empty state.
    await seekerPage.reload();
    await expect(seekerPage.getByRole("heading", { name: /my tests/i })).toBeVisible({
      timeout: 10_000,
    });

    // ── 10. Switch to Completed tab → the same row appears with 85% Passed ──
    await seekerPage
      .getByRole("button", { name: /^completed/i })
      .first()
      .click();

    const completedRow = seekerPage
      .locator("tr", { hasText: "Frontend Mixed Assessment" });
    await expect(completedRow).toBeVisible({ timeout: 10_000 });
    await expect(completedRow.getByText("85%", { exact: true })).toBeVisible();
    await expect(
      completedRow.getByText("Passed", { exact: true }),
    ).toBeVisible();

    // The action column for graded rows offers "View Results", not "Take Test".
    await expect(
      completedRow.getByRole("link", { name: /view results/i }),
    ).toBeVisible();
    await expect(
      completedRow.getByRole("link", { name: /take test/i }),
    ).toHaveCount(0);
  });
});
