-- ============================================================================
-- FitVector — Phase 2 + Phase 3 Database Migration
-- Date: 2026-03-27
-- Description: Adds employer/hiring tables (Phase 2), marketplace + community
--              tables (Phase 3), and assessment tables.
-- Prerequisite: Phase 1 schema (20260322000001_initial_schema.sql) must exist.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- PART A: Modifications to existing Phase 1 tables
-- (Deferred ALTERs run AFTER referenced tables are created — see inline notes)
-- ──────────────────────────────────────────────────────────────────────────────

-- Add fitvector_application_id to notification_log (FK added later in Part C)
ALTER TABLE notification_log ADD COLUMN IF NOT EXISTS fitvector_application_id UUID;

-- ──────────────────────────────────────────────────────────────────────────────
-- PART B: Phase 2 — Employer / Hiring Tables
-- ──────────────────────────────────────────────────────────────────────────────

-- B1. companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  description TEXT,
  culture_keywords TEXT[] DEFAULT '{}',
  locations JSONB DEFAULT '[]',
  branding JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'business', 'enterprise')),
  plan_expiry TIMESTAMPTZ,
  plan_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_plan_tier ON companies(plan_tier);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B2. company_members
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'recruiter', 'hiring_manager', 'viewer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON company_members(status);

ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B3. job_posts (employer-created jobs — distinct from scraped 'jobs' table)
CREATE TABLE IF NOT EXISTS job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  work_mode TEXT CHECK (work_mode IN ('onsite', 'remote', 'hybrid')),
  job_type TEXT CHECK (job_type IN ('fulltime', 'parttime', 'contract', 'internship')),
  experience_min INTEGER,
  experience_max INTEGER,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'INR',
  salary_visible BOOLEAN DEFAULT true,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  nice_to_have_skills TEXT[] DEFAULT '{}',
  screening_questions JSONB DEFAULT '[]',
  openings_count INTEGER DEFAULT 1,
  application_deadline TIMESTAMPTZ,
  interview_plan JSONB,
  assessment_config JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'filled')),
  auto_advance_threshold INTEGER CHECK (auto_advance_threshold >= 0 AND auto_advance_threshold <= 100),
  auto_reject_threshold INTEGER CHECK (auto_reject_threshold >= 0 AND auto_reject_threshold <= 100),
  dimension_weights JSONB,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_posts_company ON job_posts(company_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_created ON job_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_company_status ON job_posts(company_id, status);

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_job_posts_updated_at
  BEFORE UPDATE ON job_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- DEFERRED ALTER: Now that job_posts exists, link scraped jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_job_post_id ON jobs(job_post_id) WHERE job_post_id IS NOT NULL;

-- B4. applicants
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_title TEXT,
  current_company TEXT,
  experience INTEGER,
  avatar_url TEXT,
  resume_url TEXT,
  resume_parsed_json JSONB,
  screening_responses JSONB DEFAULT '[]',
  interest_note TEXT,
  source TEXT NOT NULL DEFAULT 'external' CHECK (source IN ('fitvector_organic', 'external_link', 'referral', 'imported', 'boosted')),
  screening_score INTEGER CHECK (screening_score >= 0 AND screening_score <= 100),
  screening_breakdown JSONB,
  screening_summary TEXT,
  bucket TEXT CHECK (bucket IN ('strong_fit', 'good_fit', 'potential_fit', 'weak_fit')),
  pipeline_stage TEXT NOT NULL DEFAULT 'applied' CHECK (pipeline_stage IN ('applied', 'ai_screened', 'ai_interviewed', 'assessment', 'human_interview', 'offer', 'hired', 'rejected', 'on_hold')),
  rejection_reason TEXT,
  is_talent_pool BOOLEAN DEFAULT false,
  talent_pool_tags TEXT[] DEFAULT '{}',
  is_boosted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applicants_job_post ON applicants(job_post_id);
CREATE INDEX IF NOT EXISTS idx_applicants_pipeline ON applicants(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_applicants_score ON applicants(screening_score DESC);
CREATE INDEX IF NOT EXISTS idx_applicants_user ON applicants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applicants_source ON applicants(source);
CREATE INDEX IF NOT EXISTS idx_applicants_bucket ON applicants(bucket);
CREATE INDEX IF NOT EXISTS idx_applicants_job_stage ON applicants(job_post_id, pipeline_stage);

ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_applicants_updated_at
  BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B5. ai_interviews
CREATE TABLE IF NOT EXISTS ai_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'role_specific', 'general')),
  duration_planned INTEGER,
  duration_actual INTEGER,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'completed', 'expired', 'cancelled')),
  invite_sent_at TIMESTAMPTZ,
  invite_expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transcript JSONB DEFAULT '[]',
  audio_recording_url TEXT,
  evaluation_report JSONB,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  skill_scores JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  concerns JSONB DEFAULT '[]',
  cheating_confidence TEXT CHECK (cheating_confidence IN ('low', 'medium', 'high')),
  cheating_signals JSONB DEFAULT '[]',
  communication_assessment JSONB,
  ai_recommendation TEXT CHECK (ai_recommendation IN ('strong_advance', 'advance', 'borderline', 'reject')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interviews_applicant ON ai_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_ai_interviews_job_post ON ai_interviews(job_post_id);
CREATE INDEX IF NOT EXISTS idx_ai_interviews_status ON ai_interviews(status);
CREATE INDEX IF NOT EXISTS idx_ai_interviews_completed ON ai_interviews(completed_at DESC);

ALTER TABLE ai_interviews ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_ai_interviews_updated_at
  BEFORE UPDATE ON ai_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B6. assessments (templates/definitions)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('coding_test', 'mcq_quiz', 'case_study', 'assignment')),
  time_limit_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  passing_score INTEGER CHECK (passing_score >= 0 AND passing_score <= 100),
  questions JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_company ON assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_template ON assessments(is_template) WHERE is_template = true;

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B7. assessment_submissions
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'submitted', 'graded', 'expired')),
  invited_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  answers JSONB DEFAULT '[]',
  auto_score INTEGER CHECK (auto_score >= 0 AND auto_score <= 100),
  manual_score INTEGER CHECK (manual_score >= 0 AND manual_score <= 100),
  final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
  grader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  grader_notes TEXT,
  plagiarism_flag BOOLEAN DEFAULT false,
  proctoring_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_subs_assessment ON assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_subs_applicant ON assessment_submissions(applicant_id);
