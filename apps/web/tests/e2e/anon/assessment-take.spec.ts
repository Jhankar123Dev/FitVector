/**
 * anon/assessment-take.spec.ts
 *
 * End-to-end coverage of the public, token-gated candidate assessment flow.
 * Tests drive the API directly — no UI walk-through — because the contract
 * is what matters and the Take page is verified separately by component tests.
 *
 * Token issuance: tests/e2e/support/helpers/token.ts::issueAssessmentToken().
 * The submission UUID itself IS the URL token.
 *
 * Verified against:
 *   GET    /api/assessment/[token]
 *     - 404 if not found
 *     - 410 if status ∈ { expired, submitted, graded }
 *     - 410 if expires_at < now()
 *     - 410 if status='invited' AND invited_at + 7d < now()
 *     - On success returns questions with stripCorrectAnswers() applied
 *   POST   /api/assessment/[token]/start
 *     - 400 unless status='invited'
 *     - On success: status='started', started_at=now()
 *   POST   /api/code/execute
 *     - Requires submissionToken (UUID) of an active 'started' submission
 *     - Returns results WITHOUT expectedOutput field
 *   POST   /api/assessment/[token]/event
 *     - Accumulates tabSwitches / copyPasteAttempts on proctoring_flags
 *     - Always returns 200 (sendBeacon contract)
 *   POST   /api/assessment/[token]/submit
 *     - 400 unless status='started'
 *     - Late iff elapsedMinutes > timeLimit + 2
 *     - Computes flagged based on server-side tabSwitches/copyPaste/late
 *
 * Coverage (8 tests):
 *   ✅ GET returns assessment data with correctAnswer stripped
 *   ✅ POST /start transitions invited → started + sets started_at
 *   ✅ POST /code/execute runs visible test cases only, no expectedOutput leaked
 *   ✅ POST /event accumulates tabSwitches + copyPasteAttempts server-side
 *   ✅ submit before time-limit + 2min grace → wasLate=false
 *   ✅ submit after grace → wasLate=true, lateByMinutes computed
 *   ❌ access expired token → 410
 *   ❌ submit when status='submitted' → 400
 */

import { test, expect } from "../support/fixtures";
import { issueAssessmentToken, type IssuedAssessmentToken } from "../support/helpers/token";
import { getAdminClient } from "../support/helpers/db-helpers";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

// MCQ-only sample answers shaped per submitAssessmentSchema:
//   answers: [{ questionId, selectedAnswer, timeSpent? }, ...]
const SAMPLE_MCQ_ANSWERS = [
  { questionId: "q1", selectedAnswer: "1" /* "4" */ },
];

