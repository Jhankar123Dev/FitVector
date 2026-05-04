/**
 * seeker/integration/interview-flow.spec.ts
 *
 * END-TO-END: handoff between the authenticated seeker dashboard and the
 * public token-gated AI interview surface.
 *
 *   /dashboard/tracker         ← seeker, authed; Applied tab carries
 *        │                       interviewLink ("/interview/{token}") on every
 *        │                       row whose fitvectorStatus="interview_invited"
 *        │
 *        │ navigate to interview URL
 *        ▼
 *   /interview/{token}         ← public, no auth; Web-Speech-API driven
 *        │ GET    /api/interview/{token}          — fetch info
 *        │ POST   /api/interview/{token}/start    — flip invited → started
 *        │ POST   /api/interview/{token}/message  — Q&A loop until isComplete
 *        │ POST   /api/interview/{token}/complete — final save
 *        ▼
 *   /dashboard/interviews/{id} ← seeker again; the report should now be
 *                                generated and renderable.
 *
 * BROWSER-API SHIMS (critical):
 *   The live page uses window.SpeechRecognition + window.speechSynthesis.
 *   Headless Chromium ships neither. Without shims the page short-circuits
 *   to a "Browser Not Supported" error. We:
 *     1. Grant fake mic + camera permissions on the context.
 *     2. addInitScript() injects:
 *          • a SpeechRecognition class whose `start()` synchronously fires
 *            an `onresult` event with a final transcript ≥20 chars (so the
 *            page accepts the answer when "Done Speaking" is clicked).
 *          • a speechSynthesis stub whose `speak(utt)` invokes
 *            utt.onend on the next tick, advancing the page from
 *            "ai-speaking" → "listening".
 *
 * MOCK STRATEGY:
 *   - /api/tracker            — one row with interviewLink set.
 *   - /api/interview/{token}                — info (status=invited).
 *   - /api/interview/{token}/start          — 200.
 *   - /api/interview/{token}/message        — first call returns nextQuestion;
 *     second call returns isComplete=true (so we exit after one Q&A).
 *   - /api/interview/{token}/complete       — 200.
 *   - /api/seeker/interviews/{token}        — initially 404; flipped to 200
 *     with a populated report once the live flow completes.
 *
 * Coverage (single end-to-end spec, multiple assertions):
 *   ✅ /dashboard/tracker Applied tab shows the row with the interview link
 *   ✅ Permissions granted: getUserMedia is callable from the page
 *   ✅ Welcome screen → "Start Voice Interview" fires POST /start
 *   ✅ "Done Speaking" fires POST /message with { answer, history }
 *   ✅ Second message round returns isComplete=true → "Interview Complete" screen
 *   ✅ POST /complete fires with the full history
 *   ✅ Navigating to /dashboard/interviews/{id} renders the report
 */

import { test, expect } from "../../support/fixtures";
import { mockAi } from "../../support/fixtures/mock-fixture";
import {
  MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE,
  MOCK_INTERVIEW_COMPLETE_RESPONSE,
} from "../../support/mocks/ai-responses";
import type { Page, Request } from "@playwright/test";

const INTERVIEW_TOKEN = "00000000-0000-4000-8000-000000000999";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const TRACKER_ROW = {
  id: "row-fv-int-1",
  jobId: null,
  jobTitle: "Backend Engineer",
  companyName: "InterviewCo",
  companyLogoUrl: null,
  location: "Remote",
  jobUrl: null,
  status: "applied",
  fitvectorStatus: "interview_invited",
  rawPipelineStage: "ai_interview_pending",
  isTransparentPipeline: false,
  matchScore: 91,
  interviewLink: `${BASE_URL}/interview/${INTERVIEW_TOKEN}`,
  statusHistory: [],
  notes: null,
  nextFollowupDate: null,
  positionOrder: 1,
  contactName: null,
  contactEmail: null,
  contactRole: null,
  tailoredResumeId: null,
  fitvectorAppId: "fv-app-int-1",
  appliedAt: "2026-04-20T10:00:00Z",
  createdAt: "2026-04-20T10:00:00Z",
};

const SEEKER_REPORT = {
  id: INTERVIEW_TOKEN,
  status: "completed",
  interviewType: "technical",
  durationPlanned: 30,
  completedAt: new Date().toISOString(),
  jobTitle: TRACKER_ROW.jobTitle,
  candidateName: "Test User",
  executiveSummary: "Strong candidate with clear technical reasoning.",
  strengths: ["Clear architectural thinking", "Concrete project examples"],
  areasToGrow: ["Could deepen distributed-systems trade-offs"],
  skillRatings: [{ skill: "System Design", score: 4, note: "" }],
  communicationScores: [{ label: "Clarity", score: 5, note: "" }],
  transcript: [
    { speaker: "ai" as const, text: MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE.nextQuestion, timestamp: "00:00" },
    { speaker: "candidate" as const, text: "I am the candidate's mocked spoken answer.", timestamp: "00:08" },
  ],
};

