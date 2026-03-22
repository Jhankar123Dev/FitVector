# FitVector — System Design Document

**Version:** 1.0
**Last Updated:** March 22, 2026
**Scope:** Phase 1 (Job Seeker) — with forward-compatible design for Phase 2 and 3

---

## 1. System overview

FitVector is a two-service architecture: a Next.js application handling the frontend, authentication, and CRUD operations, and a Python FastAPI microservice handling all AI workloads, job scraping, and compute-heavy tasks. Both services share a single PostgreSQL database and communicate via REST APIs.

```
                    ┌──────────────────────────┐
                    │        Cloudflare         │
                    │     (CDN + DNS + WAF)     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
     ┌────────▼────────┐  ┌─────▼──────┐  ┌────────▼────────┐
     │   Next.js App   │  │  Python    │  │  Chrome Ext     │
     │   (Vercel)      │  │  FastAPI   │  │  (Plasmo)       │
     │                 │  │  (Railway) │  │                 │
     │  - Frontend     │  │            │  │  - LinkedIn     │
     │  - API Routes   │  │  - AI/LLM  │  │    overlay      │
     │  - Auth         │  │  - Scraping│  │  - Job save     │
     │  - PWA          │  │  - PDF gen │  │  - Msg gen      │
     └───────┬─────────┘  └─────┬──────┘  └────────┬────────┘
             │                  │                   │
             │    REST/JSON     │                   │
             ├──────────────────┤                   │
             │                  │                   │
     ┌───────▼──────────────────▼───────────────────▼───┐
     │              PostgreSQL (Supabase)                 │
     │                                                    │
     │  - Users, Profiles, Jobs, Applications             │
     │  - Row Level Security enabled                      │
     │  - pgvector extension for embeddings               │
     └──────────────────────┬─────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Supabase     │
                    │  Storage      │
                    │  (R2/S3)      │
                    │               │
                    │  - Resumes    │
                    │  - PDFs       │
                    │  - Logos      │
                    └───────────────┘
```

---

## 2. Service architecture

### 2.1 Next.js application (primary service)

**Hosting:** Vercel (Hobby → Pro as traffic grows)
**Runtime:** Node.js 20+, Edge Runtime for auth middleware
**Framework:** Next.js 14+ with App Router

**Responsibilities:**
- Server-side rendered pages (landing, dashboard, job listings, tracker)
- Client-side interactive components (kanban board, PDF viewer, editors)
- API routes for all CRUD operations (users, profiles, applications, tracker)
- Authentication via Auth.js v5 (Google, LinkedIn, email/password)
- Session management (JWT stored in httpOnly cookies)
- Rate limiting middleware on API routes
- PWA service worker registration and push notification handling
- Webhook receivers (payment events from Razorpay/Stripe)

**Key API route groups:**
```
/api/auth/*          → Auth.js handlers
/api/user/*          → Profile CRUD, onboarding, preferences
/api/tracker/*       → Application tracker CRUD
/api/usage/*         → Plan limits check, usage counters
/api/payments/*      → Subscription management, webhook handlers
/api/ai/*            → Proxy routes to Python microservice (see below)
```

**Why proxy AI calls through Next.js instead of calling Python directly from frontend:**
- Centralizes authentication — Python service doesn't need to verify JWTs
- Enforces plan-based rate limits before expensive AI calls reach Python
- Logs usage in PostgreSQL atomically with the request
- Hides Python service URL from client (security)
- Allows response transformation and error normalization

### 2.2 Python FastAPI microservice (AI/compute service)

**Hosting:** Railway (Starter → Pro) or Fly.io
**Runtime:** Python 3.11+, uvicorn ASGI server
**Framework:** FastAPI

