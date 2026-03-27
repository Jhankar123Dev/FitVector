// ─── Assessment ────────────────────────────────────────────────────────────

export type AssessmentType = 'coding_test' | 'mcq_quiz' | 'case_study' | 'assignment';
export type AssessmentDifficulty = 'easy' | 'medium' | 'hard';
export type AssessmentStatus = 'active' | 'archived';
export type SubmissionStatus = 'invited' | 'started' | 'submitted' | 'graded' | 'expired';

export interface CodingQuestion {
  id: string;
  problem: string;
  languageOptions: string[];
  testCases: { input: string; expectedOutput: string }[];
  points: number;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  explanation: string;
  points: number;
}

export interface CaseStudyQuestion {
  id: string;
  scenario: string;
  questions: string[];
  rubric: string[];
}

export interface AssignmentQuestion {
  id: string;
  instructions: string;
  deliverables: string[];
  format: string;
  rubric: string[];
}

export type AssessmentQuestion = CodingQuestion | MCQQuestion | CaseStudyQuestion | AssignmentQuestion;

export interface AssessmentSettings {
  autoGrade: boolean;
  plagiarismDetection: boolean;
  cameraProctoring: boolean;
  allowRetakes: boolean;
  randomizeOrder: boolean;
  maxAttempts: number;
}

export interface Assessment {
  id: string;
  companyId: string;
  createdBy: string;
  name: string;
  assessmentType: AssessmentType;
  timeLimitMinutes: number | null;
  difficulty: AssessmentDifficulty | null;
  passingScore: number | null;
  questions: AssessmentQuestion[];
  settings: AssessmentSettings;
  isTemplate: boolean;
  timesUsed: number;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  applicantId: string;
  jobPostId: string;
  status: SubmissionStatus;
  invitedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  timeTakenMinutes: number | null;
  answers: Record<string, unknown>[];
  autoScore: number | null;
  manualScore: number | null;
  finalScore: number | null;
  graderId: string | null;
  graderNotes: string | null;
  plagiarismFlag: boolean;
  proctoringFlags: string[];
  createdAt: string;
  updatedAt: string;
}
