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
