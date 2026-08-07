-- OUMMAH — séparation TEST / SANDBOX / PRODUCTION RevenueCat

alter table public.revenuecat_webhook_events
  add column if not exists is_test_event boolean not null default false;

update public.revenuecat_webhook_events
set is_test_event = true
where event_type = 'TEST';

update public.revenuecat_customer_subscriptions
set active = false
where latest_event_type = 'TEST';

create or replace function public.admin_get_revenuecat_finance_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  overview_value jsonb;
  products_value jsonb;
  stores_value jsonb;
  subscribers_value jsonb;
  wasil_risk_value jsonb;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select jsonb_build_object(
    'active_subscriptions', (
      select count(*)
      from public.revenuecat_customer_subscriptions
      where active = true
        and environment = 'PRODUCTION'
        and latest_event_type <> 'TEST'
        and (expiration_at is null or expiration_at > now())
    ),
    'trials_active', (
      select count(*)
      from public.revenuecat_customer_subscriptions
      where active = true
        and environment = 'PRODUCTION'
        and latest_event_type <> 'TEST'
        and is_trial = true
        and (expiration_at is null or expiration_at > now())
    ),
    'revenue_today_usd', (
      select coalesce(sum(greatest(coalesce(price_usd, 0), 0)), 0)
      from public.revenuecat_webhook_events
      where received_at >= date_trunc('day', now())
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in (
          'INITIAL_PURCHASE',
          'RENEWAL',
          'NON_RENEWING_PURCHASE',
          'UNCANCELLATION',
          'SUBSCRIPTION_EXTENDED'
        )
    ),
    'revenue_7d_usd', (
      select coalesce(sum(greatest(coalesce(price_usd, 0), 0)), 0)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '7 days'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in (
          'INITIAL_PURCHASE',
          'RENEWAL',
          'NON_RENEWING_PURCHASE',
          'UNCANCELLATION',
          'SUBSCRIPTION_EXTENDED'
        )
    ),
    'revenue_30d_usd', (
      select coalesce(sum(greatest(coalesce(price_usd, 0), 0)), 0)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '30 days'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in (
          'INITIAL_PURCHASE',
          'RENEWAL',
          'NON_RENEWING_PURCHASE',
          'UNCANCELLATION',
          'SUBSCRIPTION_EXTENDED'
        )
    ),
    'revenue_lifetime_usd', (
      select coalesce(sum(greatest(coalesce(price_usd, 0), 0)), 0)
      from public.revenuecat_webhook_events
      where environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in (
          'INITIAL_PURCHASE',
          'RENEWAL',
          'NON_RENEWING_PURCHASE',
          'UNCANCELLATION',
          'SUBSCRIPTION_EXTENDED'
        )
    ),
    'refunds_30d_usd', (
      select coalesce(sum(abs(coalesce(price_usd, 0))), 0)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '30 days'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in ('REFUND', 'REFUND_REVERSED')
    ),
    'refund_events_30d', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '30 days'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and event_type in ('REFUND', 'REFUND_REVERSED')
    ),
    'billing_issues_active', (
      select count(*)
      from public.revenuecat_customer_subscriptions
      where billing_issue_detected_at is not null
        and environment = 'PRODUCTION'
        and latest_event_type <> 'TEST'
        and active = true
    ),
    'events_30d', (
      select count(*)
      from public.revenuecat_webhook_events
      where received_at >= now() - interval '30 days'
        and environment = 'PRODUCTION'
        and event_type <> 'TEST'
    )
  )
  into overview_value;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', product_rows.product_id,
        'active_subscribers', product_rows.active_subscribers,
        'revenue_30d_usd', product_rows.revenue_30d_usd,
        'revenue_lifetime_usd', product_rows.revenue_lifetime_usd
      )
      order by product_rows.revenue_30d_usd desc
    ),
    '[]'::jsonb
  )
  into products_value
  from (
    select
      coalesce(event_row.product_id, 'inconnu') as product_id,
      (
        select count(*)
        from public.revenuecat_customer_subscriptions subscription
        where subscription.product_id = event_row.product_id
          and subscription.environment = 'PRODUCTION'
          and subscription.latest_event_type <> 'TEST'
          and subscription.active = true
          and (
            subscription.expiration_at is null
            or subscription.expiration_at > now()
          )
      ) as active_subscribers,
      sum(
        case
          when event_row.received_at >= now() - interval '30 days'
            and event_row.environment = 'PRODUCTION'
            and event_row.event_type <> 'TEST'
            and event_row.event_type in (
              'INITIAL_PURCHASE',
              'RENEWAL',
              'NON_RENEWING_PURCHASE',
              'UNCANCELLATION',
              'SUBSCRIPTION_EXTENDED'
            )
          then greatest(coalesce(event_row.price_usd, 0), 0)
          else 0
        end
      ) as revenue_30d_usd,
      sum(
        case
          when event_row.environment = 'PRODUCTION'
            and event_row.event_type <> 'TEST'
            and event_row.event_type in (
              'INITIAL_PURCHASE',
              'RENEWAL',
              'NON_RENEWING_PURCHASE',
              'UNCANCELLATION',
              'SUBSCRIPTION_EXTENDED'
            )
          then greatest(coalesce(event_row.price_usd, 0), 0)
          else 0
        end
      ) as revenue_lifetime_usd
    from public.revenuecat_webhook_events event_row
    where event_row.event_type <> 'TEST'
    group by event_row.product_id
  ) product_rows;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'store', store_rows.store,
        'active_subscribers', store_rows.active_subscribers,
        'revenue_30d_usd', store_rows.revenue_30d_usd
      )
      order by store_rows.revenue_30d_usd desc
    ),
    '[]'::jsonb
  )
  into stores_value
  from (
    select
      coalesce(event_row.store, 'UNKNOWN') as store,
      (
        select count(*)
        from public.revenuecat_customer_subscriptions subscription
        where coalesce(subscription.store, 'UNKNOWN')
          = coalesce(event_row.store, 'UNKNOWN')
          and subscription.environment = 'PRODUCTION'
          and subscription.latest_event_type <> 'TEST'
          and subscription.active = true
          and (
            subscription.expiration_at is null
            or subscription.expiration_at > now()
          )
      ) as active_subscribers,
      sum(
        case
          when event_row.received_at >= now() - interval '30 days'
            and event_row.environment = 'PRODUCTION'
            and event_row.event_type <> 'TEST'
            and event_row.event_type in (
              'INITIAL_PURCHASE',
              'RENEWAL',
              'NON_RENEWING_PURCHASE',
              'UNCANCELLATION',
              'SUBSCRIPTION_EXTENDED'
            )
          then greatest(coalesce(event_row.price_usd, 0), 0)
          else 0
        end
      ) as revenue_30d_usd
    from public.revenuecat_webhook_events event_row
    where event_row.event_type <> 'TEST'
    group by event_row.store
  ) store_rows;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'app_user_id', subscription.app_user_id,
        'user_email', account.email,
        'product_id', subscription.product_id,
        'store', subscription.store,
        'environment', subscription.environment,
        'active', subscription.active
          and subscription.latest_event_type <> 'TEST'
          and (
            subscription.expiration_at is null
            or subscription.expiration_at > now()
          ),
        'will_renew', subscription.will_renew,
        'is_trial', subscription.is_trial,
        'expiration_at', subscription.expiration_at,
        'latest_event_type', subscription.latest_event_type,
        'updated_at', subscription.updated_at
      )
      order by subscription.updated_at desc
    ),
    '[]'::jsonb
  )
  into subscribers_value
  from (
    select *
    from public.revenuecat_customer_subscriptions
    where latest_event_type <> 'TEST'
    order by updated_at desc
    limit 100
  ) subscription
  left join auth.users account
    on account.id = subscription.user_id;

  if to_regclass('public.analytics_events') is not null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'user_id', risk.user_id,
          'email', account.email,
          'questions_10m', risk.questions_10m,
          'questions_1h', risk.questions_1h,
          'questions_24h', risk.questions_24h,
          'risk_level',
            case
              when risk.questions_10m >= 20
                or risk.questions_1h >= 60
                or risk.questions_24h >= 250
              then 'critical'
              when risk.questions_10m >= 12
                or risk.questions_1h >= 35
                or risk.questions_24h >= 150
              then 'high'
              else 'medium'
            end
        )
        order by risk.questions_10m desc, risk.questions_1h desc
      ),
      '[]'::jsonb
    )
    into wasil_risk_value
    from (
      select
        event_row.user_id,
        count(*) filter (
          where event_row.created_at >= now() - interval '10 minutes'
        )::integer as questions_10m,
        count(*) filter (
          where event_row.created_at >= now() - interval '1 hour'
        )::integer as questions_1h,
        count(*) filter (
          where event_row.created_at >= now() - interval '24 hours'
        )::integer as questions_24h
      from public.analytics_events event_row
      where event_row.event_name = 'wasil_question'
        and event_row.created_at >= now() - interval '24 hours'
      group by event_row.user_id
      having
        count(*) filter (
          where event_row.created_at >= now() - interval '10 minutes'
        ) >= 8
        or count(*) filter (
          where event_row.created_at >= now() - interval '1 hour'
        ) >= 25
        or count(*) >= 100
      limit 100
    ) risk
    left join auth.users account on account.id = risk.user_id;
  else
    wasil_risk_value := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'overview', overview_value,
    'products', products_value,
    'stores', stores_value,
    'subscribers', subscribers_value,
    'wasil_risk', wasil_risk_value
  );
end;
$$;

notify pgrst, 'reload schema';