**Responsibilities:**
- Job scraping via JobSpy library (LinkedIn, Naukri, Indeed, Glassdoor, Google Jobs)
- AI resume tailoring (Claude API calls with system prompt + JD + user profile)
- AI outreach generation (cold emails, LinkedIn messages, referral requests)
- Resume parsing (PDF/DOCX → structured JSON via Claude)
- Match score computation (embedding generation + cosine similarity)
- LaTeX → PDF compilation (Tectonic TeX engine)
- Recruiter email finding (Hunter.io, Apollo.io, Snov.io API calls)
- Background job processing (daily job matching cron, email digests)

**Key endpoints:**
```
POST /scrape/jobs          → Trigger job search across boards
POST /ai/tailor-resume     → Generate tailored resume (LaTeX + PDF)
POST /ai/cold-email        → Generate cold email
POST /ai/linkedin-message  → Generate LinkedIn InMail or referral msg
POST /ai/parse-resume      → Parse uploaded resume to structured JSON
POST /ai/match-score       → Compute match score for user-job pair
POST /ai/gap-analysis      → Detailed Claude-powered gap analysis
POST /find/recruiter-email → Find recruiter email for a company/role
GET  /health               → Health check
```

**Internal communication:**
- Next.js calls Python via REST over private network (Railway/Fly internal networking)
- Shared secret in header (`X-Internal-Key`) for service-to-service auth
- Timeout: 30 seconds for AI calls, 15 seconds for scraping, 5 seconds for email lookup

### 2.3 Background job processing

**Queue:** BullMQ (Redis-backed) running inside the Python service
**Redis:** Upstash Redis (serverless, free tier supports low volume)

**Scheduled jobs:**
| Job | Schedule | Description |
|-----|----------|-------------|
| `daily_job_match` | 3:00 AM IST daily | Runs JobSpy for each user's saved preferences, computes match scores, stores new matches |
| `send_job_alerts` | 7:00 AM IST daily | Sends email digest of new matches to opted-in users |
| `refresh_job_cache` | Every 6 hours | Re-scrapes popular search queries to keep cache fresh |
| `cleanup_expired_jobs` | Midnight daily | Marks jobs older than 30 days as inactive |
| `compute_embeddings` | On new job/profile | Generates embeddings for new jobs and updated user profiles |
| `usage_reset` | 1st of each month | Resets monthly usage counters for all users |

**Event-driven jobs (triggered by user actions):**
| Trigger | Job | Description |
|---------|-----|-------------|
| User uploads resume | `parse_resume` | Async parsing, notifies user when complete |
| User clicks "Tailor Resume" | `tailor_resume` | Generates LaTeX → compiles PDF → stores |
| User clicks "Find Recruiter" | `find_email` | Queries Hunter/Apollo/Snov → returns result |

---

## 3. Data architecture

### 3.1 PostgreSQL (Supabase)

**Why Supabase PostgreSQL:**
- Managed PostgreSQL with built-in auth helpers, storage, and realtime
- Row Level Security (RLS) for multi-tenant data isolation
- pgvector extension for embedding storage and similarity search
- Free tier supports MVP; scales to Pro ($25/mo) for production
- Built-in connection pooling via PgBouncer (critical for serverless Next.js)

**Key database design decisions:**

**Multi-tenancy via RLS:**
Every user-owned table has a `user_id` column. RLS policies ensure users can only read/write their own data. No application-level filtering needed — security is enforced at the database layer.

```sql
-- Example: Users can only see their own applications
CREATE POLICY "Users see own applications"
  ON applications FOR SELECT
  USING (user_id = auth.uid());
```

**Embedding storage (pgvector):**
```sql
-- Job embeddings for match scoring
ALTER TABLE jobs ADD COLUMN embedding vector(1536);

-- User profile embeddings
ALTER TABLE user_profiles ADD COLUMN embedding vector(1536);

-- Similarity search: find top matching jobs for a user
SELECT j.*, 1 - (j.embedding <=> up.embedding) AS similarity
FROM jobs j, user_profiles up
WHERE up.user_id = 'xxx'
ORDER BY j.embedding <=> up.embedding
LIMIT 50;
```

