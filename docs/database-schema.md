# FitVector — Database Schema

**Version:** 1.0
**Last Updated:** March 22, 2026
**Database:** PostgreSQL 15+ (Supabase)
**Extensions:** pgvector, pg_trgm (trigram search), uuid-ossp
**Scope:** Phase 1 tables. Phase 2/3 additions noted at bottom.

---

## 1. Extensions and configuration

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- trigram similarity for fuzzy search

-- Set default timezone
SET timezone = 'UTC';
```

---

## 2. Enums

```sql
CREATE TYPE auth_provider AS ENUM ('google', 'linkedin', 'email');
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'elite');
CREATE TYPE user_status AS ENUM ('onboarding', 'active', 'suspended', 'deleted');
CREATE TYPE job_source AS ENUM ('linkedin', 'naukri', 'indeed', 'glassdoor', 'google', 'ziprecruiter', 'fitvector');
CREATE TYPE job_type AS ENUM ('fulltime', 'parttime', 'internship', 'contract');
CREATE TYPE work_mode AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE application_status AS ENUM ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn');
CREATE TYPE outreach_type AS ENUM ('cold_email', 'linkedin_inmail', 'referral_request');
CREATE TYPE email_confidence AS ENUM ('verified', 'likely', 'pattern_guess', 'unknown');
CREATE TYPE usage_action AS ENUM ('job_search', 'resume_tailor', 'cold_email', 'linkedin_msg', 'referral_msg', 'email_find', 'gap_analysis');
CREATE TYPE experience_level AS ENUM ('fresher', '1_3', '3_7', '7_15', '15_plus');
CREATE TYPE match_bucket AS ENUM ('strong_fit', 'good_fit', 'potential_fit', 'weak_fit');
```

---

## 3. Core tables

### 3.1 users

Primary user account table. One row per registered user.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    avatar_url      TEXT,
    auth_provider   auth_provider NOT NULL DEFAULT 'email',
    auth_provider_id TEXT,                          -- Google/LinkedIn OAuth ID
    password_hash   TEXT,                           -- Only for email auth
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    user_type       TEXT[] NOT NULL DEFAULT '{seeker}', -- supports: seeker, employer, admin
    plan_tier       plan_tier NOT NULL DEFAULT 'free',
    plan_expiry     TIMESTAMPTZ,                    -- NULL for free tier
    plan_payment_id TEXT,                           -- Razorpay/Stripe subscription ID
    user_status     user_status NOT NULL DEFAULT 'onboarding',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    notification_preferences JSONB DEFAULT '{
        "email_digest": "daily",
        "push_new_matches": true,
        "push_status_updates": true,
        "push_reminders": true
    }',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX idx_users_plan ON users(plan_tier);
CREATE INDEX idx_users_status ON users(user_status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (id = auth.uid());
```

### 3.2 user_profiles

Detailed seeker profile. Parsed resume data, preferences, and embedding.

```sql
CREATE TABLE user_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Current status
    current_role        TEXT,
    current_company     TEXT,
    current_status      TEXT,                        -- "student", "working", "unemployed", "freelancing"
    experience_level    experience_level,
    
    -- Target preferences
    target_roles        TEXT[] DEFAULT '{}',          -- e.g., {"Frontend Developer", "Full Stack Engineer"}
    target_locations    TEXT[] DEFAULT '{}',          -- e.g., {"Bangalore", "Remote", "Mumbai"}
    preferred_work_mode work_mode,
    preferred_job_types job_type[] DEFAULT '{fulltime}',
    preferred_industries TEXT[] DEFAULT '{}',
    expected_salary_min INTEGER,                      -- in INR (or user's currency)
    expected_salary_max INTEGER,
    salary_currency     TEXT DEFAULT 'INR',
    
    -- Parsed resume data (structured JSON from AI parsing)
    parsed_resume_json  JSONB,
    /*
    Schema of parsed_resume_json:
    {
        "name": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "summary": "string (2-3 sentences)",
        "experience": [
            {
                "company": "string",
                "role": "string",
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM | present",
                "bullets": ["string"],
                "technologies": ["string"]
            }
        ],
        "education": [
            {
                "institution": "string",
                "degree": "string",
                "field": "string",
                "graduation_year": 2024,
                "gpa": "string (optional)"
            }
        ],
        "skills": ["string"],
        "projects": [
            {
                "name": "string",
                "description": "string",
                "technologies": ["string"],
                "url": "string (optional)"
            }
        ],
        "certifications": [
            {
                "name": "string",
                "issuer": "string",
                "year": 2024
            }
        ]
    }
    */
    
    -- Raw resume file
    raw_resume_url      TEXT,                        -- Supabase Storage signed URL
    raw_resume_filename TEXT,
    resume_parsed_at    TIMESTAMPTZ,
    
    -- Skills extracted (denormalized for fast filtering)
    skills              TEXT[] DEFAULT '{}',
    
    -- Embedding for match scoring (pgvector)
    embedding           vector(1536),
    embedding_model     TEXT DEFAULT 'text-embedding-3-small',
    embedding_updated_at TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_profiles_skills ON user_profiles USING GIN(skills);
CREATE INDEX idx_profiles_target_roles ON user_profiles USING GIN(target_roles);
CREATE INDEX idx_profiles_target_locations ON user_profiles USING GIN(target_locations);
CREATE INDEX idx_profiles_embedding ON user_profiles USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_profiles_experience ON user_profiles(experience_level);

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
```

