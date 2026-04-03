-- ─────────────────────────────────────────────────────────────────────────────
-- Link applications table to fitvector_applications so employer status
-- changes (reject / advance) can be reflected on the seeker's tracker.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS fitvector_app_id UUID REFERENCES fitvector_applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_fv_app
  ON applications(fitvector_app_id)
  WHERE fitvector_app_id IS NOT NULL;
