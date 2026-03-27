// ─── FitVector Application (Marketplace) ───────────────────────────────────

export type FVAppStatus =
  | 'applied'
  | 'under_review'
  | 'interview_invited'
  | 'interviewed'
  | 'decision_pending'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export type BoostTier = 'basic' | 'standard' | 'premium';

export interface FVStatusTimelineEntry {
  status: FVAppStatus;
  label: string;
  timestamp: string;
  note?: string;
}

export interface FVScreeningResponse {
  questionId: string;
  question: string;
  type: 'short_answer' | 'yes_no' | 'multiple_choice';
  answer: string;
  aiSuggested: boolean;
}

export interface FitVectorApplication {
  id: string;
  applicantUserId: string;
  jobPostId: string;
  applicantId: string | null;
  tailoredResumeId: string | null;
  matchScore: number | null;
  screeningResponses: FVScreeningResponse[];
  interestNote: string | null;
  resumeName: string | null;
  isBoosted: boolean;
  boostTier: BoostTier | null;
  status: FVAppStatus;
  statusTimeline: FVStatusTimelineEntry[];
  statusUpdatedAt: string | null;
  employerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Promoted Listings ─────────────────────────────────────────────────────

export type PromotionType = 'sponsored_feed' | 'priority_search';
export type PromotionStatus = 'active' | 'expired' | 'paused';

export interface PromotedListing {
  id: string;
  jobPostId: string;
  companyId: string;
  promotionType: PromotionType;
  durationDays: number;
  startDate: string;
  endDate: string;
  amountPaid: number;
  currency: string;
  paymentId: string | null;
  impressions: number;
  clicks: number;
  applications: number;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Application Boost ─────────────────────────────────────────────────────

export interface ApplicationBoost {
  id: string;
  fitvectorApplicationId: string;
  userId: string;
  boostTier: BoostTier;
  amountPaid: number;
  currency: string;
  paymentId: string | null;
  createdAt: string;
}

export interface BoostCredits {
  id: string;
  userId: string;
  creditsRemaining: number;
  creditsPurchased: number;
  amountPaid: number;
  currency: string;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}
