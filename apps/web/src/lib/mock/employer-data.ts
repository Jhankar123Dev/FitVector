import type { Company, TeamMember } from "@/types/employer";

export const MOCK_COMPANY: Company = {
  id: "comp-001",
  name: "TechStartup Inc",
  logoUrl: null,
  websiteUrl: "https://techstartup.io",
  industry: "saas",
  companySize: "11-50",
  description:
    "TechStartup Inc builds AI-powered developer tools that help engineering teams ship 10x faster. Founded in 2024, we're backed by top-tier VCs and are growing rapidly across Bangalore and San Francisco.",
  cultureKeywords: [
    "Move fast",
    "Ownership",
    "Transparency",
    "Remote-first",
    "Builder mindset",
  ],
  locations: ["Bangalore, India", "San Francisco, USA"],
  planTier: "growth",
  createdAt: "2026-01-15T10:00:00Z",
};

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-001",
    email: "arjun@techstartup.io",
    name: "Arjun Mehta",
    role: "admin",
    status: "active",
    avatarUrl: null,
    invitedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "tm-002",
    email: "priya@techstartup.io",
    name: "Priya Sharma",
    role: "recruiter",
    status: "active",
    avatarUrl: null,
    invitedAt: "2026-01-20T14:00:00Z",
  },
  {
    id: "tm-003",
    email: "rahul@techstartup.io",
    name: "Rahul Gupta",
    role: "hiring_manager",
    status: "active",
    avatarUrl: null,
    invitedAt: "2026-01-22T09:30:00Z",
  },
  {
    id: "tm-004",
    email: "sneha@techstartup.io",
    name: null,
    role: "viewer",
    status: "invited",
    avatarUrl: null,
    invitedAt: "2026-03-10T11:00:00Z",
  },
];

export const MOCK_EMPLOYER_STATS = {
  activeJobs: 4,
  totalApplicants: 127,
  interviewsThisWeek: 8,
  offersExtended: 2,
  avgTimeToHire: "12 days",
  screeningAccuracy: "84%",
};
