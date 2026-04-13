import { z } from "zod";

export const onboardingSchema = z.object({
  currentRole: z.string().min(1, "Current role is required"),
  currentCompany: z.string().optional(),
  currentStatus: z.enum(["student", "working", "unemployed", "freelancing"]),
  experienceLevel: z.enum(["fresher", "1_3", "3_7", "7_15", "15_plus"]),
  targetRoles: z.array(z.string()).min(1, "At least one target role is required"),
  targetLocations: z.array(z.string()).min(1, "At least one location is required"),
  preferredWorkMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  preferredJobTypes: z.array(z.enum(["fulltime", "parttime", "internship", "contract"])),
});

export const jobSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  location: z.string().optional(),
  workMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  jobType: z.enum(["fulltime", "parttime", "internship", "contract"]).optional(),
  experienceMin: z.number().int().min(0).optional(),
  experienceMax: z.number().int().max(30).optional(),
  salaryMin: z.number().int().min(0).optional(),
  page: z.number().int().min(1).default(1),
});

export const tailorResumeSchema = z.object({
  jobId: z.string().uuid(),
  templateId: z.string().default("modern"),
});

export const outreachSchema = z.object({
  jobId: z.string().uuid(),
  outreachType: z.enum(["cold_email", "linkedin_inmail", "referral_request"]),
  tone: z.enum(["professional", "conversational", "confident"]).default("professional"),
  recruiterName: z.string().optional(),
});

export const applicationSchema = z.object({
  jobId: z.string().uuid().optional(),
  jobTitle: z.string().min(1),
  companyName: z.string().min(1),
  companyLogoUrl: z.string().url().optional(),
  location: z.string().optional(),
  jobUrl: z.string().url().optional(),
  status: z
    .enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"])
    .default("saved"),
  notes: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z
    .enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"])
    .optional(),
  notes: z.string().optional(),
  positionOrder: z.number().int().optional(),
  nextFollowupDate: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactRole: z.string().optional(),
});

// ─── Employer: Company ────────────────────────────────────────────────────────

export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name is required").max(200),
  logoUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  cultureKeywords: z.array(z.string()).default([]),
  locations: z
    .array(
      z.object({
        city: z.string(),
        state: z.string().optional(),
        country: z.string(),
      })
    )
    .default([]),
});

export const updateCompanySchema = createCompanySchema.partial();

// ─── Employer: Team Members ───────────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]),
});

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "recruiter", "hiring_manager", "viewer"]).optional(),
  status: z.enum(["active", "deactivated"]).optional(),
});

// ─── Employer: Job Posts ──────────────────────────────────────────────────────

export const createJobPostSchema = z.object({
  title: z.string().min(3, "Title is required").max(200),
  department: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  isRemote: z.boolean().default(false),
  workMode: z.enum(["onsite", "remote", "hybrid"]).optional().nullable(),
  jobType: z.enum(["fulltime", "parttime", "contract", "internship"]).optional().nullable(),
  experienceMin: z.number().int().min(0).optional().nullable(),
  experienceMax: z.number().int().max(50).optional().nullable(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().optional().nullable(),
  salaryCurrency: z.string().default("INR"),
  salaryVisible: z.boolean().default(true),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requiredSkills: z.array(z.string()).default([]),
  niceToHaveSkills: z.array(z.string()).default([]),
  screeningQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    type: z.enum(["short_answer", "yes_no", "multiple_choice"]),
    options: z.array(z.string()).optional(),
    required: z.boolean(),
  })).default([]),
  openingsCount: z.number().int().min(1).default(1),
  applicationDeadline: z.string().optional().nullable(),
  interviewPlan: z.object({
    enabled: z.boolean(),
    interviewType: z.string(),
    duration: z.number(),
    focusAreas: z.string(),
    difficultyLevel: z.string(),
    customQuestions: z.array(z.string()),
  }).optional().nullable(),
  assessmentConfig: z.object({
    enabled: z.boolean(),
    assessmentType: z.string(),
    timeLimit: z.number(),
    difficultyLevel: z.string(),
    customQuestions: z.array(z.string()),
  }).optional().nullable(),
  autoAdvanceThreshold: z.number().int().min(0).max(100).optional().nullable(),
  autoRejectThreshold: z.number().int().min(0).max(100).optional().nullable(),
  dimensionWeights: z.record(z.number()).optional().nullable(),
  pipelineStages: z.array(z.string()).min(2).optional(),
  status: z.enum(["draft", "active"]).default("draft"),
  // Link a pre-built assessment to this job. When set, moving a candidate to
  // assessment_pending auto-assigns this assessment instead of auto-generating one.
  assessmentId: z.string().uuid().nullable().optional(),
});

