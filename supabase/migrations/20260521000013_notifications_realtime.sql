-- ================================================================
-- Enable Supabase Realtime on the notifications table.
-- Without this, postgres_changes events are not broadcast
-- even if the client subscribes to the channel.
-- ================================================================

-- Add notifications to the realtime publication
-- (supabase_realtime publication is created by Supabase automatically)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify:
SELECT pubname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';