CREATE INDEX IF NOT EXISTS idx_assessment_subs_job ON assessment_submissions(job_post_id);
CREATE INDEX IF NOT EXISTS idx_assessment_subs_status ON assessment_submissions(status);

ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_assessment_submissions_updated_at
  BEFORE UPDATE ON assessment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B8. human_interviews
CREATE TABLE IF NOT EXISTS human_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  round_number INTEGER NOT NULL,
  interview_type TEXT CHECK (interview_type IN ('phone_screen', 'technical', 'behavioral', 'culture_fit', 'hiring_manager', 'panel')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  feedback JSONB,
  rating TEXT CHECK (rating IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  notes TEXT,
  rescheduled_from TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_interviews_applicant ON human_interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_human_interviews_job ON human_interviews(job_post_id);
CREATE INDEX IF NOT EXISTS idx_human_interviews_interviewer ON human_interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_human_interviews_scheduled ON human_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_human_interviews_status ON human_interviews(status);

ALTER TABLE human_interviews ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_human_interviews_updated_at
  BEFORE UPDATE ON human_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B9. candidate_notes
CREATE TABLE IF NOT EXISTS candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_applicant ON candidate_notes(applicant_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_created ON candidate_notes(applicant_id, created_at DESC);

ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_candidate_notes_updated_at
  BEFORE UPDATE ON candidate_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B10. candidate_votes
CREATE TABLE IF NOT EXISTS candidate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(applicant_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_votes_applicant ON candidate_votes(applicant_id);

ALTER TABLE candidate_votes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_candidate_votes_updated_at
  BEFORE UPDATE ON candidate_votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- B11. employer_usage
CREATE TABLE IF NOT EXISTS employer_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('resume_screen', 'ai_interview', 'assessment', 'job_post')),
  month_year TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(company_id, action_type, month_year)
);

CREATE INDEX IF NOT EXISTS idx_employer_usage_company ON employer_usage(company_id);

ALTER TABLE employer_usage ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- PART C: Phase 3 — Marketplace + Community Tables
-- ──────────────────────────────────────────────────────────────────────────────

-- C1. fitvector_applications (marketplace: seeker ↔ employer)
CREATE TABLE IF NOT EXISTS fitvector_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id) ON DELETE SET NULL,
  tailored_resume_id UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  screening_responses JSONB DEFAULT '[]',
  interest_note TEXT,
  resume_name TEXT,
  is_boosted BOOLEAN DEFAULT false,
  boost_tier TEXT CHECK (boost_tier IN ('basic', 'standard', 'premium')),
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'under_review', 'interview_invited', 'interviewed', 'decision_pending', 'offered', 'rejected', 'withdrawn')),
  status_timeline JSONB DEFAULT '[]',
  status_updated_at TIMESTAMPTZ,
  employer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fv_apps_user ON fitvector_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_fv_apps_job ON fitvector_applications(job_post_id);