export const updateJobPostSchema = createJobPostSchema.partial().extend({
  assessmentId: z.string().uuid().nullable().optional(),
});

export const changeJobStatusSchema = z.object({
  status: z.enum(["active", "paused", "closed", "filled"]),
});

// ─── Employer: Applicant Pipeline ─────────────────────────────────────────────

export const changeStageSchema = z.object({
  // Accept any non-empty string so custom pipeline stages (set per-job) are not rejected.
  // Known stage values are still written correctly — no DB CHECK constraint on this column.
  stage: z.string().min(1),
});

export const rejectApplicantSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(1000),
});

// ─── Employer: AI Interviews ──────────────────────────────────────────────────

export const inviteInterviewSchema = z.object({
  interviewType: z.enum(["technical", "behavioral", "role_specific", "general"]).default("general"),
  durationPlanned: z.number().int().min(10).max(60).default(20),
  focusAreas: z.string().optional(),
  customQuestions: z.array(z.string()).optional(),
});

export const completeInterviewSchema = z.object({
  answers: z.array(z.object({
    question: z.string(),
    answer: z.string().min(1),
  })).min(1, "At least one answer is required"),
  clientSignals: z.array(z.object({
    type: z.enum(["tab_switch", "copy", "cut", "paste", "focus_lost"]),
    at: z.string(),
  })).optional().default([]),
});

export const interviewMessageSchema = z.object({
  // The candidate's spoken answer to the current question (empty string on first call)
  answer: z.string(),
  // Full conversation history so far (excludes the current answer)
  history: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
});

// ─── Employer: Assessments ────────────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  name: z.string().min(2, "Assessment name is required").max(200),
  assessmentType: z.enum(["coding_test", "mcq_quiz", "mixed", "case_study", "assignment"]),
  timeLimitMinutes: z.number().int().min(5).max(300).optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().nullable(),
  passingScore: z.number().int().min(0).max(100).optional().nullable(),
  questions: z.array(z.record(z.unknown())).default([]),
  settings: z.record(z.unknown()).default({}),
  isTemplate: z.boolean().default(false),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const assignAssessmentSchema = z.object({
  applicantIds: z.array(z.string().uuid()).min(1, "At least one applicant required"),
  jobPostId: z.string().uuid(),
});

export const gradeSubmissionSchema = z.object({
  manualScore: z.number().int().min(0).max(100),
  graderNotes: z.string().max(5000).optional(),
});

export const submitAssessmentSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    selectedAnswer: z.string().optional(),
    codeSubmission: z.string().optional(),
  })).min(1),
  proctoringData: z.object({
    tabSwitches: z.number().int().min(0).default(0),
    copyPasteAttempts: z.number().int().min(0).default(0),
  }).optional(),
});

// ─── Employer: Scheduling ─────────────────────────────────────────────────────

export const scheduleInterviewSchema = z.object({
  jobPostId: z.string().uuid(),
  interviewerId: z.string().uuid(),
  interviewType: z.enum(["phone_screen", "technical", "behavioral", "culture_fit", "hiring_manager", "panel"]).default("technical"),
  scheduledAt: z.string().min(1, "Scheduled time is required"),
  durationMinutes: z.number().int().min(15).max(180).default(60),
  meetingLink: z.string().url().optional().nullable(),
});

export const rescheduleInterviewSchema = z.object({
  scheduledAt: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled", "no_show"]).optional(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  meetingLink: z.string().url().optional().nullable(),
});

export const submitFeedbackSchema = z.object({
  rating: z.enum(["strong_hire", "hire", "no_hire", "strong_no_hire"]),
  feedback: z.record(z.unknown()).optional(),
  notes: z.string().max(5000).optional(),
});

// ─── Employer: Notes + Votes ──────────────────────────────────────────────────

export const addNoteSchema = z.object({
  body: z.string().min(1, "Note content is required").max(5000),
  mentions: z.array(z.string().uuid()).default([]),
});

export const castVoteSchema = z.object({
  vote: z.enum(["strong_hire", "hire", "no_hire", "strong_no_hire"]),
});
