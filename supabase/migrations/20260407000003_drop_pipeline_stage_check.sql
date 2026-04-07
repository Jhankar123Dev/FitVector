-- ── Drop hardcoded pipeline_stage CHECK constraint ───────────────────────────
-- The original applicants table was created with:
--   pipeline_stage TEXT NOT NULL DEFAULT 'applied'
--     CHECK (pipeline_stage IN ('applied', 'ai_screened', ...fixed list...))
--
-- This constraint blocks custom pipeline stages defined per-job (added in
-- 20260407000001_pipeline_stages_per_job.sql). Since stage values are now
-- controlled by job_posts.pipeline_stages (a TEXT[] column with no restriction),
-- the CHECK on applicants.pipeline_stage serves no purpose and must be removed.

ALTER TABLE applicants
  DROP CONSTRAINT IF EXISTS applicants_pipeline_stage_check;
