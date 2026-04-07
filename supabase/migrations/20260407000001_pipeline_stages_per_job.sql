-- ── Flexible pipeline stages per job post ────────────────────────────────────
-- Adds a pipeline_stages column to job_posts so each job can have its own
-- hiring flow. Existing jobs are backfilled with the full default pipeline
-- before the NOT NULL constraint is applied.

-- 1. Add column as nullable first so the UPDATE can fill it
ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS pipeline_stages TEXT[] DEFAULT NULL;

-- 2. Backfill all existing jobs that have no pipeline config
UPDATE job_posts
SET pipeline_stages = ARRAY[
  'applied',
  'ai_screened',
  'assessment_pending',
  'assessment_completed',
  'ai_interview_pending',
  'ai_interviewed',
  'human_interview',
  'offer',
  'hired'
]
WHERE pipeline_stages IS NULL;

-- 3. Now enforce NOT NULL and set the default for future inserts
ALTER TABLE job_posts
  ALTER COLUMN pipeline_stages SET NOT NULL;

ALTER TABLE job_posts
  ALTER COLUMN pipeline_stages SET DEFAULT ARRAY[
    'applied',
    'ai_screened',
    'assessment_pending',
    'assessment_completed',
    'ai_interview_pending',
    'ai_interviewed',
    'human_interview',
    'offer',
    'hired'
  ];
