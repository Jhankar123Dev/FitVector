# FitVector — Product Requirements Document
## Phase 1: Job Seeker Platform

**Version:** 1.0
**Date:** March 22, 2026
**Author:** FitVector Product Team
**Status:** Draft

---

## 1. Product overview

### 1.1 Vision
FitVector is an AI-powered hiring ecosystem that connects job seekers with opportunities and employers with talent. Phase 1 focuses exclusively on the job seeker side — an intelligent platform that aggregates jobs from across the internet, tailors resumes to specific JDs, generates personalized outreach (cold emails, LinkedIn messages, referral requests), and tracks every application in one place.

### 1.2 Problem statement
Job seekers today face a fragmented, exhausting process:
- They manually search 5-8 job boards daily (LinkedIn, Naukri, Indeed, Glassdoor, etc.)
- They send the same generic resume to every role, resulting in low callback rates
- They don't know how to write effective cold emails or referral requests
- They lose track of where they applied, what resume version they used, and follow-up deadlines
- Existing tools solve only one of these problems — no single platform connects the full pipeline from discovery to application to tracking

### 1.3 Solution
FitVector provides an end-to-end AI-powered job search command center:
1. **Discover** — Enter your target role, and FitVector aggregates matching jobs from LinkedIn, Naukri, Indeed, Glassdoor, and more
2. **Prepare** — One click to tailor your resume to any JD, with AI rewriting your experience in LaTeX-rendered PDF format
3. **Reach out** — Generate cold emails to recruiters (with auto-found email addresses), LinkedIn InMail messages, and referral request templates
4. **Track** — Kanban-style application tracker with status management, notes, reminders, and analytics

### 1.4 Target users
- Fresh graduates entering the job market (students, bootcamp grads)
- Working professionals seeking new opportunities (1-15+ years experience)
- Career switchers moving between industries/domains
- Geography: India-first launch, expanding globally
- All job domains: tech, business, design, marketing, finance, healthcare, etc.

---

## 2. Tech stack

### 2.1 Recommended stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router) | SSR, API routes, PWA support, single codebase for web + mobile |
| PWA | next-pwa package | Installable on Android/iOS, offline support, push notifications |
| Styling | Tailwind CSS + shadcn/ui | Fast development, consistent design system |
| Backend/API | Next.js API Routes + Python (FastAPI) microservice | Next.js handles auth/CRUD; Python handles AI/scraping workloads |
| Database | PostgreSQL (via Supabase or Neon) | Relational data, row-level security, free tier available |
| Auth | NextAuth.js (Auth.js v5) | Google, LinkedIn, email/password login |
| AI/LLM | Claude API (Anthropic) | Resume tailoring, email/message generation, JD analysis |
| Job Scraping | JobSpy (Python library) + Google Jobs API | Free, supports LinkedIn/Naukri/Indeed/Glassdoor/ZipRecruiter |
| Proxy Layer | Rotating residential proxies (SmartProxy/Bright Data lite) | ~$5-15/month, prevents rate limiting on scraping |
| LaTeX → PDF | latex.js (client-side) or Tectonic (server-side TeX engine) | Compiles LaTeX to PDF without Overleaf dependency |
| Email Finder | Hunter.io free tier + Apollo.io free tier + Snov.io | Blended approach, near-zero cost at low volume |
| File Storage | Supabase Storage or Cloudflare R2 | Resume PDFs, user uploads |
| Hosting | Vercel (Next.js) + Railway/Fly.io (Python microservice) | Free/cheap tiers, auto-scaling |
| Chrome Extension | Plasmo framework | React-based extension dev, shares components with main app |
| Analytics | PostHog (self-hosted or cloud free tier) | Product analytics, funnel tracking |
| Payments | Razorpay (India) + Stripe (global) | UPI/card support for India, global card processing |

### 2.2 Architecture overview

