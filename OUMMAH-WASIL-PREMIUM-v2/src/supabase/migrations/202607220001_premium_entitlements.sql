create table if not exists public.premium_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'premium' check (tier in ('premium')),
  status text not null default 'inactive' check (
    status in ('trialing', 'active', 'past_due', 'paused', 'canceled', 'expired')
  ),
  source text not null default 'manual' check (
    source in ('apple', 'google', 'stripe', 'manual')
  ),
  current_period_end timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_entitlements enable row level security;

revoke all on public.premium_entitlements from anon, authenticated;
grant select on public.premium_entitlements to authenticated;

drop policy if exists "Users read their premium entitlement"
  on public.premium_entitlements;
create policy "Users read their premium entitlement"
  on public.premium_entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_my_premium_entitlement()
returns table (
  is_premium boolean,
  tier text,
  status text,
  current_period_end timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(
      entitlement.status in ('trialing', 'active')
      and (
        entitlement.current_period_end is null
        or entitlement.current_period_end > now()
      ),
      false
    ) as is_premium,
    coalesce(entitlement.tier, 'free') as tier,
    coalesce(entitlement.status, 'inactive') as status,
    entitlement.current_period_end
  from (select auth.uid() as user_id) as request_user
  left join public.premium_entitlements as entitlement
    on entitlement.user_id = request_user.user_id;
$$;

revoke all on function public.get_my_premium_entitlement()
  from public, anon;
grant execute on function public.get_my_premium_entitlement()
  to authenticated;
