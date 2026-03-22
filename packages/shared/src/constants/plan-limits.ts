export const PLAN_LIMITS = {
  free: {
    job_search: 3,
    jobs_per_search: 5,
    resume_tailor: 2,
    cold_email: 2,
    linkedin_msg: 2,
    referral_msg: 0,
    email_find: 0,
    gap_analysis: 0,
    active_applications: 10,
    resume_templates: ['modern'] as const,
    resume_history: 2,
    followup_reminders: 0,
    job_alerts: false,
    chrome_extension: false,
  },
  starter: {
    job_search: 10,
    jobs_per_search: 25,
    resume_tailor: 10,
    cold_email: 15,
    linkedin_msg: 15,
    referral_msg: 5,
    email_find: 0,
    gap_analysis: 0,
    active_applications: 50,
    resume_templates: ['modern', 'classic'] as const,
    resume_history: 5,
    followup_reminders: 3,
    job_alerts: true,
    chrome_extension: false,
  },
  pro: {
    job_search: -1,
    jobs_per_search: -1,
    resume_tailor: 50,
    cold_email: 50,
    linkedin_msg: 50,
    referral_msg: 30,
    email_find: 20,
    gap_analysis: 20,
    active_applications: -1,
    resume_templates: ['modern', 'classic', 'minimal'] as const,
    resume_history: -1,
    followup_reminders: -1,
    job_alerts: true,
    chrome_extension: true,
  },
  elite: {
    job_search: -1,
    jobs_per_search: -1,
    resume_tailor: -1,
    cold_email: -1,
    linkedin_msg: -1,
    referral_msg: -1,
    email_find: 100,
    gap_analysis: -1,
    active_applications: -1,
    resume_templates: ['modern', 'classic', 'minimal', 'custom'] as const,
    resume_history: -1,
    followup_reminders: -1,
    job_alerts: true,
    chrome_extension: true,
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export const PLAN_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'elite'];

/**
 * Returns true if the limit value represents unlimited usage (-1).
 */
export function isUnlimited(value: number): boolean {
  return value === -1;
}

/**
 * Checks whether a user has remaining quota for a given feature on their plan.
 * Returns true if the feature is unlimited or the current usage is below the limit.
 */
export function hasQuota(
  tier: PlanTier,
  feature: keyof Omit<
    (typeof PLAN_LIMITS)[PlanTier],
    'resume_templates' | 'job_alerts' | 'chrome_extension'
  >,
  currentUsage: number,
): boolean {
  const limit = PLAN_LIMITS[tier][feature] as number;
  if (isUnlimited(limit)) return true;
  return currentUsage < limit;
}