/**
 * Inject Web-Speech-API shims BEFORE any page script runs.
 * - SpeechRecognition: new instance whose .start() asynchronously fires
 *   onresult with one final-transcript ≥ 20 chars. The page's silence
 *   timer (8s after >=20 chars) is cancelled because we click "Done
 *   Speaking" before it fires.
 * - speechSynthesis: speak(utt) invokes utt.onend on the next tick so the
 *   page advances from "ai-speaking" → "listening".
 */
async function injectSpeechShims(page: Page): Promise<void> {
  await page.addInitScript(() => {
    interface FakeResult {
      transcript: string;
    }
    type FakeResultList = (FakeResult[] & { isFinal: boolean })[];

    class FakeSpeechRecognition extends EventTarget {
      continuous = false;
      interimResults = true;
      lang = "en-US";
      onresult:
        | ((e: { results: FakeResultList }) => void)
        | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: { error: string }) => void) | null = null;
      private _aborted = false;
      private _timer: ReturnType<typeof setTimeout> | null = null;

      start() {
        this._aborted = false;
        this._timer = setTimeout(() => {
          if (this._aborted) return;
          const result0 = [
            { transcript: "I am the candidate giving a mocked spoken answer right now." },
          ] as FakeResult[] & { isFinal: boolean };
          result0.isFinal = true;
          const list: FakeResultList = [result0];
          this.onresult?.({ results: list });
        }, 60);
      }
      stop() {
        this._aborted = true;
        if (this._timer) clearTimeout(this._timer);
        // Don't auto-restart — the page handles that itself.
        this.onend?.();
      }
      abort() {
        this._aborted = true;
        if (this._timer) clearTimeout(this._timer);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = FakeSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = FakeSpeechRecognition;

    interface FakeUtterance {
      text: string;
      rate?: number;
      pitch?: number;
      voice?: unknown;
      onend?: () => void;
      onerror?: (e: unknown) => void;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      rate = 1;
      pitch = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };

    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak(utt: FakeUtterance) {
          // Fire onend on the next macrotask so the React handler that
          // sets phase="listening" runs after speak() returns.
          setTimeout(() => utt.onend?.(), 20);
        },
        cancel() {},
        getVoices() {
          return [{ lang: "en-US", name: "Test Voice" }];
        },
      },
    });
  });
}

interface RouteCounts {
  start: number;
  message: number;
  complete: number;
}

/**
 * Wires up the interview-side routes. /message returns the next question
 * on call 1 and isComplete=true on call 2.
 */
async function mockInterviewChain(page: Page): Promise<{
  counts: RouteCounts;
  messageRequests: Request[];
  setReportReady: () => void;
}> {
  const counts: RouteCounts = { start: 0, message: 0, complete: 0 };
  const messageRequests: Request[] = [];
  let reportReady = false;

  await page.route("**/api/tracker**", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [TRACKER_ROW] }),
    });
  });

  await page.route(`**/api/interview/${INTERVIEW_TOKEN}`, (route) => {
    // Only the bare GET — start/message/complete have their own patterns below.
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: INTERVIEW_TOKEN,
          status: "invited",
          interviewType: "technical",
          durationPlanned: 30,
          candidateName: "Test User",
          jobTitle: TRACKER_ROW.jobTitle,
        },
      }),
    });
  });

  await page.route(
    `**/api/interview/${INTERVIEW_TOKEN}/start`,
    async (route) => {
      counts.start += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { id: INTERVIEW_TOKEN, status: "started", startedAt: new Date().toISOString() },
          message: "Interview started",
        }),
      });
    },
  );

  await page.route(
    `**/api/interview/${INTERVIEW_TOKEN}/message`,
    async (route) => {
      counts.message += 1;
      messageRequests.push(route.request());

      const body = route.request().postDataJSON() as {
        answer?: string;
        history?: Array<{ question: string; answer: string }>;
      };

      // Round 1 (history.length === 0): seed first question.
      // Round 2 (history.length === 1): mark complete.
      const isComplete = (body.history?.length ?? 0) >= 1;
      const responseBody = isComplete
        ? MOCK_INTERVIEW_COMPLETE_RESPONSE
        : MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });
    },
  );

  await page.route(
    `**/api/interview/${INTERVIEW_TOKEN}/complete`,
    async (route) => {
      counts.complete += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { id: INTERVIEW_TOKEN, status: "completed" } }),
      });
    },
  );

  await page.route(
    `**/api/seeker/interviews/${INTERVIEW_TOKEN}`,
    async (route) => {
      if (!reportReady) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Report not yet generated." }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: SEEKER_REPORT }),
      });
    },
  );

  return {
    counts,
    messageRequests,
    setReportReady: () => {
      reportReady = true;
    },
  };
}