### 3.3 jobs

Scraped job listings from external boards. Single source of truth for all discoverable jobs.

```sql
CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source identification
    external_id         TEXT,                        -- Job board's own ID
    source              job_source NOT NULL,
    sources             job_source[] DEFAULT '{}',   -- All boards where this job appears (after dedup)
    fingerprint         TEXT NOT NULL,               -- MD5 hash for deduplication
    url                 TEXT NOT NULL,               -- Original job posting URL
    
    -- Job details
    title               TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    company_logo_url    TEXT,
    company_url         TEXT,
    location            TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT DEFAULT 'India',
    work_mode           work_mode,
    job_type            job_type,
    
    -- Description
    description         TEXT NOT NULL,               -- Full JD (markdown format)
    description_hash    TEXT,                        -- For detecting JD changes
    
    -- Requirements (AI-extracted from description)
    skills_required     TEXT[] DEFAULT '{}',
    skills_nice_to_have TEXT[] DEFAULT '{}',
    experience_min      INTEGER,                     -- Years
    experience_max      INTEGER,
    education_required  TEXT,                        -- e.g., "Bachelor's in CS"
    
    -- Compensation
    salary_min          INTEGER,
    salary_max          INTEGER,
    salary_currency     TEXT DEFAULT 'INR',
    salary_period       TEXT DEFAULT 'yearly',       -- yearly, monthly, hourly
    salary_source       TEXT,                        -- "direct" (from listing) or "estimated"
    
    -- Company metadata (from scraper)
    company_size        TEXT,                        -- "1-10", "11-50", etc.
    company_industry    TEXT,
    company_rating      DECIMAL(2,1),               -- Glassdoor rating if available
    company_description TEXT,
    
    -- Embedding for match scoring
    embedding           vector(1536),
    embedding_model     TEXT DEFAULT 'text-embedding-3-small',
    
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT true,
    posted_at           TIMESTAMPTZ,                 -- When job was originally posted
    scraped_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at    TIMESTAMPTZ,                 -- Last time we confirmed job is still live
    deactivated_at      TIMESTAMPTZ,
    
    -- Easy apply
    is_easy_apply       BOOLEAN DEFAULT false,
    apply_url           TEXT,                        -- Direct application URL if different from listing URL
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_jobs_fingerprint ON jobs(fingerprint);
CREATE INDEX idx_jobs_source_active ON jobs(source, is_active);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(city, country);
CREATE INDEX idx_jobs_title_trgm ON jobs USING GIN(title gin_trgm_ops);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat(embedding vector_cosine_ops) WITH (lists = 200);
CREATE INDEX idx_jobs_work_mode ON jobs(work_mode) WHERE is_active = true;
CREATE INDEX idx_jobs_type ON jobs(job_type) WHERE is_active = true;
CREATE INDEX idx_jobs_active ON jobs(is_active, posted_at DESC);

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Jobs are public read (no RLS needed for read)
-- Write access restricted to service role only
```

### 3.4 job_matches

Pre-computed match scores between users and jobs.

