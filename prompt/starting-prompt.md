# Prompt 1 — Project Initialization

> Copy everything below this line and paste it as your first message in a new Claude chat. Attach `project-structure.md` and `system-design.md` from your docs folder.

---

I'm building FitVector — an AI-powered job search platform. I have complete documentation in my docs folder. I'm attaching the project structure and system design docs for context.

**Your role:** You are the lead full-stack engineer building this project. Follow the docs exactly. Don't deviate from the architecture, naming conventions, or tech stack unless there's a clear technical reason (and explain it before changing).

**Task: Initialize the monorepo project from scratch.**

Set up the following:

1. **Monorepo with pnpm workspaces + Turborepo**
   - Root `package.json` with workspace config
   - `pnpm-workspace.yaml`
   - `turbo.json` with build/dev/lint/test pipelines

2. **Next.js app (`apps/web/`)**
   - Next.js 14+ with App Router
   - TypeScript strict mode
   - Tailwind CSS + shadcn/ui (init with default config)
   - Auth.js v5 skeleton (Google + LinkedIn + credentials providers — just the config, no UI yet)
   - next-pwa basic config
   - Path alias `@/` pointing to `src/`
   - ESLint + Prettier config

3. **Python FastAPI microservice (`services/ai-engine/`)**
   - `pyproject.toml` with all dependencies from the spec
   - FastAPI app entry point (`src/main.py`) with CORS, health endpoint, service-to-service auth middleware
   - Dockerfile (with Tectonic TeX engine installation)
   - Router stubs for all endpoints (empty functions with correct route paths and Pydantic models)

4. **Shared package (`packages/shared/`)**
   - TypeScript package with plan limits constants
   - Shared types (User, Job, Application, etc.)

5. **Supabase setup (`supabase/`)**
   - `config.toml`
   - Initial migration file with all Phase 1 tables from the database schema doc

6. **Root files**
   - `.env.example` with all environment variables
   - `.gitignore` (Node, Python, env files, .next, __pycache__, etc.)
   - `README.md` with setup instructions

Create all files with real code — not placeholder comments. Every file should be functional. The project should start successfully with `pnpm dev` after setup.

---

# Prompt 2 — Auth + Landing Page

> Use this as your second prompt in the same chat or a new one. Attach `project-structure.md` and `api-contracts.md`.

---

Continuing FitVector build. Now implement authentication and the landing page.

**Task 1: Auth system**
- Auth.js v5 fully configured with Google OAuth, LinkedIn OAuth, and email/password
- Supabase adapter for Auth.js (stores sessions in our PostgreSQL)
- Auth middleware in `middleware.ts`: protect all `/dashboard/*` routes, allow public routes (`/`, `/login`, `/signup`, `/pricing`)
- Login page at `/login` with Google/LinkedIn social buttons + email/password form
- Signup page at `/signup` with same providers + name field
- Post-auth redirect: new users → `/onboarding`, returning users → `/dashboard`
- Session hook: `useUser()` that returns current user + plan tier

**Task 2: Landing page**
- Marketing landing page at `/` with:
  - Hero section: headline, subtitle, CTA button "Get Started Free"
  - Feature grid: 4 features (Job Search, Resume Tailor, Cold Email, Application Tracker) with icons and short descriptions
  - How it works: 3-step visual (Search → Tailor → Apply)
  - Pricing section: 4-tier comparison table (from the PRD)
  - Footer with links
- Responsive: mobile-first design
- Use shadcn/ui components (Button, Card, Badge)

All code should follow the naming conventions and folder structure from the project-structure doc.

---

# Prompt 3 — Onboarding + Resume Upload

> Attach `project-structure.md`, `api-contracts.md`, and `database-schema.md`.

---

Continuing FitVector build. Now implement the onboarding wizard and resume upload.

**Task 1: Onboarding wizard**
- Multi-step wizard at `/onboarding` (4 steps with progress indicator)
- Step 1: Current status (student/working/unemployed), current role, current company
- Step 2: Target roles (multi-input with autocomplete), experience level dropdown
- Step 3: Target locations (multi-select with search), work mode, salary range (optional)
- Step 4: Resume upload
- Back button preserves data, skip button available on optional steps
- On completion: POST to `/api/user/onboarding` → creates `user_profiles` record → redirects to `/dashboard`
- Use React Hook Form + Zod for validation
- Smooth step transitions (not jarring page reloads)

**Task 2: Resume upload and parsing**
- File upload component accepting PDF/DOCX (max 5MB)
- Upload to Supabase Storage (`resumes-raw` bucket)
- Call `/api/ai/parse-resume` which proxies to Python service
- Show loading state: "Analyzing your resume..." with progress animation
- On success: display parsed data in editable form (summary, experience list, education list, skills tags)
- User can edit any field, add/remove skills
- Save button stores everything to `user_profiles.parsed_resume_json`
- Error handling: if parsing fails, show retry button

**Task 3: Dashboard shell**
- Dashboard layout at `/(dashboard)/layout.tsx`
- Sidebar navigation: Dashboard, Jobs, Resume, Outreach, Tracker, Analytics, Settings
- Top bar with: user avatar, notification bell, plan badge
- Mobile: sidebar collapses into hamburger menu
- Active nav item highlighted

Follow the API contracts exactly for request/response shapes.

---

# Prompt 4 — Job Search

> Attach `project-structure.md`, `api-contracts.md`, and `scoring-engine-spec.md`.

---

Continuing FitVector build. Now implement the job search and matching engine.