```
┌─────────────────────────────────────────────────┐
│                  Next.js (Vercel)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Frontend  │  │ API      │  │ Auth (NextAuth)│  │
│  │ (React)   │  │ Routes   │  │ Google/LinkedIn│  │
│  │ + PWA     │  │          │  │ Email/Password │  │
│  └──────────┘  └────┬─────┘  └───────────────┘  │
│                      │                            │
└──────────────────────┼────────────────────────────┘
                       │ REST/tRPC
┌──────────────────────┼────────────────────────────┐
│          Python Microservice (FastAPI)             │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ JobSpy   │  │ Claude   │  │ Email Finder    │  │
│  │ Scraper  │  │ AI Engine│  │ (Hunter/Apollo) │  │
│  │ + Proxies│  │          │  │                 │  │
│  └──────────┘  └──────────┘  └─────────────────┘  │
│  ┌──────────┐  ┌──────────┐                       │
│  │ LaTeX →  │  │ Job      │                       │
│  │ PDF      │  │ Matching │                       │
│  │ Compiler │  │ Algorithm│                       │
│  └──────────┘  └──────────┘                       │
└───────────────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │   PostgreSQL    │
              │   (Supabase)    │
              └─────────────────┘
```

---

## 3. Feature specifications

### 3.1 User onboarding

**Flow:**
1. User signs up via Google, LinkedIn, or email/password
2. Onboarding wizard collects:
   - Full name, current role/status (student, working, unemployed)
   - Target job title(s) — supports multiple (e.g., "Frontend Developer", "Full Stack Engineer")
   - Preferred locations (multiple cities/remote/hybrid)
   - Experience level (fresher, 1-3 yrs, 3-7 yrs, 7-15 yrs, 15+)
   - Expected salary range (optional)
   - Preferred industries/domains (optional)
3. User uploads their current resume (PDF/DOCX) — AI parses and extracts structured data (skills, experience, education, projects)
4. User lands on their personalized dashboard

**Resume parsing:**
- Use Claude API to extract structured JSON from uploaded resume
- Store parsed data: contact info, summary, work experience (company, role, duration, bullets), education, skills, projects, certifications
- User can review and edit parsed data before proceeding
- This parsed profile becomes the source material for all future resume tailoring

### 3.2 Job aggregation engine

**Core functionality:**
- User enters/selects their target role → system searches across multiple job boards simultaneously
- Results displayed in a unified feed with filters and sorting

**Data sources (via JobSpy + Google Jobs):**
- LinkedIn
- Naukri.com
- Indeed
- Glassdoor
- ZipRecruiter
- Google Jobs (aggregates many smaller boards)

**Search and filter parameters:**
- Job title / keywords
- Location (city, state, country, remote)
- Experience level
- Job type (full-time, part-time, internship, contract)
- Date posted (last 24h, last 3 days, last week, last month)
- Salary range (where available)
- Company size (startup, mid, enterprise)
- Easy apply available (yes/no)

