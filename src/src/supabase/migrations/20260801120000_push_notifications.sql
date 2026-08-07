create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  audience_tier text not null default 'free'
    check (audience_tier in ('free', 'premium')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists user_push_tokens_target_idx
on public.user_push_tokens(enabled, audience_tier);

alter table public.user_push_tokens enable row level security;

create or replace function public.register_my_push_token(
  p_expo_push_token text,
  p_platform text,
  p_audience_tier text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_platform not in ('ios', 'android') then
    raise exception 'INVALID_PLATFORM';
  end if;

  if p_audience_tier not in ('free', 'premium') then
    raise exception 'INVALID_AUDIENCE_TIER';
  end if;

  insert into public.user_push_tokens (
    user_id,
    expo_push_token,
    platform,
    audience_tier,
    enabled,
    last_seen_at
  )
  values (
    auth.uid(),
    trim(p_expo_push_token),
    p_platform,
    p_audience_tier,
    true,
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = auth.uid(),
    platform = excluded.platform,
    audience_tier = excluded.audience_tier,
    enabled = true,
    last_seen_at = now();
end;
$$;

revoke all on public.user_push_tokens from anon, authenticated;
revoke all on function public.register_my_push_token(text, text, text) from public;
grant execute on function public.register_my_push_token(text, text, text) to authenticated;

create table if not exists public.admin_push_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  audience text not null check (audience in ('all', 'free', 'premium')),
  route text not null default '/',
  targeted_devices integer not null default 0,
  successful_deliveries integer not null default 0,
  failed_deliveries integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.admin_push_campaigns enable row level security;
revoke all on public.admin_push_campaigns from anon, authenticated;

notify pgrst, 'reload schema';
