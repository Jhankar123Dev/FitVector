import type { JobSearchResult } from "@/types/job";
import type {
  FitVectorApplication,
  ScreeningAnswer,
  SeekerNotification,
  VerificationItem,
} from "@/types/marketplace";

// ─── Helpers ───────────────────────────────────────────────────────────────

export function isFitVectorJob(job: JobSearchResult): boolean {
  return job.sources.includes("fitvector");
}

// Maps seeker-facing FitVector job IDs → employer MOCK_JOB_POSTS IDs
export const FITVECTOR_JOB_POST_MAP: Record<string, string> = {
  "fv-job-001": "jp-001",
  "fv-job-002": "jp-002",
  "fv-job-003": "jp-003",
};

// ─── 3 FitVector-Posted Jobs ───────────────────────────────────────────────

export const MOCK_FITVECTOR_JOBS: JobSearchResult[] = [
  {
    id: "fv-job-001",
    title: "Senior Frontend Developer",
    companyName: "TechStartup Inc",
    companyLogoUrl: null,
    location: "Bangalore, India",
    workMode: "hybrid",
    jobType: "fulltime",
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: "INR",
    postedAt: "2026-03-10T09:00:00Z",
    sources: ["fitvector"],
    url: "",
    matchScore: 88,
    matchBucket: "strong_fit",
    decisionLabel: "apply_now",
    embeddingScore: 0.91,
    deterministicScore: 85,
    deterministicComponents: {
      requiredSkillsMatch: {
        ratio: 0.8,
        matched: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
        missing: ["REST APIs"],
        weight: 0.4,
      },
      optionalSkillsMatch: {
        ratio: 0.5,
        matched: ["Figma", "Testing (Vitest/Playwright)"],
        missing: ["GraphQL", "AWS"],
        weight: 0.15,
      },
      roleAlignment: {
        score: 0.95,
        userRole: "Frontend Developer",
        jobRole: "Senior Frontend Developer",
        weight: 0.25,
      },
      experienceAlignment: {
        score: 0.85,
        userYears: 5,
        requiredYears: 4,
        shortfall: 0,
        weight: 0.2,
      },
    },
    skillsRequired: ["React", "TypeScript", "Next.js", "Tailwind CSS", "REST APIs"],
    skillsNiceToHave: ["GraphQL", "Figma", "Testing (Vitest/Playwright)", "AWS"],
    isEasyApply: true,
    isSaved: false,
    description:
      "We're looking for a Senior Frontend Developer to lead the development of our AI-powered dashboard. You'll work with React, TypeScript, and Next.js to build beautiful, performant interfaces that thousands of developers use daily.\n\n## Responsibilities\n- Lead frontend architecture decisions\n- Build and maintain complex React components\n- Collaborate with design and backend teams\n- Mentor junior developers\n\n## Requirements\n- 4+ years of React/TypeScript experience\n- Strong understanding of state management\n- Experience with Next.js and server-side rendering\n- Passion for building great user experiences",
  },
  {
    id: "fv-job-002",
    title: "Backend Engineer (Python)",
    companyName: "TechStartup Inc",
    companyLogoUrl: null,
    location: "Remote",
    workMode: "remote",
    jobType: "fulltime",
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: "INR",
    postedAt: "2026-03-12T11:00:00Z",
    sources: ["fitvector"],
    url: "",
    matchScore: 62,
    matchBucket: "potential_fit",
    decisionLabel: "prepare_then_apply",
    embeddingScore: 0.65,
    deterministicScore: 59,
    deterministicComponents: {
      requiredSkillsMatch: {
        ratio: 0.4,
        matched: ["Python", "Docker"],
        missing: ["FastAPI", "PostgreSQL", "Redis"],
        weight: 0.4,
      },
      optionalSkillsMatch: {
        ratio: 0.25,
        matched: ["AI/ML"],
        missing: ["Kubernetes", "Elasticsearch", "Terraform"],
        weight: 0.15,
      },
      roleAlignment: {
        score: 0.7,
        userRole: "Frontend Developer",
        jobRole: "Backend Engineer",
        weight: 0.25,
      },
      experienceAlignment: {
        score: 0.8,
        userYears: 5,
        requiredYears: 3,
        shortfall: 0,
        weight: 0.2,
      },
    },
    skillsRequired: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    skillsNiceToHave: ["Kubernetes", "AI/ML", "Elasticsearch", "Terraform"],
    isEasyApply: true,
    isSaved: false,
    description:
      "Join our backend team to build the AI engine that powers FitVector. You'll design and implement scalable APIs, work with LLMs, and optimize data pipelines that process millions of records.\n\n## What you'll do\n- Design and build REST/GraphQL APIs with FastAPI\n- Integrate with AI/ML models (Claude, OpenAI)\n- Optimize database queries and caching layers\n- Build robust background job processing systems",
  },
  {
    id: "fv-job-003",
    title: "Product Designer",
    companyName: "TechStartup Inc",
    companyLogoUrl: null,
    location: "Bangalore, India",
    workMode: "onsite",
    jobType: "fulltime",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    postedAt: "2026-02-20T10:00:00Z",
    sources: ["fitvector"],
    url: "",
    matchScore: 45,
    matchBucket: "weak_fit",
    decisionLabel: "explore",
    embeddingScore: 0.42,
    deterministicScore: 48,
    deterministicComponents: {
      requiredSkillsMatch: {
        ratio: 0.25,
        matched: ["Figma"],
        missing: ["UI/UX Design", "Design Systems", "Prototyping"],
        weight: 0.4,
      },
      optionalSkillsMatch: {
        ratio: 0.33,
        matched: ["HTML/CSS"],
        missing: ["Motion Design", "User Research"],
        weight: 0.15,
      },
      roleAlignment: {
        score: 0.3,
        userRole: "Frontend Developer",
        jobRole: "Product Designer",
        weight: 0.25,
      },
      experienceAlignment: {
        score: 0.9,
        userYears: 5,
        requiredYears: 2,
        shortfall: 0,
        weight: 0.2,
      },
    },
    skillsRequired: ["Figma", "UI/UX Design", "Design Systems", "Prototyping"],
    skillsNiceToHave: ["Motion Design", "User Research", "HTML/CSS"],
    isEasyApply: true,
    isSaved: false,
    description:
      "We need a Product Designer who can turn complex AI workflows into intuitive, delightful interfaces. You'll own the end-to-end design process from user research through high-fidelity prototypes.",
  },
];

