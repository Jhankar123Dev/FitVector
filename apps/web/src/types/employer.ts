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
