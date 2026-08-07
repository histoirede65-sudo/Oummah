-- OUMMAH — fiche utilisateur et historique des crédits administrateur

create or replace function public.admin_get_user_detail(
  p_user_id uuid
)
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

  if not exists (
    select 1
    from auth.users
    where id = p_user_id
  ) then
    raise exception 'ADMIN_USER_NOT_FOUND';
  end if;

  select jsonb_build_object(
    'user_id', target.id,
    'email', target.email,
    'created_at', target.created_at,
    'last_sign_in_at', target.last_sign_in_at,
    'balance', coalesce(wallet.balance, 0),
    'total_spent', coalesce(wallet.total_spent, 0),
    'adjustment_count', (
      select count(*)
      from public.admin_credit_adjustments adjustment
      where adjustment.target_user_id = target.id
    ),
    'adjustment_total', (
      select coalesce(sum(adjustment.amount), 0)
      from public.admin_credit_adjustments adjustment
      where adjustment.target_user_id = target.id
    )
  )
  into result
  from auth.users target
  left join public.wasil_wallets wallet
    on wallet.user_id = target.id
  where target.id = p_user_id;

  return result;
end;
$$;

create or replace function public.admin_list_user_credit_adjustments(
  p_user_id uuid,
  p_limit integer default 100
)
returns table (
  id uuid,
  amount integer,
  reason text,
  admin_email text,
  created_at timestamptz
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
    adjustment.id,
    adjustment.amount,
    adjustment.reason,
    admin_user.email::text,
    adjustment.created_at
  from public.admin_credit_adjustments adjustment
  left join auth.users admin_user
    on admin_user.id = adjustment.admin_user_id
  where adjustment.target_user_id = p_user_id
  order by adjustment.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
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
  current_balance integer;
  next_balance integer;
  cleaned_reason text;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if p_amount = 0 or p_amount is null then
    raise exception 'ADMIN_CREDIT_AMOUNT_INVALID';
  end if;

  cleaned_reason := trim(coalesce(p_reason, ''));

  if char_length(cleaned_reason) < 3 then
    raise exception 'ADMIN_CREDIT_REASON_REQUIRED';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = p_user_id
  ) then
    raise exception 'ADMIN_USER_NOT_FOUND';
  end if;

  insert into public.wasil_wallets (
    user_id,
    balance,
    total_spent,
    updated_at
  )
  values (
    p_user_id,
    0,
    0,
    now()
  )
  on conflict (user_id)
  do nothing;

  select balance
  into current_balance
  from public.wasil_wallets
  where user_id = p_user_id
  for update;

  if current_balance + p_amount < 0 then
    raise exception 'ADMIN_CREDIT_BALANCE_INSUFFICIENT';
  end if;

  update public.wasil_wallets
  set
    balance = balance + p_amount,
    updated_at = now()
  where user_id = p_user_id
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
    cleaned_reason
  );

  return jsonb_build_object(
    'balance', next_balance,
    'amount', p_amount,
    'reason', cleaned_reason
  );
end;
$$;

revoke all on function public.admin_get_user_detail(uuid) from public;
revoke all on function public.admin_list_user_credit_adjustments(uuid, integer) from public;
revoke all on function public.admin_adjust_wasil_credits(uuid, integer, text) from public;

grant execute on function public.admin_get_user_detail(uuid) to authenticated;
grant execute on function public.admin_list_user_credit_adjustments(uuid, integer) to authenticated;
grant execute on function public.admin_adjust_wasil_credits(uuid, integer, text) to authenticated;

notify pgrst, 'reload schema';
