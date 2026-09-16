-- OUMMAH — centre de pilotage administrateur
-- Compte autorisé : bahri13015@hotmail.fr

create table if not exists public.admin_credit_adjustments (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_credit_adjustments enable row level security;

create or replace function public.is_oummah_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) =
    'bahri13015@hotmail.fr';
$$;

revoke all on function public.is_oummah_admin() from public;
grant execute on function public.is_oummah_admin() to authenticated;

create or replace function public.admin_get_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result jsonb;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'users_today', (
      select count(*) from auth.users
      where created_at >= date_trunc('day', now())
    ),
    'mosque_pending', (
      select count(*) from public.mosque_submissions
      where validation_status = 'pending'
    ),
    'mosque_approved', (
      select count(*) from public.mosque_submissions
      where validation_status = 'approved'
    ),
    'mosque_rejected', (
      select count(*) from public.mosque_submissions
      where validation_status = 'rejected'
    ),
    'wallets_total', (select count(*) from public.wasil_wallets),
    'credits_available', (
      select coalesce(sum(balance), 0) from public.wasil_wallets
    ),
    'credits_spent', (
      select coalesce(sum(total_spent), 0) from public.wasil_wallets
    )
  )
  into result;

  return result;
end;
$$;

create or replace function public.admin_list_users(
  p_search text default null,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  balance integer,
  total_spent integer
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
    u.id,
    u.email::text,
    u.created_at,
    coalesce(w.balance, 0)::integer,
    coalesce(w.total_spent, 0)::integer
  from auth.users u
  left join public.wasil_wallets w on w.user_id = u.id
  where
    p_search is null
    or trim(p_search) = ''
    or lower(coalesce(u.email, '')) like '%' || lower(trim(p_search)) || '%'
  order by u.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
end;
$$;

create or replace function public.admin_adjust_wasil_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  next_balance integer;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if p_amount = 0 or p_amount is null then
    raise exception 'ADMIN_CREDIT_AMOUNT_INVALID';
  end if;

  insert into public.wasil_wallets (
    user_id,
    balance,
    total_spent,
    updated_at
  )
  values (
    p_user_id,
    greatest(p_amount, 0),
    0,
    now()
  )
  on conflict (user_id)
  do update set
    balance = greatest(
      0,
      public.wasil_wallets.balance + p_amount
    ),
    updated_at = now()
  returning balance into next_balance;

  insert into public.admin_credit_adjustments (
    admin_user_id,
    target_user_id,
    amount,
    reason
  )
  values (
    auth.uid(),
    p_user_id,
    p_amount,
    coalesce(nullif(trim(p_reason), ''), 'Ajustement administrateur')
  );

  return jsonb_build_object('balance', next_balance);
end;
$$;

revoke all on function public.admin_get_dashboard() from public;
revoke all on function public.admin_list_users(text, integer) from public;
revoke all on function public.admin_adjust_wasil_credits(uuid, integer, text) from public;

grant execute on function public.admin_get_dashboard() to authenticated;
grant execute on function public.admin_list_users(text, integer) to authenticated;
grant execute on function public.admin_adjust_wasil_credits(uuid, integer, text) to authenticated;

-- Aucun accès direct public à l'historique des ajustements.
revoke all on public.admin_credit_adjustments from anon, authenticated;
