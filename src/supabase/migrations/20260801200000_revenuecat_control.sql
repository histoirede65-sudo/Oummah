-- OUMMAH — contrôle et réconciliation RevenueCat

alter table public.revenuecat_customer_subscriptions
  add column if not exists reconciliation_note text,
  add column if not exists reconciled_at timestamptz,
  add column if not exists reconciled_by uuid
    references auth.users(id) on delete set null;

create or replace function public.admin_get_revenuecat_control()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  summary_value jsonb;
  events_value jsonb;
  unlinked_value jsonb;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select jsonb_build_object(
    'events_24h', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '24 hours'
    ),
    'production_events_24h', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '24 hours'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
    ),
    'sandbox_events_24h', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '24 hours'
        and environment = 'SANDBOX'
        and event_type <> 'TEST'
    ),
    'test_events_24h', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '24 hours'
        and event_type = 'TEST'
    ),
    'unlinked_subscriptions', (
      select count(*)
      from public.revenuecat_customer_subscriptions
      where user_id is null
        and latest_event_type <> 'TEST'
    ),
    'stale_subscriptions', (
      select count(*)
      from public.revenuecat_customer_subscriptions
      where updated_at < now() - interval '30 days'
        and active = true
        and latest_event_type <> 'TEST'
    )
  )
  into summary_value;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'event_id', event_row.event_id,
        'event_type', event_row.event_type,
        'app_user_id', event_row.app_user_id,
        'product_id', event_row.product_id,
        'store', event_row.store,
        'environment', event_row.environment,
        'price_usd', coalesce(event_row.price_usd, 0),
        'received_at', event_row.received_at
      )
      order by event_row.received_at desc
    ),
    '[]'::jsonb
  )
  into events_value
  from (
    select *
    from public.revenuecat_webhook_events
    order by received_at desc
    limit 100
  ) event_row;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'app_user_id', subscription.app_user_id,
        'product_id', subscription.product_id,
        'store', subscription.store,
        'environment', subscription.environment,
        'latest_event_type', subscription.latest_event_type,
        'expiration_at', subscription.expiration_at,
        'updated_at', subscription.updated_at,
        'suggested_email',
          subscription.raw_event #>> '{subscriber_attributes,$email,value}'
      )
      order by subscription.updated_at desc
    ),
    '[]'::jsonb
  )
  into unlinked_value
  from public.revenuecat_customer_subscriptions subscription
  where subscription.user_id is null
    and subscription.latest_event_type <> 'TEST';

  return jsonb_build_object(
    'summary', summary_value,
    'events', events_value,
    'unlinked', unlinked_value
  );
end;
$$;

create or replace function public.admin_reconcile_revenuecat_subscription(
  p_app_user_id text,
  p_product_id text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
  clean_email text;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  clean_email := lower(trim(coalesce(p_email, '')));

  select id
  into target_user_id
  from auth.users
  where lower(email) = clean_email
  limit 1;

  if target_user_id is null then
    raise exception 'ADMIN_USER_NOT_FOUND';
  end if;

  update public.revenuecat_customer_subscriptions
  set
    user_id = target_user_id,
    reconciliation_note = 'Association manuelle par adresse e-mail',
    reconciled_at = now(),
    reconciled_by = auth.uid(),
    updated_at = now()
  where app_user_id = p_app_user_id
    and product_id = p_product_id;

  if not found then
    raise exception 'REVENUECAT_SUBSCRIPTION_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.admin_get_revenuecat_control() from public;
revoke all on function
  public.admin_reconcile_revenuecat_subscription(text, text, text)
from public;

grant execute on function public.admin_get_revenuecat_control()
to authenticated;

grant execute on function
  public.admin_reconcile_revenuecat_subscription(text, text, text)
to authenticated;

notify pgrst, 'reload schema';
