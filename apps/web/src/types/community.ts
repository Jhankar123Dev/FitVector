// ─── Interview Experiences ──────────────────────────────────────────────────

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewOutcome = "got_offer" | "rejected" | "ghosted" | "in_progress";

export const DIFFICULTY_CONFIG: Record<
  InterviewDifficulty,
  { label: string; color: string; bg: string }
> = {
  easy: { label: "Easy", color: "text-green-700", bg: "bg-green-50" },
  medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50" },
  hard: { label: "Hard", color: "text-red-700", bg: "bg-red-50" },
};

export const OUTCOME_CONFIG: Record<
  InterviewOutcome,
  { label: string; color: string; bg: string }
> = {
  got_offer: { label: "Got Offer", color: "text-green-700", bg: "bg-green-50" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
  ghosted: { label: "Ghosted", color: "text-surface-500", bg: "bg-surface-100" },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-50" },
};

export interface InterviewRound {
  roundNumber: number;
  type: string;
  questions: string[];
}

export interface InterviewExperience {
  id: string;
  companyName: string;
  role: string;
  difficulty: InterviewDifficulty;
  rounds: InterviewRound[];
  outcome: InterviewOutcome;
  processDescription: string;
  tips: string;
  overallRating: number;
  upvotes: number;
  downvotes: number;
  isAnonymous: boolean;
  authorName: string | null;
  createdAt: string;
}

// ─── Discussion Forums ─────────────────────────────────────────────────────

export type DiscussionCategory =
  | "tech"
  | "business"
  | "design"
  | "marketing"
  | "career_advice"
  | "salary"
  | "general";

export const CATEGORY_CONFIG: Record<
  DiscussionCategory,
  { label: string; color: string; bg: string }
> = {
  tech: { label: "Tech", color: "text-blue-700", bg: "bg-blue-50" },
  business: { label: "Business", color: "text-emerald-700", bg: "bg-emerald-50" },
  design: { label: "Design", color: "text-pink-700", bg: "bg-pink-50" },
  marketing: { label: "Marketing", color: "text-orange-700", bg: "bg-orange-50" },
  career_advice: { label: "Career Advice", color: "text-purple-700", bg: "bg-purple-50" },
  salary: { label: "Salary", color: "text-amber-700", bg: "bg-amber-50" },
  general: { label: "General", color: "text-surface-600", bg: "bg-surface-100" },
};

export const CATEGORY_IDS: DiscussionCategory[] = [
  "tech",
  "business",
  "design",
  "marketing",
  "career_advice",
  "salary",
  "general",
];

export interface DiscussionReply {
  id: string;
  threadId: string;
  parentReplyId: string | null;
  authorName: string | null;
  isAnonymous: boolean;
  body: string;
  upvotes: number;
  createdAt: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  category: DiscussionCategory;
  authorName: string | null;
  isAnonymous: boolean;
  body: string;
  upvotes: number;
  repliesCount: number;
  lastActivityAt: string;
  createdAt: string;
}

// ─── Salary Insights ───────────────────────────────────────────────────────

export interface SalaryEntry {
  id: string;
  role: string;
  companyName: string | null;
  location: string;
  experienceYears: number;
  baseSalary: number;
  totalComp: number;
  currency: string;
  createdAt: string;
}

export interface SalaryAggregation {
  role: string;
  location: string;
  sampleSize: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  distribution: { bucket: string; count: number }[];
}

export type ExperienceFilter = "all" | "0-2" | "3-5" | "6-10" | "10+";

export const EXPERIENCE_FILTERS: Record<ExperienceFilter, { label: string; min: number; max: number }> = {
  all: { label: "All", min: 0, max: 99 },
  "0-2": { label: "0-2 yrs", min: 0, max: 2 },
  "3-5": { label: "3-5 yrs", min: 3, max: 5 },
  "6-10": { label: "6-10 yrs", min: 6, max: 10 },
  "10+": { label: "10+ yrs", min: 10, max: 99 },
};
