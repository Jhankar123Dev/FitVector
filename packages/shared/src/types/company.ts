// ─── Company ───────────────────────────────────────────────────────────────

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
export type CompanyPlanTier = 'starter' | 'growth' | 'business' | 'enterprise';
export type CompanyMemberRole = 'admin' | 'recruiter' | 'hiring_manager' | 'viewer';
export type CompanyMemberStatus = 'invited' | 'active' | 'deactivated';

export interface CompanyLocation {
  city: string;
  state?: string;
  country: string;
}

export interface CompanyBrandingData {
  banner_url?: string;
  story?: string;
  team_photos?: { id: string; url: string | null; caption: string; initials: string }[];
  benefits?: string[];
  culture_values?: { title: string; description: string; icon: string }[];
  day_in_the_life?: { job_post_id: string; job_title: string; description: string }[];
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  industry: string | null;
  companySize: CompanySize | null;
  description: string | null;
  cultureKeywords: string[];
  locations: CompanyLocation[];
  branding: CompanyBrandingData;
  createdBy: string;
  planTier: CompanyPlanTier;
  planExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyMemberRole;
  invitedBy: string | null;
  inviteEmail: string | null;
  status: CompanyMemberStatus;
  invitedAt: string;
  createdAt: string;
  updatedAt: string;
}
