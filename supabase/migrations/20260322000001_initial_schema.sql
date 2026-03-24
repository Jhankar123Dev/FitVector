-- FitVector Phase 1 Initial Schema
-- PostgreSQL 15+ (Supabase)
-- Created: 2026-03-22
-- Updated: 2026-03-23 (aligned column names with application code)

-- ============================================================================
-- 1. Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- trigram similarity for fuzzy search

SET timezone = 'UTC';

-- ============================================================================
-- 2. Enums
-- ============================================================================

CREATE TYPE auth_provider AS ENUM ('google', 'linkedin', 'credentials');
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'elite');
CREATE TYPE user_status AS ENUM ('onboarding', 'active', 'suspended', 'deleted');
CREATE TYPE job_source AS ENUM ('linkedin', 'naukri', 'indeed', 'glassdoor', 'google', 'ziprecruiter', 'fitvector');
CREATE TYPE job_type AS ENUM ('fulltime', 'parttime', 'internship', 'contract');
CREATE TYPE work_mode AS ENUM ('onsite', 'remote', 'hybrid');
CREATE TYPE application_status AS ENUM ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn');
CREATE TYPE outreach_type AS ENUM ('cold_email', 'linkedin_message', 'referral_request');
CREATE TYPE email_confidence AS ENUM ('verified', 'likely', 'pattern_guess', 'unknown');
CREATE TYPE experience_level AS ENUM ('fresher', '1_3', '3_7', '7_15', '15_plus');
CREATE TYPE match_bucket AS ENUM ('strong_fit', 'good_fit', 'potential_fit', 'weak_fit');
CREATE TYPE decision_label AS ENUM ('apply_now', 'prepare_then_apply', 'explore');

-- ============================================================================
-- 3. Trigger function (shared)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Tables
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4.1 users
-- --------------------------------------------------------------------------

CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                       TEXT NOT NULL UNIQUE,
    full_name                   TEXT NOT NULL DEFAULT '',
    avatar_url                  TEXT,
    auth_provider               auth_provider NOT NULL DEFAULT 'credentials',
    auth_provider_id            TEXT,
    password_hash               TEXT,
    email_verified              BOOLEAN NOT NULL DEFAULT false,
    user_type                   TEXT[] NOT NULL DEFAULT '{seeker}',
    plan_tier                   plan_tier NOT NULL DEFAULT 'free',
    plan_expiry                 TIMESTAMPTZ,
    plan_payment_id             TEXT,
    status                      user_status NOT NULL DEFAULT 'onboarding',
    onboarding_completed        BOOLEAN NOT NULL DEFAULT false,
    notification_preferences    JSONB DEFAULT '{
        "email_digest": "daily",
        "push_new_matches": true,
        "push_status_updates": true,
        "push_reminders": true
    }',
    last_login_at               TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX idx_users_plan ON users(plan_tier);
CREATE INDEX idx_users_status ON users(status);

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- 4.2 user_profiles
-- --------------------------------------------------------------------------

CREATE TABLE user_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Current status
    "current_role"          TEXT,
    current_company         TEXT,
    "current_status"        TEXT,
    experience_level        experience_level,

    -- Target preferences
    target_roles            TEXT[] DEFAULT '{}',
    target_locations        TEXT[] DEFAULT '{}',
    preferred_work_mode     work_mode,
    preferred_job_types     job_type[] DEFAULT '{fulltime}',
    preferred_industries    TEXT[] DEFAULT '{}',
    expected_salary_min     INTEGER,
    expected_salary_max     INTEGER,
    salary_currency         TEXT DEFAULT 'INR',

    -- Parsed resume data
    parsed_resume_json      JSONB,

    -- Raw resume file
    raw_resume_url          TEXT,
    raw_resume_filename     TEXT,
    resume_parsed_at        TIMESTAMPTZ,

    -- Skills (denormalized for fast filtering)
    skills                  TEXT[] DEFAULT '{}',

    -- Embedding (pgvector)
    embedding               vector(384),
    embedding_model         TEXT DEFAULT 'all-MiniLM-L6-v2',
    embedding_updated_at    TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_profiles_skills ON user_profiles USING GIN(skills);
CREATE INDEX idx_profiles_target_roles ON user_profiles USING GIN(target_roles);
CREATE INDEX idx_profiles_target_locations ON user_profiles USING GIN(target_locations);
CREATE INDEX idx_profiles_experience ON user_profiles(experience_level);

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- 4.3 jobs
-- --------------------------------------------------------------------------

