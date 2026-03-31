// ─── Decision Labels ────────────────────────────────────────────────────────

export type DecisionLabel = "apply_now" | "prepare_then_apply" | "explore";

export const DECISION_LABEL_CONFIG: Record<
  DecisionLabel,
  { label: string; color: string; bg: string; description: string }
> = {
  apply_now: {
    label: "Apply now",
    color: "text-green-700",
    bg: "bg-green-100",
    description: "Strong match — go for it!",
  },
  prepare_then_apply: {
    label: "Prepare & apply",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    description: "Good potential — brush up on a few skills first",
  },
  explore: {
    label: "Explore",
    color: "text-gray-600",
    bg: "bg-gray-100",
    description: "Worth exploring — may need more preparation",
  },
};

// ─── Job Search Types ───────────────────────────────────────────────────────

export interface JobSearchParams {
  role: string;
  location?: string;
  workMode?: "onsite" | "remote" | "hybrid";
  jobType?: "fulltime" | "parttime" | "internship" | "contract";
  hoursOld?: number;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
  decisionLabel?: DecisionLabel;
}

export interface DeterministicComponents {
  requiredSkillsMatch: {
    ratio: number;
    matched: string[];
    missing: string[];
    weight: number;
  };
  optionalSkillsMatch: {
    ratio: number;
    matched: string[];
    missing: string[];
    weight: number;
  };
  roleAlignment: {
    score: number;
    userRole: string;
    jobRole: string;
    weight: number;
  };
  experienceAlignment: {
    score: number;
    userYears: number;
    requiredYears: number;
    shortfall: number;
    weight: number;
  };
}

export interface JobSearchResult {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  workMode: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  postedAt: string | null;
  sources: string[];
  url: string;
  matchScore: number | null;
  matchBucket: string | null;
  decisionLabel: DecisionLabel | null;
  embeddingScore: number | null;
  deterministicScore: number | null;
  deterministicComponents: DeterministicComponents | null;
  skillsRequired: string[];
  skillsNiceToHave: string[];
  isEasyApply: boolean;
  isSaved: boolean;
  description: string;
  isDirect?: boolean;
}

export interface JobSearchResponse {
  jobs: JobSearchResult[];
  total: number;
  page: number;
  limit: number;
  cached: boolean;
  cachedAt: string | null;
}

// ─── Job Detail Types ───────────────────────────────────────────────────────

export interface SkillMatch {
  matching: string[];
  missing: string[];
  extra: string[];
}

export interface JobDetail extends JobSearchResult {
  companyUrl: string | null;
  companySize: string | null;
  companyIndustry: string | null;
  companyRating: number | null;
  experienceMin: number | null;
  experienceMax: number | null;
  applyUrl: string | null;
  skillMatch: SkillMatch | null;
  hasGapAnalysis: boolean;
  applicationStatus: string | null;
}

// ─── Usage Types ────────────────────────────────────────────────────────────

export interface UsageItem {
  used: number;
  limit: number;
  period: "daily" | "monthly" | "total";
}

export interface UsageData {
  plan: string;
  month: string;
  usage: {
    jobSearch: UsageItem;
    resumeTailor: UsageItem;
    coldEmail: UsageItem;
    linkedinMsg: UsageItem;
    referralMsg: UsageItem;
    emailFind: UsageItem;
    gapAnalysis: UsageItem;
    activeApplications: UsageItem;
  };
}

// ─── Skills to Learn Types ──────────────────────────────────────────────────

export interface SkillToLearn {
  skill: string;
  priorityScore: number;
  requiredIn: number;
  niceToHaveIn: number;
  wouldUnlock: number;
  message: string;
}

export interface SkillsToLearnData {
  skillsToLearn: SkillToLearn[];
}
