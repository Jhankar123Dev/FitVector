# FitVector Pro - Project Status Report

**Date:** 2026-03-31
**Current Commit:** `e77983f` (commit #47)
**Branch:** main

---

## 1. PROJECT OVERVIEW

FitVector Pro is an **AI-powered job search and recruitment platform** with a dual-sided marketplace:
- **Job Seekers** - Find jobs, get AI match scores, tailor resumes, track applications, community features
- **Employers** - Post jobs, manage pipelines, conduct AI interviews, assessments, scheduling
- **Superadmin** - Platform-wide management dashboard

---

## 2. ARCHITECTURE

### Monorepo Structure (Turborepo + pnpm)

```
fitvector/
  apps/web/           # Next.js 14 (App Router) - main web application
  packages/shared/    # Shared types, constants, utils
  services/ai-engine/ # Python FastAPI microservice for AI/ML workloads
  supabase/           # Database migrations (4 migration files)
  prompt/             # AI prompt templates
```

### Tech Stack

| Layer           | Technology                                        |
|-----------------|---------------------------------------------------|
| Frontend        | Next.js 14 (App Router), React 18, TypeScript     |
| Styling         | Tailwind CSS, Radix UI primitives, CVA             |
| State/Data      | TanStack React Query, React Hook Form, Zod         |
| Auth            | NextAuth v5 (beta) - Google, LinkedIn, Credentials |
| Database        | Supabase (PostgreSQL 15+), pgvector, pg_trgm       |
| AI Engine       | FastAPI (Python) microservice                       |
| Charts          | Recharts                                           |
| DnD             | @hello-pangea/dnd (Kanban board)                   |
| PDF             | react-pdf                                          |
| Build           | Turborepo, pnpm 9.4.0                             |
| Testing         | Vitest (unit), Playwright (e2e)                    |
| Node            | >= 20.0.0                                          |

---

## 3. DATABASE SCHEMA

**4 Migrations** across 4 phases:

### Phase 1 - Core Tables (2026-03-22)
| Table              | Purpose                           |
|--------------------|-----------------------------------|
| users              | Auth, profiles, plans             |
| user_profiles      | Extended seeker profile data      |
| jobs               | Scraped job listings              |
| job_matches        | AI match scores per user+job      |
| tailored_resumes   | AI-tailored resume versions       |
| generated_outreach | Cold emails, LinkedIn msgs        |
| applications       | Seeker application tracking       |
| usage_logs         | API usage metering                |
| recruiter_emails   | Found recruiter contacts          |
| notification_log   | In-app notifications              |

### Phase 2 - Employer/Hiring (2026-03-27)
| Table                    | Purpose                              |
|--------------------------|--------------------------------------|
| companies                | Employer company profiles            |
| company_members          | Multi-role team (admin/recruiter/HM) |
| job_posts                | Employer-created job listings        |
| applicants               | Candidates per job post              |
| ai_interviews            | AI-conducted interview sessions      |
| assessments              | Skill assessment templates           |
| assessment_submissions   | Candidate assessment results         |
| human_interviews         | Scheduled human interviews           |
| candidate_notes          | Recruiter notes on candidates        |
| candidate_votes          | Team voting on candidates            |
| employer_usage           | Employer API usage tracking          |

### Phase 3 - Marketplace & Community (2026-03-27)
| Table                | Purpose                             |
|----------------------|-------------------------------------|
| fitvector_applications | FitVector direct applications     |
| promoted_listings    | Paid employer listing boosts        |
| application_boosts   | Candidate boost purchases           |
| boost_credits        | Credit balance system               |
| community_posts      | Discussion forum posts              |
| community_comments   | Post comments                       |
| community_votes      | Upvote/downvote system              |
| user_reputation      | Community reputation scoring        |
| verified_profiles    | Identity verification records       |
| salary_reports       | Anonymous salary submissions        |

### Phase 4 - Role Enum + Extras (2026-03-30)
| Table               | Purpose                              |
|---------------------|--------------------------------------|
| interview_panels    | Recruiter interview panel templates  |
| talent_pool_cache   | Vector search result caching         |
| + resumes bucket    | Private storage for resume files     |
| + role column       | Replaced user_type[] with single role|

**Key Enums:** auth_provider, plan_tier, user_status, job_source, job_type, work_mode, application_status, outreach_type, experience_level, match_bucket, decision_label

---

## 4. AUTHENTICATION SYSTEM

- **NextAuth v5 (beta)** with JWT strategy (30-day sessions)
- **3 Providers:** Google OAuth, LinkedIn OAuth, Email/Password (bcrypt, cost 10)
- **3 Roles:** `seeker`, `employer`, `superadmin`
- **1 email = 1 role** (enforced at DB level)
- OAuth sign-in creates seeker-only accounts; employers blocked from OAuth
- Role-based middleware redirects: seekers to `/dashboard`, employers to `/employer`, superadmins to `/admin`
- Company membership tracked via `company_members` table (companyId in JWT)

---

## 5. ROUTE STRUCTURE

### Route Groups (5 layout groups)

| Group          | Path Prefix   | Role      | Pages |
|----------------|---------------|-----------|-------|
| (auth)         | /login, /signup | Public  | 3     |
| (dashboard)    | /dashboard/*  | Seeker    | 14    |
| (employer)     | /employer/*   | Employer  | 15    |
| (admin)        | /admin/*      | Superadmin| 4     |
| (assessment)   | /assessments  | Public    | 1     |
| Root           | /, /onboarding, /interview | Mixed | 3 |

### Seeker Dashboard Pages (14)
- Dashboard home, Jobs listing, Job detail
- Resume listing, Resume detail
- Tracker (Kanban board), Tests
- Analytics, Outreach
- Community (discussions, interviews, salaries)
- Settings (general, notifications, plan, verification)

### Employer Dashboard Pages (15)
- Employer home, Onboarding
- Jobs (list, create, pipeline)
- Interviews (list, detail, compare, panels)
- Assessments (list, create, results)
- Candidates, Talent Pool, Team, Scheduling
- Analytics, Branding, Promotions, Settings

### Admin Dashboard Pages (4)
- Admin home (stats overview)
- Users management
- Jobs management
- Companies management

### API Routes (83 total)
Key domains: auth, ai, jobs, tracker, employer/*, admin/*, community, user/*, applications, interviews, assessments, salary, outreach, scheduling, health

---

## 6. AI ENGINE (Python FastAPI)

### Routers
| Router          | Capabilities                                     |
|-----------------|--------------------------------------------------|
| health          | Health check endpoint                            |
| scraper         | Job scraping from multiple sources               |
| resume          | Parse and tailor resumes                         |
| outreach        | Generate cold emails, LinkedIn messages          |
| scoring         | Job match scoring (batch processing)             |
| email_finder    | Find recruiter email addresses                   |

### Services
| Service              | Purpose                                     |
|----------------------|---------------------------------------------|
| ai_service.py        | Core AI/LLM integration (496 lines)         |
| deterministic_scorer | Rule-based scoring engine (325 lines)       |
| embedding_service    | Vector embeddings for semantic search (340 lines) |
| scraper_service      | Multi-source job scraper (401 lines)         |
| pdf_service          | PDF parsing/generation                       |
| skills_analytics     | Skills gap analysis                          |

**Security:** Service-level auth middleware, CORS enabled.

---

## 7. COMPONENTS INVENTORY (63 .tsx files)

### By Domain
| Domain    | Components | Key Components                                   |
|-----------|------------|--------------------------------------------------|
| UI        | 13         | Button, Card, Badge, Input, Tabs, Sheet, etc.    |
| Auth      | 4          | Login, Signup, Employer Signup, Social buttons    |
| Jobs      | 10         | JobCard, JobDetail, Filters, FitVector Apply Modal|
| Resume    | 7          | Editor, PDFViewer, DiffView, Tailor, Templates   |
| Tracker   | 6          | KanbanBoard, KanbanColumn, ApplicationCard, etc. |
| Employer  | 5          | Navbar, Sidebar, MobileNav, Pipeline components  |
| Layout    | 5          | Navbar, Sidebar, Footer, MobileNav, Notifications|
| Onboarding| 5          | Wizard, StepResume, StepRoles, StepPreferences   |
| Outreach  | 2          | OutreachPreview, ReferralDialog                  |
| Shared    | 4          | EmptyState, LoadingSpinner, Providers, Upgrade   |

### Custom Hooks (20)
use-analytics, use-applicants, use-assessments, use-candidate-tests, use-community, use-dashboard-stats, use-employer, use-employer-jobs, use-fitvector-apply, use-interview-panels, use-interviews, use-jobs, use-notes-votes, use-notifications, use-resume, use-scheduling, use-talent-pool, use-tracker, use-usage, use-user

---

## 8. CODE QUALITY METRICS (from Code Review Graph)

| Metric     | Count  |
|------------|--------|
| Total Files| 253    |
| Functions  | 566    |
| Classes    | 41     |
| Total Edges| 6,839  |
| CALLS      | 5,102  |
| IMPORTS    | 1,101  |
| Languages  | JS, TS, TSX, Python |

### Large Files / Functions (Technical Debt Hotspots)
| File/Function                       | Lines | Issue                    |
|-------------------------------------|-------|--------------------------|
| CreateJobPage                       | 1,433 | Massive single component |
| EmployerOnboardingPage              | 707   | Needs decomposition      |
| CandidateDetail                     | 627   | Complex detail view      |
| community-data.ts (mock)            | 975   | Large mock data file     |
| employer.ts (types)                 | 796   | Many interfaces          |
| PipelinePage                        | 513   | Large pipeline component |
| TakeAssessmentPage                  | 489   | Assessment logic + UI    |
| ai_service.py                       | 496   | Core AI service          |
| scraper_service.py                  | 401   | Multi-source scraper     |

**50 files/functions exceed 80 lines** - significant decomposition opportunity.

---

## 9. MOCK DATA vs REAL API STATUS

### Pages Still Using Mock Data (13 pages)
These pages import from `lib/mock/*` instead of fetching from API:

1. `employer/analytics/page.tsx` - Uses mock analytics data
2. `employer/branding/page.tsx` - Uses mock branding data
3. `employer/jobs/create/page.tsx` - Mock for preview
4. `employer/onboarding/page.tsx` - Mock employer data
5. `employer/page.tsx` - Mock employer dashboard data
6. `employer/promotions/page.tsx` - Mock promotions data
7. `dashboard/community/discussions/page.tsx` - Mock community data
8. `dashboard/community/interviews/page.tsx` - Mock interview data
9. `dashboard/community/page.tsx` - Mock community data
10. `dashboard/community/salaries/page.tsx` - Mock salary data
11. `dashboard/settings/verification/page.tsx` - Mock verification data
12. `assessments/take/[id]/page.tsx` - Mock assessment data
13. `employer/applicants/[id]/screen/route.ts` - Mock screening (API)

### Mock Data Files (8 files in lib/mock/)
analytics-data.ts, assessment-data.ts, branding-data.ts, community-data.ts, employer-data.ts, interview-data.ts, scheduling-data.ts, seeker-marketplace-data.ts

### Pages with Real API Integration
All other pages use hooks (TanStack Query) -> API routes -> Supabase.
Key real integrations: Jobs search, Resume management, Tracker, Auth, Admin dashboard, Employer jobs/applicants/interviews/assessments/scheduling/talent-pool, Notifications, User profile/onboarding.

---

## 10. UNCOMMITTED CHANGES (Current Working State)

| Status | File                                      |
|--------|-------------------------------------------|
| M      | apps/web/package.json                     |
| M      | apps/web/src/app/(admin)/admin/* (4 files)|
| M      | apps/web/src/app/(admin)/layout.tsx       |
| M      | apps/web/src/app/api/admin/jobs/route.ts  |
| M      | apps/web/src/components/tracker/* (3 files)|
| M      | pnpm-lock.yaml                            |

Focus: Admin dashboard improvements (responsive sidebar/drawer) and tracker component updates.

---

## 11. DEVELOPMENT PROGRESS (47 Commits)

### Phase 1 - Core Platform (Commits 1-20)
- Project scaffolding, Next.js App Router setup
- Auth system (NextAuth v5 + Supabase)
- Job search with AI scoring
- Resume parsing and AI tailoring
- Onboarding wizard
- Dashboard UI components

### Phase 2 - Employer Side (Commits 21-35)
- Employer dashboard and sidebar layout
- Job post CRUD management
- Applicant management with AI screening
- Interview system (AI + human)
- Assessment creation and grading
- Talent pool with search
- Team management
- Analytics dashboards
- Community features (discussions, salary insights)

### Phase 3 - Integration & Polish (Commits 36-47)
- FitVector application tracking (Kanban board)
- Notification system (API + hooks)
- Batch job match scoring
- Resume parsing improvements
- Interview panels API
- Seed script for DB initialization
- Admin dashboard (users, jobs, companies management)
- Responsive admin sidebar/drawer
- Dependency updates

---

## 12. KEY ARCHITECTURAL DECISIONS

1. **Single users table** with role column (not separate seeker/employer tables)
2. **bcrypt(10)** for password hashing
3. **1 email = 1 role** (enforced at DB level)
4. **Separate `jobs` vs `job_posts`** - scraped listings vs employer-created
5. **JWT sessions** (30-day expiry, role + companyId embedded)
6. **Python microservice** for AI/ML workloads (not in Next.js API routes)
7. **Service auth middleware** between Next.js and Python service
8. **pgvector** for embeddings, **pg_trgm** for fuzzy search
9. **TanStack Query** for all client-side data fetching via custom hooks
10. **Row Level Security** enabled on all employer/company tables

---

## 13. WHAT NEEDS TO BE DONE (Gaps & TODOs)

### High Priority
- [ ] **Replace 13 mock-data pages** with real API integrations (community, employer analytics, branding, promotions, verification, assessments)
- [ ] **Decompose large components** - CreateJobPage (1,433 lines), EmployerOnboardingPage (707 lines), CandidateDetail (627 lines)
- [ ] **Add tests** - No visible test files; Vitest and Playwright configured but unused
- [ ] **Payment/billing integration** - plan_tier and boost_credits tables exist but no payment provider
- [ ] **Email service** - Notification log exists but no email sending implementation

### Medium Priority
- [ ] Real-time features (WebSocket/SSE for notifications, interview updates)
- [ ] File upload flow for resumes (Supabase storage bucket created, UI exists)
- [ ] PWA configuration (next-pwa dependency installed)
- [ ] Rate limiting on API routes
- [ ] Error boundaries and error pages
- [ ] Loading states consistency

### Low Priority
- [ ] SEO optimization (meta tags, sitemap)
- [ ] i18n support
- [ ] Dark mode
- [ ] Accessibility audit
- [ ] Performance optimization (code splitting, lazy loading large pages)
- [ ] CI/CD pipeline
- [ ] Docker configuration (none exists)
- [ ] Environment variable documentation (.env.example missing)

---

## 14. RISK AREAS

1. **SSL workaround in AI engine** - `ssl._create_unverified_context` is insecure for production
2. **CORS wildcard** in AI engine - `allow_origins=["*"]` should be restricted
3. **No rate limiting** on any API routes
4. **No input sanitization** beyond Zod validation on some routes
5. **Large component files** are maintenance hazards
6. **Mock data coupling** - 13 pages will break if mock files are removed without migration
7. **NextAuth v5 beta** - Using pre-release auth library in production
8. **No error boundaries** - Unhandled errors crash the entire page
