// ─── Applicant ─────────────────────────────────────────────────────────────

export type PipelineStage =
  | 'applied'
  | 'ai_screened'
  | 'ai_interviewed'
  | 'assessment'
  | 'human_interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'on_hold';

export type ScreeningBucket = 'strong_fit' | 'good_fit' | 'potential_fit' | 'weak_fit';

export type ApplicantSource = 'fitvector_organic' | 'external_link' | 'referral' | 'imported' | 'boosted';

export interface ScreeningBreakdown {
  skillMatch: number;
  experienceRelevance: number;
  educationFit: number;
  achievementSignals: number;
  cultureFit: number;
  screeningQuestions: number;
}

export interface Applicant {
  id: string;
  jobPostId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  roleTitle: string | null;
  currentCompany: string | null;
  experience: number | null;
  avatarUrl: string | null;
  resumeUrl: string | null;
  resumeParsedJson: Record<string, unknown> | null;
  screeningResponses: Array<{ questionId: string; answer: string }>;
  interestNote: string | null;
  source: ApplicantSource;
  screeningScore: number | null;
  screeningBreakdown: ScreeningBreakdown | null;
  screeningSummary: string | null;
  bucket: ScreeningBucket | null;
  pipelineStage: PipelineStage;
  rejectionReason: string | null;
  isTalentPool: boolean;
  talentPoolTags: string[];
  isBoosted: boolean;
  createdAt: string;
  updatedAt: string;
}