test.describe("Anonymous assessment-take API contract", () => {
  // No auth — anonymous browser context.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("GET /api/assessment/[token] returns metadata with correctAnswer stripped", async ({
    request,
  }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "invited" });

      const res = await request.get(`${BASE_URL}/api/assessment/${issued.token}`);
      expect(res.status()).toBe(200);

      const json = (await res.json()) as {
        data: {
          questions: Array<Record<string, unknown>>;
          assessmentName: string;
          status: string;
        };
      };

      expect(json.data.status).toBe("invited");
      expect(json.data.questions.length).toBeGreaterThan(0);
      // SECURITY: correctAnswer must NEVER reach the candidate.
      for (const q of json.data.questions) {
        expect(
          q.correctAnswer,
          `question ${q.id}: correctAnswer must be stripped`,
        ).toBeUndefined();
      }
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("POST /start transitions an invited submission to started", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "invited" });

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/start`);
      expect(res.status()).toBe(200);

      const json = (await res.json()) as {
        data: { status: string; startedAt: string | null };
      };
      expect(json.data.status).toBe("started");
      expect(json.data.startedAt).toBeTruthy();

      // Verify in DB.
      const supabase = getAdminClient();
      const { data } = await supabase
        .from("assessment_submissions")
        .select("status, started_at")
        .eq("id", issued.submissionId)
        .single();
      expect(data?.status).toBe("started");
      expect(data?.started_at).toBeTruthy();
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("POST /code/execute runs preview cases and never returns expectedOutput", async ({
    request,
  }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started" });

      const res = await request.post(`${BASE_URL}/api/code/execute`, {
        data: {
          // q2 in defaultAssessmentQuestions() is the coding question.
          questionId: "q2",
          submissionToken: issued.submissionId,
          language: "javascript",
          code: "function add(a, b) { return a + b; }",
        },
      });

      // JDoodle may not be configured in local CI — accept either successful
      // execution OR the explicit "service not configured" 503. We only
      // strictly enforce the security invariant when a 200 lands.
      if (res.status() === 503) {
        test.info().annotations.push({
          type: "skipped",
          description: "JDoodle not configured — skipping output validation",
        });
        return;
      }

      expect(res.status()).toBe(200);
      const json = (await res.json()) as {
        data: { results: Array<Record<string, unknown>>; totalCount: number };
      };
      expect(json.data.totalCount).toBeGreaterThan(0);
      // SECURITY: expectedOutput must be stripped from every result.
      for (const r of json.data.results) {
        expect(r.expectedOutput, "expectedOutput must be stripped").toBeUndefined();
      }
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("POST /event accumulates tabSwitches and copyPasteAttempts in proctoring_flags", async ({
    request,
  }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started" });

      // Three batched beacons → final tabSwitches=3, copyPasteAttempts=2.
      await request.post(`${BASE_URL}/api/assessment/${issued.token}/event`, {
        data: { tabSwitches: 1, copyPasteAttempts: 0 },
      });
      await request.post(`${BASE_URL}/api/assessment/${issued.token}/event`, {
        data: { tabSwitches: 2, copyPasteAttempts: 1 },
      });
      await request.post(`${BASE_URL}/api/assessment/${issued.token}/event`, {
        data: { tabSwitches: 0, copyPasteAttempts: 1 },
      });

      const supabase = getAdminClient();
      const { data } = await supabase
        .from("assessment_submissions")
        .select("proctoring_flags")
        .eq("id", issued.submissionId)
        .single();

      const flags = (data?.proctoring_flags ?? {}) as {
        tabSwitches?: number;
        copyPasteAttempts?: number;
      };
      expect(flags.tabSwitches).toBe(3);
      expect(flags.copyPasteAttempts).toBe(2);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("submit within the time-limit + 2min grace → wasLate=false", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      // 60-min limit, freshly started — easily within grace.
      issued = await issueAssessmentToken({ status: "started", timeLimitMinutes: 60 });

      // Set started_at to 5 minutes ago — well under the 60-min limit.
      const supabase = getAdminClient();
      await supabase
        .from("assessment_submissions")
        .update({ started_at: new Date(Date.now() - 5 * 60_000).toISOString() })
        .eq("id", issued.submissionId);

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: SAMPLE_MCQ_ANSWERS },
      });
      expect(res.status()).toBe(200);

      const json = (await res.json()) as { data: { wasLate: boolean } };
      expect(json.data.wasLate).toBe(false);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("submit after grace window → wasLate=true with lateByMinutes set", async ({
    request,
  }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started", timeLimitMinutes: 30 });

      // 60 minutes ago > 30 + 2 grace → late by ~28 minutes.
      const supabase = getAdminClient();
      await supabase
        .from("assessment_submissions")
        .update({ started_at: new Date(Date.now() - 60 * 60_000).toISOString() })
        .eq("id", issued.submissionId);

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: SAMPLE_MCQ_ANSWERS },
      });
      expect(res.status()).toBe(200);

      const json = (await res.json()) as { data: { wasLate: boolean } };
      expect(json.data.wasLate).toBe(true);

      const { data } = await supabase
        .from("assessment_submissions")
        .select("proctoring_flags")
        .eq("id", issued.submissionId)
        .single();
      const flags = (data?.proctoring_flags ?? {}) as {
        submittedLate?: boolean;
        lateByMinutes?: number;
      };
      expect(flags.submittedLate).toBe(true);
      expect(flags.lateByMinutes).toBeGreaterThan(0);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("expired-status submission returns 410 on GET", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "expired" });

      const res = await request.get(`${BASE_URL}/api/assessment/${issued.token}`);
      expect(res.status()).toBe(410);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("submit when status='submitted' is rejected with 400", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "submitted" });

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: SAMPLE_MCQ_ANSWERS },
      });
      expect(res.status()).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toMatch(/cannot submit.*submitted/i);
    } finally {
      if (issued) await issued.cleanup();
    }
  });
});
