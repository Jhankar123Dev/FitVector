// ─── AI Interview ──────────────────────────────────────────────────────────

export type AIInterviewType = 'technical' | 'behavioral' | 'role_specific' | 'general';
export type AIInterviewStatus = 'invited' | 'started' | 'completed' | 'expired' | 'cancelled';
export type AIRecommendation = 'strong_advance' | 'advance' | 'borderline' | 'reject';
export type CheatingConfidence = 'low' | 'medium' | 'high';

export interface TranscriptEntry {
  speaker: 'ai' | 'candidate';
  text: string;
  timestamp: number;
}

export interface SkillScore {
  skill: string;
  score: number;
  justification: string;
}

export interface CheatingSignal {
  signal: string;
  evidence: string;
}

export interface CommunicationAssessment {
  structuredThinking: number;
  clarity: number;
  curiosity: number;
  confidence: number;
}

export interface EvaluationReport {
  summary: string;
  skillScores: SkillScore[];
  strengths: string[];
  concerns: string[];
  communication: CommunicationAssessment;
}

export interface AIInterview {
  id: string;
  applicantId: string;
  jobPostId: string;
  interviewType: AIInterviewType;
  durationPlanned: number | null;
  durationActual: number | null;
  status: AIInterviewStatus;
  inviteSentAt: string | null;
  inviteExpiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  transcript: TranscriptEntry[];
  audioRecordingUrl: string | null;
  evaluationReport: EvaluationReport | null;
  overallScore: number | null;
  skillScores: SkillScore[];
  strengths: string[];
  concerns: string[];
  cheatingConfidence: CheatingConfidence | null;
  cheatingSignals: CheatingSignal[];
  communicationAssessment: CommunicationAssessment | null;
  aiRecommendation: AIRecommendation | null;
  createdAt: string;
  updatedAt: string;
}
