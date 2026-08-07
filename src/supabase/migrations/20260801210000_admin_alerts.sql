-- OUMMAH — centre d'alertes administrateur

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'admin_alert_severity'
  ) then
    create type public.admin_alert_severity as enum (
      'info',
      'warning',
      'critical'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'admin_alert_status'
  ) then
    create type public.admin_alert_status as enum (
      'open',
      'resolved',
      'ignored'
    );
  end if;
end
$$;

create table if not exists public.admin_system_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  source_key text not null unique,
  severity public.admin_alert_severity not null,
  status public.admin_alert_status not null default 'open',
  title text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  ignored_at timestamptz,
  handled_by uuid references auth.users(id) on delete set null,
  handling_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_system_alerts_status_severity_idx
on public.admin_system_alerts(status, severity, last_detected_at desc);

alter table public.admin_system_alerts enable row level security;
revoke all on public.admin_system_alerts from anon, authenticated;

create or replace function public.admin_upsert_detected_alert(
  p_alert_type text,
  p_source_key text,
  p_severity public.admin_alert_severity,
  p_title text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.admin_system_alerts (
    alert_type,
    source_key,
    severity,
    title,
    description,
    metadata,
    first_detected_at,
    last_detected_at
  )
  values (
    p_alert_type,
    p_source_key,
    p_severity,
    p_title,
    p_description,
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (source_key)
  do update set
    severity = excluded.severity,
    title = excluded.title,
    description = excluded.description,
    metadata = excluded.metadata,
    last_detected_at = now(),
    updated_at = now();
end;
$$;

create or replace function public.admin_refresh_system_alerts()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  row_data record;
  last_production_event timestamptz;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  -- RevenueCat silencieux : seulement si un événement Production a déjà existé.
  if to_regclass('public.revenuecat_webhook_events') is not null then
    select max(received_at)
    into last_production_event
    from public.revenuecat_webhook_events
    where environment = 'PRODUCTION'
      and event_type <> 'TEST';

    if last_production_event is not null
      and last_production_event < now() - interval '24 hours'
    then
      perform public.admin_upsert_detected_alert(
        'revenuecat_webhook_silent',
        'revenuecat:webhook:production-silent',
        'warning',
        'Webhook RevenueCat silencieux',
        'Aucun événement RevenueCat Production reçu depuis plus de 24 heures.',
        jsonb_build_object(
          'last_production_event', last_production_event
        )
      );
    end if;
  end if;

  -- Abonnements Production non reliés.
  if to_regclass('public.revenuecat_customer_subscriptions') is not null then
    for row_data in
      select
        app_user_id,
        product_id,
        store,
        expiration_at,
        latest_event_type
      from public.revenuecat_customer_subscriptions
      where user_id is null
        and environment = 'PRODUCTION'
        and latest_event_type <> 'TEST'
    loop
      perform public.admin_upsert_detected_alert(
        'revenuecat_unlinked_subscription',
        'revenuecat:unlinked:' || row_data.app_user_id || ':' || row_data.product_id,
        'critical',
        'Abonnement Production non relié',
        'Un abonnement RevenueCat Production n’est associé à aucun compte OUMMAH.',
        jsonb_build_object(
          'app_user_id', row_data.app_user_id,
          'product_id', row_data.product_id,
          'store', row_data.store,
          'expiration_at', row_data.expiration_at,
          'latest_event_type', row_data.latest_event_type
        )
      );
    end loop;

    -- Incidents de paiement actifs.
    for row_data in
      select
        app_user_id,
        product_id,
        user_id,
        billing_issue_detected_at,
        expiration_at
      from public.revenuecat_customer_subscriptions
      where environment = 'PRODUCTION'
        and latest_event_type <> 'TEST'
        and active = true
        and billing_issue_detected_at is not null
    loop
      perform public.admin_upsert_detected_alert(
        'revenuecat_billing_issue',
        'revenuecat:billing:' || row_data.app_user_id || ':' || row_data.product_id,
        'critical',
        'Incident de paiement RevenueCat',
        'Un abonnement actif rencontre un incident de paiement.',
        jsonb_build_object(
          'app_user_id', row_data.app_user_id,
          'product_id', row_data.product_id,
          'user_id', row_data.user_id,
          'billing_issue_detected_at', row_data.billing_issue_detected_at,
          'expiration_at', row_data.expiration_at
        )
      );
    end loop;
  end if;

  -- Remboursements Production : une alerte par événement.
  if to_regclass('public.revenuecat_webhook_events') is not null then
    for row_data in
      select
        event_id,
        app_user_id,
        product_id,
        price_usd,
        currency,
        received_at
      from public.revenuecat_webhook_events
      where environment = 'PRODUCTION'
        and event_type = 'REFUND'
        and received_at >= now() - interval '30 days'
    loop
      perform public.admin_upsert_detected_alert(
        'revenuecat_refund',
        'revenuecat:refund:' || row_data.event_id,
        'warning',
        'Remboursement RevenueCat reçu',
        'Un achat ou abonnement RevenueCat a été remboursé.',
        jsonb_build_object(
          'event_id', row_data.event_id,
          'app_user_id', row_data.app_user_id,
          'product_id', row_data.product_id,
          'price_usd', row_data.price_usd,
          'currency', row_data.currency,
          'received_at', row_data.received_at
        )
      );
    end loop;
  end if;

  -- Consommation Wasil anormale.
  if to_regclass('public.analytics_events') is not null then
    for row_data in
      select
        analytics.user_id,
        account.email,
        count(*) filter (
          where analytics.created_at >= now() - interval '10 minutes'
        )::integer as questions_10m,
        count(*) filter (
          where analytics.created_at >= now() - interval '1 hour'
        )::integer as questions_1h,
        count(*) filter (
          where analytics.created_at >= now() - interval '24 hours'
        )::integer as questions_24h
      from public.analytics_events analytics
      left join auth.users account on account.id = analytics.user_id
      where analytics.event_name = 'wasil_question'
        and analytics.created_at >= now() - interval '24 hours'
      group by analytics.user_id, account.email
      having
        count(*) filter (
          where analytics.created_at >= now() - interval '10 minutes'
        ) >= 12
        or count(*) filter (
          where analytics.created_at >= now() - interval '1 hour'
        ) >= 35
        or count(*) >= 150
    loop
      perform public.admin_upsert_detected_alert(
        'wasil_consumption_spike',
        'wasil:spike:' || row_data.user_id::text || ':'
          || to_char(now() at time zone 'UTC', 'YYYY-MM-DD'),
        case
          when row_data.questions_10m >= 20
            or row_data.questions_1h >= 60
            or row_data.questions_24h >= 250
          then 'critical'::public.admin_alert_severity
          else 'warning'::public.admin_alert_severity
        end,
        'Consommation Wasil anormale',
        'Un utilisateur présente une fréquence de questions Wasil inhabituelle.',
        jsonb_build_object(
          'user_id', row_data.user_id,
          'email', row_data.email,
          'questions_10m', row_data.questions_10m,
          'questions_1h', row_data.questions_1h,
          'questions_24h', row_data.questions_24h
        )
      );
    end loop;
  end if;

  -- Premium manuel expirant sous 7 jours.
  if to_regclass('public.premium_manual_grants') is not null then
    for row_data in
      select
        grant_row.user_id,
        account.email,
        grant_row.ends_at
      from public.premium_manual_grants grant_row
      left join auth.users account on account.id = grant_row.user_id
      where grant_row.active = true
        and grant_row.ends_at > now()
        and grant_row.ends_at <= now() + interval '7 days'
    loop
      perform public.admin_upsert_detected_alert(
        'manual_premium_expiring',
        'premium:expiring:' || row_data.user_id::text || ':'
          || row_data.ends_at::date::text,
        'info',
        'Premium manuel bientôt expiré',
        'Un accès Premium offert arrive à expiration sous 7 jours.',
        jsonb_build_object(
          'user_id', row_data.user_id,
          'email', row_data.email,
          'ends_at', row_data.ends_at
        )
      );
    end loop;
  end if;

  -- Utilisateurs récemment tombés à zéro crédit après consommation.
  if to_regclass('public.wasil_wallets') is not null then
    for row_data in
      select
        wallet.user_id,
        account.email,
        wallet.total_spent,
        wallet.updated_at
      from public.wasil_wallets wallet
      left join auth.users account on account.id = wallet.user_id
      where wallet.balance = 0
        and wallet.total_spent > 0
        and wallet.updated_at >= now() - interval '7 days'
      order by wallet.updated_at desc
      limit 100
    loop
      perform public.admin_upsert_detected_alert(
        'wasil_zero_credit',
        'wasil:zero-credit:' || row_data.user_id::text || ':'
          || row_data.updated_at::date::text,
        'info',
        'Utilisateur à zéro crédit Wasil',
        'Un utilisateur ayant déjà consommé des crédits vient d’atteindre un solde nul.',
        jsonb_build_object(
          'user_id', row_data.user_id,
          'email', row_data.email,
          'total_spent', row_data.total_spent,
          'wallet_updated_at', row_data.updated_at
        )
      );
    end loop;
  end if;
end;
$$;

create or replace function public.admin_get_alert_counts()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  return jsonb_build_object(
    'open_count', (
      select count(*)
      from public.admin_system_alerts
      where status = 'open'
    ),
    'critical_count', (
      select count(*)
      from public.admin_system_alerts
      where status = 'open'
        and severity = 'critical'
    ),
    'warning_count', (
      select count(*)
      from public.admin_system_alerts
      where status = 'open'
        and severity = 'warning'
    ),
    'info_count', (
      select count(*)
      from public.admin_system_alerts
      where status = 'open'
        and severity = 'info'
    )
  );
end;
$$;

create or replace function public.admin_list_system_alerts(
  p_status public.admin_alert_status default 'open',
  p_limit integer default 200
)
returns table (
  id uuid,
  alert_type text,
  severity public.admin_alert_severity,
  status public.admin_alert_status,
  title text,
  description text,
  source_key text,
  metadata jsonb,
  first_detected_at timestamptz,
  last_detected_at timestamptz,
  resolved_at timestamptz,
  ignored_at timestamptz,
  handled_by_email text,
  handling_note text
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
    alert_row.id,
    alert_row.alert_type,
    alert_row.severity,
    alert_row.status,
    alert_row.title,
    alert_row.description,
    alert_row.source_key,
    alert_row.metadata,
    alert_row.first_detected_at,
    alert_row.last_detected_at,
    alert_row.resolved_at,
    alert_row.ignored_at,
    handler.email::text,
    alert_row.handling_note
  from public.admin_system_alerts alert_row
  left join auth.users handler on handler.id = alert_row.handled_by
  where alert_row.status = p_status
  order by
    case alert_row.severity
      when 'critical' then 0
      when 'warning' then 1
      else 2
    end,
    alert_row.last_detected_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
end;
$$;

create or replace function public.admin_update_system_alert(
  p_alert_id uuid,
  p_status public.admin_alert_status,
  p_note text default null
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

  update public.admin_system_alerts
  set
    status = p_status,
    resolved_at = case
      when p_status = 'resolved' then now()
      else null
    end,
    ignored_at = case
      when p_status = 'ignored' then now()
      else null
    end,
    handled_by = case
      when p_status in ('resolved', 'ignored') then auth.uid()
      else null
    end,
    handling_note = case
      when p_status in ('resolved', 'ignored') then nullif(trim(p_note), '')
      else null
    end,
    updated_at = now()
  where id = p_alert_id;

  if not found then
    raise exception 'ADMIN_ALERT_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.admin_upsert_detected_alert(
  text,
  text,
  public.admin_alert_severity,
  text,
  text,
  jsonb
) from public;

revoke all on function public.admin_refresh_system_alerts() from public;
revoke all on function public.admin_get_alert_counts() from public;
revoke all on function public.admin_list_system_alerts(
  public.admin_alert_status,
  integer
) from public;
revoke all on function public.admin_update_system_alert(
  uuid,
  public.admin_alert_status,
  text
) from public;

grant execute on function public.admin_refresh_system_alerts()
to authenticated;
grant execute on function public.admin_get_alert_counts()
to authenticated;
grant execute on function public.admin_list_system_alerts(
  public.admin_alert_status,
  integer
) to authenticated;
grant execute on function public.admin_update_system_alert(
  uuid,
  public.admin_alert_status,
  text
) to authenticated;

notify pgrst, 'reload schema';
