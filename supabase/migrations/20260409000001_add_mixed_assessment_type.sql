-- ── Add 'mixed' to assessments.assessment_type CHECK constraint ───────────────
-- The original CHECK only allowed: coding_test, mcq_quiz, case_study, assignment.
-- Mixed assessments (MCQ + coding combined) were added to the TypeScript types
-- but not to the DB constraint, causing every INSERT with type='mixed' to fail
-- silently and leave job_posts.assessment_id as NULL.

-- 1. Drop old constraint
ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS assessments_assessment_type_check;

-- 2. Re-add with 'mixed' included
ALTER TABLE assessments
  ADD CONSTRAINT assessments_assessment_type_check
  CHECK (assessment_type IN ('coding_test', 'mcq_quiz', 'mixed', 'case_study', 'assignment'));

-- 3. Add assessment_id column to job_posts if not already present
--    (needed for auto-assign on stage move to assessment_pending)
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_posts_assessment ON job_posts(assessment_id)
  WHERE assessment_id IS NOT NULL;
