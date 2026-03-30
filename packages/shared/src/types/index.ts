import type { PlanTier } from '../constants/plan-limits';
import type { JobSourceId } from '../constants/job-sources';
import type { ApplicationStatusId } from '../constants/application-statuses';

// ─── Phase 2 + 3 Type Re-exports ──────────────────────────────────────────
export type * from './company';
export type * from './job-post';
export type * from './applicant';
export type * from './ai-interview';
export type * from './assessment';
export type * from './human-interview';
export type * from './marketplace';
export type * from './community';
export type * from './verified-profile';

// ─── Auth & User ────────────────────────────────────────────────────────────

export type AuthProvider = 'google' | 'github' | 'email';

export type UserStatus = 'active' | 'suspended' | 'deleted';

export type UserRole = 'seeker' | 'employer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  planTier: PlanTier;
  userStatus: UserStatus;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── User Profile ───────────────────────────────────────────────────────────

export type ExperienceLevel = 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';

export type JobSearchStatus = 'actively_looking' | 'open_to_offers' | 'casually_browsing' | 'not_looking';

export interface UserProfile {
  id: string;
  userId: string;
  currentRole: string | null;
  currentCompany: string | null;
  currentStatus: JobSearchStatus;
  experienceLevel: ExperienceLevel;
  targetRoles: string[];
  targetLocations: string[];
  preferredWorkMode: WorkMode;
  preferredJobTypes: JobType[];
  skills: string[];
  parsedResumeJson: Record<string, unknown> | null;
  rawResumeUrl: string | null;
}

// ─── Job ────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  externalId: string | null;
  source: JobSourceId;
  sources: JobSourceId[];
  url: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  city: string | null;
  country: string | null;
  workMode: WorkMode;
  jobType: JobType;
  description: string;
  skillsRequired: string[];
  experienceMin: number | null;
  experienceMax: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isActive: boolean;
  postedAt: string | null;
}

// ─── Job Match ──────────────────────────────────────────────────────────────

export type MatchBucket = 'excellent' | 'good' | 'fair' | 'poor';

export interface GapAnalysisItem {
  skill: string;
  importance: 'required' | 'preferred' | 'nice_to_have';
  userHas: boolean;
}

export interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  matchScore: number;
  matchBucket: MatchBucket;
  gapAnalysis: GapAnalysisItem[] | null;
  isSeen: boolean;
  isSaved: boolean;
  isDismissed: boolean;
}

// ─── Application ────────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  status: ApplicationStatusId;
  changedAt: string;
  note: string | null;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatusId;
  statusHistory: StatusHistoryEntry[];
  tailoredResumeId: string | null;
  appliedAt: string | null;
  notes: string | null;
  nextFollowupDate: string | null;
  positionOrder: number;
  isArchived: boolean;
}

// ─── Tailored Resume ────────────────────────────────────────────────────────

export interface TailoredResume {
  id: string;
  userId: string;
  jobId: string | null;
  versionName: string;
  templateId: string;
  latexSource: string;
  pdfUrl: string | null;
  jobTitle: string | null;
  companyName: string | null;
  createdAt: string;
}

// ─── Generated Outreach ─────────────────────────────────────────────────────

export type OutreachType = 'cold_email' | 'linkedin_message' | 'referral_request';

export type OutreachTone = 'professional' | 'casual' | 'enthusiastic' | 'concise';

export interface GeneratedOutreach {
  id: string;
  userId: string;
  jobId: string | null;
  outreachType: OutreachType;
  subject: string | null;
  body: string;
  tone: OutreachTone;
  recruiterName: string | null;
  recruiterEmail: string | null;
  wasCopied: boolean;
  wasSent: boolean;
}