**JSONB for flexible schemas:**
Resume parsed data, screening responses, and skill lists use JSONB columns instead of normalized tables. This avoids complex joins for read-heavy operations and accommodates varying resume structures.

**Indexes:**
```sql
-- Critical indexes for performance
CREATE INDEX idx_jobs_source_active ON jobs(source, is_active);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_job_matches_user_score ON job_matches(user_id, match_score DESC);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_usage_user_month ON usage_tracking(user_id, month_year);
```

### 3.2 File storage (Supabase Storage)

**Buckets:**
| Bucket | Contents | Access |
|--------|----------|--------|
| `resumes-raw` | Uploaded resume files (PDF/DOCX) | Private — signed URLs, 1h expiry |
| `resumes-tailored` | Generated tailored resume PDFs | Private — signed URLs, 1h expiry |
| `avatars` | User profile photos | Public |
| `company-logos` | Company logos (scraped or uploaded) | Public, cached at CDN |

**Storage policy:** All resume files encrypted at rest. Signed URLs prevent unauthorized access. Files auto-deleted 90 days after account deletion (GDPR compliance).

### 3.3 Caching strategy

**Layer 1 — Vercel Edge Cache:**
- Static pages (landing, pricing, blog) cached at CDN edge
- ISR (Incremental Static Regeneration) for semi-static pages

**Layer 2 — Redis (Upstash):**
- Job search results: cached by query hash, 24h TTL
- Match scores: cached per user-job pair, 7d TTL (invalidated on profile update)
- Usage counters: cached for fast reads, write-through to PostgreSQL
- Session data: short-lived, 24h TTL

**Layer 3 — PostgreSQL:**
- Scraped jobs stored with `scraped_at` timestamp
- Deduplication: composite unique index on (source, external_id) prevents duplicate job entries
- Stale jobs marked inactive after 30 days

**Cache invalidation triggers:**
- User updates profile → invalidate all match scores for that user
- New jobs scraped → compute match scores for relevant users
- User upgrades plan → invalidate usage cache

---

## 4. AI pipeline architecture

### 4.1 Resume parsing pipeline

```
User uploads PDF/DOCX
    ↓
Supabase Storage (store raw file)
    ↓
Python microservice receives file URL
    ↓
Text extraction:
  - PDF: PyMuPDF (fitz) library
  - DOCX: python-docx library
    ↓
Claude API call:
  System prompt: "Extract structured resume data as JSON"
  User message: [extracted text]
  Response format: {
    name, email, phone, location,
    summary,
    experience: [{ company, role, start, end, bullets: [] }],
    education: [{ institution, degree, field, year }],
    skills: [],
    projects: [{ name, description, tech: [] }],
    certifications: []
  }
    ↓
Validate JSON schema (Pydantic model)
    ↓
Store in user_profiles.parsed_resume_json
    ↓
Generate embedding from skills + experience summary
    ↓
Store in user_profiles.embedding (pgvector)
    ↓
Notify frontend: "Resume parsed successfully"
```

### 4.2 Resume tailoring pipeline

```
User clicks "Tailor Resume" on a job
    ↓
Next.js API checks usage limits (plan enforcement)
    ↓
Proxies request to Python microservice with:
  - user_profiles.parsed_resume_json
  - jobs.description (full JD text)
  - template_id
    ↓
Claude API call:
  System prompt: [pre-built tailoring prompt — already developed]
  User message: "Profile: {json} | JD: {text} | Output LaTeX"
  Max tokens: ~4000
    ↓
Receive LaTeX output from Claude
    ↓
Tectonic TeX compiler: LaTeX → PDF
  (Tectonic runs as a subprocess, no external dependencies)
  Timeout: 10 seconds
  Fallback: if Tectonic fails, use latex.js client-side rendering
    ↓
Upload PDF to Supabase Storage (resumes-tailored bucket)
    ↓
Store record in tailored_resumes table:
  - latex_source (full LaTeX text)
  - pdf_url (signed storage URL)
  - template_used
  - job_id (FK)
    ↓
Return to frontend:
  - pdf_url (for in-app viewer)
  - latex_source (for download)
  - version_name (auto-generated: "{Company}_{Role}_{Date}")
```

