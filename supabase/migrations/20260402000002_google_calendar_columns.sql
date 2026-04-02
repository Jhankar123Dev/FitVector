-- Store Google OAuth refresh token and calendar connection flag on the users row.
-- The refresh token is used server-side to call the Google Calendar API on behalf of the user.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_refresh_token   TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN NOT NULL DEFAULT FALSE;
