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

// ── Applicant / Pipeline types ──────────────────────────────────────

export type PipelineStage =
  | "applied"
  | "ai_screened"
  | "ai_interviewed"
  | "assessment"
  | "human_interview"
  | "offer"
  | "hired"
  | "rejected";

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  applied: "Applied",
  ai_screened: "AI Screened",
  ai_interviewed: "AI Interviewed",
  assessment: "Assessment",
  human_interview: "Human Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const PIPELINE_COLUMNS: PipelineStage[] = [
  "applied",
  "ai_screened",
  "ai_interviewed",
  "assessment",
  "human_interview",
  "offer",
  "hired",
];

export type ApplicantSource = "fitvector" | "external" | "referral" | "imported";

export const SOURCE_LABELS: Record<ApplicantSource, string> = {
  fitvector: "FitVector",
  external: "External",
  referral: "Referral",
  imported: "Imported",
};

export type ScreeningBucket = "strong_fit" | "good_fit" | "potential_fit" | "weak_fit";

export const BUCKET_LABELS: Record<ScreeningBucket, string> = {
  strong_fit: "Strong Fit",
  good_fit: "Good Fit",
  potential_fit: "Potential Fit",
  weak_fit: "Weak Fit",
};

export const BUCKET_COLORS: Record<ScreeningBucket, string> = {
  strong_fit: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good_fit: "bg-brand-50 text-brand-700 border-brand-200",
  potential_fit: "bg-amber-50 text-amber-700 border-amber-200",
  weak_fit: "bg-red-50 text-red-700 border-red-200",
};

export interface ScreeningBreakdown {
  skillMatch: number;
  experienceRelevance: number;
  educationFit: number;
  achievementSignals: number;
  cultureFit: number;
  screeningQuestions: number;
}

export interface ParsedResume {
  summary: string;
  experience: {
    company: string;
    title: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
  projects: {
    name: string;
    description: string;
  }[];
}

export interface CandidateNote {
  id: string;
  authorName: string;
  authorRole: TeamMemberRole;
  content: string;
  createdAt: string;
}

export interface Applicant {
  id: string;
  jobPostId: string;
  name: string;
  email: string;
  phone: string;
  currentRole: string;
  currentCompany: string;
  experience: number; // years
  avatarUrl: string | null;
  source: ApplicantSource;
  pipelineStage: PipelineStage;
  screeningScore: number; // 0-100
  screeningBucket: ScreeningBucket;
  screeningSummary: string;
  screeningBreakdown: ScreeningBreakdown;
  parsedResume: ParsedResume;
  notes: CandidateNote[];
  appliedAt: string;
  updatedAt: string;
}

// ── AI Interview types ──────────────────────────────────────────────

export type AIInterviewStatus = "invited" | "started" | "completed" | "expired" | "cancelled";
export type AIRecommendation = "strong_advance" | "advance" | "borderline" | "reject";
export type CheatingConfidence = "low" | "medium" | "high";

export const AI_INTERVIEW_STATUS_LABELS: Record<AIInterviewStatus, string> = {
  invited: "Invited",
  started: "In Progress",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const AI_RECOMMENDATION_LABELS: Record<AIRecommendation, string> = {
  strong_advance: "Strong Advance",
  advance: "Advance",
  borderline: "Borderline",
  reject: "Reject",
};

export const AI_RECOMMENDATION_COLORS: Record<AIRecommendation, string> = {
  strong_advance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  advance: "bg-brand-50 text-brand-700 border-brand-200",
  borderline: "bg-amber-50 text-amber-700 border-amber-200",
  reject: "bg-red-50 text-red-700 border-red-200",
};

export const CHEATING_CONFIDENCE_COLORS: Record<CheatingConfidence, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export interface TranscriptTurn {
  speaker: "ai" | "candidate";
  text: string;
  timestamp: string; // "00:00", "01:23" etc
}

export interface SkillRating {
  skill: string;
  score: number; // 1-5
  justification: string;
}

export interface CommunicationScore {
  label: string;
  score: number; // 1-5
  note: string;
}

export interface AIInterview {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;
  applicantCompany: string;
  jobPostId: string;
  jobTitle: string;
  interviewType: InterviewType;
  durationPlanned: number; // minutes
  durationActual: number | null;
  status: AIInterviewStatus;
  inviteSentAt: string;
  startedAt: string | null;
  completedAt: string | null;
  overallScore: number | null; // 0-100
  aiRecommendation: AIRecommendation | null;
  cheatingConfidence: CheatingConfidence | null;
  cheatingSignals: string[];
  cheatingNote: string | null;
  executiveSummary: string | null;
  skillRatings: SkillRating[];
  strengths: string[];
  concerns: string[];
  communicationScores: CommunicationScore[];
  transcript: TranscriptTurn[];
  audioUrl: string | null;
  createdAt: string;
}

// ── Assessment System types ────────────────────────────────────────

export type AssessmentStatus = "draft" | "active" | "archived";
export type QuestionType = "multiple_choice" | "code" | "short_answer" | "true_false";

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const ASSESSMENT_STATUS_COLORS: Record<AssessmentStatus, string> = {
  draft: "bg-surface-100 text-surface-600 border-surface-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-red-50 text-red-700 border-red-200",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  code: "Code",
  short_answer: "Short Answer",
  true_false: "True / False",
};

export interface AssessmentTemplate {
  id: string;
  title: string;
  type: AssessmentType;
  difficulty: DifficultyLevel;
  duration: number; // minutes
  questionCount: number;
  tags: string[];
  status: AssessmentStatus;
  description: string;
  completionRate: number; // 0-100
  avgScore: number; // 0-100
  candidatesTaken: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for multiple_choice / true_false
  correctAnswer: string; // option text or expected answer
  points: number;
  codeLanguage?: string; // for code questions
  testCases?: { input: string; expectedOutput: string }[];
}

export interface AssessmentInstance {
  id: string;
  templateId: string;
  title: string;
  type: AssessmentType;
  difficulty: DifficultyLevel;
  duration: number;
  passingScore: number; // percentage
  questions: AssessmentQuestion[];
  status: AssessmentStatus;
  settings: {
    randomizeQuestions: boolean;
    showResultsToCandidate: boolean;
    maxAttempts: number;
    proctoring: {
      tabSwitchDetection: boolean;
      copyPasteDetection: boolean;
    };
  };
  createdAt: string;
}

export type CandidateAssessmentStatus = "not_started" | "in_progress" | "completed" | "expired";

export const CANDIDATE_ASSESSMENT_STATUS_LABELS: Record<CandidateAssessmentStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  expired: "Expired",
};

export const CANDIDATE_ASSESSMENT_STATUS_COLORS: Record<CandidateAssessmentStatus, string> = {
  not_started: "bg-surface-100 text-surface-600 border-surface-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-red-50 text-red-700 border-red-200",
};

export interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: string;
  codeSubmission?: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsMax: number;
  timeTaken: number; // seconds
}