CREATE INDEX IF NOT EXISTS idx_fv_apps_status ON fitvector_applications(status);
CREATE INDEX IF NOT EXISTS idx_fv_apps_created ON fitvector_applications(created_at DESC);

ALTER TABLE fitvector_applications ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_fitvector_applications_updated_at
  BEFORE UPDATE ON fitvector_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- DEFERRED FK: Link notification_log to fitvector_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_notification_fv_app'
  ) THEN
    ALTER TABLE notification_log
      ADD CONSTRAINT fk_notification_fv_app
      FOREIGN KEY (fitvector_application_id)
      REFERENCES fitvector_applications(id) ON DELETE SET NULL;
  END IF;
END $$;

-- C2. promoted_listings
CREATE TABLE IF NOT EXISTS promoted_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('sponsored_feed', 'priority_search')),
  duration_days INTEGER NOT NULL CHECK (duration_days IN (7, 14, 30)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promoted_job ON promoted_listings(job_post_id);
CREATE INDEX IF NOT EXISTS idx_promoted_company ON promoted_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_promoted_status ON promoted_listings(status);
CREATE INDEX IF NOT EXISTS idx_promoted_end_date ON promoted_listings(end_date);

ALTER TABLE promoted_listings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_promoted_listings_updated_at
  BEFORE UPDATE ON promoted_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C3. application_boosts
CREATE TABLE IF NOT EXISTS application_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fitvector_application_id UUID NOT NULL REFERENCES fitvector_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boost_tier TEXT NOT NULL CHECK (boost_tier IN ('basic', 'standard', 'premium')),
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_boosts_fv_app ON application_boosts(fitvector_application_id);
CREATE INDEX IF NOT EXISTS idx_app_boosts_user ON application_boosts(user_id);

ALTER TABLE application_boosts ENABLE ROW LEVEL SECURITY;

-- C4. boost_credits
CREATE TABLE IF NOT EXISTS boost_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boost_credits_user ON boost_credits(user_id);

ALTER TABLE boost_credits ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_boost_credits_updated_at
  BEFORE UPDATE ON boost_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C5. community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('interview_experience', 'discussion', 'salary_report')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('tech', 'business', 'design', 'marketing', 'career_advice', 'salary', 'general')),
  is_anonymous BOOLEAN DEFAULT true,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed', 'under_review')),
  interview_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C6. community_comments
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created ON community_comments(post_id, created_at);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C7. community_votes (prevents double voting)
CREATE TABLE IF NOT EXISTS community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_community_votes_target ON community_votes(target_type, target_id);

ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;

-- C8. user_reputation
CREATE TABLE IF NOT EXISTS user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  karma_points INTEGER DEFAULT 0,
  helpful_reviews_count INTEGER DEFAULT 0,
  interview_experiences_count INTEGER DEFAULT 0,
  community_posts_count INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_user_reputation_updated_at
  BEFORE UPDATE ON user_reputation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C9. verified_profiles
CREATE TABLE IF NOT EXISTS verified_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  identity_verified BOOLEAN DEFAULT false,
  identity_document_ref TEXT,
  education_verified BOOLEAN DEFAULT false,
  education_document_ref TEXT,
  employment_verified BOOLEAN DEFAULT false,
  employment_document_ref TEXT,
  skills_verified BOOLEAN DEFAULT false,
  skills_assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verified_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_verified_profiles_updated_at
  BEFORE UPDATE ON verified_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- C10. salary_reports (anonymized)
CREATE TABLE IF NOT EXISTS salary_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT,
  company_size TEXT,
  location TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  base_salary INTEGER NOT NULL,
  total_compensation INTEGER,
  currency TEXT DEFAULT 'INR',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_reports_role ON salary_reports(role_title);