CREATE TABLE jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source identification
    external_id             TEXT,
    source                  job_source NOT NULL,
    sources                 job_source[] DEFAULT '{}',
    fingerprint             TEXT NOT NULL,
    url                     TEXT NOT NULL,

    -- Job details
    title                   TEXT NOT NULL,
    company_name            TEXT NOT NULL,
    company_logo_url        TEXT,
    company_url             TEXT,
    location                TEXT,
    city                    TEXT,
    state                   TEXT,
    country                 TEXT DEFAULT 'India',
    work_mode               work_mode,
    job_type                job_type,

    -- Description
    description             TEXT NOT NULL,
    description_hash        TEXT,

    -- Requirements (AI-extracted)
    skills_required         TEXT[] DEFAULT '{}',
    skills_nice_to_have     TEXT[] DEFAULT '{}',
    experience_min          INTEGER,
    experience_max          INTEGER,
    education_required      TEXT,

    -- Compensation
    salary_min              INTEGER,
    salary_max              INTEGER,
    salary_currency         TEXT DEFAULT 'INR',
    salary_period           TEXT DEFAULT 'yearly',
    salary_source           TEXT,

    -- Company metadata
    company_size            TEXT,
    company_industry        TEXT,
    company_rating          DECIMAL(2,1),
    company_description     TEXT,

    -- Embedding
    embedding               vector(384),
    embedding_model         TEXT DEFAULT 'all-MiniLM-L6-v2',

    -- Status
    is_active               BOOLEAN NOT NULL DEFAULT true,
    posted_at               TIMESTAMPTZ,
    scraped_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at        TIMESTAMPTZ,
    deactivated_at          TIMESTAMPTZ,

    -- Easy apply
    is_easy_apply           BOOLEAN DEFAULT false,
    apply_url               TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_jobs_fingerprint ON jobs(fingerprint);
CREATE INDEX idx_jobs_source_active ON jobs(source, is_active);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(city, country);
CREATE INDEX idx_jobs_title_trgm ON jobs USING GIN(title gin_trgm_ops);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_work_mode ON jobs(work_mode) WHERE is_active = true;
CREATE INDEX idx_jobs_type ON jobs(job_type) WHERE is_active = true;
CREATE INDEX idx_jobs_active ON jobs(is_active, posted_at DESC);

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- 4.4 job_matches
-- --------------------------------------------------------------------------

