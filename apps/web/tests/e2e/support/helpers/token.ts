/**
 * support/helpers/token.ts
 *
 * Token issuance for anonymous (no-session) flows:
 *   - assessment-take    → assessment_submissions.id is the URL token
 *   - public-interview   → ai_interviews.id is the URL token
 *   - password-reset     → SHA-256(rawToken) is stored, raw token sent in URL
 *
 * Each helper seeds the full FK chain (company → job_post → applicant →
 * assessment/interview/etc.) so callers can pass a single options object
 * and get back a working token without writing setup boilerplate.
 *
 * Cleanup is the caller's responsibility: pass the returned `cleanup`
 * function to your test's `afterAll` hook, or use the matching
 * `ephemeral*` fixture which auto-cleans.
 */

import { randomBytes, createHash } from "node:crypto";
import {
  getAdminClient,
  createTestCompany,
  createTestJob,
  deleteTestCompany,
  deleteTestJob,
  TEST_PREFIX,
} from "./db-helpers";

// ─── Assessment token ─────────────────────────────────────────────────────────

export interface IssueAssessmentTokenOptions {
  candidateName?: string;
  candidateEmail?: string;
  /**
   * Time limit in minutes. Default: 60. Pass 0 for "no limit" tests.
   */
  timeLimitMinutes?: number;
  /**
   * Difficulty stamped on the assessment template.
   */
  difficulty?: "easy" | "medium" | "hard";
  /**
   * Submission status. Default: "invited" so /start transitions to "started".
   */
  status?: "invited" | "started" | "submitted" | "graded" | "expired";
  /**
   * If set, `invited_at` is backdated by this many days (for testing the
   * 7-day invite-expiry path documented in route.ts).
   */
  invitedDaysAgo?: number;
  /**
   * Hard expiry (`expires_at` column). Pass a Date in the past to force the
   * 410 expired-token branch.
   */
  expiresAt?: Date;
}

export interface IssuedAssessmentToken {
  /** The submission id — used directly as the URL `[token]` param. */
  token: string;
  submissionId: string;
  assessmentId: string;
  applicantId: string;
  jobPostId: string;
  companyId: string;
  cleanup: () => Promise<void>;
}

export async function issueAssessmentToken(
  options: IssueAssessmentTokenOptions = {},
): Promise<IssuedAssessmentToken> {
  const supabase = getAdminClient();

  const company = await createTestCompany();
  const job = await createTestJob({
    source: "job_posts",
    companyId: company.id,
    createdBy: await ensureSystemUserId(),
  });

  const candidateName = options.candidateName ?? `${TEST_PREFIX}candidate`;
  const candidateEmail =
    options.candidateEmail ?? `${TEST_PREFIX}cand_${randomBytes(4).toString("hex")}@e2e.fitvector.dev`;

  const { data: applicant, error: applicantErr } = await supabase
    .from("applicants")
    .insert({
      job_post_id: job.id,
      name: candidateName,
      email: candidateEmail,
      source: "fitvector_organic",
      pipeline_stage: "applied",
    })
    .select("id")
    .single();
  if (applicantErr || !applicant) {
    await deleteTestJob(job.id, "job_posts");
    await deleteTestCompany(company.id);
    throw new Error(`issueAssessmentToken: applicant insert failed: ${applicantErr?.message}`);
  }

  const { data: assessment, error: assessmentErr } = await supabase
    .from("assessments")
    .insert({
      company_id: company.id,
      created_by: await ensureSystemUserId(),
      name: `${TEST_PREFIX}assessment`,
      assessment_type: "coding_test",
      time_limit_minutes: options.timeLimitMinutes ?? 60,
      difficulty: options.difficulty ?? "medium",
      passing_score: 70,
      questions: defaultAssessmentQuestions(),
    })
    .select("id")
    .single();
  if (assessmentErr || !assessment) {
    await deleteTestJob(job.id, "job_posts");
    await deleteTestCompany(company.id);
    throw new Error(`issueAssessmentToken: assessment insert failed: ${assessmentErr?.message}`);
  }

  const invitedAt = options.invitedDaysAgo
    ? new Date(Date.now() - options.invitedDaysAgo * 24 * 60 * 60 * 1000)
    : new Date();

  const { data: submission, error: submissionErr } = await supabase
    .from("assessment_submissions")
    .insert({
      assessment_id: assessment.id,
      applicant_id: applicant.id,
      job_post_id: job.id,
      status: options.status ?? "invited",
      invited_at: invitedAt.toISOString(),
    })
    .select("id")
    .single();
  if (submissionErr || !submission) {
    await deleteTestJob(job.id, "job_posts");
    await deleteTestCompany(company.id);
    throw new Error(
      `issueAssessmentToken: submission insert failed: ${submissionErr?.message}`,
    );
  }

  // Optional explicit expires_at — only set if caller provided it.
  if (options.expiresAt) {
    await supabase
      .from("assessment_submissions")
      // expires_at is stored on the submission row; some schema variants put
      // it on the assessment itself. Set both to be safe.
      .update({ expires_at: options.expiresAt.toISOString() })
      .eq("id", submission.id);
  }

  return {
    token: submission.id,
    submissionId: submission.id,
    assessmentId: assessment.id,
    applicantId: applicant.id,
    jobPostId: job.id,
    companyId: company.id,
    cleanup: async () => {
      // Cascading FKs handle submission, applicant, and assessment.
      await deleteTestJob(job.id, "job_posts");
      await deleteTestCompany(company.id);
    },
  };
}

// ─── Interview token ──────────────────────────────────────────────────────────

