// ── Employer-side types ──────────────────────────────────────────────

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

export type Industry =
  | "technology"
  | "fintech"
  | "healthcare"
  | "education"
  | "ecommerce"
  | "saas"
  | "consulting"
  | "manufacturing"
  | "media"
  | "other";

export const INDUSTRY_LABELS: Record<Industry, string> = {
  technology: "Technology",
  fintech: "Fintech",
  healthcare: "Healthcare",
  education: "Education",
  ecommerce: "E-Commerce",
  saas: "SaaS",
  consulting: "Consulting",
  manufacturing: "Manufacturing",
  media: "Media & Entertainment",
  other: "Other",
};

export const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string;
  industry: Industry;
  companySize: CompanySize;
  description: string;
  cultureKeywords: string[];
  locations: string[];
  planTier: "starter" | "growth" | "business" | "enterprise";
  createdAt: string;
}

export type TeamMemberRole = "admin" | "recruiter" | "hiring_manager" | "viewer";
export type TeamMemberStatus = "invited" | "active" | "deactivated";

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  avatarUrl: string | null;
  invitedAt: string;
}

export interface OnboardingData {
  // Step 1 — Company basics
  companyName: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  websiteUrl: string;
  industry: Industry | "";
  companySize: CompanySize | "";

  // Step 2 — Company profile
  description: string;
  cultureKeywords: string[];
  locations: string[];

  // Step 3 — Team setup
  invites: { email: string; role: TeamMemberRole }[];
}

export const TEAM_ROLE_LABELS: Record<TeamMemberRole, string> = {
  admin: "Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  viewer: "Viewer",
};

// ── Job Post types ──────────────────────────────────────────────────

export type JobPostStatus = "draft" | "active" | "paused" | "closed" | "filled";
export type JobPostType = "fulltime" | "parttime" | "contract" | "internship";
export type WorkMode = "onsite" | "remote" | "hybrid";
export type InterviewType = "technical" | "behavioral" | "role_specific" | "general";
export type DifficultyLevel = "junior" | "mid" | "senior";
export type AssessmentType = "coding_test" | "mcq_quiz" | "case_study" | "assignment";
export type ScreeningQuestionType = "multiple_choice" | "short_answer" | "yes_no";

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: ScreeningQuestionType;
  options?: string[]; // for multiple_choice
  required: boolean;
}

export interface AIInterviewConfig {
  enabled: boolean;
  interviewType: InterviewType;
  duration: 15 | 20 | 30;
  focusAreas: string;
  difficultyLevel: DifficultyLevel;
  customQuestions: string[];
}

export interface AssessmentConfig {
  enabled: boolean;
  assessmentType: AssessmentType;
  timeLimit: number; // minutes
  difficultyLevel: DifficultyLevel;
  customQuestions: string[];
}

export interface JobPost {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  workMode: WorkMode;
  jobType: JobPostType;
  experienceMin: number;
  experienceMax: number;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryVisible: boolean;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  screeningQuestions: ScreeningQuestion[];
  openingsCount: number;
  applicationDeadline: string | null;
  interviewConfig: AIInterviewConfig | null;
  assessmentConfig: AssessmentConfig | null;
  status: JobPostStatus;
  applicantsCount: number;
  screenedCount: number;
  interviewedCount: number;
  hiredCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostFormData {
  // Step 1: Basic info
  title: string;
  department: string;
  location: string;
  workMode: WorkMode;
  jobType: JobPostType;
  experienceMin: number;
  experienceMax: number;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryVisible: boolean;
  openingsCount: number;

  // Step 2: Description
  description: string;

  // Step 3: Skills
  requiredSkills: string[];
  niceToHaveSkills: string[];

  // Step 4: Screening
  screeningQuestions: ScreeningQuestion[];

  // Step 5: AI Interview
  interviewConfig: AIInterviewConfig;

  // Step 6: Assessment
  assessmentConfig: AssessmentConfig;
}

export const JOB_TYPE_LABELS: Record<JobPostType, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const JOB_STATUS_LABELS: Record<JobPostStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
  filled: "Filled",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  technical: "Technical Screening",
  behavioral: "Behavioral / Situational",
  role_specific: "Role-Specific",
  general: "General Screening",
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  coding_test: "Coding Test",
  mcq_quiz: "MCQ Quiz",
  case_study: "Case Study",
  assignment: "Take-Home Assignment",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
};

// ── Activity feed types ─────────────────────────────────────────────

export type ActivityType =
  | "new_applicant"
  | "ai_interview_completed"
  | "interview_scheduled"
  | "job_posted"
  | "offer_sent"
  | "candidate_hired";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  jobTitle: string;
  candidateName?: string;
  timestamp: string;
  actionUrl: string;
}