CREATE INDEX IF NOT EXISTS idx_salary_reports_location ON salary_reports(location);
CREATE INDEX IF NOT EXISTS idx_salary_reports_exp ON salary_reports(experience_years);

ALTER TABLE salary_reports ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- PART D: RLS Policies
-- ──────────────────────────────────────────────────────────────────────────────

-- Helper: Check if user is a member of a given company
CREATE OR REPLACE FUNCTION is_company_member(p_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members
    WHERE company_id = p_company_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: Get company_id for a job_post
CREATE OR REPLACE FUNCTION get_job_post_company(p_job_post_id UUID)
RETURNS UUID AS $$
  SELECT company_id FROM job_posts WHERE id = p_job_post_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- === Company-owned table policies ===

-- companies: members can read, admins can write
CREATE POLICY companies_select ON companies FOR SELECT
  USING (is_company_member(id));
CREATE POLICY companies_insert ON companies FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY companies_update ON companies FOR UPDATE
  USING (is_company_member(id));

-- company_members: members can see their company's members
CREATE POLICY company_members_select ON company_members FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY company_members_insert ON company_members FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY company_members_update ON company_members FOR UPDATE
  USING (is_company_member(company_id));
CREATE POLICY company_members_delete ON company_members FOR DELETE
  USING (is_company_member(company_id));

-- job_posts: company members can CRUD
CREATE POLICY job_posts_select ON job_posts FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY job_posts_insert ON job_posts FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY job_posts_update ON job_posts FOR UPDATE
  USING (is_company_member(company_id));
CREATE POLICY job_posts_delete ON job_posts FOR DELETE
  USING (is_company_member(company_id));

-- Also allow seekers to read active job_posts (for marketplace)
CREATE POLICY job_posts_public_read ON job_posts FOR SELECT
  USING (status = 'active' AND auth.uid() IS NOT NULL);

-- applicants: company members of the job's company
CREATE POLICY applicants_select ON applicants FOR SELECT
  USING (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY applicants_insert ON applicants FOR INSERT
  WITH CHECK (is_company_member(get_job_post_company(job_post_id)) OR user_id = auth.uid());
CREATE POLICY applicants_update ON applicants FOR UPDATE
  USING (is_company_member(get_job_post_company(job_post_id)));

-- ai_interviews: company members
CREATE POLICY ai_interviews_select ON ai_interviews FOR SELECT
  USING (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY ai_interviews_insert ON ai_interviews FOR INSERT
  WITH CHECK (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY ai_interviews_update ON ai_interviews FOR UPDATE
  USING (is_company_member(get_job_post_company(job_post_id)));

-- assessments: company members
CREATE POLICY assessments_select ON assessments FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY assessments_insert ON assessments FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY assessments_update ON assessments FOR UPDATE
  USING (is_company_member(company_id));

-- assessment_submissions: company members
CREATE POLICY assessment_subs_select ON assessment_submissions FOR SELECT
  USING (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY assessment_subs_insert ON assessment_submissions FOR INSERT
  WITH CHECK (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY assessment_subs_update ON assessment_submissions FOR UPDATE
  USING (is_company_member(get_job_post_company(job_post_id)));

-- human_interviews: company members
CREATE POLICY human_interviews_select ON human_interviews FOR SELECT
  USING (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY human_interviews_insert ON human_interviews FOR INSERT
  WITH CHECK (is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY human_interviews_update ON human_interviews FOR UPDATE
  USING (is_company_member(get_job_post_company(job_post_id)));

-- candidate_notes: company members
CREATE POLICY candidate_notes_select ON candidate_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applicants a
    WHERE a.id = applicant_id
      AND is_company_member(get_job_post_company(a.job_post_id))
  ));
CREATE POLICY candidate_notes_insert ON candidate_notes FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY candidate_notes_update ON candidate_notes FOR UPDATE
  USING (auth.uid() = author_id);

-- candidate_votes: company members
CREATE POLICY candidate_votes_select ON candidate_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applicants a
    WHERE a.id = applicant_id
      AND is_company_member(get_job_post_company(a.job_post_id))
  ));
CREATE POLICY candidate_votes_insert ON candidate_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);
CREATE POLICY candidate_votes_update ON candidate_votes FOR UPDATE
  USING (auth.uid() = voter_id);

-- employer_usage: company members
CREATE POLICY employer_usage_select ON employer_usage FOR SELECT
  USING (is_company_member(company_id));

-- promoted_listings: company members
CREATE POLICY promoted_listings_select ON promoted_listings FOR SELECT
  USING (is_company_member(company_id));
CREATE POLICY promoted_listings_insert ON promoted_listings FOR INSERT
  WITH CHECK (is_company_member(company_id));
CREATE POLICY promoted_listings_update ON promoted_listings FOR UPDATE
  USING (is_company_member(company_id));

-- === User-owned table policies ===

-- fitvector_applications: user owns their applications
CREATE POLICY fv_apps_select ON fitvector_applications FOR SELECT
  USING (applicant_user_id = auth.uid() OR is_company_member(get_job_post_company(job_post_id)));
CREATE POLICY fv_apps_insert ON fitvector_applications FOR INSERT
  WITH CHECK (applicant_user_id = auth.uid());
CREATE POLICY fv_apps_update ON fitvector_applications FOR UPDATE
  USING (applicant_user_id = auth.uid() OR is_company_member(get_job_post_company(job_post_id)));

-- application_boosts: user owns
CREATE POLICY app_boosts_select ON application_boosts FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY app_boosts_insert ON application_boosts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- boost_credits: user owns
CREATE POLICY boost_credits_select ON boost_credits FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY boost_credits_insert ON boost_credits FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY boost_credits_update ON boost_credits FOR UPDATE
  USING (user_id = auth.uid());

-- community_posts: all authenticated can read published, author can write
CREATE POLICY community_posts_select ON community_posts FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY community_posts_insert ON community_posts FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY community_posts_update ON community_posts FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY community_posts_delete ON community_posts FOR DELETE
  USING (user_id = auth.uid());

-- community_comments: all authenticated can read published, author can write
CREATE POLICY community_comments_select ON community_comments FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY community_comments_insert ON community_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY community_comments_update ON community_comments FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY community_comments_delete ON community_comments FOR DELETE
  USING (user_id = auth.uid());

-- community_votes: user owns
CREATE POLICY community_votes_select ON community_votes FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY community_votes_insert ON community_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY community_votes_delete ON community_votes FOR DELETE
  USING (user_id = auth.uid());

-- user_reputation: anyone can read, user can update own
CREATE POLICY user_reputation_select ON user_reputation FOR SELECT
  USING (true);
CREATE POLICY user_reputation_insert ON user_reputation FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY user_reputation_update ON user_reputation FOR UPDATE
  USING (user_id = auth.uid());

-- verified_profiles: user owns
CREATE POLICY verified_profiles_select ON verified_profiles FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY verified_profiles_insert ON verified_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY verified_profiles_update ON verified_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- salary_reports: NEVER expose individual rows publicly
-- User can see own entries only
CREATE POLICY salary_reports_own ON salary_reports FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY salary_reports_insert ON salary_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- PART E: Database Functions
-- ──────────────────────────────────────────────────────────────────────────────

-- Salary aggregation function (returns aggregated data only, never individual rows)
CREATE OR REPLACE FUNCTION get_salary_aggregation(
  p_role TEXT,
  p_location TEXT DEFAULT NULL,
  p_exp_min INT DEFAULT 0,
  p_exp_max INT DEFAULT 99
)
RETURNS TABLE (
  sample_size BIGINT,
  median_salary NUMERIC,
  p25_salary NUMERIC,
  p75_salary NUMERIC,
  min_salary INTEGER,
  max_salary INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS sample_size,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC AS median_salary,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC AS p25_salary,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY sr.total_compensation)::NUMERIC AS p75_salary,
    MIN(sr.total_compensation) AS min_salary,
    MAX(sr.total_compensation) AS max_salary
  FROM salary_reports sr
  WHERE sr.role_title = p_role
    AND sr.experience_years >= p_exp_min
    AND sr.experience_years <= p_exp_max
    AND (p_location IS NULL OR sr.location = p_location);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Auto-increment job_posts.applications_count on applicant insert
CREATE OR REPLACE FUNCTION update_job_post_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_posts
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_applicant_count
  AFTER INSERT ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_job_post_applicant_count();

-- ──────────────────────────────────────────────────────────────────────────────
-- Done. Migration creates 21 new tables, modifies 2 existing tables,
-- adds RLS policies, indexes, triggers, and helper functions.
-- ──────────────────────────────────────────────────────────────────────────────