### 4.3 Match scoring pipeline

**Lightweight scoring (runs on every job-user pair):**
```
New job scraped OR user profile updated
    ↓
Generate embedding:
  - Job: embed(title + description + skills_required)
  - User: embed(target_roles + skills + experience_summary)
  Model: text-embedding-3-small (OpenAI) or all-MiniLM-L6-v2 (HuggingFace, free)
    ↓
Cosine similarity: score = cos_sim(job_embedding, user_embedding)
    ↓
Normalize to 0-100 scale:
  - 0.0-0.3 similarity → 0-30 score (weak fit)
  - 0.3-0.5 → 30-60 (potential fit)
  - 0.5-0.7 → 60-80 (good fit)
  - 0.7-1.0 → 80-100 (strong fit)
    ↓
Store in job_matches table
    ↓
Jobs displayed in feed sorted by match_score DESC
```

**Deep analysis (triggered on-demand, Pro+ plans):**
```
User clicks "View AI Gap Analysis" on a job
    ↓
Claude API call:
  System: "Analyze this candidate's fit for this role. Identify: matching skills,
           missing skills, experience gaps, strengths, and specific improvement
           suggestions. Be constructive and specific."
  User: "Profile: {json} | JD: {text}"
    ↓
Response: structured gap analysis
  - Matching skills: [list with evidence from resume]
  - Missing skills: [list with importance rating]
  - Experience gaps: [specific areas]
  - Strengths: [top 3]
  - Recommendations: [actionable steps]
    ↓
Cached in Redis (7d TTL, keyed by user_id + job_id)
    ↓
Displayed in job detail view
```

### 4.4 Outreach generation pipeline

```
User clicks "Cold Email" / "LinkedIn Message" / "Referral Request"
    ↓
Next.js checks usage limits
    ↓
Python microservice:
  Claude API call:
    System prompt: role-specific (cold email vs InMail vs referral)
    User message: {
      user_profile: {name, current_role, skills, key_achievements},
      job: {title, company, description},
      outreach_type: "cold_email" | "linkedin_inmail" | "referral_request",
      tone: "professional" | "conversational" | "confident",
      recruiter_name: (if known)
    }
    ↓
  Response: {
    subject: (for emails only, 2-3 options),
    body: (150-200 words),
    personalization_points: [what was personalized]
  }
    ↓
Store in generated_outreach table
    ↓
Auto-link to application tracker entry (if exists)
    ↓
Return to frontend with copy-to-clipboard + mail client deep links
```

---

## 5. Authentication and authorization

### 5.1 Auth flow

**Provider:** Auth.js v5 (NextAuth) with Supabase adapter

**Supported providers:**
- Google OAuth 2.0 (primary — most users have Google accounts)
- LinkedIn OAuth 2.0 (professional context, can import profile data)
- Email/password with email verification (fallback)

**Session strategy:** JWT in httpOnly secure cookie
- Access token: 1 hour expiry
- Refresh token: 30 days expiry
- Token rotation on every refresh

**Auth middleware (Next.js):**
```typescript
// middleware.ts — runs on every request
export function middleware(request) {
  // Public routes: /, /login, /signup, /pricing, /blog/*
  // Protected routes: /dashboard/*, /api/* (except /api/auth/*)
  // Check JWT validity
  // Attach user session to request
  // Redirect unauthenticated users to /login
}
```

### 5.2 Authorization model

