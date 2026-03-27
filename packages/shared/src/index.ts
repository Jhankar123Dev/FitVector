// Constants
export {
  PLAN_LIMITS,
  PLAN_TIERS,
  isUnlimited,
  hasQuota,
  type PlanTier,
} from './constants/plan-limits';

export {
  JOB_SOURCES,
  JOB_SOURCE_IDS,
  getJobSource,
  type JobSource,
  type JobSourceId,
} from './constants/job-sources';

export {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_IDS,
  getOrderedStatuses,
  isTerminalStatus,
  type ApplicationStatus,
  type ApplicationStatusId,
} from './constants/application-statuses';

// Types
export type {
  AuthProvider,
  UserStatus,
  User,
  ExperienceLevel,
  WorkMode,
  JobType,
  JobSearchStatus,
  UserProfile,
  Job,
  MatchBucket,
  GapAnalysisItem,
  JobMatch,
  StatusHistoryEntry,
  Application,
  TailoredResume,
  OutreachType,
  OutreachTone,
  GeneratedOutreach,
  // Phase 2+3 types
  CompanySize,
  CompanyPlanTier,
  CompanyMemberRole,
  CompanyMemberStatus,
  CompanyLocation,
  CompanyBrandingData,
  Company,
  CompanyMember,
} from './types/index';

export type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  SortParams,
} from './types/api';

export {
  successResponse,
  errorResponse,
  paginatedResponse,
} from './types/api';

// Utils
export {
  formatDate,
  formatRelativeTime,
  formatSalary,
  formatNumber,
} from './utils/format';

export {
  emailSchema,
  uuidSchema,
  urlSchema,
  nonEmptyString,
  paginationSchema,
  sortOrderSchema,
  createSortSchema,
  planTierSchema,
  authProviderSchema,
  workModeSchema,
  jobTypeSchema,
  experienceLevelSchema,
  applicationStatusSchema,
  outreachTypeSchema,
  outreachToneSchema,
  jobSearchStatusSchema,
  skillsArraySchema,
  salaryRangeSchema,
  dateStringSchema,
  type PaginationInput,
} from './utils/validation';