**Task 1: Python scraping service**
- Implement `scraper_service.py` using JobSpy library
- Support all 5 sources: Indeed, LinkedIn, Google Jobs, Naukri, Glassdoor
- Proxy rotation via config
- Job deduplication using fingerprint hash (title + company + location)
- Cache results in PostgreSQL with 24h TTL
- Rate limiting: max 1 request per 3 seconds per source
- Fallback chain: if a source fails, continue with remaining sources
- Endpoint: POST `/scrape/jobs`

**Task 2: Embedding and scoring service**
- Implement `embedding_service.py`
- Generate embeddings using OpenAI text-embedding-3-small
- Build user text and job text representations (exact functions from scoring-engine-spec.md)
- Store embeddings in pgvector columns
- Cosine similarity scoring with calibration function (exact thresholds from spec)
- Score to bucket mapping

**Task 3: Job search frontend**
- Job search page at `/dashboard/jobs`
- Search bar pre-filled with user's target role
- Filter panel: location, work mode, job type, date posted, salary range
- Results as scrollable card list with job cards showing: title, company, location, posted date, source badges, match score badge
- Infinite scroll pagination
- Job detail page at `/dashboard/jobs/[id]` with full description, company info, skills match visualization, action bar
- Loading states, empty states, error states
- Usage counter for free users: "X of 3 searches used today"

---

# Prompt 5 — Resume Tailoring

> Attach `project-structure.md` and `api-contracts.md`.

---

Continuing FitVector build. Now implement AI resume tailoring.

**Task 1: Python AI tailoring service**
- Implement the resume tailoring pipeline in `ai_service.py`
- Takes user profile JSON + JD text → calls Claude API with the tailoring system prompt
- Output: LaTeX source code
- Compile LaTeX to PDF using Tectonic (subprocess call with 10s timeout)
- Fallback: if Tectonic fails, return LaTeX source only with error flag
- Upload generated PDF to Supabase Storage
- Store record in `tailored_resumes` table
- Endpoint: POST `/ai/tailor-resume`

**Task 2: Resume tailoring frontend**
- "Tailor Resume" button on job detail page
- Click → loading state "Tailoring your resume..." (10-15 seconds expected)
- On completion: split view — left: editable sections, right: PDF preview
- PDF viewer using react-pdf (zoomable, scrollable)
- Template picker (only 1 template for Phase 1A, but build the UI for multiple)
- "Download PDF" and "Download LaTeX" buttons
- Auto-generated version name: "{Company}_{Role}_{MonthYear}"
- Resume history page at `/dashboard/resume` listing all versions
- Usage limit enforcement for free tier (2/month)

---

# Prompt 6 — Outreach + Tracker

> Attach `project-structure.md` and `api-contracts.md`.

---

Continuing FitVector build. Now implement cold email generation, LinkedIn messages, and the application tracker.

**Task 1: Outreach generation (Python)**
- Implement cold email, LinkedIn InMail, and referral request generation in `ai_service.py`
- Each has its own system prompt tailored to the outreach type
- Cold email returns: subject (+ 2 alternatives), body (150-200 words)
- LinkedIn InMail returns: body (under 300 chars)
- Referral request takes connection name + relationship context → returns warm message
- Endpoints: POST `/ai/cold-email`, POST `/ai/linkedin-message`

**Task 2: Outreach frontend**
- "Cold Email" button on job detail → generates → shows preview with subject options + body
- Copy to clipboard buttons (subject, body separately) with visual confirmation toast
- "Open in Gmail" / "Open in Outlook" mailto: links
- "LinkedIn Message" button → generates → shows message with copy button
- "Request Referral" → modal asking for connection name + relationship → generates → copy button
- All generated outreach stored and viewable at `/dashboard/outreach`

**Task 3: Application tracker**
- Kanban board at `/dashboard/tracker`
- 6 columns: Saved, Applied, Screening, Interview, Offer, Rejected
- Drag and drop between columns (react-beautiful-dnd)
- Click card → detail modal with all fields: notes, linked resume, linked outreach, interview rounds, follow-up date
- "Add manually" button with minimal form (job title + company required)
- Auto-creation: when user clicks external "Apply" link or generates outreach, auto-create tracker entry
- Search and filter by company name
- Status counts shown per column header
- Free tier limit: max 10 active applications (show upgrade prompt)

---

# How to Use These Prompts

**Workflow:**
1. Open a new Claude chat
2. Paste Prompt 1
3. Attach the specified docs from your `docs/` folder
4. Let Claude generate all the code
5. Copy the code to your project, verify it runs
6. Open the same or new chat → Paste Prompt 2 → attach docs → continue
7. Repeat for Prompts 3-6

**Tips:**
- Always attach `project-structure.md` — it gives Claude the full folder context
- If Claude's response gets cut off, say "continue from where you stopped"
- If a file has errors, paste the error message and say "fix this error in [filename]"
- After each prompt, run the project locally and verify before moving to the next prompt
- If you need to modify something Claude built, explain what you want changed and attach the relevant spec doc

**After Phase 1A is complete (Prompts 1-6), you'll have:**
- Working auth with Google/LinkedIn/email
- Onboarding wizard with resume upload and AI parsing
- Job search across 5 boards with match scoring
- AI resume tailoring with in-app PDF preview
- Cold email and LinkedIn message generation
- Kanban application tracker
- Free tier with usage limits

**Phase 1B and 1C prompts** (payments, alerts, Chrome extension, analytics) can be created after 1A is working. Focus on getting the core product live first.