// ─── Resume Options ────────────────────────────────────────────────────────

export const MOCK_SEEKER_RESUMES = [
  { id: "res-001", name: "Master Resume", tailoredFor: null },
  { id: "res-002", name: "Tailored for Frontend Roles", tailoredFor: "Frontend Developer" },
  { id: "res-003", name: "Tailored for TechStartup Inc — SFD", tailoredFor: "Senior Frontend Developer" },
];

// ─── AI-Suggested Screening Answers ────────────────────────────────────────

export const MOCK_AI_SCREENING_ANSWERS: Record<string, ScreeningAnswer[]> = {
  "fv-job-001": [
    {
      questionId: "sq-001",
      question: "Describe a complex UI component you built and the technical decisions involved.",
      type: "short_answer",
      answer:
        "I built a real-time collaborative document editor using React and WebSockets. Key decisions included using CRDT (Conflict-free Replicated Data Types) for conflict resolution, virtualized rendering for large documents, and a custom undo/redo system with operation transformation. The component handled 50+ concurrent users with sub-100ms latency.",
      aiSuggested: true,
    },
    {
      questionId: "sq-002",
      question: "Are you comfortable working in a hybrid setting (3 days in-office)?",
      type: "yes_no",
      answer: "yes",
      aiSuggested: true,
    },
  ],
  "fv-job-002": [
    {
      questionId: "sq-003",
      question: "What's your experience with building AI-powered applications?",
      type: "short_answer",
      answer:
        "I've integrated OpenAI and Claude APIs into production applications, building features like intelligent document summarization and semantic search. I have experience with prompt engineering, embedding pipelines, and building RAG systems using vector databases. My most recent project processed 10K+ documents daily with 95% accuracy.",
      aiSuggested: true,
    },
  ],
  "fv-job-003": [],
};

// ─── In-Progress FitVector Application ─────────────────────────────────────

export const MOCK_FITVECTOR_APPLICATION: FitVectorApplication = {
  id: "fva-001",
  jobId: "fv-job-001",
  employerJobPostId: "jp-001",
  jobTitle: "Senior Frontend Developer",
  companyName: "TechStartup Inc",
  location: "Bangalore, India",
  resumeId: "res-003",
  resumeName: "Tailored for TechStartup Inc — SFD",
  screeningAnswers: MOCK_AI_SCREENING_ANSWERS["fv-job-001"],
  coverNote:
    "I'm excited about the opportunity to lead frontend development at TechStartup Inc. Your AI-powered developer tools align perfectly with my passion for building performant, developer-friendly interfaces. With 5 years of React and TypeScript experience, including extensive work with Next.js, I'm confident I can make an immediate impact on your dashboard product.",
  matchScore: 88,
  status: "fv_under_review",
  statusTimeline: [
    {
      status: "fv_applied",
      label: "Applied via FitVector",
      timestamp: "2026-03-22T14:30:00Z",
      note: "Application submitted with tailored resume",
    },
    {
      status: "fv_under_review",
      label: "Under Review",
      timestamp: "2026-03-23T09:15:00Z",
      note: "Recruiter viewed your profile",
    },
  ],
  appliedAt: "2026-03-22T14:30:00Z",
  updatedAt: "2026-03-23T09:15:00Z",
};

