create table if not exists public.wasil_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  store_transaction_id text,
  app_user_id text not null,
  product_id text not null,
  environment text not null,
  platform text not null,
  credits_granted integer not null,
  status text not null,
  purchased_at timestamptz,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint wasil_credit_purchases_event_id_not_blank
    check (length(btrim(event_id)) > 0),
  constraint wasil_credit_purchases_app_user_id_not_blank
    check (length(btrim(app_user_id)) > 0),
  constraint wasil_credit_purchases_product_id_not_blank
    check (length(btrim(product_id)) > 0),
  constraint wasil_credit_purchases_store_transaction_id_not_blank
    check (store_transaction_id is null or length(btrim(store_transaction_id)) > 0),
  constraint wasil_credit_purchases_credits_positive
    check (credits_granted > 0),
  constraint wasil_credit_purchases_environment_allowed
    check (environment in ('test', 'production')),
  constraint wasil_credit_purchases_platform_allowed
    check (platform in ('revenuecat_test', 'ios', 'android')),
  constraint wasil_credit_purchases_status_allowed
    check (status in ('credited', 'duplicate', 'refunded', 'reversed', 'failed')),
  constraint wasil_credit_purchases_event_id_key
    unique (event_id),
  constraint wasil_credit_purchases_store_transaction_id_key
    unique (store_transaction_id)
);

create index if not exists wasil_credit_purchases_user_created_idx
  on public.wasil_credit_purchases(user_id, created_at desc);

create index if not exists wasil_credit_purchases_product_lookup_idx
  on public.wasil_credit_purchases(product_id, environment, platform);

alter table public.wasil_credit_purchases enable row level security;

revoke all on table public.wasil_credit_purchases from public, anon, authenticated;
grant all on table public.wasil_credit_purchases to service_role;

create or replace function public.grant_wasil_purchase_credits(
  p_user_id uuid,
  p_event_id text,
  p_app_user_id text,
  p_product_id text,
  p_environment text,
  p_platform text,
  p_store_transaction_id text default null,
  p_purchased_at timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
) returns table (
  purchase_id uuid,
  already_processed boolean,
  credits_added integer,
  new_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.wasil_credit_products%rowtype;
  v_purchase public.wasil_credit_purchases%rowtype;
  v_purchase_id uuid;
  v_balance integer;
begin
  if p_user_id is null
     or p_event_id is null
     or length(btrim(p_event_id)) = 0
     or p_app_user_id is null
     or length(btrim(p_app_user_id)) = 0
     or p_product_id is null
     or length(btrim(p_product_id)) = 0
     or p_environment is null
     or p_platform is null then
    raise exception 'INVALID_WASIL_PURCHASE';
  end if;

  if p_app_user_id <> p_user_id::text then
    raise exception 'WASIL_APP_USER_MISMATCH';
  end if;

  if p_environment not in ('test', 'production') then
    raise exception 'INVALID_WASIL_PURCHASE_ENVIRONMENT';
  end if;

  if p_platform not in ('revenuecat_test', 'ios', 'android') then
    raise exception 'INVALID_WASIL_PURCHASE_PLATFORM';
  end if;

  select * into v_product
  from public.wasil_credit_products
  where product_id = p_product_id
    and environment = p_environment
    and platform = p_platform
    and active = true;

  if not found then
    raise exception 'WASIL_PRODUCT_NOT_FOUND_OR_INACTIVE';
  end if;

  select * into v_purchase
  from public.wasil_credit_purchases
  where event_id = p_event_id
     or (p_store_transaction_id is not null
         and store_transaction_id = p_store_transaction_id)
  order by created_at
  limit 1;

  if found then
    if v_purchase.user_id <> p_user_id
       or v_purchase.app_user_id <> p_app_user_id then
      raise exception 'WASIL_PURCHASE_IDENTITY_CONFLICT';
    end if;

    select balance into v_balance
    from public.wasil_wallets
    where user_id = p_user_id;

    return query select
      v_purchase.id,
      true,
      0,
      coalesce(v_balance, 0);
    return;
  end if;

  perform public.ensure_wasil_wallet(p_user_id, 0);

  insert into public.wasil_credit_purchases (
    user_id,
    event_id,
    store_transaction_id,
    app_user_id,
    product_id,
    environment,
    platform,
    credits_granted,
    status,
    purchased_at,
    metadata
  )
  values (
    p_user_id,
    p_event_id,
    nullif(btrim(p_store_transaction_id), ''),
    p_app_user_id,
    v_product.product_id,
    v_product.environment,
    v_product.platform,
    v_product.credits,
    'credited',
    p_purchased_at,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_purchase_id;

  update public.wasil_wallets
  set balance = balance + v_product.credits,
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  if v_balance is null then
    raise exception 'WASIL_WALLET_NOT_FOUND';
  end if;

  insert into public.wasil_credit_transactions (
    user_id,
    amount,
    reason
  )
  values (
    p_user_id,
    v_product.credits,
    'purchase'
  );

  return query select v_purchase_id, false, v_product.credits, v_balance;
exception
  when unique_violation then
    select * into v_purchase
    from public.wasil_credit_purchases
    where event_id = p_event_id
       or (p_store_transaction_id is not null
           and store_transaction_id = p_store_transaction_id)
    order by created_at
    limit 1;

    if found then
      if v_purchase.user_id <> p_user_id
         or v_purchase.app_user_id <> p_app_user_id then
        raise exception 'WASIL_PURCHASE_IDENTITY_CONFLICT';
      end if;

      select balance into v_balance
      from public.wasil_wallets
      where user_id = p_user_id;

      return query select v_purchase.id, true, 0, coalesce(v_balance, 0);
      return;
    end if;

    raise;
end;
$$;

revoke all on function public.grant_wasil_purchase_credits(
  uuid, text, text, text, text, text, text, timestamptz, jsonb
) from public, anon, authenticated;
grant execute on function public.grant_wasil_purchase_credits(
  uuid, text, text, text, text, text, text, timestamptz, jsonb
) to service_role;