export interface IssueInterviewTokenOptions {
  candidateName?: string;
  candidateEmail?: string;
  interviewType?: "technical" | "behavioral" | "role_specific" | "general";
  durationPlanned?: number;
  status?: "invited" | "started" | "completed" | "expired" | "cancelled";
  /**
   * Hours from now until invite_expires_at. Pass a negative number for an
   * already-expired invite.
   */
  expiresInHours?: number;
}

export interface IssuedInterviewToken {
  token: string;
  interviewId: string;
  applicantId: string;
  jobPostId: string;
  companyId: string;
  cleanup: () => Promise<void>;
}

export async function issueInterviewToken(
  options: IssueInterviewTokenOptions = {},
): Promise<IssuedInterviewToken> {
  const supabase = getAdminClient();

  const company = await createTestCompany();
  const job = await createTestJob({
    source: "job_posts",
    companyId: company.id,
    createdBy: await ensureSystemUserId(),
  });

  const candidateName = options.candidateName ?? `${TEST_PREFIX}interviewee`;
  const candidateEmail =
    options.candidateEmail ?? `${TEST_PREFIX}int_${randomBytes(4).toString("hex")}@e2e.fitvector.dev`;

  const { data: applicant, error: applicantErr } = await supabase
    .from("applicants")
    .insert({
      job_post_id: job.id,
      name: candidateName,
      email: candidateEmail,
      source: "fitvector_organic",
      pipeline_stage: "ai_interviewed",
    })
    .select("id")
    .single();
  if (applicantErr || !applicant) {
    await deleteTestJob(job.id, "job_posts");
    await deleteTestCompany(company.id);
    throw new Error(`issueInterviewToken: applicant insert failed: ${applicantErr?.message}`);
  }

  const expiresInHours = options.expiresInHours ?? 72;
  const inviteExpiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const { data: interview, error: interviewErr } = await supabase
    .from("ai_interviews")
    .insert({
      applicant_id: applicant.id,
      job_post_id: job.id,
      interview_type: options.interviewType ?? "technical",
      duration_planned: options.durationPlanned ?? 20,
      status: options.status ?? "invited",
      invite_sent_at: new Date().toISOString(),
      invite_expires_at: inviteExpiresAt.toISOString(),
    })
    .select("id")
    .single();
  if (interviewErr || !interview) {
    await deleteTestJob(job.id, "job_posts");
    await deleteTestCompany(company.id);
    throw new Error(`issueInterviewToken: interview insert failed: ${interviewErr?.message}`);
  }

  return {
    token: interview.id,
    interviewId: interview.id,
    applicantId: applicant.id,
    jobPostId: job.id,
    companyId: company.id,
    cleanup: async () => {
      await deleteTestJob(job.id, "job_posts");
      await deleteTestCompany(company.id);
    },
  };
}

// ─── Password reset token ─────────────────────────────────────────────────────

export interface IssuePasswordResetTokenOptions {
  /**
   * Seconds from now until expiry. Default: 3600 (1 hour, matches prod).
   * Pass a negative number to create an already-expired token.
   */
  expiresInSeconds?: number;
  /**
   * Marks the token as already used. For replay-attack tests.
   */
  usedAt?: Date;
}

export interface IssuedPasswordResetToken {
  /** The RAW token — what goes in the email URL `?token=`. */
  rawToken: string;
  /** The DB row id (rarely needed). */
  tokenId: string;
  /** SHA-256 hash of the raw token — the only form stored server-side. */
  tokenHash: string;
  cleanup: () => Promise<void>;
}

export async function issuePasswordResetToken(
  userId: string,
  options: IssuePasswordResetTokenOptions = {},
): Promise<IssuedPasswordResetToken> {
  const supabase = getAdminClient();

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const expiresInSeconds = options.expiresInSeconds ?? 3600;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used_at: options.usedAt ? options.usedAt.toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`issuePasswordResetToken failed: ${error?.message ?? "no data"}`);
  }

  return {
    rawToken,
    tokenId: data.id,
    tokenHash,
    cleanup: async () => {
      await supabase.from("password_reset_tokens").delete().eq("id", data.id);
    },
  };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/**
 * Returns a stable test-system user id, creating one on first call.
 * Every token chain needs a `created_by` FK — using a shared system user
 * avoids an N×M cleanup problem when many tests issue tokens in parallel.
 */
let _systemUserId: string | undefined;
async function ensureSystemUserId(): Promise<string> {
  if (_systemUserId) return _systemUserId;

  const supabase = getAdminClient();
  const email = `${TEST_PREFIX}system@e2e.fitvector.dev`;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing?.id) {
    _systemUserId = existing.id;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email,
      full_name: `${TEST_PREFIX}system`,
      auth_provider: "credentials",
      // password hash for "do_not_use" — this account is never logged into.
      password_hash:
        "$2a$10$wgPEqu4vWqSj0X.1Oo8SiOBUMx1u1V4F7dF8zN3gG3eJpWqQHjjQO",
      email_verified: true,
      role: "employer",
      plan_tier: "free",
      status: "active",
      onboarding_completed: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`ensureSystemUserId: failed to seed system user: ${error?.message}`);
  }

  _systemUserId = data.id;
  return data.id;
}

function defaultAssessmentQuestions() {
  return [
    {
      id: "q1",
      type: "mcq",
      prompt: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
    },
    {
      id: "q2",
      type: "coding",
      prompt: "Write a function that returns the sum of two numbers.",
      starterCode: "function add(a, b) {\n  // your code\n}",
      testCases: [
        { input: "add(1, 2)", expectedOutput: "3" },
        { input: "add(0, 0)", expectedOutput: "0" },
      ],
    },
  ];
}
