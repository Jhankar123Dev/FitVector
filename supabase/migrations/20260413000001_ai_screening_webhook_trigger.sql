-- ─── AI Screening Webhook Trigger ────────────────────────────────────────────
-- When an applicant's pipeline_stage is set to 'ai_screening_in_progress',
-- this trigger asynchronously POSTs to the Python AI engine via pg_net.
-- The Python engine performs Gemini resume evaluation and writes 'ai_screened'
-- + results back to the DB when complete, triggering Supabase Realtime for the UI.
--
-- Requires: pg_net extension (enabled by default on Supabase cloud)
-- Python service URL is read from app.settings.python_service_url DB setting;
-- set it once per environment:
--   ALTER DATABASE postgres SET app.settings.python_service_url = 'https://your-python-service.com';
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper function invoked by the trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_ai_screening_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  python_url  TEXT;
  secret_key  TEXT;
  payload     JSONB;
BEGIN
  -- Only fire when pipeline_stage transitions TO 'ai_screening_in_progress'
  IF NEW.pipeline_stage IS DISTINCT FROM 'ai_screening_in_progress' THEN
    RETURN NEW;
  END IF;
  IF OLD.pipeline_stage = 'ai_screening_in_progress' THEN
    -- Avoid re-firing on unrelated updates while already in_progress
    RETURN NEW;
  END IF;

  -- Read Python service URL from DB-level setting (configure per environment)
  python_url := current_setting('app.settings.python_service_url', true);
  IF python_url IS NULL OR python_url = '' THEN
    python_url := 'http://localhost:8000';  -- local dev fallback
  END IF;

  -- Read internal service secret
  secret_key := current_setting('app.settings.python_service_secret', true);
  IF secret_key IS NULL THEN
    secret_key := '';
  END IF;

  payload := jsonb_build_object(
    'applicant_id', NEW.id,
    'job_post_id',  NEW.job_post_id
  );

  -- Fire-and-forget HTTP POST via pg_net (fully async — does not block the UPDATE)
  PERFORM net.http_post(
    url     := python_url || '/ai/screen-applicant',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'X-Internal-Key', secret_key
    ),
    body    := payload::text
  );

  RETURN NEW;
END;
$$;

-- ── Trigger on applicants table ───────────────────────────────────────────────
DROP TRIGGER IF EXISTS ai_screening_webhook_trigger ON applicants;

CREATE TRIGGER ai_screening_webhook_trigger
AFTER UPDATE OF pipeline_stage ON applicants
FOR EACH ROW
EXECUTE FUNCTION trigger_ai_screening_webhook();

-- ── Column for storing screening results (idempotent) ─────────────────────────
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS ai_screening_result  JSONB    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_screening_score   INTEGER  DEFAULT NULL;

COMMENT ON COLUMN applicants.ai_screening_result IS
  'Gemini screening output: {overall_score, hire_recommendation, summary, strengths, gaps, skill_match}';
COMMENT ON COLUMN applicants.ai_screening_score IS
  'Shortcut integer 0-100 from ai_screening_result for fast sorting/filtering';
