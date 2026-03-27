# FitVector Pro — What All Is Done (as of Commit #27)

This file is a complete reference of everything built so far. Use it to understand the current state before making changes.

---

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Frontend**: Next.js 14+ (App Router), TypeScript strict, Tailwind CSS + shadcn/ui
- **Backend**: Python FastAPI microservice (`services/ai-engine/`)
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini API (replaced OpenAI/Anthropic in commit #11)
- **Shared package**: `packages/shared/` (TypeScript types, plan limits)

---

## Project Structure

```
apps/web/          → Next.js frontend
services/ai-engine/ → Python FastAPI backend
packages/shared/    → Shared TypeScript types & constants
supabase/          → DB config & migrations
prompt/            → Build prompts (phase 1 & phase 2)
```

---

## Backend — FastAPI AI Engine (`services/ai-engine/`)

### Services (all implemented)
- `ai_service.py` — Gemini AI integration with retry logic and error handling
- `embedding_service.py` — Gemini embeddings for job matching
- `deterministic_scorer.py` — Explainable scoring (skills match, role alignment, experience alignment)
- `pdf_service.py` — On-demand PDF/LaTeX resume compilation (Tectonic TeX engine)
- `scraper_service.py` — Job scraping via JobSpy (runs as subprocess for stability)
- `skills_analytics.py` — Skills gap analysis and learning recommendations

### Routers (all implemented)
- `health.py` — Health check endpoint
- `scoring.py` — Job match scoring (blended: 70% embedding + 30% deterministic)
- `resume.py` — Resume parsing + tailoring (LaTeX support)
- `outreach.py` — Cold email, LinkedIn message, referral request generation
- `scraper.py` — Job search/scraping endpoints
- `email_finder.py` — Email finder for outreach

### Scoring System
- Blended score = (embedding_score × 0.7) + (deterministic_score × 0.3)
- Decision labels: "Apply Now" (70-100), "Prepare & Apply" (50-69), "Explore" (0-49)
- Components: required skills match (55%), optional skills match (15%), role alignment (15%), experience alignment (15%)

---

## Frontend — Next.js App (`apps/web/`)

### Authentication
- Auth.js v5 configured (Google + LinkedIn + credentials providers)
- Auth pages/flows set up under `(auth)` route group

### Onboarding Flow (Commit #5)
- `step-status.tsx` — Job search status
- `step-resume-upload.tsx` — Resume upload & parsing
- `step-roles.tsx` — Target role selection
- `step-preferences.tsx` — Job preferences (location, salary, etc.)
- `wizard.tsx` — Multi-step wizard controller

### B2C Job Seeker Dashboard (`(dashboard)/dashboard/`)

#### Dashboard Home (`page.tsx`)
- Main dashboard overview page

#### Job Search & Management (`jobs/`)
- Job search with location filter
- Job cards with match score badges and decision labels (Apply Now / Prepare & Apply / Explore)
- Job detail panel with skills visualization (matched/missing skills)
- Gap analysis panel (API-integrated)
- FitVector apply modal
- Job filters (including filter by decision label)
- Source badges for job origins

#### Resume Management (`resume/`)
- Resume editor
- PDF viewer
- Resume tailoring dialog (LaTeX-based)
- Template picker
- Version list

#### Application Tracker (`tracker/`)
- Kanban board with drag-and-drop columns
- Application cards and detail modals
- FitVector status timeline
- Skills-to-learn insights

#### Outreach (`outreach/`)
- Outreach preview (cold emails, LinkedIn messages)
- Referral request dialog

#### Analytics (`analytics/`)
- Analytics dashboard page

#### Community/Marketplace (`community/`)
- **Interview Experiences** (`community/interviews/`) — Browse interview experiences
- **Discussion Forums** (`community/discussions/`) — Community discussions
- **Salary Insights** (`community/salaries/`) — Salary data and comparisons

#### Settings (`settings/`)
- User settings page

### B2B Employer Dashboard (`(employer)/employer/`)

#### Employer Home (`page.tsx`)
- Employer dashboard overview

#### Job Management (`jobs/`)
- Employer job management with CRUD actions and filtering

#### Candidates (`candidates/`)
- CandidateCard and CandidateDetail components
- Applicant management pipeline

#### Talent Pool (`talent-pool/`)
- Talent pool page with candidate management features

#### Assessments (`assessments/`)
- Assessment templates management
- Assessment statistics

#### Take Assessment (`(assessment)/assessments/take/`)
- Assessment taking flow for candidates

#### Team Management (`team/`)
- Team member roles and permissions
- Activity log

#### Interviews (`interviews/`)
- Interview scheduling and management

#### Scheduling (`scheduling/`)
- Calendar/scheduling features

#### Analytics (`analytics/`)
- Employer analytics dashboard

#### Branding (`branding/`)
- Company branding page

#### Promotions (`promotions/`)
- Job promotion features

#### Settings (`settings/`)
- Employer settings page

#### Onboarding (`onboarding/`)
- Employer onboarding flow

### Employer UI Components
- `sidebar.tsx` — Employer sidebar navigation
- `navbar.tsx` — Employer top navbar
- `mobile-nav.tsx` — Mobile navigation
- `pipeline/` — Candidate pipeline components

### Design System & Theme (Commit #16)
- Full FitVector design system implemented
- UI theme updated for B2C

---

## API Routes (`apps/web/src/app/api/`)

- `auth/` — Authentication endpoints
- `health/` — Health check
- `user/` — User profile management
- `usage/` — Usage tracking
- `jobs/search/` — Job search (proxies to AI engine)
- `jobs/[id]/` — Individual job details
- `jobs/gap-analysis/` — Skills gap analysis
- `ai/parse-resume/` — Resume parsing
- `ai/tailor-resume/` — Resume tailoring
- `ai/cold-email/` — Cold email generation
- `ai/linkedin-msg/` — LinkedIn message generation
- `ai/referral-msg/` — Referral request generation
- `outreach/` — Outreach endpoint
- `tracker/` — Application tracking

---

## TypeScript Types (`apps/web/src/types/`)

- `job.ts` — Job, JobMatch, JobSearch types
- `resume.ts` — Resume, ResumeVersion types
- `employer.ts` — Employer-specific types
- `marketplace.ts` — Marketplace types
- `community.ts` — Interview experiences, discussion forums, salary insights types

---

## Mock Data (`apps/web/src/lib/mock/`)

- `analytics-data.ts`
- `assessment-data.ts`
- `branding-data.ts`
- `community-data.ts`
- `employer-data.ts`
- `interview-data.ts` — Detailed mock AI interview data
- `scheduling-data.ts`
- `seeker-marketplace-data.ts`

---

## What Is NOT Done Yet (Phase 2 — Planned)

The `prompt/phase 2/` folder contains prompts for upcoming work:
- `backend-wiring-prompts.md` — Wiring frontend to real backend APIs
- `db-migration-prompt.md` — Database migration for new tables/columns
- `design-style-prompt.md` — Design/style refinements
- `phase2-frontend-prompts.md` — Additional frontend features
- `phase1-things dependent on ai` — will be doing after getting api keys

### Key things still pending:
- Most employer pages use **mock data** — not wired to real backend APIs yet
- Community features (interviews, discussions, salaries) use **mock data**
- Database migrations for Phase 2 tables/columns not yet run
- Real-time features not implemented
- Payment/subscription integration not done
- PWA functionality not fully configured
- Email notifications not implemented
- Employer assessment backend not built (frontend only)

---

## Commit History (Chronological)

| # | What was done |
|---|---|
| 1-3 | Project initialization, monorepo setup, packages |
| 4 | TypeScript type refinements |
| 5 | Onboarding wizard (4 steps) |
| 6 | AI engine services (job matching, skills analytics) |
| 7 | Resume tailoring with LaTeX support |
| 8 | Outreach generation (cold email, LinkedIn, referral) |
| 9 | Supabase integration |
| 10 | Dashboard pages (analytics, job search, outreach, resume, settings) |
| 11 | Switched from OpenAI/Anthropic to Gemini API |
| 12 | On-demand PDF compilation for tailored resumes |
| 13 | Job scraping via JobSpy subprocess |
| 14 | Gap analysis feature + location filter |
| 15 | Design system, employer/marketplace frontend prompts, auth token handling |
| 16 | UI theme update for FitVector B2C |
| 17 | Employer dashboard layout and components |
| 18 | Employer job management (CRUD + filtering) |
| 19 | CandidateCard and CandidateDetail components |
| 20 | Layout/styling refactor for employer responsiveness |
| 21 | Detailed mock AI interview data |
| 22 | Assessments page with templates and stats |
| 23 | Team management page (roles + activity log) |
| 24 | Talent pool page with candidate management |
| 25 | Application features and UI components |
| 26 | Types for interview experiences, discussions, salary insights |
| 27 | Candidates, promotions, and settings pages for employer |