```sql
CREATE TABLE job_matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Scoring
    match_score     SMALLINT NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    match_bucket    match_bucket NOT NULL,
    similarity_raw  REAL,                            -- Raw cosine similarity (0-1)
    
    -- Detailed analysis (populated on-demand for Pro+ users)
    gap_analysis    JSONB,
    /*
    Schema of gap_analysis (when populated):
    {
        "matching_skills": [{"skill": "React", "evidence": "3 years at Company X"}],
        "missing_skills": [{"skill": "GraphQL", "importance": "high"}],
        "experience_gaps": ["No distributed systems experience"],
        "strengths": ["Strong frontend portfolio", "Relevant industry"],
        "recommendations": ["Learn GraphQL basics", "Add system design project"]
    }
    */
    gap_analysis_generated_at TIMESTAMPTZ,
    
    -- User interaction
    is_seen         BOOLEAN NOT NULL DEFAULT false,
    is_saved        BOOLEAN NOT NULL DEFAULT false,
    is_dismissed    BOOLEAN NOT NULL DEFAULT false,
    seen_at         TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, job_id)
);

-- Indexes
CREATE INDEX idx_matches_user_score ON job_matches(user_id, match_score DESC) WHERE NOT is_dismissed;
CREATE INDEX idx_matches_user_unseen ON job_matches(user_id, created_at DESC) WHERE NOT is_seen AND NOT is_dismissed;
CREATE INDEX idx_matches_user_saved ON job_matches(user_id) WHERE is_saved = true;
CREATE INDEX idx_matches_job ON job_matches(job_id);

ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own matches" ON job_matches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own matches" ON job_matches FOR UPDATE USING (user_id = auth.uid());
```

### 3.5 tailored_resumes

AI-generated tailored resumes linked to specific jobs.

```sql
CREATE TABLE tailored_resumes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Version info
    version_name    TEXT NOT NULL,                    -- e.g., "Google_SDE2_Mar2026"
    template_id     TEXT NOT NULL DEFAULT 'modern',   -- "modern", "classic", "minimal"
    
    -- Content
    latex_source    TEXT NOT NULL,                    -- Full LaTeX source code
    pdf_url         TEXT NOT NULL,                    -- Supabase Storage URL
    
    -- Metadata
    job_title       TEXT,                             -- Denormalized for display when job is deleted
    company_name    TEXT,                             -- Denormalized
    
    -- AI generation metadata
    ai_model        TEXT DEFAULT 'claude-sonnet-4-20250514',
    prompt_version  TEXT DEFAULT 'v1',                -- Track which system prompt version was used
    generation_time_ms INTEGER,                      -- How long AI took to generate
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_resumes_user ON tailored_resumes(user_id, created_at DESC);
CREATE INDEX idx_resumes_user_job ON tailored_resumes(user_id, job_id);

ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own resumes" ON tailored_resumes FOR ALL USING (user_id = auth.uid());
```

### 3.6 generated_outreach

AI-generated cold emails, LinkedIn messages, and referral requests.

```sql
CREATE TABLE generated_outreach (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Type and content
    outreach_type       outreach_type NOT NULL,
    subject             TEXT,                        -- For cold emails only
    subject_alternatives TEXT[],                     -- 2-3 alternative subject lines
    body                TEXT NOT NULL,
    tone                TEXT DEFAULT 'professional', -- professional, conversational, confident
    
    -- Recruiter info
    recruiter_name      TEXT,
    recruiter_email     TEXT,
    recruiter_title     TEXT,
    email_confidence    email_confidence,
    
    -- Metadata
    job_title           TEXT,                        -- Denormalized
    company_name        TEXT,                        -- Denormalized
    personalization_points TEXT[],                   -- What was personalized
    
    -- Usage tracking
    was_copied          BOOLEAN DEFAULT false,       -- User clicked "Copy"
    was_sent            BOOLEAN DEFAULT false,       -- User confirmed they sent it
    
    ai_model            TEXT DEFAULT 'claude-sonnet-4-20250514',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_user ON generated_outreach(user_id, created_at DESC);
CREATE INDEX idx_outreach_user_job ON generated_outreach(user_id, job_id);
CREATE INDEX idx_outreach_type ON generated_outreach(user_id, outreach_type);

ALTER TABLE generated_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own outreach" ON generated_outreach FOR ALL USING (user_id = auth.uid());
```

### 3.7 applications

Application tracker — user's personal Kanban board for managing job applications.