**Job card displays:**
- Job title, company name, company logo
- Location + remote/hybrid/onsite badge
- Salary range (if available)
- Posted date (relative: "2 days ago")
- Match score (AI-calculated fit percentage based on user's profile vs JD)
- Source badge (LinkedIn, Naukri, Indeed, etc.)
- Quick action buttons: "Tailor Resume", "Generate Cold Email", "Save", "Apply"

**Job detail view:**
- Full job description
- Company info (size, industry, rating if available from Glassdoor)
- Required skills vs user's skills (visual match/gap analysis)
- Similar jobs section
- All action buttons (tailor resume, cold email, LinkedIn message, referral request, mark as applied)

**Background job matching:**
- Daily cron job runs JobSpy scraper for each user's saved preferences
- New matches pushed via email digest (daily/weekly, user configurable)
- In-app notification bell for new matches
- PWA push notifications for high-match jobs (90%+ match score)

**Technical implementation:**
- JobSpy runs on the Python microservice with rotating proxies
- Results cached in PostgreSQL with 24-hour TTL to reduce re-scraping
- Deduplication logic: same job from LinkedIn and Indeed → show once, with both source badges
- Match score algorithm: Claude API analyzes user profile JSON vs JD text, returns 0-100 score + reasoning

**Rate limiting & safety:**
- Max 3 scraping sessions per user per day on free plan
- Scrape during off-peak hours (2-6 AM IST) for batch jobs
- Implement exponential backoff on rate limit responses
- Rotate user agents and proxy IPs per request
- Cache aggressively — if 50 users search "React Developer in Bangalore", reuse the same cached results

### 3.3 AI resume tailoring

**Core functionality:**
- User clicks "Tailor Resume" on any job listing
- System sends user's parsed profile + full JD to Claude API
- Claude rewrites resume content to align with the JD's requirements
- Output rendered as a professional PDF in-app

**AI tailoring process:**
1. Extract key requirements from JD (must-have skills, nice-to-haves, responsibilities, qualifications)
2. Map user's experience to JD requirements
3. Rewrite bullet points to emphasize relevant experience using JD keywords
4. Adjust professional summary to target the specific role
5. Reorder skills section to prioritize JD-relevant skills
6. Generate output in LaTeX format

**Resume output:**
- LaTeX compiled to PDF server-side using Tectonic engine
- PDF rendered in-app using react-pdf or pdf.js viewer
- User can preview, zoom, scroll through the tailored resume
- Download options: PDF (primary), LaTeX source file (for users who want to edit in Overleaf)
- Multiple professional templates (3 templates at launch: clean modern, classic, minimal)

**Editing workflow:**
- After AI generates the tailored resume, user sees a split view: left = editable sections, right = live PDF preview
- User can accept/reject individual AI suggestions per bullet point
- User can manually edit any section
- "Regenerate" button to get a fresh AI pass on any section
- Save as a named version (e.g., "Google_SDE2_March2026")

**System prompt (pre-existing):**
- Use the already-developed system prompt for LaTeX output
- Ensure consistent formatting, ATS-friendly structure, and professional tone
- Prompt includes instructions for quantifying achievements, using action verbs, and matching JD language naturally (not keyword stuffing)

### 3.4 Cold email generator

**Core functionality:**
- User clicks "Cold Email" on any job listing
- System generates a personalized cold email (subject + body) targeting the recruiter/hiring manager

**Email generation inputs:**
- Job description (auto-populated from selected job)
- User's profile/resume data
- Recruiter/hiring manager name (auto-found or user-entered)
- Company name
- Tone preference: professional, conversational, confident

**Email output:**
- Subject line (2-3 options to choose from)
- Email body (concise, 150-200 words max)
- Personalized opening referencing something specific about the company/role
- Clear value proposition connecting user's experience to the role
- Soft call-to-action (meeting request, not demanding)
- Copy-to-clipboard button
- "Open in Gmail" / "Open in Outlook" deep link (pre-fills compose window)

**Recruiter email finder (Pro+ plans):**
- When user clicks "Find Recruiter Email" on a job listing
- System extracts company name + attempts to find recruiter/HR contact
- Blended lookup: Hunter.io API → Apollo.io API → Snov.io → pattern-based guessing (firstname.lastname@company.com)
- Display confidence score: "Verified" (found on Hunter), "Likely" (pattern match), "Unknown"
- Monthly limits based on plan tier

### 3.5 LinkedIn message generator

**Two types of messages:**

**A. LinkedIn InMail to recruiter/hiring manager:**
- Generates a concise InMail (under 300 characters for connection request, or full InMail for premium LinkedIn users)
- Personalized to the specific role and company
- Professional but human tone
- Copy-to-clipboard button

**B. Referral request to connections:**
- Generates a warm, non-pushy message asking a connection at the target company for a referral
- Adapts tone based on relationship strength (close connection vs acquaintance)
- Includes a brief pitch about why the user is a fit
- Copy-to-clipboard button

**Chrome extension integration (Pro+ plans):**
- Extension detects when user is on LinkedIn
- Floating FitVector button appears on LinkedIn job posts and profile pages
- Click → extension pulls JD from the page → generates tailored message
- One-click paste into LinkedIn message box
- Extension syncs with FitVector account via auth token (login required)
- Extension also supports: saving LinkedIn jobs to FitVector tracker, viewing match score overlay on LinkedIn job listings

### 3.6 Application tracker

**Core functionality:**
- Kanban board with customizable columns
- Default columns: Saved → Applied → Screening → Interview → Offer → Rejected

**Per-application card stores:**
- Job title, company, location
- Source (which job board)
- Date saved, date applied
- Resume version used (linked to the tailored resume)
- Outreach sent (which emails/messages were generated)
- Status (current column)
- Notes (free text)
- Next follow-up date (with reminder notification)
- Salary info (offered/expected)
- Contact person (recruiter name, email)
- Interview dates and stages

**Features:**
- Drag-and-drop between columns
- Bulk actions (archive, delete, move)
- Search and filter (by company, status, date range)
- Sort by date applied, company name, match score
- Timeline view (alternative to kanban — chronological list)
- Analytics dashboard:
  - Total applications this week/month
  - Response rate (applied → screening/interview)
  - Most active companies
  - Average time in each stage
  - Resume version performance (which version got more callbacks)

**Auto-tracking:**
- When user clicks "Apply" on an external job link, auto-create a tracker card in "Applied" column
- When user generates a cold email, auto-log it in the tracker card
- Daily digest email summarizing: X new matches, Y applications pending follow-up, Z interviews this week

---

## 4. Pricing structure

### 4.1 Tier design — 4 tiers

| Feature | Free | Starter (₹299/mo) | Pro (₹799/mo) | Elite (₹1,499/mo) |
|---------|------|-------------------|----------------|-------------------|
| Job searches per day | 3 | 10 | Unlimited | Unlimited |
| Job matches shown | 5 per search | 25 per search | All results | All results + priority |
| Resume tailoring | 2/month | 10/month | 50/month | Unlimited |
| Resume templates | 1 basic | 2 templates | All templates | All + custom templates |
| Cold email generation | 2/month | 15/month | 50/month | Unlimited |
| LinkedIn message gen | 2/month | 15/month | 50/month | Unlimited |
| Recruiter email finder | No | No | 20/month | 100/month |
| Application tracker | 10 active jobs | 50 active jobs | Unlimited | Unlimited |
| Tracker analytics | Basic | Basic | Full dashboard | Full + export |
| Daily job alerts | No | Email only | Email + push | Email + push + SMS |
| Chrome extension | No | No | Full access | Full access |
| Match score on jobs | No | Basic | AI-detailed | AI-detailed + gap analysis |
| Resume version history | Last 2 | Last 5 | Unlimited | Unlimited |
| Follow-up reminders | No | 3 active | Unlimited | Unlimited |
| Priority support | No | No | Email | Email + chat |
| Referral message gen | No | 5/month | 30/month | Unlimited |

### 4.2 Pricing notes
- Annual plans: 20% discount (₹239/mo, ₹639/mo, ₹1,199/mo)
- Student discount: 40% off Pro with valid student email (.edu/.ac.in)
- 7-day free trial of Pro for all new signups
- Razorpay for Indian payments (UPI, cards, wallets), Stripe for international
- All prices above are India pricing; international pricing in USD ($4.99, $12.99, $24.99/mo)

---

## 5. User flows

### 5.1 Core flow — New user first session

```
Sign Up (Google/LinkedIn/Email)
    ↓
Onboarding Wizard (role, location, experience, salary)
    ↓
Upload Resume → AI parses and extracts profile
    ↓
Review parsed profile → Edit if needed → Save
    ↓
Dashboard (shows first batch of matched jobs)
    ↓
User clicks a job → Job detail view
    ↓
┌─────────────────────────────────────────┐
│ Action bar: 4 buttons                    │
│ [Tailor Resume] [Cold Email]             │
│ [LinkedIn Msg] [Save to Tracker]         │
└─────────────────────────────────────────┘
    ↓
User clicks "Tailor Resume"
    ↓
AI generates tailored resume → PDF preview
    ↓
User reviews → edits → downloads PDF
    ↓
User clicks "Cold Email"
    ↓
AI generates email → user copies → sends externally
    ↓
Auto-added to Application Tracker as "Applied"
    ↓
User continues browsing more jobs
```

### 5.2 Returning user flow

```
Login → Dashboard
    ↓
Notification: "12 new job matches since yesterday"
    ↓
Browse new matches → Apply to relevant ones
    ↓
Check Application Tracker → Follow up on pending
    ↓
Reminder: "Follow up with Google recruiter — applied 7 days ago"
```

---

## 6. Database schema (core tables)

### Users
- id (UUID, PK)
- email, name, avatar_url
- auth_provider (google, linkedin, email)
- onboarding_completed (boolean)
- plan_tier (free, starter, pro, elite)
- plan_expiry (timestamp)
- created_at, updated_at

### User_Profiles
- id (UUID, PK)
- user_id (FK → Users)
- current_role, current_company
- experience_years
- target_roles (text array)
- target_locations (text array)
- expected_salary_min, expected_salary_max
- skills (text array)
- parsed_resume_json (JSONB — full structured resume data)
- raw_resume_url (file storage link)

### Jobs
- id (UUID, PK)
- external_id (source job ID for dedup)
- source (linkedin, naukri, indeed, glassdoor, google, ziprecruiter)
- title, company_name, company_logo_url
- location, is_remote, job_type
- description (full text)
- salary_min, salary_max, salary_currency
- posted_at, scraped_at
- url (original job posting URL)
- skills_required (text array, AI-extracted)
- experience_required
- is_active (boolean)

### Job_Matches
- id (UUID, PK)
- user_id (FK → Users)
- job_id (FK → Jobs)
- match_score (0-100)
- match_reasoning (text — AI explanation)
- is_seen (boolean)
- created_at

### Tailored_Resumes
- id (UUID, PK)
- user_id (FK → Users)
- job_id (FK → Jobs)
- version_name (e.g., "Google_SDE2_March2026")
- latex_source (text)
- pdf_url (file storage link)
- template_used
- created_at

### Generated_Outreach
- id (UUID, PK)
- user_id (FK → Users)
- job_id (FK → Jobs)
- type (cold_email, linkedin_inmail, referral_request)
- subject (for emails)
- body (text)
- recruiter_name, recruiter_email
- email_confidence (verified, likely, unknown)
- created_at

### Applications
- id (UUID, PK)
- user_id (FK → Users)
- job_id (FK → Jobs)
- status (saved, applied, screening, interview, offer, rejected, withdrawn)
- tailored_resume_id (FK → Tailored_Resumes, nullable)
- outreach_ids (UUID array → Generated_Outreach)
- applied_at
- notes (text)
- next_followup_date
- salary_offered
- contact_name, contact_email
- interview_dates (JSONB array)
- created_at, updated_at

### Usage_Tracking
- id (UUID, PK)
- user_id (FK → Users)
- action_type (job_search, resume_tailor, cold_email, linkedin_msg, referral_msg, email_find)
- month_year (e.g., "2026-03")
- count (integer)
- (Composite unique index on user_id + action_type + month_year)

---

## 7. API endpoints (core)

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Onboarding
- POST /api/onboarding/profile — Save onboarding data
- POST /api/onboarding/resume-upload — Upload + parse resume

### Jobs
- GET /api/jobs/search?role=X&location=Y&filters... — Search/aggregate jobs
- GET /api/jobs/:id — Job detail
- GET /api/jobs/matches — Personalized job matches for user
- POST /api/jobs/:id/match-score — Calculate match score for specific job

### Resume
- POST /api/resume/tailor — Generate tailored resume (input: job_id)
- GET /api/resume/:id/preview — Get PDF preview URL
- GET /api/resume/:id/download — Download PDF or LaTeX
- PUT /api/resume/:id — Update/edit tailored resume
- GET /api/resume/history — List all resume versions

### Outreach
- POST /api/outreach/cold-email — Generate cold email (input: job_id)
- POST /api/outreach/linkedin-inmail — Generate InMail message
- POST /api/outreach/referral — Generate referral request
- POST /api/outreach/find-recruiter — Find recruiter email (Pro+)

### Tracker
- GET /api/tracker — Get all applications (with filters)
- POST /api/tracker — Create application entry
- PUT /api/tracker/:id — Update status, notes, etc.
- DELETE /api/tracker/:id — Remove application
- GET /api/tracker/analytics — Get tracking analytics

### Usage
- GET /api/usage — Get current month's usage vs plan limits

---

## 8. Non-functional requirements

### 8.1 Performance
- Job search results return within 3 seconds (cached) or 8 seconds (fresh scrape)
- Resume tailoring completes within 10-15 seconds
- Cold email generation within 5 seconds
- PDF rendering within 3 seconds
- Page load time under 2 seconds (LCP)

### 8.2 Scalability
- Support 10,000 concurrent users at launch
- Job cache refreshed every 24 hours per search query
- Background scraping jobs run via queue (BullMQ or Celery)
- Database connection pooling via Supabase

### 8.3 Security
- All API endpoints authenticated via JWT
- Row-level security on all user data in PostgreSQL
- Resume files stored with private access (signed URLs, 1-hour expiry)
- Rate limiting on all public endpoints
- OWASP Top 10 compliance
- GDPR-ready data deletion endpoint

### 8.4 Reliability
- 99.5% uptime target
- Graceful degradation: if JobSpy fails for LinkedIn, show results from other sources
- AI generation retry logic: 3 attempts with exponential backoff
- Error tracking via Sentry

### 8.5 SEO & Growth
- Public landing pages (SSR via Next.js) optimized for: "AI resume builder", "job search India", "cold email generator for jobs"
- Blog section for organic traffic
- Referral program: invite a friend → both get 1 week of Pro free
- Social sharing: shareable resume preview links (privacy-gated)

---

## 9. MVP scope and phasing

### Phase 1A — Core MVP (Week 1-6)
- User auth (Google + email)
- Onboarding wizard + resume upload/parse
- Job search with 3 sources (Indeed, Google Jobs, Naukri via JobSpy)
- Basic job listing UI with filters
- Resume tailoring (1 template) with in-app PDF preview
- Cold email generation (user enters recruiter email manually)
- Basic application tracker (kanban, manual entry)
- Free tier only (no payments)

### Phase 1B — Monetization + Polish (Week 7-10)
- LinkedIn + Glassdoor added to job sources
- 2 more resume templates
- LinkedIn InMail + referral message generation
- Recruiter email auto-finder
- Usage tracking + plan limits enforcement
- Razorpay + Stripe payment integration
- All 4 pricing tiers live
- Email digest for new job matches
- PWA configuration (installable, offline tracker access)

### Phase 1C — Growth Features (Week 11-14)
- Chrome extension (LinkedIn overlay, one-click save/tailor)
- Match score with AI explanation
- Tracker analytics dashboard
- Follow-up reminders (in-app + email + push)
- Resume version comparison
- Referral program
- Student discount verification

### Phase 2 (Future) — Employer/Hiring Side
- Separate PRD to be created
- AI resume screening for employers
- Fabric-style AI interviewer integration
- Interview scheduling automation
- Candidate ranking and reporting
- Shared data layer connecting both sides of the marketplace

---

## 10. Success metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered users | 10,000 |
| Monthly active users | 3,000 |
| Free → Paid conversion | 5-8% |
| Resumes tailored per user/month | 4+ |
| Jobs applied per user/month | 15+ |
| User-reported interview callbacks | 2x improvement over manual apply |
| NPS score | 40+ |
| Churn rate (paid users) | Under 8% monthly |
| DAU/MAU ratio | 30%+ |

---

## 11. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Job board blocks scraping | High — core feature breaks | Multi-source redundancy; aggressive caching; Google Jobs as fallback (uses official API); explore Naukri partnership for data feeds |
| LinkedIn rate limiting | Medium — reduces one source | Proxies + respectful scraping intervals; LinkedIn is supplementary, not primary |
| Claude API costs spike | Medium — margins compress | Cache AI outputs for identical JD+profile combinations; batch processing during off-peak; set per-user generation limits |
| LaTeX compilation fails | Low — user can't get resume | Fallback: HTML-to-PDF renderer (Puppeteer) that produces same layout without LaTeX dependency |
| Low conversion to paid | High — business viability | Strong free tier to build habit; clear value gate on Pro features; A/B test pricing |
| Legal/ToS issues with scraping | Medium — cease and desist | Consult legal counsel; use official APIs where available; cache and transform data (don't mirror listings); add robots.txt compliance |
| Recruiter email accuracy | Low — user frustration | Confidence scoring; verify before showing; fallback to manual entry |

---

## 12. Resolved design decisions

### 12.1 One-click apply → Deferred to Phase 3
Manual prep only in Phase 1. No auto-filling of external ATS forms (Workday, Lever, Greenhouse). These systems constantly update DOM structures, form fields, and CAPTCHAs — maintaining auto-fill is an engineering nightmare that drains resources from core differentiators. One-click apply will be built in Phase 3 as a native marketplace feature after the employer portal (Phase 2) is live, where applications flow directly into the employer's FitVector dashboard without ATS dependency.

### 12.2 Match score algorithm → Hybrid embedding + Claude
- **Feed-level scoring:** Lightweight embedding model (OpenAI text-embedding-3-small or open-source Hugging Face model via Python backend) generates base 0-100 match scores using cosine similarity between user profile embeddings and JD embeddings. Fast, cheap, runs on every job-user pair.
- **Detailed analysis (upsell trigger):** Claude API called only when user explicitly clicks "View AI Gap Analysis" on a specific job. Generates detailed skill-gap breakdown, missing qualifications, and actionable improvement suggestions. This is a Pro/Elite tier feature.
- **Cost implication:** Embedding calls cost ~$0.00002 per pair vs Claude calls at ~$0.01-0.03 per pair. At 10,000 users × 50 jobs each = 500,000 pairs/day, embeddings cost ~$10/day vs Claude at ~$5,000-15,000/day.

### 12.3 Community features → Deferred to Phase 2
FitVector Phase 1 is a single-player SaaS tool. Community requires seeding content, moderating spam, and building engagement loops — a completely different operational motion. Nail the single-player utility first, then activate community once there is a critical mass of active users.

### 12.4 International pricing → PPP-adjusted
- India baseline pricing is already localized (₹299/₹799/₹1,499)
- International expansion uses Purchasing Power Parity pricing via ParityDeals integration with Stripe
- PPP adjustment based on user's IP geolocation
- Example: Pro tier = ₹799 (India) / $12.99 (US) / $6.99 (LATAM/SEA/Eastern Europe)
- Significantly increases Free → Paid conversion in price-sensitive markets where early-career professionals are the primary users

---

## 13. Product roadmap summary

| Phase | Scope | Timeline |
|-------|-------|----------|
| **Phase 1A** | Core MVP — auth, onboarding, job search (3 sources), resume tailor (1 template), cold email, basic tracker. Free tier only. | Week 1-6 |
| **Phase 1B** | Monetization — all job sources, 3 templates, LinkedIn/referral messages, recruiter email finder, payments (Razorpay + Stripe), all 4 tiers, PWA, job alerts. | Week 7-10 |
| **Phase 1C** | Growth — Chrome extension, AI match score with gap analysis, tracker analytics, follow-up reminders, resume version compare, referral program, student discount. | Week 11-14 |
| **Phase 2** | Employer/Hiring portal — AI resume screening, AI interviewer (Fabric-style), interview scheduling, candidate ranking, employer dashboard. Separate PRD. | Post Phase 1 launch |
| **Phase 3** | Marketplace — One-click "Apply via FitVector" connecting job seekers directly to employer dashboards. Native application flow, no ATS form dependency. Community features. | Post Phase 2 launch |

---

*This PRD covers the complete job seeker side of FitVector (Phase 1). Phase 2 (Employer/Hiring side) and Phase 3 (Marketplace/One-click apply) will be documented separately.*
