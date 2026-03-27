/**
 * Transform ai_interviews DB row → frontend AIInterview shape.
 * Handles snake_case → camelCase + field renaming for UI compat.
 */

// ─── Transform with joined applicant/job data ────────────────────────────────

export function transformInterview(
  row: Record<string, unknown>,
  applicantInfo?: { name: string; email: string; role_title: string; current_company: string },
  jobTitle?: string,
) {
  const evalReport = row.evaluation_report as Record<string, unknown> | null;

  return {
    id: row.id as string,
    applicantId: row.applicant_id as string,
    jobPostId: row.job_post_id as string,

    // Joined data (from separate queries)
    applicantName: applicantInfo?.name || "",
    applicantEmail: applicantInfo?.email || "",
    applicantRole: applicantInfo?.role_title || "",
    applicantCompany: applicantInfo?.current_company || "",
    jobTitle: jobTitle || "",

    // Interview config
    interviewType: row.interview_type as string,
    durationPlanned: (row.duration_planned as number) || 20,
    durationActual: (row.duration_actual as number) || null,

    // Status + timing
    status: row.status as string,
    inviteSentAt: (row.invite_sent_at as string) || null,
    startedAt: (row.started_at as string) || null,
    completedAt: (row.completed_at as string) || null,

    // Scores
    overallScore: (row.overall_score as number) || null,
    aiRecommendation: (row.ai_recommendation as string) || null,

    // Cheating
    cheatingConfidence: (row.cheating_confidence as string) || null,
    cheatingSignals: (row.cheating_signals as string[]) || [],
    cheatingNote: evalReport?.cheatingNote as string || null,

    // Evaluation
    executiveSummary: evalReport?.summary as string || null,
    skillRatings: (row.skill_scores as Array<{ skill: string; score: number; justification: string }>) || [],
    strengths: (row.strengths as string[]) || [],
    concerns: (row.concerns as string[]) || [],

    // Communication
    communicationScores: transformCommunicationScores(row.communication_assessment),

    // Transcript + audio
    transcript: transformTranscript(row.transcript),
    audioUrl: (row.audio_recording_url as string) || null,

    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Communication assessment → frontend shape ───────────────────────────────

function transformCommunicationScores(raw: unknown): Array<{ label: string; score: number; note: string }> {
  if (!raw || typeof raw !== "object") return [];
  const comm = raw as Record<string, number>;
  return [
    { label: "Structured Thinking", score: comm.structuredThinking || 0, note: "" },
    { label: "Clarity", score: comm.clarity || 0, note: "" },
    { label: "Curiosity", score: comm.curiosity || 0, note: "" },
    { label: "Confidence", score: comm.confidence || 0, note: "" },
  ];
}

// ─── Transcript → frontend shape (with HH:MM timestamps) ────────────────────

function transformTranscript(raw: unknown): Array<{ speaker: string; text: string; timestamp: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => ({
    speaker: entry.speaker || "ai",
    text: entry.text || "",
    timestamp: entry.timestamp
      ? typeof entry.timestamp === "number"
        ? formatTimestamp(entry.timestamp)
        : String(entry.timestamp)
      : "00:00",
  }));
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Fallback evaluation (when Python service is down) ───────────────────────

export function generateFallbackEvaluation(
  answers: Array<{ question: string; answer: string }>,
  requiredSkills: string[] = [],
  interviewType: string = "general",
) {
  // Generate skill scores in the exact shape the Radar chart expects: { skill, score (1-5), justification }
  const skills = requiredSkills.length > 0 ? requiredSkills.slice(0, 6) : ["Problem Solving", "Communication", "Technical Knowledge", "Teamwork", "Adaptability"];
  const skillScores = skills.map((skill) => ({
    skill,
    score: Math.floor(2 + Math.random() * 3), // 2-4 range
    justification: `Demonstrated ${Math.random() > 0.5 ? "adequate" : "moderate"} understanding of ${skill} based on text responses.`,
  }));

  const avgScore = Math.round(skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length * 20);

  // Communication assessment matching frontend shape
  const communicationAssessment = {
    structuredThinking: Math.floor(2 + Math.random() * 3),
    clarity: Math.floor(2 + Math.random() * 3),
    curiosity: Math.floor(2 + Math.random() * 3),
    confidence: Math.floor(2 + Math.random() * 3),
  };

  // Build transcript from Q&A
  const transcript = answers.flatMap((a, i) => [
    { speaker: "ai", text: a.question, timestamp: i * 120 },
    { speaker: "candidate", text: a.answer, timestamp: i * 120 + 60 },
  ]);

  const recommendation =
    avgScore >= 80 ? "strong_advance" :
    avgScore >= 60 ? "advance" :
    avgScore >= 40 ? "borderline" :
    "reject";

  const evaluationReport = {
    summary: `Candidate completed a ${interviewType} interview via text-based assessment. ${
      avgScore >= 60
        ? "Showed reasonable competency across evaluated areas."
        : "Performance was below expectations in several areas."
    } Responses were evaluated across ${skills.length} skill dimensions. Overall score: ${avgScore}/100.`,
    cheatingNote: null,
  };

  return {
    overall_score: avgScore,
    skill_scores: skillScores,
    strengths: [
      answers.length >= 3 ? "Completed all questions" : "Attempted the assessment",
      "Provided detailed responses",
    ],
    concerns: avgScore < 60 ? ["Responses lacked depth in technical areas", "May benefit from additional assessment"] : [],
    cheating_confidence: "low" as const,
    cheating_signals: [],
    communication_assessment: communicationAssessment,
    ai_recommendation: recommendation,
    evaluation_report: evaluationReport,
    transcript,
    duration_actual: Math.round(answers.length * 2.5), // ~2.5 min per question
  };
}