```sql
CREATE TABLE applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Job info (denormalized so tracker works even if job is deleted/deactivated)
    job_title           TEXT NOT NULL,
    company_name        TEXT NOT NULL,
    company_logo_url    TEXT,
    location            TEXT,
    job_url             TEXT,
    job_source          job_source,
    
    -- Application status
    status              application_status NOT NULL DEFAULT 'saved',
    status_history      JSONB DEFAULT '[]',
    /*
    Schema of status_history:
    [
        {"status": "saved", "timestamp": "2026-03-22T10:00:00Z"},
        {"status": "applied", "timestamp": "2026-03-22T10:05:00Z"},
        {"status": "screening", "timestamp": "2026-03-25T14:00:00Z"}
    ]
    */
    
    -- Linked resources
    tailored_resume_id  UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
    outreach_ids        UUID[] DEFAULT '{}',          -- References to generated_outreach
    
    -- Application details
    applied_at          TIMESTAMPTZ,
    applied_via         TEXT,                         -- "fitvector", "linkedin", "company_site", "referral"
    
    -- Contact info
    contact_name        TEXT,
    contact_email       TEXT,
    contact_role        TEXT,                         -- "recruiter", "hiring_manager", "referral"
    
    -- Interview tracking
    interview_rounds    JSONB DEFAULT '[]',
    /*
    Schema of interview_rounds:
    [
        {
            "round": 1,
            "type": "phone_screen",
            "date": "2026-03-28T10:00:00Z",
            "interviewer": "John Doe",
            "notes": "Went well, asked about React hooks",
            "outcome": "passed"
        }
    ]
    */
    
    -- Notes and follow-ups
    notes               TEXT,
    next_followup_date  DATE,
    followup_reminder_sent BOOLEAN DEFAULT false,
    
    -- Salary info
    salary_offered      INTEGER,
    salary_currency     TEXT DEFAULT 'INR',
    
    -- Outcome
    rejection_reason    TEXT,
    offer_details       JSONB,                       -- {base, bonus, equity, benefits, deadline}
    
    -- Sorting and display
    position_order      INTEGER,                     -- For Kanban column ordering
    is_archived         BOOLEAN NOT NULL DEFAULT false,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_apps_user_status ON applications(user_id, status) WHERE NOT is_archived;
CREATE INDEX idx_apps_user_created ON applications(user_id, created_at DESC);
CREATE INDEX idx_apps_user_followup ON applications(user_id, next_followup_date) WHERE next_followup_date IS NOT NULL AND NOT is_archived;
CREATE INDEX idx_apps_company ON applications(user_id, company_name);

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON applications FOR ALL USING (user_id = auth.uid());
```

### 3.8 usage_tracking

Monthly usage counters for plan limit enforcement.

```sql
CREATE TABLE usage_tracking (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type     usage_action NOT NULL,
    month_year      TEXT NOT NULL,                    -- Format: "2026-03"
    count           INTEGER NOT NULL DEFAULT 0,
    
    UNIQUE(user_id, action_type, month_year)
);

-- Index for fast lookups
CREATE INDEX idx_usage_user_month ON usage_tracking(user_id, month_year);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON usage_tracking FOR SELECT USING (user_id = auth.uid());
-- Write access via service role only (not direct user writes)
```

### 3.9 recruiter_emails

Cache of found recruiter emails to avoid redundant API calls.

```sql
CREATE TABLE recruiter_emails (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    TEXT NOT NULL,
    company_domain  TEXT,
    recruiter_name  TEXT,
    recruiter_email TEXT NOT NULL,
    recruiter_title TEXT,
    confidence      email_confidence NOT NULL,
    source          TEXT,                             -- "hunter", "apollo", "snov", "pattern"
    verified_at     TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(recruiter_email, company_domain)
);

-- Index
CREATE INDEX idx_recruiter_company ON recruiter_emails(company_domain);
CREATE INDEX idx_recruiter_name ON recruiter_emails(company_name);
-- No RLS — shared cache across all users (no PII, these are public business contacts)
```

### 3.10 notification_log

Track sent notifications to prevent duplicates and enable analytics.