**Role-based (Phase 1 is simple — single user role):**
| Role | Access |
|------|--------|
| `free_user` | All free-tier features, enforced limits |
| `starter_user` | Starter tier features + limits |
| `pro_user` | Pro tier features + limits |
| `elite_user` | Elite tier features + limits |
| `admin` | FitVector internal admin dashboard |

**Plan enforcement pattern:**
```typescript
// Before any AI operation
async function checkUsageLimit(userId: string, actionType: string) {
  const plan = await getUserPlan(userId);
  const usage = await getMonthlyUsage(userId, actionType);
  const limit = PLAN_LIMITS[plan][actionType];
  
  if (usage >= limit) {
    throw new PlanLimitError(
      `You've used ${usage}/${limit} ${actionType} this month. Upgrade for more.`
    );
  }
  
  await incrementUsage(userId, actionType);
}
```

---

## 6. Job scraping architecture

### 6.1 JobSpy integration

**Library:** jobspy (Python, open-source, MIT license)
**Proxy:** SmartProxy rotating residential proxies ($7/month for 1GB)

**Scraping configuration:**
```python
from jobspy import scrape_jobs

def search_jobs(role: str, location: str, filters: dict) -> list:
    jobs = scrape_jobs(
        site_name=["indeed", "linkedin", "google", "naukri", "glassdoor"],
        search_term=role,
        location=location,
        results_wanted=50,
        hours_old=72,  # jobs posted in last 3 days
        country_indeed="India",  # or dynamic based on user location
        proxies=ROTATING_PROXY_LIST,
        description_format="markdown",
    )
    return jobs.to_dict(orient="records")
```

### 6.2 Anti-detection and safety measures

**Proxy rotation:**
- Pool of 10+ rotating residential IPs
- Different IP per job board per scrape session
- Geo-targeted proxies (Indian IPs for Naukri, US IPs for US Indeed)

**Rate limiting (self-imposed):**
- Max 1 request per 3 seconds per job board
- Max 100 pages per job board per hour
- Exponential backoff on 429 responses (1s → 2s → 4s → 8s → skip)
- Circuit breaker: if a source fails 5 times consecutively, disable for 1 hour

**User agent rotation:**
- Pool of 20+ realistic browser user agents
- Rotated per session

**Request deduplication:**
- Hash search parameters (role + location + filters) → check Redis cache
- If cached results exist and are < 24h old, return cached
- Dramatically reduces total scraping volume

### 6.3 Job deduplication

Same job often appears on multiple boards. Dedup logic:
```python
def deduplicate_job(job: dict) -> str:
    # Generate a fingerprint from title + company + location
    fingerprint = hashlib.md5(
        f"{normalize(job.title)}:{normalize(job.company)}:{normalize(job.location)}"
        .encode()
    ).hexdigest()
    
    # Check if fingerprint exists in DB
    existing = db.query(Job).filter(Job.fingerprint == fingerprint).first()
    
    if existing:
        # Add source badge to existing job
        existing.sources.append(job.source)
        return existing.id
    else:
        # Insert new job
        job.fingerprint = fingerprint
        db.insert(job)
        return job.id
```

### 6.4 Fallback chain

If a scraping source fails, the system degrades gracefully:
```
Primary: JobSpy (all 5 boards)
    ↓ (if LinkedIn blocked)
Fallback 1: JobSpy (4 boards without LinkedIn) + Google Jobs API
    ↓ (if multiple boards down)
Fallback 2: Google Jobs API only (always available, official API)
    ↓ (if all scraping fails)
Fallback 3: Serve cached results (even if > 24h old) with "results may be outdated" badge
```

---

## 7. Payment architecture

### 7.1 Dual payment processor

**India (primary):** Razorpay
- UPI, credit/debit cards, wallets (Paytm, PhonePe), net banking
- Subscription API for recurring billing
- Webhook: `razorpay.subscription.charged`, `razorpay.subscription.cancelled`

**International:** Stripe
- Credit/debit cards, Apple Pay, Google Pay
- Stripe Subscriptions for recurring billing
- Stripe Checkout for one-time purchases
- ParityDeals integration for PPP pricing

**Payment flow:**
```
User selects plan → clicks "Subscribe"
    ↓
