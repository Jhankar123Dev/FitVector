# FitVector Pro — What All Is Done (as of Commit #37)

This file is a complete reference of everything built so far. Use it to understand the current state before making changes.

---

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 14+ (App Router), TypeScript strict, Tailwind CSS + shadcn/ui
- **Backend**: Python FastAPI microservice (`services/ai-engine/`)
- **Database**: Supabase (PostgreSQL) with RLS policies, triggers, and stored functions
- **AI**: Gemini API (replaced OpenAI/Anthropic in commit #11)
- **Auth**: Auth.js v5 (Google + LinkedIn + credentials providers)
- **Shared package**: `packages/shared/` (TypeScript types, plan limits)

---

## Project Structure

```
apps/web/              → Next.js frontend (App Router)
services/ai-engine/    → Python FastAPI AI backend
packages/shared/       → Shared TypeScript types & constants
supabase/              → DB config, migrations, seed data
docs/                  → Project documentation
prompt/                → Build prompts (phase 1 & 2)
```

---

## Database — Supabase (`supabase/`)

### Migrations

| File | What It Creates |
|------|----------------|
| `20260322000001_initial_schema.sql` | Core tables: users, job_posts, applications, resume_versions, outreach_messages, usage_logs; pgvector extension; embedding indexes; RLS policies |
| `20260324_swap_embeddings_384.sql` | Swaps embedding dimensions to 384 (Gemini embeddings) |
| `20260327000001_phase2_phase3_tables.sql` | 21 new tables: companies, company_members, assessments, assessment_questions, assessment_submissions, ai_interview_sessions, ai_interview_questions, human_interview_slots, human_interview_bookings, scheduling_events, scheduling_feedback, talent_pool_entries, community_posts, community_votes, salary_reports, fitvector_applications, user_verifications, notification_preferences, job_promotions; triggers; `get_salary_aggregation()` RPC function |

### Seed Files

- `seed.sql` — Phase 1 seed data (demo users, job posts, applications, resume versions)
- `seed_phase2_phase3.sql` — Phase 2/3 seed data (companies, assessments, interview sessions, community posts, salary reports, talent pool entries)

### RLS & Security
- Row Level Security enabled on all user-facing tables
- Policies: users read/write only their own rows; employers scoped to their company; public read for community posts
- Admin client (`src/lib/supabase/admin.ts`) used only in server-side API routes for bypass operations

---

## Shared Package (`packages/shared/src/types/`)

All cross-app TypeScript types live here:

| File | What It Defines |
|------|----------------|
| `api.ts` | Generic API response wrappers, pagination types |
| `applicant.ts` | Applicant pipeline stages, applicant detail, notes, votes |
| `assessment.ts` | Assessment templates, questions, submissions, grading |
| `ai-interview.ts` | AI interview sessions, questions, answers, scores |
| `human-interview.ts` | Human interview slots, bookings, scheduling |
| `community.ts` | Community posts, votes, discussion threads, interview experiences |
| `company.ts` | Company profile, team members, roles, permissions |
| `job-post.ts` | Job post CRUD types, status, promotion |
| `marketplace.ts` | Marketplace listing types |
| `verified-profile.ts` | User verification badges and status |
| `index.ts` | Re-exports everything |

---

## Backend — FastAPI AI Engine (`services/ai-engine/`)

### Services
- `ai_service.py` — Gemini AI integration with retry logic and error handling
- `embedding_service.py` — Gemini text-embedding-004 (384 dimensions) for job matching
- `deterministic_scorer.py` — Explainable scoring: required skills (55%), optional skills (15%), role alignment (15%), experience alignment (15%)
- `pdf_service.py` — On-demand PDF/LaTeX resume compilation via Tectonic TeX engine
- `scraper_service.py` — Job scraping via JobSpy (runs as subprocess for SSL stability)
- `skills_analytics.py` — Skills gap analysis and learning recommendations

### Routers
- `health.py` — Health check endpoint
- `scoring.py` — Job match scoring: blended = (embedding × 0.7) + (deterministic × 0.3); labels: "Apply Now" (70–100), "Prepare & Apply" (50–69), "Explore" (0–49)
- `resume.py` — Resume parsing + LaTeX tailoring
- `outreach.py` — Cold email, LinkedIn message, referral request generation
- `scraper.py` — Job search/scraping endpoints
- `email_finder.py` — Email finder for outreach

### Utils
- `jobspy_runner.py` — Standalone JobSpy subprocess runner (SSL verification disabled)
- `proxy.py` — Proxy support utilities
- `rate_limiter.py` — Per-user rate limiting middleware
- `text.py` — Text processing helpers

---

## Frontend — Next.js App (`apps/web/`)

### Authentication & Middleware
- Auth.js v5 with Google, LinkedIn, and credentials providers
- `src/lib/auth.ts` — Auth config; UUID validation for OAuth provider sub IDs using `String(token.id)`
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server-side Supabase client (uses cookies)
- `src/lib/supabase/admin.ts` — Admin Supabase client (service role, server-only)
- Auth pages/flows under `(auth)` route group

### Onboarding Flow
- `step-status.tsx` — Job search status
- `step-resume-upload.tsx` — Resume upload & parsing
- `step-roles.tsx` — Target role selection
- `step-preferences.tsx` — Job preferences (location, salary, etc.)
- `wizard.tsx` — Multi-step wizard controller

---

## B2C Job Seeker Dashboard (`(dashboard)/dashboard/`)

### Dashboard Home (`page.tsx`)
- Overview page with quick stats

### Job Search & Management (`jobs/`)
- Job search with location filter
- Job cards with match score badges and decision labels
- Job detail panel with matched/missing skills visualization
- Gap analysis panel (wired to `/api/jobs/gap-analysis/`)
- FitVector one-click apply modal
- Job filters (by decision label, location, etc.)
- Source badges
- Individual job page (`jobs/[id]/page.tsx`)

### Resume Management (`resume/`)
- Resume editor with LaTeX source
- PDF viewer (compiled on-demand)
- Resume tailoring dialog
- Template picker (Modern available; Classic/Minimal/Custom planned)
- Version list
- Individual resume page (`resume/[id]/page.tsx`)

### Application Tracker (`tracker/`)
- Kanban board with drag-and-drop columns
- Application cards and detail modals
- FitVector status timeline
- Skills-to-learn insights
- Wired to `/api/tracker/` CRUD + `/api/tracker/analytics/`

### Outreach (`outreach/`)
- Cold email preview and generation
- LinkedIn message preview
- Referral request dialog
- Wired to `/api/outreach/` and `/api/ai/cold-email/`, `/api/ai/linkedin-msg/`, `/api/ai/referral-msg/`

### Analytics (`analytics/`)
- Total applications, this-week count, response rate, avg response time
- Application pipeline bar chart by status
- Wired to `/api/tracker?all=true`; returns `AnalyticsData | null`

### Community (`community/`)
- **Hub page** (`community/page.tsx`) — Links to the three sub-sections
- **Interview Experiences** (`community/interviews/`) — Browse + share interview experiences; upvote/downvote; wired to `/api/community/posts/` + `/api/community/vote/`
- **Discussion Forums** (`community/discussions/`) — Browse + create threads; wired to `/api/community/posts/`
- **Salary Insights** (`community/salaries/`) — View aggregated salary data; submit salary reports; wired to `/api/salary/insights/` + `/api/salary/report/`

### Settings (`settings/`)
- Main settings page (`settings/page.tsx`)
- Notification preferences (`settings/notifications/page.tsx`)
- Plan & usage (`settings/plan/page.tsx`)
- Identity verification (`settings/verification/page.tsx`)

---

## B2B Employer Dashboard (`(employer)/employer/`)

### Employer Home (`page.tsx`)
- Overview with key metrics

### Job Management (`jobs/`)
- Job list with CRUD, filtering, status toggle, duplication
- Create job page (`jobs/create/page.tsx`) — Full job post form
- Candidate pipeline page (`jobs/[id]/pipeline/page.tsx`) — Per-job applicant pipeline view
- Wired to `/api/employer/jobs/` (CRUD + `/status/`, `/duplicate/`, `/applicants/`, `/screen-all/`)

### Candidates (`candidates/`)
- Candidate list with search and filter
- CandidateCard + CandidateDetail components
- Stage management, notes, team votes, AI screening
- Wired to `/api/employer/applicants/` (full CRUD + `/stage/`, `/screen/`, `/notes/`, `/vote/`, `/reject/`, `/invite-interview/`, `/schedule/`)

### Talent Pool (`talent-pool/`)
- Saved candidate profiles not yet applied
- Tag management, re-engagement actions
- Wired to `/api/employer/talent-pool/` (+ `/tags/`, `/reengage/`)

### Assessments (`assessments/`)
- Assessment template list + stats (`assessments/page.tsx`)
- Create new assessment (`assessments/create/page.tsx`)
- View submission results (`assessments/[id]/results/page.tsx`)
- Wired to `/api/employer/assessments/` (CRUD + `/assign/`, `/results/`)
- Assessment taking flow for candidates under `(assessment)/assessments/take/[id]/`
- Candidate-facing token-based assessment API: `/api/assessment/[token]/` (GET, start, submit)
- Submission grading: `/api/employer/submissions/[id]/grade/` and `/api/employer/submissions/[id]/`

### Interviews (`interviews/`)
- Interview list page
- Interview detail page (`interviews/[id]/page.tsx`)
- Candidate comparison page (`interviews/compare/page.tsx`)
- Wired to `/api/employer/interviews/` (list, detail, compare)
- Candidate-facing token-based AI interview: `/api/interview/[token]/` (GET, start, complete)

### Scheduling (`scheduling/`)
- Calendar/scheduling view for all interview slots
- Wired to `/api/employer/scheduling/` (CRUD + `/[id]/feedback/`)

### Analytics (`analytics/`)
- Employer analytics dashboard with pipeline funnel, conversion rates, source attribution
- Wired to `/api/employer/analytics/` + `/funnel/` + `/sources/`

### Team Management (`team/`)
- Team member list with roles and permissions
- Activity log
- Wired to `/api/employer/company/members/` (list + `/[id]/`)

### Company Profile (`company/`)
- Managed via `/api/employer/company/` (GET + PATCH)

### Branding (`branding/`)
- Company branding page (logo, colors, description)

### Promotions (`promotions/`)
- Job promotion features

### Onboarding (`onboarding/`)
- Employer onboarding flow

### Settings (`settings/`)
- Employer settings page

---

## API Routes — Full List (`apps/web/src/app/api/`)

**73 route files total:**

| Group | Routes |
|-------|--------|
| `auth/` | `[...nextauth]/`, `signup/` |
| `health/` | health check |
| `user/` | `profile/`, `onboarding/`, `resumes/`, `resumes/[id]/`, `resumes/[id]/pdf/` |
| `usage/` | usage tracking |
| `jobs/` | `search/`, `[id]/`, `gap-analysis/` |
| `ai/` | `parse-resume/`, `tailor-resume/`, `cold-email/`, `linkedin-msg/`, `referral-msg/` |
| `outreach/` | outreach endpoint |
| `tracker/` | CRUD `tracker/`, `[id]/`, `analytics/` |
| `applications/` | `fitvector/`, `fitvector/[id]/status/` |
| `apply/` | `fitvector/[jobPostId]/` |
| `community/` | `posts/`, `posts/[id]/`, `posts/[id]/comments/`, `vote/` |
| `salary/` | `insights/`, `report/` |
| `interview/` | `[token]/`, `[token]/start/`, `[token]/complete/` |
| `assessment/` | `[token]/`, `[token]/start/`, `[token]/submit/` |
| `employer/analytics/` | root, `funnel/`, `sources/` |
| `employer/applicants/` | root, `[id]/`, `[id]/stage/`, `[id]/screen/`, `[id]/notes/`, `[id]/vote/`, `[id]/reject/`, `[id]/invite-interview/`, `[id]/schedule/` |
| `employer/assessments/` | root, `[id]/`, `[id]/assign/`, `[id]/results/` |
| `employer/company/` | root, `members/`, `members/[id]/` |
| `employer/interviews/` | root, `[id]/`, `compare/` |
| `employer/jobs/` | root, `[id]/`, `[id]/status/`, `[id]/duplicate/`, `[id]/applicants/`, `[id]/screen-all/` |
| `employer/scheduling/` | root, `[id]/`, `[id]/feedback/` |
| `employer/submissions/` | `[id]/`, `[id]/grade/` |
| `employer/talent-pool/` | root, `[id]/tags/`, `[id]/reengage/` |

---

## React Query Hooks (`apps/web/src/hooks/`)

**16 hooks total:**

| Hook | What It Manages |
|------|----------------|
| `use-user.ts` | User profile, onboarding status |
| `use-usage.ts` | Plan usage limits |
| `use-jobs.ts` | Job search, job detail, gap analysis |
| `use-resume.ts` | Resume versions, tailoring, PDF |
| `use-tracker.ts` | Application tracker CRUD |
| `use-analytics.ts` | Seeker analytics data |
| `use-community.ts` | Community posts, votes, salary insights, salary report submit |
| `use-fitvector-apply.ts` | One-click FitVector apply + status tracking |
| `use-employer.ts` | Company profile, employer onboarding |
| `use-employer-jobs.ts` | Employer job CRUD, status, duplication |
| `use-applicants.ts` | Candidate pipeline, screening, stage changes |
| `use-notes-votes.ts` | Applicant notes and team votes |
| `use-assessments.ts` | Assessment CRUD, assignment, submissions, grading |
| `use-interviews.ts` | Interview sessions (AI + human), comparison |
| `use-scheduling.ts` | Scheduling events and feedback |
| `use-talent-pool.ts` | Talent pool management, tags, re-engagement |

---

## TypeScript Types (`apps/web/src/types/`)

- `job.ts` — Job, JobMatch, JobSearchResult, JobSearchParams
- `resume.ts` — TailorResumeParams, TailorResumeResult (with `compilationError?`), ResumeVersion, ResumeTemplate, RESUME_TEMPLATES
- `employer.ts` — Employer-specific UI types
- `marketplace.ts` — Marketplace listing types
- `community.ts` — InterviewExperience, DiscussionThread, SalaryInsight types

---

## Mock Data (`apps/web/src/lib/mock/`)

- `analytics-data.ts`
- `assessment-data.ts`
- `branding-data.ts`
- `community-data.ts`
- `employer-data.ts`
- `interview-data.ts` — Detailed mock AI interview data for frontend developer candidates
- `scheduling-data.ts`
- `seeker-marketplace-data.ts`

---

## What Is NOT Done Yet

### Pending / Deferred
- **Payment/subscription integration** — Plan page UI exists but no Stripe integration
- **Real-time features** — No WebSocket/realtime subscriptions yet
- **Email notifications** — No transactional email (e.g. Resend/SendGrid)
- **PWA** — Not fully configured
- **Community comments/replies** — No separate DB comments table; replies remain client-side for MVP
- **Employer branding & promotions** — Pages exist but backend wiring not complete
- **AI-dependent features** — Some features marked `phase1-things dependent on ai` need Gemini API keys in production
- **OAuth provider wiring** — Google/LinkedIn OAuth providers configured but may need production credentials

### Known Technical Debt
- Community pages (interviews, discussions, salaries) use a mix of real API calls and lingering mock data for some sub-features
- `services/ai-engine/` screening logic runs through Next.js API routes, not directly through FastAPI

---

## Commit History

| # | What Was Done |
|---|---|
| 1–3 | Project initialization, monorepo setup, shared packages |
| 4 | TypeScript type refinements (`InputProps` as type alias) |
| 5 | Onboarding wizard (4 steps) |
| 6 | AI engine services (job matching, skills analytics) |
| 7 | Resume tailoring with LaTeX support |
| 8 | Outreach generation (cold email, LinkedIn, referral) |
| 9 | Supabase integration |
| 10 | Dashboard pages (analytics, job details, job search, outreach, resume, settings) |
| 11 | Switched from OpenAI/Anthropic to Gemini API; embedding dimensions updated |
| 12 | On-demand PDF compilation for tailored resumes |
| 13 | Job scraping via JobSpy subprocess; SSL fix |
| 14 | Gap analysis feature + location filter; job detail improvements |
| 15 | Design system for FitVector B2C; auth token handling fix; AI retry logic; employer/marketplace frontend prompts |
| 16 | Full UI theme update for FitVector B2C |
| 17 | Employer dashboard layout, sidebar, navbar, mobile nav |
| 18 | Employer job management (CRUD + filtering) |
| 19 | CandidateCard and CandidateDetail components |
| 20 | Layout/styling refactor across employer components |
| 21 | Detailed mock AI interview data (frontend developer candidates) |
| 22 | Assessments page (templates + stats) |
| 23 | Team management page (roles + activity log) |
| 24 | Talent pool page with candidate management |
| 25 | FitVector one-click apply modal + application UI components |
| 26 | TypeScript types for interview experiences, discussions, salary insights |
| 27 | Candidates, promotions, and settings pages for employer |
| 28 | Phase 2/3 DB migration (21 tables, RLS, triggers, `get_salary_aggregation()` RPC); seed data loaded |
| 29 | Company profile + team member management APIs |
| 30 | Employer job post management APIs (create, update, duplicate, status, screen-all) |
| 31 | Applicant management APIs with AI screening integration |
| 32 | AI interview API (token-based candidate flow: start, answer, complete) |
| 33 | Assessment management APIs (CRUD, assign, submit, grade); `use-assessments` hook |
| 34 | Scheduling + feedback APIs; `use-scheduling` hook |
| 35 | Employer analytics + talent pool APIs; `use-analytics`, `use-talent-pool` hooks |
| 36 | FitVector one-click apply API + application status tracking; `use-fitvector-apply` hook |
| 37 | Fixed 14 TypeScript errors to zero: analytics `useQuery` typing, gap-analysis cast, `TailorResumeResult.compilationError`, auth `isUUID.test()` |