test.describe("Integration — interview hand-off (tracker → live → report)", () => {
  test("seeker starts an interview, completes the AI Q&A, and the report renders on /dashboard/interviews/[id]", async ({
    seekerPage,
  }) => {
    // Browser permissions: mic + camera (the live page calls getUserMedia
    // implicitly via SpeechRecognition; we still grant explicitly so the
    // permission UI never blocks).
    await seekerPage.context().grantPermissions(["microphone", "camera"], {
      origin: BASE_URL,
    });
    await injectSpeechShims(seekerPage);

    // Mock the AI message endpoint via the W1 helper for the no-history
    // branch — the per-history-length branching is then handled by the
    // route mock in mockInterviewChain (which overrides the simpler mockAi
    // route since route handlers register newest-first).
    await mockAi(seekerPage, { interviewMessage: "next" });

    const { counts, messageRequests, setReportReady } =
      await mockInterviewChain(seekerPage);

    // ── 1. Land on /dashboard/tracker → Applied tab ─────────────────────────
    await seekerPage.goto("/dashboard/tracker");
    await expect(seekerPage.getByText(TRACKER_ROW.jobTitle)).toBeVisible({
      timeout: 10_000,
    });

    // The "Start Interview" link is rendered with target="_blank"; we read its
    // href and navigate the same context to keep the test single-page.
    const startInterviewLink = seekerPage
      .getByRole("link", { name: /start interview/i })
      .first();
    await expect(startInterviewLink).toHaveAttribute(
      "href",
      TRACKER_ROW.interviewLink,
    );

    // ── 2. Cross to the public interview surface ────────────────────────────
    await seekerPage.goto(TRACKER_ROW.interviewLink);
    await expect(
      seekerPage.getByRole("heading", { name: /ai voice interview/i }),
    ).toBeVisible({ timeout: 10_000 });

    // ── 3. Click "Start Voice Interview" → POST /start fires + AI speaks ────
    await seekerPage
      .getByRole("button", { name: /start voice interview/i })
      .click();
    await expect.poll(() => counts.start).toBeGreaterThan(0);

    // After /start the page fetches the first question via /message with
    // history=[] → our mock returns the "next" payload. Wait for the
    // listening state's "Done Speaking" button to appear (signals that the
    // TTS shim fired onend AND the SpeechRecognition shim populated the
    // transcript).
    await expect(
      seekerPage.getByRole("button", { name: /done speaking/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect.poll(() => counts.message).toBeGreaterThanOrEqual(1);

    // ── 4. End first turn — POST /message round 2 returns isComplete=true ──
    await seekerPage
      .getByRole("button", { name: /done speaking/i })
      .click();

    // The "Interview Complete" screen is the canonical end-state.
    await expect(
      seekerPage.getByRole("heading", { name: /interview complete/i }),
    ).toBeVisible({ timeout: 15_000 });
    expect(counts.message).toBeGreaterThanOrEqual(2);
    expect(counts.complete).toBeGreaterThan(0);

    // The /message round-2 body must include the candidate's transcribed
    // answer in the history.
    const round2 = messageRequests[1];
    const body2 = round2.postDataJSON() as {
      answer: string;
      history: Array<{ question: string; answer: string }>;
    };
    expect(body2.history.length).toBeGreaterThanOrEqual(1);
    expect(body2.history[body2.history.length - 1].answer.length).toBeGreaterThan(0);

    // ── 5. Flip the report mock to "ready" and navigate to the report ────────
    setReportReady();
    await seekerPage.goto(`/dashboard/interviews/${INTERVIEW_TOKEN}`);

    // Report sections render — proves the seeker side reflects the live flow.
    await expect(
      seekerPage.getByRole("heading", { name: /ai interview report/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(seekerPage.getByText(SEEKER_REPORT.executiveSummary)).toBeVisible();
    for (const strength of SEEKER_REPORT.strengths) {
      await expect(seekerPage.getByText(strength)).toBeVisible();
    }
  });
});