export interface CandidateAssessmentResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateName: string;
  candidateEmail: string;
  status: CandidateAssessmentStatus;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  timeSpent: number | null; // minutes
  answers: AssessmentAnswer[];
  proctoringFlags: {
    tabSwitches: number;
    copyPasteAttempts: number;
    flagged: boolean;
  };
}

// ── Interview Scheduling types ─────────────────────────────────────

export type ScheduledInterviewType = "phone" | "video" | "onsite";
export type ScheduledInterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export const SCHEDULED_INTERVIEW_TYPE_LABELS: Record<ScheduledInterviewType, string> = {
  phone: "Phone",
  video: "Video",
  onsite: "On-site",
};

export const SCHEDULED_INTERVIEW_STATUS_LABELS: Record<ScheduledInterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

export const SCHEDULED_INTERVIEW_TYPE_COLORS: Record<ScheduledInterviewType, string> = {
  phone: "bg-amber-50 text-amber-700 border-amber-200",
  video: "bg-brand-50 text-brand-700 border-brand-200",
  onsite: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const SCHEDULED_INTERVIEW_STATUS_COLORS: Record<ScheduledInterviewStatus, string> = {
  scheduled: "bg-brand-50 text-brand-700 border-brand-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rescheduled: "bg-amber-50 text-amber-700 border-amber-200",
};

export interface ScheduledInterview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobPostId: string;
  jobTitle: string;
  interviewerIds: string[];
  interviewerNames: string[];
  type: ScheduledInterviewType;
  status: ScheduledInterviewStatus;
  scheduledAt: string; // ISO datetime
  duration: number; // minutes
  meetingLink: string | null;
  location: string | null;
  interviewerNotes: string;
  createdBy: string;
  createdAt: string;
}

// ── Candidate Voting types ─────────────────────────────────────────

export type VoteValue = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

export const VOTE_LABELS: Record<VoteValue, string> = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire",
  strong_no_hire: "Strong No Hire",
};

export const VOTE_COLORS: Record<VoteValue, string> = {
  strong_hire: "bg-emerald-100 text-emerald-700 border-emerald-300",
  hire: "bg-brand-100 text-brand-700 border-brand-300",
  no_hire: "bg-amber-100 text-amber-700 border-amber-300",
  strong_no_hire: "bg-red-100 text-red-700 border-red-300",
};

export interface CandidateVote {
  id: string;
  candidateId: string;
  voterId: string;
  voterName: string;
  voterRole: TeamMemberRole;
  vote: VoteValue;
  comment: string | null;
  createdAt: string;
}

// ── Team Activity types ────────────────────────────────────────────

export interface TeamActivity {
  id: string;
  actorName: string;
  actorRole: TeamMemberRole;
  description: string;
  timestamp: string;
}
