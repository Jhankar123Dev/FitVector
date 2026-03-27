// ─── Job Post (Employer-created) ───────────────────────────────────────────

export type JobPostStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled';
export type JobPostWorkMode = 'onsite' | 'remote' | 'hybrid';
export type JobPostType = 'fulltime' | 'parttime' | 'contract' | 'internship';

export interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'short_answer' | 'yes_no' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

export interface InterviewPlan {
  enabled: boolean;
  interviewType: 'technical' | 'behavioral' | 'role_specific' | 'general';
  duration: number;
  focusAreas: string;
  difficultyLevel: string;
  customQuestions: string[];
}

export interface AssessmentConfig {
  enabled: boolean;
  assessmentType: string;
  timeLimit: number;
  difficultyLevel: string;
  customQuestions: string[];
}

export interface DimensionWeights {
  skillMatch: number;
  experience: number;
  education: number;
  achievements: number;
  culture: number;
  screeningQuestions: number;
}

export interface JobPost {
  id: string;
  companyId: string;
  createdBy: string;
  title: string;
  department: string | null;
  location: string | null;
  isRemote: boolean;
  workMode: JobPostWorkMode | null;
  jobType: JobPostType | null;
  experienceMin: number | null;
  experienceMax: number | null;
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
  interviewPlan: InterviewPlan | null;
  assessmentConfig: AssessmentConfig | null;
  status: JobPostStatus;
  autoAdvanceThreshold: number | null;
  autoRejectThreshold: number | null;
  dimensionWeights: DimensionWeights | null;
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}
