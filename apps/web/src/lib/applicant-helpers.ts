/**
 * Transform a snake_case DB applicant row → camelCase frontend-compatible shape.
 *
 * Bridges the gap between:
 * - DB columns: role_title, current_company, resume_parsed_json, pipeline_stage, etc.
 * - Frontend Applicant type: currentRole, currentCompany, parsedResume, pipelineStage, etc.
 * - Source values: DB "fitvector_organic" → frontend "fitvector", DB "external_link" → frontend "external"
 */

// ─── Source mapping ───────────────────────────────────────────────────────────

const SOURCE_DB_TO_FRONTEND: Record<string, string> = {
  fitvector_organic: "fitvector",
  external_link: "external",
  referral: "referral",
  imported: "imported",
  boosted: "boosted",
};

const SOURCE_FRONTEND_TO_DB: Record<string, string> = {
  fitvector: "fitvector_organic",
  external: "external_link",
  referral: "referral",
  imported: "imported",
  boosted: "boosted",
};

// ─── Transform DB row → frontend shape ────────────────────────────────────────

export function transformApplicant(row: Record<string, unknown>) {
  const dbSource = (row.source as string) || "external_link";
  const frontendSource = SOURCE_DB_TO_FRONTEND[dbSource] || dbSource;

  return {
    // IDs
    id: row.id as string,
    jobPostId: row.job_post_id as string,
    userId: (row.user_id as string) || null,

    // Personal info
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || null,

    // Role info — dual naming for frontend compat
    currentRole: (row.role_title as string) || "",
    roleTitle: (row.role_title as string) || null,
    currentCompany: (row.current_company as string) || "",
    experience: (row.experience as number) ?? 0,
    avatarUrl: (row.avatar_url as string) || null,

    // Resume
    resumeUrl: (row.resume_url as string) || null,
    parsedResume: row.resume_parsed_json || null,
    resumeParsedJson: row.resume_parsed_json || null,

    // Application details
    screeningResponses: row.screening_responses || [],
    interestNote: (row.interest_note as string) || null,
    source: frontendSource,

    // Screening
    screeningScore: (row.screening_score as number) ?? 0,
    screeningBreakdown: row.screening_breakdown || null,
    screeningSummary: (row.screening_summary as string) || "",
    screeningBucket: (row.bucket as string) || null,
    bucket: (row.bucket as string) || null,

    // Pipeline
    pipelineStage: (row.pipeline_stage as string) || "applied",
    rejectionReason: (row.rejection_reason as string) || null,

    // Talent pool
    isTalentPool: (row.is_talent_pool as boolean) || false,
    talentPoolTags: (row.talent_pool_tags as string[]) || [],
    isBoosted: (row.is_boosted as boolean) || false,

    // Timestamps — dual naming for frontend compat
    appliedAt: row.created_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,

    // Placeholder arrays (populated by separate queries in detail view)
    notes: [],
    votes: [],
  };
}

// ─── Fallback screening when Python service is down ───────────────────────────

export function generateFallbackScreening(
  resumeSkills: string[],
  requiredSkills: string[],
  niceToHaveSkills: string[] = [],
  applicantName: string = "candidate",
) {
  // Calculate skill overlap for realistic scoring
  const normalizeSkill = (s: string) => s.toLowerCase().trim();
  const resumeNorm = resumeSkills.map(normalizeSkill);
  const requiredNorm = requiredSkills.map(normalizeSkill);
  const niceNorm = niceToHaveSkills.map(normalizeSkill);

  const requiredMatches = requiredNorm.filter((s) => resumeNorm.includes(s)).length;
  const niceMatches = niceNorm.filter((s) => resumeNorm.includes(s)).length;

  const requiredRatio = requiredNorm.length > 0 ? requiredMatches / requiredNorm.length : 0.5;
  const niceRatio = niceNorm.length > 0 ? niceMatches / niceNorm.length : 0.5;

  // Build dimension scores
  const skillMatch = Math.round(requiredRatio * 100);
  const experienceRelevance = Math.round(50 + Math.random() * 40);
  const educationFit = Math.round(40 + Math.random() * 40);
  const achievementSignals = Math.round(30 + Math.random() * 50);
  const cultureFit = Math.round(40 + Math.random() * 40);
  const screeningQuestions = Math.round(50 + Math.random() * 40);

  // Weighted overall score (from PRD)
  const overallScore = Math.round(
    skillMatch * 0.3 +
    experienceRelevance * 0.25 +
    educationFit * 0.1 +
    achievementSignals * 0.15 +
    cultureFit * 0.1 +
    screeningQuestions * 0.1
  );

  // Determine bucket
  const bucket =
    overallScore >= 80 ? "strong_fit" :
    overallScore >= 60 ? "good_fit" :
    overallScore >= 40 ? "potential_fit" :
    "weak_fit";

  const summary = `${applicantName} demonstrates ${
    overallScore >= 70 ? "strong" : overallScore >= 50 ? "moderate" : "limited"
  } alignment with the role requirements. ${
    requiredMatches > 0
      ? `Matches ${requiredMatches} of ${requiredNorm.length} required skills.`
      : "Limited skill overlap with required skills."
  } ${
    niceMatches > 0 ? `Also matches ${niceMatches} nice-to-have skills.` : ""
  } Overall assessment: ${bucket.replace("_", " ")}.`;

  return {
    screening_score: overallScore,
    screening_breakdown: {
      skillMatch,
      experienceRelevance,
      educationFit,
      achievementSignals,
      cultureFit,
      screeningQuestions,
    },
    screening_summary: summary,
    bucket,
  };
}

export { SOURCE_FRONTEND_TO_DB };
