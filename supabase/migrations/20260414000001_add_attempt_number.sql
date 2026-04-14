-- Add attempt_number to assessment_submissions
-- Required by the re-invite API (POST /api/employer/assessments/[id]/reinvite)
-- which inserts a new row per re-invite with attempt_number = prior_count + 1.
-- Default 1 so all existing rows are treated as first attempts.

ALTER TABLE public.assessment_submissions
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1;
