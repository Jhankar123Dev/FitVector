-- Migration: swap embedding dimensions from 1536 to 384
-- Run this in the Supabase SQL Editor to update the live database.
-- Reason: Switching from OpenAI text-embedding-3-small (1536-dim)
--         to HuggingFace all-MiniLM-L6-v2 (384-dim, runs locally).

-- 1. Drop existing indexes first, or Postgres will block the ALTER TABLE
DROP INDEX IF EXISTS idx_profiles_embedding;
DROP INDEX IF EXISTS idx_jobs_embedding;

-- 2. Alter the column dimensions
ALTER TABLE user_profiles ALTER COLUMN embedding TYPE vector(384);
ALTER TABLE jobs ALTER COLUMN embedding TYPE vector(384);

-- 3. Update embedding model metadata
ALTER TABLE user_profiles ALTER COLUMN embedding_model SET DEFAULT 'all-MiniLM-L6-v2';
ALTER TABLE jobs ALTER COLUMN embedding_model SET DEFAULT 'all-MiniLM-L6-v2';

-- 4. Update AI model defaults
ALTER TABLE tailored_resumes ALTER COLUMN ai_model SET DEFAULT 'gemini-2.0-flash';
ALTER TABLE generated_outreach ALTER COLUMN ai_model SET DEFAULT 'gemini-2.0-flash';

-- 5. Recreate the indexes with the new dimension size
CREATE INDEX idx_profiles_embedding ON user_profiles USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat(embedding vector_cosine_ops) WITH (lists = 200);