Detect user location (IP-based)
    ↓
India → Razorpay Checkout
International → Stripe Checkout (with PPP price)
    ↓
Payment succeeds → webhook fired
    ↓
Next.js webhook handler:
  1. Verify webhook signature
  2. Update user.plan_tier and user.plan_expiry in DB
  3. Reset usage counters if upgrading
  4. Send confirmation email
  5. Invalidate cached plan data in Redis
    ↓
User redirected to dashboard with new plan active
```

### 7.2 Plan enforcement

Every API route that performs a limited action follows this pattern:
1. Read plan tier from JWT (cached in session)
2. Read monthly usage from Redis (write-through cache of PostgreSQL)
3. Compare against plan limits constant
4. If within limits → proceed and increment counter
5. If exceeded → return 429 with upgrade prompt

---

## 8. PWA configuration

### 8.1 Service worker

**Package:** next-pwa

**Caching strategy:**
- App shell (HTML, CSS, JS): Cache-first, update in background
- API responses: Network-first, fall back to cache
- Images/logos: Cache-first with 7-day expiry
- Job search results: Network-only (always fresh)

**Offline support:**
- Dashboard loads from cache (shows last-known state)
- Application tracker is fully functional offline (local cache + sync on reconnect)
- Job search requires network (shows "offline" message)
- Resume viewer works offline if PDF was previously viewed

### 8.2 Push notifications

**Provider:** Web Push API via Supabase Edge Functions or self-hosted

**Notification types:**
| Event | Priority | Message |
|-------|----------|---------|
| New high-match job (90%+) | High | "New match: {Role} at {Company} — 95% fit" |
| Application status change | High | "Update: {Company} moved you to Interview stage" |
| Follow-up reminder | Medium | "Reminder: Follow up with {Company} — applied 7 days ago" |
| Weekly job digest | Low | "12 new jobs match your profile this week" |

---

## 9. Security measures

### 9.1 Application security
- HTTPS everywhere (enforced by Vercel + Cloudflare)
- CSRF protection via SameSite cookie attribute
- XSS prevention: React's built-in escaping + Content-Security-Policy headers
- SQL injection: prevented by Supabase client (parameterized queries) + Prisma ORM
- Rate limiting: 100 requests/minute per user on API routes, 10 requests/minute on AI endpoints
- Input validation: Zod schemas on all API inputs (Next.js) + Pydantic models (Python)

### 9.2 Data security
- Database encryption at rest (Supabase default)
- File storage encryption at rest (Supabase Storage default)
- Signed URLs for all private file access (1-hour expiry)
- PII minimization: store only what's needed, delete on account deletion
- Audit log for sensitive operations (plan changes, data exports, account deletion)

### 9.3 API security
- JWT verification on every protected route
- Service-to-service auth (Next.js → Python) via shared secret in header
- Python microservice not exposed to public internet (internal network only)
- API keys for external services (Claude, Hunter, Razorpay) stored in environment variables, never in code

---

## 10. Monitoring and observability

### 10.1 Error tracking
**Tool:** Sentry (free tier: 5K events/month)
- Integrated in both Next.js and Python services
- Source maps uploaded for frontend error debugging
- Alert on error spike (> 10 errors in 5 minutes)

### 10.2 Application monitoring
**Tool:** Vercel Analytics (built-in) + PostHog
- Core Web Vitals (LCP, FID, CLS)
- API response times (P50, P95, P99)
- AI generation latency tracking
- Scraping success/failure rates per source

### 10.3 Uptime monitoring
**Tool:** Better Stack (free tier) or UptimeRobot
- Health check endpoints: `/api/health` (Next.js), `/health` (Python)
- Alerts via email + Slack on downtime
- 99.5% uptime target

### 10.4 Logging
- Next.js: Vercel's built-in logging (serverless function logs)
- Python: structured JSON logging to stdout (Railway captures automatically)
- Log levels: ERROR (always), WARN (always), INFO (production), DEBUG (development only)
- Sensitive data (emails, resume content) never logged

---

## 11. Scalability considerations

### 11.1 Phase 1 scale targets
- 10,000 registered users
- 3,000 monthly active users
- ~500 concurrent users at peak
- ~50,000 jobs in database
- ~5,000 AI generations per day (resume + email + messages combined)

### 11.2 Scaling strategy

**Frontend (Next.js on Vercel):**
- Serverless functions auto-scale to demand
- Edge functions for auth middleware (globally distributed)
- ISR for semi-static pages reduces server load
- No scaling action needed until 100K+ users

**Python microservice (Railway):**
- Vertical scaling first: increase RAM/CPU on Railway ($5 → $20/month)
- Horizontal scaling: add replicas behind Railway's built-in load balancer
- Background jobs on separate worker process (doesn't block API responses)
- Scaling trigger: when P95 latency > 5 seconds on AI endpoints

**Database (Supabase):**
- Free tier supports MVP (500MB, 50K rows)
- Pro tier ($25/month): 8GB, unlimited rows, daily backups
- Connection pooling via PgBouncer (handles serverless connection storms)
- Read replicas available on Team tier if needed

**Redis (Upstash):**
- Serverless: auto-scales, pay per request
- Free tier: 10K commands/day (sufficient for MVP)
- Scaling: automatic, no action needed

### 11.3 Cost projections

| Service | MVP (0-1K users) | Growth (1K-10K users) | Scale (10K-50K users) |
|---------|-------------------|-----------------------|-----------------------|
| Vercel | Free | Pro ($20/mo) | Pro ($20/mo) |
| Railway (Python) | Starter ($5/mo) | Dev ($10/mo) | Pro ($20/mo) |
| Supabase | Free | Pro ($25/mo) | Pro ($25/mo) |
| Upstash Redis | Free | Pay-as-you-go (~$5/mo) | Pay-as-you-go (~$15/mo) |
| Claude API | ~$50/mo | ~$300/mo | ~$1,500/mo |
| OpenAI Embeddings | ~$5/mo | ~$20/mo | ~$80/mo |
| SmartProxy | $7/mo | $15/mo | $30/mo |
| Sentry | Free | Free | Paid ($26/mo) |
| Resend (email) | Free | $20/mo | $20/mo |
| **Total** | **~$67/mo** | **~$415/mo** | **~$1,716/mo** |

---

## 12. Forward compatibility — Phase 2 and 3

### Design decisions made now to avoid rewrites later:

**Users table supports dual roles:**
```sql
-- A single user can be both a job seeker and an employer
ALTER TABLE users ADD COLUMN user_type text[] DEFAULT '{seeker}';
-- Possible values: 'seeker', 'employer', 'admin'
-- Array allows a user to be both simultaneously
```

**Jobs table vs Job_Posts table:**
- Phase 1 `jobs` table: scraped external jobs
- Phase 2 will add `job_posts` table: employer-created jobs on FitVector
- Both appear in the seeker's feed, differentiated by source
- Schema designed so both can be queried with the same frontend components

**Embedding infrastructure:**
- pgvector set up in Phase 1 for match scoring
- Same infrastructure powers Phase 2's AI resume screening (employer-side)
- Embedding dimensions (1536) chosen to be compatible with both OpenAI and Anthropic models

**Real-time infrastructure:**
- Supabase Realtime enabled but not heavily used in Phase 1 (just notifications)
- Phase 3's real-time application status updates will use the same infrastructure
- No additional setup needed

---

*This system design document is the technical foundation for FitVector. All other spec documents (database schema, API contracts, project structure) reference this document for architectural context.*
