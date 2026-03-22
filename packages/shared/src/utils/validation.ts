import { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email must be at most 255 characters')
  .transform((v) => v.toLowerCase().trim());

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const urlSchema = z.string().url('Invalid URL');

export const nonEmptyString = z
  .string()
  .min(1, 'This field is required')
  .transform((v) => v.trim());

// ─── Pagination ─────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── Sorting ────────────────────────────────────────────────────────────────

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export function createSortSchema<T extends string>(allowedFields: readonly T[]) {
  return z.object({
    sortBy: z.enum(allowedFields as unknown as [T, ...T[]]).optional(),
    sortOrder: sortOrderSchema,
  });
}

// ─── Domain Schemas ─────────────────────────────────────────────────────────

export const planTierSchema = z.enum(['free', 'starter', 'pro', 'elite']);

export const authProviderSchema = z.enum(['google', 'github', 'email']);

export const workModeSchema = z.enum(['remote', 'hybrid', 'onsite']);

export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
]);

export const experienceLevelSchema = z.enum([
  'intern',
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
]);

export const applicationStatusSchema = z.enum([
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
]);

export const outreachTypeSchema = z.enum([
  'cold_email',
  'linkedin_message',
  'referral_request',
]);

export const outreachToneSchema = z.enum([
  'professional',
  'casual',
  'enthusiastic',
  'concise',
]);

export const jobSearchStatusSchema = z.enum([
  'actively_looking',
  'open_to_offers',
  'casually_browsing',
  'not_looking',
]);

// ─── Compound Schemas ───────────────────────────────────────────────────────

export const skillsArraySchema = z
  .array(z.string().min(1).max(100))
  .min(1, 'At least one skill is required')
  .max(50, 'Maximum 50 skills allowed');

export const salaryRangeSchema = z
  .object({
    min: z.number().min(0).nullable(),
    max: z.number().min(0).nullable(),
    currency: z.string().length(3).default('USD'),
  })
  .refine(
    (data) => {
      if (data.min != null && data.max != null) {
        return data.min <= data.max;
      }
      return true;
    },
    { message: 'Minimum salary must be less than or equal to maximum salary' },
  );

export const dateStringSchema = z.string().refine(
  (val) => !isNaN(new Date(val).getTime()),
  { message: 'Invalid date string' },
);
