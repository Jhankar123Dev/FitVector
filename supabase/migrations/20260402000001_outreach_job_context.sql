-- Add job context columns to generated_outreach so messages can be grouped by job
ALTER TABLE generated_outreach
  ADD COLUMN IF NOT EXISTS job_title   TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT;