```sql
CREATE TABLE notification_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,                  -- "new_match", "status_change", "followup_reminder", "weekly_digest"
    channel         TEXT NOT NULL,                    -- "email", "push", "in_app"
    title           TEXT NOT NULL,
    body            TEXT,
    reference_id    UUID,                             -- FK to relevant entity (job_match, application, etc.)
    is_read         BOOLEAN NOT NULL DEFAULT false,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX idx_notifications_unread ON notification_log(user_id) WHERE NOT is_read;

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notification_log FOR ALL USING (user_id = auth.uid());
```

---

## 4. Plan limits reference table (application constant, not DB table)

```typescript
// constants/plan-limits.ts
export const PLAN_LIMITS = {
  free: {
    job_search: 3,           // per day
    jobs_per_search: 5,
    resume_tailor: 2,        // per month
    cold_email: 2,           // per month
    linkedin_msg: 2,         // per month
    referral_msg: 0,
    email_find: 0,
    gap_analysis: 0,
    active_applications: 10,
    resume_templates: ['modern'],
    resume_history: 2,
    followup_reminders: 0,
    job_alerts: false,
    chrome_extension: false,
  },
  starter: {
    job_search: 10,
    jobs_per_search: 25,
    resume_tailor: 10,
    cold_email: 15,
    linkedin_msg: 15,
    referral_msg: 5,
    email_find: 0,
    gap_analysis: 0,
    active_applications: 50,
    resume_templates: ['modern', 'classic'],
    resume_history: 5,
    followup_reminders: 3,
    job_alerts: true,         // email only
    chrome_extension: false,
  },
  pro: {
    job_search: -1,           // unlimited
    jobs_per_search: -1,
    resume_tailor: 50,
    cold_email: 50,
    linkedin_msg: 50,
    referral_msg: 30,
    email_find: 20,
    gap_analysis: 20,
    active_applications: -1,
    resume_templates: ['modern', 'classic', 'minimal'],
    resume_history: -1,
    followup_reminders: -1,
    job_alerts: true,         // email + push
    chrome_extension: true,
  },
  elite: {
    job_search: -1,
    jobs_per_search: -1,
    resume_tailor: -1,
    cold_email: -1,
    linkedin_msg: -1,
    referral_msg: -1,
    email_find: 100,
    gap_analysis: -1,
    active_applications: -1,
    resume_templates: ['modern', 'classic', 'minimal', 'custom'],
    resume_history: -1,
    followup_reminders: -1,
    job_alerts: true,         // email + push + sms
    chrome_extension: true,
  },
} as const;
// -1 = unlimited
```

---

## 5. Migration strategy

### 5.1 Migration tool
- Prisma Migrate (integrated with Next.js) OR Supabase Migrations (SQL-based)
- Recommendation: Supabase Migrations for Phase 1 (simpler, SQL-native, works with RLS)
- All migrations stored in `/supabase/migrations/` directory
- Migration naming: `YYYYMMDDHHMMSS_description.sql`

### 5.2 Seed data
```sql
-- seed.sql — development/staging only
-- Insert test user
-- Insert sample jobs (50 jobs across 5 sources)
-- Insert sample matches
-- DO NOT seed in production
```

### 5.3 Backup strategy
- Supabase Pro: daily automated backups, 7-day retention
- Point-in-time recovery available on Pro tier
- Pre-migration backup: always take a manual backup before running migrations in production

---

## 6. Phase 2 schema additions (preview)

These tables will be added when building the employer portal. Listed here for forward planning.

```
companies              → Employer company profiles
company_members        → Team members with roles
job_posts              → Employer-created jobs (distinct from scraped 'jobs')
applicants             → Candidates who apply to job_posts
ai_interviews          → AI interview sessions, transcripts, evaluations
human_interviews       → Scheduled human interview rounds
employer_usage         → Employer plan usage tracking
```

## 7. Phase 3 schema additions (preview)

```
fitvector_applications → Marketplace applications connecting seekers to employers
promoted_listings      → Paid job promotions
application_boosts     → Seeker-paid application boosts
community_posts        → Forum posts, interview experiences
community_comments     → Threaded comments
user_reputation        → Karma and badges
verified_profiles      → Identity/education/employment verification
salary_reports         → Anonymized salary data
```

---

*This schema is designed for Phase 1 with forward compatibility for Phases 2 and 3. All tables use UUID primary keys, UTC timestamps, and Row Level Security. The pgvector extension enables AI-powered match scoring without external vector databases.*