// ─── Notifications ─────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: SeekerNotification[] = [
  {
    id: "notif-001",
    type: "status_change",
    title: "Application under review",
    message: "TechStartup Inc is reviewing your application for Senior Frontend Developer.",
    jobTitle: "Senior Frontend Developer",
    companyName: "TechStartup Inc",
    isRead: false,
    createdAt: "2026-03-23T09:15:00Z",
    actionUrl: "/dashboard/tracker",
  },
  {
    id: "notif-002",
    type: "interview_invite",
    title: "Interview invitation!",
    message: "You've been invited to interview for Backend Engineer at TechStartup Inc.",
    jobTitle: "Backend Engineer (Python)",
    companyName: "TechStartup Inc",
    isRead: false,
    createdAt: "2026-03-25T10:00:00Z",
    actionUrl: "/dashboard/tracker",
  },
  {
    id: "notif-003",
    type: "general",
    title: "Complete your verified profile",
    message: "Verified profiles get 3x more employer views. Complete your verification now.",
    jobTitle: "",
    companyName: "",
    isRead: true,
    createdAt: "2026-03-20T08:00:00Z",
    actionUrl: "/dashboard/settings/verification",
  },
  {
    id: "notif-004",
    type: "status_change",
    title: "Application received",
    message: "Your application for Senior Frontend Developer was received by TechStartup Inc.",
    jobTitle: "Senior Frontend Developer",
    companyName: "TechStartup Inc",
    isRead: true,
    createdAt: "2026-03-22T14:31:00Z",
    actionUrl: "/dashboard/tracker",
  },
  {
    id: "notif-005",
    type: "general",
    title: "New FitVector jobs matching your profile",
    message: "3 new jobs from FitVector employers match your skills. Check them out!",
    jobTitle: "",
    companyName: "",
    isRead: true,
    createdAt: "2026-03-18T11:00:00Z",
    actionUrl: "/dashboard/jobs",
  },
];

// ─── Verification Items ────────────────────────────────────────────────────

export const MOCK_VERIFICATION_ITEMS: VerificationItem[] = [
  {
    id: "ver-001",
    category: "identity",
    label: "Identity Verification",
    description: "Verify your identity with Aadhaar or PAN card",
    status: "not_started",
  },
  {
    id: "ver-002",
    category: "education",
    label: "Education Verification",
    description: "Upload your degree certificate for validation",
    status: "pending",
    documentName: "BTech_Certificate_2021.pdf",
  },
  {
    id: "ver-003",
    category: "employment",
    label: "Employment Verification",
    description: "Verify current or last employment with offer letter",
    status: "verified",
    documentName: "Offer_Letter_CurrentCo.pdf",
    verifiedAt: "2026-03-15T10:00:00Z",
    expiresAt: "2027-03-15T10:00:00Z",
  },
  {
    id: "ver-004",
    category: "skills",
    label: "Skills Verification",
    description: "Pass a FitVector AI assessment to verify your technical skills",
    status: "not_started",
  },
];

// ─── AI-Generated "Why I'm Interested" Templates ──────────────────────────

export const MOCK_AI_INTEREST_NOTES: Record<string, string> = {
  "fv-job-001":
    "I'm excited about the opportunity to lead frontend development at TechStartup Inc. Your AI-powered developer tools align perfectly with my passion for building performant, developer-friendly interfaces. With 5 years of React and TypeScript experience, including extensive work with Next.js, I'm confident I can make an immediate impact on your dashboard product.",
  "fv-job-002":
    "I'm drawn to the challenge of building the AI engine powering FitVector. While my primary expertise is in frontend development, I've been actively expanding into backend and AI integration, working with Python and LLM APIs. The opportunity to work on scalable data pipelines and AI-powered systems is exactly the career growth I'm pursuing.",
  "fv-job-003":
    "As a frontend developer with a strong eye for design, I'm interested in transitioning into a full-time product design role. My experience building user interfaces gives me a unique perspective on translating designs into functional products. I'd love to bring that technical-design hybrid skillset to TechStartup Inc's design team.",
};
