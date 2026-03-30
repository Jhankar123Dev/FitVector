-- ============================================================================
-- FitVector — Phase 4 Migration: Role Enum + New Tables
-- Date: 2026-03-30
-- Description:
--   1. Replace user_type TEXT[] with role TEXT enum on users table
--   2. Create interview_panels table for recruiter workflow
--   3. Create talent_pool_cache table for on-demand vector search caching
--   4. Create resumes storage bucket
-- Prerequisite: Phase 1 + Phase 2/3 schemas must exist.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Replace user_type array with single role column
-- ──────────────────────────────────────────────────────────────────────────────

-- Drop the old array column
ALTER TABLE users DROP COLUMN IF EXISTS user_type;

-- Add the new role column (1 email = 1 role, enforced at DB level)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'seeker'
  CHECK (role IN ('seeker', 'employer'));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Interview Panels (recruiter templates for scheduling human interviews)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interview_panels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  interview_type  TEXT NOT NULL CHECK (interview_type IN (
                    'technical', 'behavioral', 'hr', 'culture_fit', 'final'
                  )),
  default_interviewer_ids UUID[] DEFAULT '{}',
  round_number    INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_panels_company ON interview_panels(company_id);

ALTER TABLE interview_panels ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_interview_panels_updated_at
  BEFORE UPDATE ON interview_panels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Talent Pool Cache (avoid expensive vector search on every page load)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS talent_pool_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_post_id   UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  results       JSONB NOT NULL DEFAULT '[]',
  filters       JSONB NOT NULL DEFAULT '{}',
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, job_post_id)
);

CREATE INDEX IF NOT EXISTS idx_talent_pool_cache_lookup
  ON talent_pool_cache(company_id, job_post_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Resumes Storage Bucket (private — RLS controlled)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT DO NOTHING;
