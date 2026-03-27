/**
 * Transform assessment DB rows → camelCase frontend shapes.
 * Auto-grade MCQ assessments.
 */

// ─── Transform assessment ─────────────────────────────────────────────────────

export function transformAssessment(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    createdBy: row.created_by as string,
    name: row.name as string,
    assessmentType: row.assessment_type as string,
    timeLimitMinutes: (row.time_limit_minutes as number) || null,
    difficulty: (row.difficulty as string) || null,
    passingScore: (row.passing_score as number) || null,
    questions: (row.questions as unknown[]) || [],
    settings: (row.settings as Record<string, unknown>) || {},
    isTemplate: (row.is_template as boolean) || false,
    timesUsed: (row.times_used as number) || 0,
    status: (row.status as string) || "active",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,

    // Computed fields for frontend compat (AssessmentTemplate shape)
    title: row.name as string,
    type: row.assessment_type as string,
    duration: (row.time_limit_minutes as number) || 0,
    questionCount: ((row.questions as unknown[]) || []).length,
    tags: [],
    description: "",
    completionRate: 0,
    avgScore: 0,
    candidatesTaken: (row.times_used as number) || 0,
  };
}

// ─── Transform submission ─────────────────────────────────────────────────────

export function transformSubmission(
  row: Record<string, unknown>,
  applicantInfo?: { name: string; email: string },
  assessmentInfo?: { name: string; assessment_type: string },
) {
  return {
    id: row.id as string,
    assessmentId: row.assessment_id as string,
    applicantId: row.applicant_id as string,
    jobPostId: row.job_post_id as string,
    status: (row.status as string) || "invited",
    invitedAt: (row.invited_at as string) || null,
    startedAt: (row.started_at as string) || null,
    submittedAt: (row.submitted_at as string) || null,
    gradedAt: (row.graded_at as string) || null,
    timeTakenMinutes: (row.time_taken_minutes as number) || null,
    answers: (row.answers as unknown[]) || [],
    autoScore: (row.auto_score as number) ?? null,
    manualScore: (row.manual_score as number) ?? null,
    finalScore: (row.final_score as number) ?? null,
    graderId: (row.grader_id as string) || null,
    graderNotes: (row.grader_notes as string) || null,
    plagiarismFlag: (row.plagiarism_flag as boolean) || false,
    proctoringFlags: (row.proctoring_flags as unknown[]) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,

    // Joined data
    candidateName: applicantInfo?.name || "",
    candidateEmail: applicantInfo?.email || "",
    assessmentTitle: assessmentInfo?.name || "",
    assessmentType: assessmentInfo?.assessment_type || "",
  };
}

// ─── MCQ Auto-Grading ────────────────────────────────────────────────────────

interface GradableQuestion {
  id: string;
  correctAnswer?: string;
  points?: number;
}

interface CandidateAnswer {
  questionId: string;
  selectedAnswer?: string;
}

/**
 * Auto-grade MCQ answers. Returns score as 0-100.
 * For each question, compares selectedAnswer with correctAnswer.
 */
export function autoGradeMCQ(
  questions: GradableQuestion[],
  answers: CandidateAnswer[],
): { score: number; gradedAnswers: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number; pointsMax: number }> } {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedAnswer]));
  let totalPoints = 0;
  let earnedPoints = 0;

  const gradedAnswers = questions.map((q) => {
    const points = q.points || 1;
    totalPoints += points;
    const selected = answerMap.get(q.id);
    const isCorrect = !!selected && !!q.correctAnswer && selected === q.correctAnswer;
    const earned = isCorrect ? points : 0;
    earnedPoints += earned;

    return {
      questionId: q.id,
      isCorrect,
      pointsEarned: earned,
      pointsMax: points,
    };
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return { score, gradedAnswers };
}

// ─── Strip correct answers for candidate view ────────────────────────────────

export function stripCorrectAnswers(questions: unknown[]): unknown[] {
  return questions.map((q) => {
    if (!q || typeof q !== "object") return q;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer, correctAnswers, testCases, ...safe } = q as Record<string, unknown>;
    return safe;
  });
}
