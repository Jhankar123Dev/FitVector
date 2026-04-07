-- ── Multi-interviewer support: interview_participants junction table ──────────
-- Replaces the single interviewer_id FK on human_interviews with a proper
-- junction table that supports multiple participants per interview, per-participant
-- roles, and mirrors Google Calendar RSVP response statuses.
--
-- The lead interviewer_id column on human_interviews is kept for backwards
-- compatibility and simpler single-interviewer queries.

CREATE TABLE IF NOT EXISTS interview_participants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  human_interview_id  UUID NOT NULL REFERENCES human_interviews(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL DEFAULT 'interviewer'
                        CHECK (role IN ('lead', 'interviewer', 'shadow', 'hiring_manager')),
  response_status     TEXT NOT NULL DEFAULT 'needsAction'
                        CHECK (response_status IN ('needsAction', 'accepted', 'declined', 'tentative')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (human_interview_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_participants_interview
  ON interview_participants(human_interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_participants_user
  ON interview_participants(user_id);

ALTER TABLE interview_participants ENABLE ROW LEVEL SECURITY;

-- Mirror human_interviews RLS: company members only
CREATE POLICY interview_participants_select ON interview_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM human_interviews hi
      WHERE hi.id = interview_participants.human_interview_id
        AND is_company_member(get_job_post_company(hi.job_post_id))
    )
  );

CREATE POLICY interview_participants_insert ON interview_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM human_interviews hi
      WHERE hi.id = interview_participants.human_interview_id
        AND is_company_member(get_job_post_company(hi.job_post_id))
    )
  );

CREATE POLICY interview_participants_update ON interview_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM human_interviews hi
      WHERE hi.id = interview_participants.human_interview_id
        AND is_company_member(get_job_post_company(hi.job_post_id))
    )
  );

-- Backfill: every existing human_interview gets its interviewer_id as lead participant
INSERT INTO interview_participants (human_interview_id, user_id, role)
SELECT id, interviewer_id, 'lead'
FROM human_interviews
ON CONFLICT (human_interview_id, user_id) DO NOTHING;
