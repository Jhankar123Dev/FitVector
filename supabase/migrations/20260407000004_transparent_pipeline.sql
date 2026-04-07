-- ── Hyper-Transparency: per-company transparent pipeline flag ────────────────
-- When is_transparent_pipeline = true, the candidate tracker shows the raw
-- pipeline_stage name (e.g. "Phone Screen") instead of the generic bucket
-- label (e.g. "Under Review"). Controlled exclusively by Super Admin.
-- The fitvector_applications.status ENUM is NOT affected.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_transparent_pipeline BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN companies.is_transparent_pipeline IS
  'When true, candidates see raw pipeline stage names in their tracker instead of generic bucket labels. Toggled by Super Admin only.';
