/**
 * support/fixtures/mock-fixture.ts
 *
 * Composable `page.route()` registration helpers for AI / storage / email
 * endpoints. Designed for explicit per-test opt-in — never auto-mock a
 * production endpoint your test isn't actually exercising, otherwise real
 * regressions go undetected.
 *
 * Usage:
 *
 *   import { mockAi, mockStorage } from "../support/fixtures/mock-fixture";
 *
 *   test("seeker can tailor a resume", async ({ seekerPage, ephemeralJob }) => {
 *     await mockAi(seekerPage, { tailorResume: "all-passed" });
 *     await mockStorage(seekerPage, { tailoredPdf: true });
 *     // ... interact with UI ...
 *   });
 *
 * Every helper is idempotent — calling twice with the same key replaces
 * the previous handler (Playwright `route.unroute()` semantics).
 */

import type { Page, Route } from "@playwright/test";
import {
  MOCK_PARSE_RESUME_RESPONSE,
  MOCK_TAILOR_RESUME_RESPONSE,
  MOCK_COLD_EMAIL_RESPONSE,
  MOCK_LINKEDIN_MSG_RESPONSE,
  MOCK_REFERRAL_MSG_RESPONSE,
  MOCK_JOB_DESCRIPTION_RESPONSE,
  MOCK_GAP_ANALYSIS_RESPONSE,
  MOCK_SCREEN_CANDIDATE_RESPONSE,
  MOCK_GENERATE_QUESTIONS_RESPONSE,
  MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE,
  MOCK_INTERVIEW_COMPLETE_RESPONSE,
  MOCK_GRADE_ASSESSMENT_RESPONSE,
  MOCK_ONBOARDING_COMPLETE_RESPONSE,
} from "../mocks/ai-responses";
import {
  MOCK_CODE_EXECUTE_ALL_PASSED,
  MOCK_CODE_EXECUTE_SOME_FAILED,
  MOCK_CODE_EXECUTE_RUNTIME_ERROR,
  MOCK_CODE_EXECUTE_INVALID_TOKEN_ERROR,
} from "../mocks/code-execute";
import {
  MOCK_RESUME_UPLOAD_RESPONSE,
  MOCK_TAILORED_PDF_RESPONSE,
  MOCK_COMPANY_LOGO_RESPONSE,
  MOCK_BANNER_UPLOAD_RESPONSE,
} from "../mocks/storage";

// ─── AI endpoints ─────────────────────────────────────────────────────────────

export interface MockAiOptions {
  parseResume?: boolean | "error";
  tailorResume?: boolean | "quota-exceeded";
  coldEmail?: boolean | "quota-exceeded";
  linkedinMsg?: boolean | "quota-exceeded";
  referralMsg?: boolean | "quota-exceeded";
  jobDescription?: boolean;
  gapAnalysis?: boolean;
  screenCandidate?: boolean;
  generateQuestions?: boolean;
  interviewMessage?: "next" | "complete";
  gradeAssessment?: boolean;
  onboardingComplete?: boolean;
}

