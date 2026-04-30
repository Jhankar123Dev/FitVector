/**
 * anon/assessment-anti-cheat.spec.ts
 *
 * Verifies the proctoring flag rules baked into the submit handler.
 *
 * Verified against src/app/api/assessment/[token]/submit/route.ts:
 *
 *   const proctoringFlags = {
 *     tabSwitches:       serverTabSwitches,
 *     copyPasteAttempts: serverCopyPasteAttempts,
 *     submittedLate:     isLate,
 *     lateByMinutes:     isLate ? round(elapsed - timeLimit) : 0,
 *     flagged:           isLate
 *                        || serverTabSwitches >= 3
 *                        || serverCopyPasteAttempts >= 2,
 *   };
 *
 * The server uses *server-stored* counts (from /event beacons), NEVER the
 * client-submitted proctoringData — that's the whole point of the anti-cheat
 * design.
 *
 * Coverage (4 tests):
 *   ✅ ≥3 tab switches  → flagged=true
 *   ✅ ≥2 copy-paste    → flagged=true
 *   ✅ submitted late   → flagged=true
 *   ⚠ test.fixme — flagged submission visible to employer with badge
 *      (requires the employer-side results POM, which doesn't exist yet)
 */

import { test, expect } from "../support/fixtures";
import { issueAssessmentToken, type IssuedAssessmentToken } from "../support/helpers/token";
import { getAdminClient } from "../support/helpers/db-helpers";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const ANSWERS = [{ questionId: "q1", selectedAnswer: "1" }];

async function setProctoringCounts(
  submissionId: string,
  counts: { tabSwitches?: number; copyPasteAttempts?: number },
): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("assessment_submissions")
    .update({ proctoring_flags: counts })
    .eq("id", submissionId);
}

async function getFlags(submissionId: string): Promise<{
  flagged?: boolean;
  tabSwitches?: number;
  copyPasteAttempts?: number;
  submittedLate?: boolean;
}> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("assessment_submissions")
    .select("proctoring_flags")
    .eq("id", submissionId)
    .single();
  return (data?.proctoring_flags ?? {}) as ReturnType<typeof getFlags> extends Promise<infer R>
    ? R
    : never;
}

test.describe("Assessment anti-cheat flagging", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("≥3 tab switches → submission flagged", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started", timeLimitMinutes: 60 });
      await setProctoringCounts(issued.submissionId, { tabSwitches: 3 });

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: ANSWERS },
      });
      expect(res.status()).toBe(200);

      const flags = await getFlags(issued.submissionId);
      expect(flags.tabSwitches).toBe(3);
      expect(flags.flagged).toBe(true);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("≥2 copy-paste attempts → submission flagged", async ({ request }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started", timeLimitMinutes: 60 });
      await setProctoringCounts(issued.submissionId, { copyPasteAttempts: 2 });

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: ANSWERS },
      });
      expect(res.status()).toBe(200);

      const flags = await getFlags(issued.submissionId);
      expect(flags.copyPasteAttempts).toBe(2);
      expect(flags.flagged).toBe(true);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test("submitted past time-limit + 2min grace → flagged + submittedLate=true", async ({
    request,
  }) => {
    let issued: IssuedAssessmentToken | undefined;
    try {
      issued = await issueAssessmentToken({ status: "started", timeLimitMinutes: 30 });

      // 60 minutes ago > 30 + 2 grace.
      const supabase = getAdminClient();
      await supabase
        .from("assessment_submissions")
        .update({ started_at: new Date(Date.now() - 60 * 60_000).toISOString() })
        .eq("id", issued.submissionId);

      const res = await request.post(`${BASE_URL}/api/assessment/${issued.token}/submit`, {
        data: { answers: ANSWERS },
      });
      expect(res.status()).toBe(200);

      const flags = await getFlags(issued.submissionId);
      expect(flags.submittedLate).toBe(true);
      expect(flags.flagged).toBe(true);
    } finally {
      if (issued) await issued.cleanup();
    }
  });

  test.fixme(
    "flagged submission renders a warning badge on the employer results page (TODO: build employer assessment-results POM)",
    async ({ employerPage }) => {
      // Future shape:
      //   await employerPage.goto(`/employer/assessments/${assessmentId}/results`);
      //   const row = employerPage.getByRole("row", { name: candidateName });
      //   await expect(row.getByText(/flagged|review/i)).toBeVisible();
      // Wired once the results POM lands; until then this serves as a reminder
      // so we don't lose track of the gap.
      void employerPage; // keep the fixture imported until the body lands
    },
  );
});
