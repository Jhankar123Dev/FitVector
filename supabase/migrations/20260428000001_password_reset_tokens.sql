-- Password reset tokens
-- Tokens are single-use and expire after 1 hour.
-- Only the SHA-256 hash of the raw token is stored (never the raw value).

create table if not exists public.password_reset_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  token_hash    text not null unique,          -- SHA-256(raw_token), hex-encoded
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Index for fast lookup by hash during validation
create index if not exists idx_password_reset_tokens_hash
  on public.password_reset_tokens (token_hash);

-- Only service-role key can read/write; no RLS bypass needed for anon/authed
alter table public.password_reset_tokens enable row level security;

-- No public policies — all access is through the service-role admin client in API routes