export async function mockAi(page: Page, options: MockAiOptions): Promise<void> {
  if (options.parseResume) {
    await mockJson(page, "**/api/ai/parse-resume", {
      status: options.parseResume === "error" ? 503 : 200,
      body:
        options.parseResume === "error"
          ? { error: "Parser service unavailable" }
          : MOCK_PARSE_RESUME_RESPONSE,
    });
  }
  if (options.tailorResume) {
    await mockJson(page, "**/api/ai/tailor-resume", {
      status: options.tailorResume === "quota-exceeded" ? 429 : 200,
      body:
        options.tailorResume === "quota-exceeded"
          ? { error: "Monthly tailor limit reached.", upgrade: true }
          : MOCK_TAILOR_RESUME_RESPONSE,
    });
  }
  if (options.coldEmail) {
    await mockJson(page, "**/api/ai/cold-email", {
      status: options.coldEmail === "quota-exceeded" ? 429 : 200,
      body:
        options.coldEmail === "quota-exceeded"
          ? { error: "Monthly cold email limit reached.", upgrade: true }
          : MOCK_COLD_EMAIL_RESPONSE,
    });
  }
  if (options.linkedinMsg) {
    await mockJson(page, "**/api/ai/linkedin-msg", {
      status: options.linkedinMsg === "quota-exceeded" ? 429 : 200,
      body:
        options.linkedinMsg === "quota-exceeded"
          ? { error: "Monthly LinkedIn message limit reached.", upgrade: true }
          : MOCK_LINKEDIN_MSG_RESPONSE,
    });
  }
  if (options.referralMsg) {
    await mockJson(page, "**/api/ai/referral-msg", {
      status: options.referralMsg === "quota-exceeded" ? 429 : 200,
      body:
        options.referralMsg === "quota-exceeded"
          ? { error: "Monthly referral message limit reached.", upgrade: true }
          : MOCK_REFERRAL_MSG_RESPONSE,
    });
  }
  if (options.jobDescription) {
    await mockJson(page, "**/api/ai/job-description", { body: MOCK_JOB_DESCRIPTION_RESPONSE });
  }
  if (options.gapAnalysis) {
    await mockJson(page, "**/api/jobs/gap-analysis", { body: MOCK_GAP_ANALYSIS_RESPONSE });
  }
  if (options.screenCandidate) {
    await mockJson(page, "**/api/employer/applicants/*/screen", {
      body: MOCK_SCREEN_CANDIDATE_RESPONSE,
    });
  }
  if (options.generateQuestions) {
    await mockJson(page, "**/api/employer/assessments/generate-questions", {
      body: MOCK_GENERATE_QUESTIONS_RESPONSE,
    });
  }
  if (options.interviewMessage) {
    const body =
      options.interviewMessage === "complete"
        ? MOCK_INTERVIEW_COMPLETE_RESPONSE
        : MOCK_INTERVIEW_NEXT_QUESTION_RESPONSE;
    await mockJson(page, "**/api/interview/*/message", { body });
  }
  if (options.gradeAssessment) {
    await mockJson(page, "**/api/assessment/*/submit", {
      body: MOCK_GRADE_ASSESSMENT_RESPONSE,
    });
  }
  if (options.onboardingComplete) {
    await mockJson(page, "**/api/user/onboarding", {
      status: 201,
      body: MOCK_ONBOARDING_COMPLETE_RESPONSE,
    });
  }
}

// ─── Code execution ───────────────────────────────────────────────────────────

export type CodeExecuteScenario =
  | "all-passed"
  | "some-failed"
  | "runtime-error"
  | "invalid-token";

export async function mockCodeExecute(
  page: Page,
  scenario: CodeExecuteScenario,
): Promise<void> {
  const mapping: Record<
    CodeExecuteScenario,
    { status: number; body: unknown }
  > = {
    "all-passed": { status: 200, body: MOCK_CODE_EXECUTE_ALL_PASSED },
    "some-failed": { status: 200, body: MOCK_CODE_EXECUTE_SOME_FAILED },
    "runtime-error": { status: 200, body: MOCK_CODE_EXECUTE_RUNTIME_ERROR },
    "invalid-token": { status: 401, body: MOCK_CODE_EXECUTE_INVALID_TOKEN_ERROR },
  };
  await mockJson(page, "**/api/code/execute", mapping[scenario]);
}

// ─── Storage / file uploads ───────────────────────────────────────────────────

export interface MockStorageOptions {
  rawResume?: boolean;
  tailoredPdf?: boolean;
  companyLogo?: boolean;
  banner?: boolean;
}

export async function mockStorage(
  page: Page,
  options: MockStorageOptions,
): Promise<void> {
  if (options.rawResume) {
    await mockJson(page, "**/api/user/resumes", { body: MOCK_RESUME_UPLOAD_RESPONSE });
  }
  if (options.tailoredPdf) {
    await mockJson(page, "**/api/user/resumes/*/pdf", { body: MOCK_TAILORED_PDF_RESPONSE });
  }
  if (options.companyLogo) {
    await mockJson(page, "**/api/employer/company/logo", { body: MOCK_COMPANY_LOGO_RESPONSE });
  }
  if (options.banner) {
    await mockJson(page, "**/api/employer/branding/banner", { body: MOCK_BANNER_UPLOAD_RESPONSE });
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

interface MockJsonOptions {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}

async function mockJson(
  page: Page,
  pattern: string,
  opts: MockJsonOptions,
): Promise<void> {
  // unroute first so callers can override an earlier mock without bleed-through.
  await page.unroute(pattern).catch(() => undefined);

  await page.route(pattern, async (route: Route) => {
    await route.fulfill({
      status: opts.status ?? 200,
      contentType: "application/json",
      headers: opts.headers,
      body: JSON.stringify(opts.body),
    });
  });
}
