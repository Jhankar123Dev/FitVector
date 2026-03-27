// ─── FitVector Marketplace Types ────────────────────────────────────────────

// FitVector marketplace application statuses (more granular than tracker)
export type FVApplicationStatus =
  | "fv_applied"
  | "fv_under_review"
  | "fv_interview_invited"
  | "fv_interviewed"
  | "fv_decision_pending"
  | "fv_offered"
  | "fv_rejected";

export const FV_STATUS_CONFIG: Record<
  FVApplicationStatus,
  { label: string; color: string; order: number; trackerColumn: string }
> = {
  fv_applied: { label: "Applied via FitVector", color: "#3B82F6", order: 0, trackerColumn: "applied" },
  fv_under_review: { label: "Under Review", color: "#F59E0B", order: 1, trackerColumn: "screening" },
  fv_interview_invited: { label: "Interview Invited", color: "#8B5CF6", order: 2, trackerColumn: "interview" },
  fv_interviewed: { label: "Interviewed", color: "#7C3AED", order: 3, trackerColumn: "interview" },
  fv_decision_pending: { label: "Decision Pending", color: "#F97316", order: 4, trackerColumn: "interview" },
  fv_offered: { label: "Offered", color: "#10B981", order: 5, trackerColumn: "offer" },
  fv_rejected: { label: "Rejected", color: "#EF4444", order: 6, trackerColumn: "rejected" },
};

export function isFitVectorApp(status: string): boolean {
  return status.startsWith("fv_");
}

// ─── FitVector Application ─────────────────────────────────────────────────

export interface ScreeningAnswer {
  questionId: string;
  question: string;
  type: "short_answer" | "yes_no" | "multiple_choice";
  answer: string;
  aiSuggested: boolean;
}

export interface StatusTimelineEntry {
  status: string;
  label: string;
  timestamp: string;
  note?: string;
}

export interface FitVectorApplication {
  id: string;
  jobId: string;
  employerJobPostId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  resumeId: string;
  resumeName: string;
  screeningAnswers: ScreeningAnswer[];
  coverNote: string;
  matchScore: number;
  status: FVApplicationStatus;
  statusTimeline: StatusTimelineEntry[];
  appliedAt: string;
  updatedAt: string;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export type NotificationType =
  | "status_change"
  | "interview_invite"
  | "offer"
  | "rejection"
  | "general";

export interface SeekerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  jobTitle: string;
  companyName: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string;
}

// ─── Verification ──────────────────────────────────────────────────────────

export type VerificationCategory = "identity" | "education" | "employment" | "skills";
export type VerificationStatus = "not_started" | "pending" | "verified" | "expired";

export interface VerificationItem {
  id: string;
  category: VerificationCategory;
  label: string;
  description: string;
  status: VerificationStatus;
  documentName?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export const VERIFICATION_STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bg: string }
> = {
  not_started: { label: "Not Started", color: "text-surface-500", bg: "bg-surface-100" },
  pending: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50" },
  verified: { label: "Verified", color: "text-green-700", bg: "bg-green-50" },
  expired: { label: "Expired", color: "text-red-700", bg: "bg-red-50" },
};

// ─── Application Boost ─────────────────────────────────────────────────────

export type BoostTier = "basic" | "standard" | "premium";

export interface BoostOption {
  tier: BoostTier;
  price: number;
  label: string;
  description: string;
}

export const BOOST_OPTIONS: BoostOption[] = [
  { tier: "basic", price: 99, label: "Basic Boost", description: "Application highlighted for 3 days" },
  { tier: "standard", price: 199, label: "Standard Boost", description: "Highlighted for 7 days + priority badge" },
  { tier: "premium", price: 299, label: "Premium Boost", description: "Highlighted for 14 days + priority badge + top of pipeline" },
];

export const BOOST_CREDIT_PACKS = [
  { count: 5, price: 449, savings: "Save 10%" },
  { count: 12, price: 999, savings: "Save 16%" },
];