CREATE TABLE job_matches (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id                      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Blended scoring
    match_score                 SMALLINT NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    match_bucket                match_bucket NOT NULL,
    decision_label              decision_label NOT NULL DEFAULT 'explore',
    similarity_raw              REAL,

    -- Individual scores (for debugging)
    embedding_score             SMALLINT,
    deterministic_score         SMALLINT,
    deterministic_components    JSONB,

    -- Detailed analysis
    gap_analysis                JSONB,
    gap_analysis_generated_at   TIMESTAMPTZ,

    -- User interaction
    is_seen                     BOOLEAN NOT NULL DEFAULT false,
    is_saved                    BOOLEAN NOT NULL DEFAULT false,
    is_dismissed                BOOLEAN NOT NULL DEFAULT false,
    seen_at                     TIMESTAMPTZ,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_matches_user_score ON job_matches(user_id, match_score DESC) WHERE NOT is_dismissed;
CREATE INDEX idx_matches_user_unseen ON job_matches(user_id, created_at DESC) WHERE NOT is_seen AND NOT is_dismissed;
CREATE INDEX idx_matches_user_saved ON job_matches(user_id) WHERE is_saved = true;
CREATE INDEX idx_matches_job ON job_matches(job_id);
CREATE INDEX idx_matches_decision ON job_matches(user_id, decision_label) WHERE NOT is_dismissed;

-- --------------------------------------------------------------------------
-- 4.5 tailored_resumes
-- --------------------------------------------------------------------------

CREATE TABLE tailored_resumes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id              UUID REFERENCES jobs(id) ON DELETE SET NULL,

    -- Version info
    version_name        TEXT NOT NULL,
    template_id         TEXT NOT NULL DEFAULT 'modern',

    -- Content
    latex_source        TEXT NOT NULL,
    pdf_url             TEXT,

    -- Metadata (denormalized)
    job_title           TEXT,
    company_name        TEXT,

    -- AI generation metadata
    ai_model            TEXT DEFAULT 'gemini-2.0-flash',
    prompt_version      TEXT DEFAULT 'v1',
    generation_time_ms  INTEGER,

    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON tailored_resumes(user_id, created_at DESC);
CREATE INDEX idx_resumes_user_job ON tailored_resumes(user_id, job_id);

-- --------------------------------------------------------------------------
-- 4.6 generated_outreach
-- --------------------------------------------------------------------------

CREATE TABLE generated_outreach (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id                  UUID REFERENCES jobs(id) ON DELETE SET NULL,

    -- Type and content
    outreach_type           outreach_type NOT NULL,
    subject                 TEXT,
    subject_alternatives    TEXT[],
    body                    TEXT NOT NULL,
    tone                    TEXT DEFAULT 'professional',

    -- Recruiter info
    recruiter_name          TEXT,
    recruiter_email         TEXT,
    recruiter_title         TEXT,
    email_confidence        email_confidence,

    -- Metadata (denormalized)
    job_title               TEXT,
    company_name            TEXT,
    personalization_points  TEXT[],

    -- Usage tracking
    was_copied              BOOLEAN DEFAULT false,
    was_sent                BOOLEAN DEFAULT false,

    ai_model                TEXT DEFAULT 'gemini-2.0-flash',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outreach_user ON generated_outreach(user_id, created_at DESC);
CREATE INDEX idx_outreach_user_job ON generated_outreach(user_id, job_id);
CREATE INDEX idx_outreach_type ON generated_outreach(user_id, outreach_type);

-- --------------------------------------------------------------------------
-- 4.7 applications
-- --------------------------------------------------------------------------

CREATE TABLE applications (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id                      UUID REFERENCES jobs(id) ON DELETE SET NULL,

    -- Job info (denormalized)
    job_title                   TEXT NOT NULL,
    company_name                TEXT NOT NULL,
    company_logo_url            TEXT,
    location                    TEXT,
    job_url                     TEXT,
    job_source                  job_source,

    -- Application status
    status                      application_status NOT NULL DEFAULT 'saved',
    status_history              JSONB DEFAULT '[]',

    -- Linked resources
    tailored_resume_id          UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
    outreach_ids                UUID[] DEFAULT '{}',

    -- Application details
    applied_at                  TIMESTAMPTZ,
    applied_via                 TEXT,

    -- Contact info
    contact_name                TEXT,
    contact_email               TEXT,
    contact_role                TEXT,

    -- Interview tracking
    interview_rounds            JSONB DEFAULT '[]',

    -- Notes and follow-ups
    notes                       TEXT,
    next_followup_date          DATE,
    followup_reminder_sent      BOOLEAN DEFAULT false,

    -- Salary info
    salary_offered              INTEGER,
    salary_currency             TEXT DEFAULT 'INR',

    -- Outcome
    rejection_reason            TEXT,
    offer_details               JSONB,

    -- Sorting and display
    position_order              INTEGER,
    is_archived                 BOOLEAN NOT NULL DEFAULT false,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_user_status ON applications(user_id, status) WHERE NOT is_archived;
CREATE INDEX idx_apps_user_created ON applications(user_id, created_at DESC);
CREATE INDEX idx_apps_user_followup ON applications(user_id, next_followup_date) WHERE next_followup_date IS NOT NULL AND NOT is_archived;
CREATE INDEX idx_apps_company ON applications(user_id, company_name);

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- 4.8 usage_logs (per-event log for fine-grained tracking)
-- --------------------------------------------------------------------------

CREATE TABLE usage_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_feature ON usage_logs(user_id, feature, created_at DESC);
CREATE INDEX idx_usage_logs_date ON usage_logs(created_at);

-- --------------------------------------------------------------------------
-- 4.9 recruiter_emails
-- --------------------------------------------------------------------------

CREATE TABLE recruiter_emails (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name        TEXT NOT NULL,
    company_domain      TEXT,
    recruiter_name      TEXT,
    recruiter_email     TEXT NOT NULL,
    recruiter_title     TEXT,
    confidence          email_confidence NOT NULL,
    source              TEXT,
    verified_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(recruiter_email, company_domain)
);

CREATE INDEX idx_recruiter_company ON recruiter_emails(company_domain);
CREATE INDEX idx_recruiter_name ON recruiter_emails(company_name);

-- --------------------------------------------------------------------------
-- 4.10 notification_log
-- --------------------------------------------------------------------------

CREATE TABLE notification_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type   TEXT NOT NULL,
    channel             TEXT NOT NULL,
    title               TEXT NOT NULL,
    body                TEXT,
    reference_id        UUID,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at             TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX idx_notifications_unread ON notification_log(user_id) WHERE NOT is_read;

-- ============================================================================
-- 5. Row Level Security
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so our API routes (using SUPABASE_SERVICE_ROLE_KEY) work fine.
-- These policies are for direct client access if ever needed.

CREATE POLICY "Users read own data" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see own matches" ON job_matches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own matches" ON job_matches FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users manage own resumes" ON tailored_resumes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own outreach" ON generated_outreach FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own applications" ON applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users see own usage" ON usage_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users see own notifications" ON notification_log FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 6. Storage buckets (created via Supabase Dashboard or API)
-- ============================================================================
-- resumes-raw: User-uploaded resume files (PDF, DOCX)
-- resumes-pdf: AI-generated tailored resume PDFs
