create table if not exists public.wasil_documentary_verification_cache (
  cache_key text primary key,
  selection jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wasil_documentary_verification_cache enable row level security;

revoke all on table public.wasil_documentary_verification_cache from anon, authenticated;

create index if not exists wasil_documentary_verification_cache_expires_at_idx
  on public.wasil_documentary_verification_cache (expires_at);
