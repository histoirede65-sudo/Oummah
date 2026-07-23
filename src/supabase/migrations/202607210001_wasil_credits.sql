create extension if not exists pgcrypto;

create table if not exists public.wasil_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_spent integer not null default 0 check (total_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wasil_requests (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('standard', 'deep')),
  status text not null check (status in ('reserved', 'completed', 'refunded')),
  credits integer not null check (credits > 0),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  provider_response_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.wasil_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.wasil_requests(id) on delete set null,
  amount integer not null check (amount <> 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists wasil_requests_user_created_idx
  on public.wasil_requests(user_id, created_at desc);
create index if not exists wasil_transactions_user_created_idx
  on public.wasil_credit_transactions(user_id, created_at desc);

alter table public.wasil_wallets enable row level security;
alter table public.wasil_requests enable row level security;
alter table public.wasil_credit_transactions enable row level security;

drop policy if exists "Users read their Wasil wallet" on public.wasil_wallets;
create policy "Users read their Wasil wallet"
  on public.wasil_wallets for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read their Wasil requests" on public.wasil_requests;
create policy "Users read their Wasil requests"
  on public.wasil_requests for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read their Wasil transactions" on public.wasil_credit_transactions;
create policy "Users read their Wasil transactions"
  on public.wasil_credit_transactions for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.ensure_wasil_wallet(
  p_user_id uuid,
  p_initial_balance integer default 0
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  insert into public.wasil_wallets(user_id, balance)
  values (p_user_id, greatest(0, p_initial_balance))
  on conflict (user_id) do nothing;

  if found and p_initial_balance > 0 then
    insert into public.wasil_credit_transactions(user_id, amount, reason)
    values (p_user_id, p_initial_balance, 'welcome');
  end if;

  select balance into v_balance
  from public.wasil_wallets where user_id = p_user_id;
  return v_balance;
end;
$$;

create or replace function public.reserve_wasil_credits(
  p_user_id uuid,
  p_request_id uuid,
  p_amount integer,
  p_mode text,
  p_model text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 or p_mode not in ('standard', 'deep') then
    raise exception 'INVALID_CREDIT_REQUEST';
  end if;

  update public.wasil_wallets
  set balance = balance - p_amount,
      total_spent = total_spent + p_amount,
      updated_at = now()
  where user_id = p_user_id and balance >= p_amount
  returning balance into v_balance;

  if v_balance is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.wasil_requests(id, user_id, mode, status, credits, model)
  values (p_request_id, p_user_id, p_mode, 'reserved', p_amount, p_model);
  insert into public.wasil_credit_transactions(user_id, request_id, amount, reason)
  values (p_user_id, p_request_id, -p_amount, 'wasil_request');
  return v_balance;
end;
$$;

create or replace function public.complete_wasil_request(
  p_request_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_provider_response_id text
) returns void
language sql
security definer
set search_path = public
as $$
  update public.wasil_requests
  set status = 'completed',
      input_tokens = p_input_tokens,
      output_tokens = p_output_tokens,
      provider_response_id = p_provider_response_id,
      completed_at = now()
  where id = p_request_id and status = 'reserved';
$$;

create or replace function public.refund_wasil_credits(
  p_user_id uuid,
  p_request_id uuid,
  p_reason text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount integer;
  v_balance integer;
begin
  update public.wasil_requests
  set status = 'refunded', completed_at = now()
  where id = p_request_id and user_id = p_user_id and status = 'reserved'
  returning credits into v_amount;

  if v_amount is null then
    select balance into v_balance from public.wasil_wallets where user_id = p_user_id;
    return v_balance;
  end if;

  update public.wasil_wallets
  set balance = balance + v_amount,
      total_spent = greatest(0, total_spent - v_amount),
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  insert into public.wasil_credit_transactions(user_id, request_id, amount, reason)
  values (p_user_id, p_request_id, v_amount, coalesce(p_reason, 'refund'));
  return v_balance;
end;
$$;

revoke all on function public.ensure_wasil_wallet(uuid, integer) from public, anon, authenticated;
revoke all on function public.reserve_wasil_credits(uuid, uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.complete_wasil_request(uuid, integer, integer, text) from public, anon, authenticated;
revoke all on function public.refund_wasil_credits(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.ensure_wasil_wallet(uuid, integer) to service_role;
grant execute on function public.reserve_wasil_credits(uuid, uuid, integer, text, text) to service_role;
grant execute on function public.complete_wasil_request(uuid, integer, integer, text) to service_role;
grant execute on function public.refund_wasil_credits(uuid, uuid, text) to service_role;
