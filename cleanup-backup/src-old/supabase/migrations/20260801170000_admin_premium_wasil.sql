-- OUMMAH — administration Premium & Wasil
-- Cette migration n'altère pas les abonnements RevenueCat existants.
-- Elle ajoute un override Premium manuel, cumulable avec les abonnements réels.

create table if not exists public.premium_manual_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  reason text not null,
  active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_manual_grants_period_check
    check (ends_at > starts_at)
);

alter table public.premium_manual_grants enable row level security;
revoke all on public.premium_manual_grants from anon, authenticated;

create or replace function public.get_my_manual_premium_override()
returns table (
  active boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    (
      grant_row.active
      and grant_row.starts_at <= now()
      and grant_row.ends_at > now()
    ) as active,
    grant_row.starts_at,
    grant_row.ends_at,
    grant_row.reason
  from public.premium_manual_grants grant_row
  where grant_row.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.admin_list_premium_users(
  p_search text default null,
  p_limit integer default 100
)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  balance integer,
  total_spent integer,
  manual_premium_active boolean,
  manual_premium_starts_at timestamptz,
  manual_premium_ends_at timestamptz,
  manual_premium_reason text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  return query
  select
    account.id,
    account.email::text,
    account.created_at,
    coalesce(wallet.balance, 0)::integer,
    coalesce(wallet.total_spent, 0)::integer,
    coalesce(
      grant_row.active
      and grant_row.starts_at <= now()
      and grant_row.ends_at > now(),
      false
    ),
    grant_row.starts_at,
    grant_row.ends_at,
    grant_row.reason
  from auth.users account
  left join public.wasil_wallets wallet
    on wallet.user_id = account.id
  left join public.premium_manual_grants grant_row
    on grant_row.user_id = account.id
  where
    p_search is null
    or trim(p_search) = ''
    or lower(coalesce(account.email, ''))
      like '%' || lower(trim(p_search)) || '%'
  order by
    coalesce(
      grant_row.active
      and grant_row.ends_at > now(),
      false
    ) desc,
    account.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
end;
$$;

create or replace function public.admin_grant_manual_premium(
  p_user_id uuid,
  p_months integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_end timestamptz;
  next_start timestamptz;
  next_end timestamptz;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if p_months not in (1, 3, 12) then
    raise exception 'ADMIN_PREMIUM_DURATION_INVALID';
  end if;

  if not exists (
    select 1 from auth.users where id = p_user_id
  ) then
    raise exception 'ADMIN_USER_NOT_FOUND';
  end if;

  select ends_at
  into current_end
  from public.premium_manual_grants
  where user_id = p_user_id
    and active = true
    and ends_at > now();

  next_start := now();
  next_end :=
    greatest(coalesce(current_end, now()), now())
    + make_interval(months => p_months);

  insert into public.premium_manual_grants (
    user_id,
    starts_at,
    ends_at,
    reason,
    active,
    granted_by,
    revoked_at,
    revoked_by,
    revocation_reason,
    updated_at
  )
  values (
    p_user_id,
    next_start,
    next_end,
    coalesce(nullif(trim(p_reason), ''), 'Premium offert par OUMMAH'),
    true,
    auth.uid(),
    null,
    null,
    null,
    now()
  )
  on conflict (user_id)
  do update set
    starts_at = case
      when public.premium_manual_grants.active
        and public.premium_manual_grants.ends_at > now()
      then public.premium_manual_grants.starts_at
      else excluded.starts_at
    end,
    ends_at = excluded.ends_at,
    reason = excluded.reason,
    active = true,
    granted_by = auth.uid(),
    revoked_at = null,
    revoked_by = null,
    revocation_reason = null,
    updated_at = now();
end;
$$;

create or replace function public.admin_revoke_manual_premium(
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  update public.premium_manual_grants
  set
    active = false,
    revoked_at = now(),
    revoked_by = auth.uid(),
    revocation_reason = coalesce(
      nullif(trim(p_reason), ''),
      'Premium manuel retiré'
    ),
    updated_at = now()
  where user_id = p_user_id;

  if not found then
    raise exception 'ADMIN_MANUAL_PREMIUM_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.admin_get_premium_wasil_overview()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  purchase_count bigint := 0;
  gross_cents numeric := 0;
  ai_cost_usd numeric := 0;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  -- Lecture dynamique : aucun nom de colonne monétaire n'est imposé.
  if to_regclass('public.wasil_credit_purchases') is not null then
    execute $dynamic$
      select
        count(*),
        coalesce(
          sum(
            coalesce(
              nullif(to_jsonb(purchase_row)->>'amount_cents', '')::numeric,
              nullif(to_jsonb(purchase_row)->>'price_cents', '')::numeric,
              nullif(to_jsonb(purchase_row)->>'gross_amount_cents', '')::numeric,
              nullif(to_jsonb(purchase_row)->>'revenue_cents', '')::numeric,
              0
            )
          ),
          0
        )
      from public.wasil_credit_purchases purchase_row
    $dynamic$
    into purchase_count, gross_cents;
  end if;

  if to_regclass('public.wasil_cost_observations') is not null then
    execute $dynamic$
      select
        coalesce(
          sum(
            coalesce(
              nullif(to_jsonb(cost_row)->>'cost_usd', '')::numeric,
              nullif(to_jsonb(cost_row)->>'estimated_cost_usd', '')::numeric,
              nullif(to_jsonb(cost_row)->>'total_cost_usd', '')::numeric,
              nullif(to_jsonb(cost_row)->>'usd_cost', '')::numeric,
              0
            )
          ),
          0
        )
      from public.wasil_cost_observations cost_row
    $dynamic$
    into ai_cost_usd;
  end if;

  return jsonb_build_object(
    'total_users', (
      select count(*) from auth.users
    ),
    'active_manual_premium', (
      select count(*)
      from public.premium_manual_grants
      where active = true
        and starts_at <= now()
        and ends_at > now()
    ),
    'expiring_7d', (
      select count(*)
      from public.premium_manual_grants
      where active = true
        and ends_at > now()
        and ends_at <= now() + interval '7 days'
    ),
    'wallets_total', (
      select count(*) from public.wasil_wallets
    ),
    'credits_available', (
      select coalesce(sum(balance), 0)
      from public.wasil_wallets
    ),
    'credits_spent', (
      select coalesce(sum(total_spent), 0)
      from public.wasil_wallets
    ),
    'credit_purchase_count', purchase_count,
    'estimated_gross_cents', gross_cents,
    'estimated_ai_cost_usd', ai_cost_usd
  );
end;
$$;

revoke all on function public.get_my_manual_premium_override() from public;
revoke all on function public.admin_list_premium_users(text, integer) from public;
revoke all on function public.admin_grant_manual_premium(uuid, integer, text) from public;
revoke all on function public.admin_revoke_manual_premium(uuid, text) from public;
revoke all on function public.admin_get_premium_wasil_overview() from public;

grant execute on function public.get_my_manual_premium_override()
to authenticated;
grant execute on function public.admin_list_premium_users(text, integer)
to authenticated;
grant execute on function public.admin_grant_manual_premium(uuid, integer, text)
to authenticated;
grant execute on function public.admin_revoke_manual_premium(uuid, text)
to authenticated;
grant execute on function public.admin_get_premium_wasil_overview()
to authenticated;

notify pgrst, 'reload schema';
