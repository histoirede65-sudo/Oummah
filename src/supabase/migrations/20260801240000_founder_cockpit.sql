-- OUMMAH — Centre de pilotage fondateur
-- Une seule RPC consolide les principaux indicateurs du back-office.

create or replace function public.admin_get_founder_cockpit()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, cron
as $$
declare
  users_total numeric := 0;
  users_today numeric := 0;
  active_1d numeric := 0;
  active_7d numeric := 0;
  active_30d numeric := 0;

  premium_revenuecat numeric := 0;
  premium_manual numeric := 0;
  premium_trials numeric := 0;
  conversion_rate numeric := 0;

  revenue_today numeric := 0;
  revenue_30d numeric := 0;
  ai_cost_today numeric := 0;
  ai_cost_30d numeric := 0;
  margin_today numeric := 0;
  margin_30d numeric := 0;

  questions_today numeric := 0;
  questions_7d numeric := 0;
  questions_30d numeric := 0;
  avg_cost_question numeric := 0;
  credits_available numeric := 0;
  credits_spent numeric := 0;

  open_alerts numeric := 0;
  critical_alerts numeric := 0;
  open_support numeric := 0;
  urgent_support numeric := 0;
  pending_mosques numeric := 0;
  pending_reports numeric := 0;

  system_health text := 'never_run';
  cron_enabled boolean := false;
  last_monitor_run timestamptz;
  failures_24h numeric := 0;

  days_elapsed numeric;
  days_in_month numeric;
  projected_revenue numeric := 0;
  projected_cost numeric := 0;
  projected_margin numeric := 0;

  status_value text := 'stable';
  status_label text := 'OUMMAH stable';

  trends_value jsonb := '[]'::jsonb;
  priorities_value jsonb := '[]'::jsonb;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select
    count(*),
    count(*) filter (
      where created_at >= date_trunc('day', now())
    )
  into users_total, users_today
  from auth.users;

  if to_regclass('public.analytics_events') is not null then
    select
      count(distinct user_id) filter (
        where created_at >= now() - interval '1 day'
      ),
      count(distinct user_id) filter (
        where created_at >= now() - interval '7 days'
      ),
      count(distinct user_id) filter (
        where created_at >= now() - interval '30 days'
      ),
      count(*) filter (
        where event_name = 'wasil_question'
          and created_at >= date_trunc('day', now())
      ),
      count(*) filter (
        where event_name = 'wasil_question'
          and created_at >= now() - interval '7 days'
      ),
      count(*) filter (
        where event_name = 'wasil_question'
          and created_at >= now() - interval '30 days'
      )
    into
      active_1d,
      active_7d,
      active_30d,
      questions_today,
      questions_7d,
      questions_30d
    from public.analytics_events;
  end if;

  if to_regclass('public.revenuecat_customer_subscriptions') is not null then
    select
      count(*) filter (
        where active = true
          and environment = 'PRODUCTION'
          and latest_event_type <> 'TEST'
          and (expiration_at is null or expiration_at > now())
      ),
      count(*) filter (
        where active = true
          and environment = 'PRODUCTION'
          and latest_event_type <> 'TEST'
          and is_trial = true
          and (expiration_at is null or expiration_at > now())
      )
    into premium_revenuecat, premium_trials
    from public.revenuecat_customer_subscriptions;
  end if;

  if to_regclass('public.premium_manual_grants') is not null then
    select count(*)
    into premium_manual
    from public.premium_manual_grants
    where active = true
      and starts_at <= now()
      and ends_at > now();
  end if;

  conversion_rate :=
    case
      when users_total > 0
      then ((premium_revenuecat + premium_manual) / users_total) * 100
      else 0
    end;

  if to_regclass('public.revenuecat_webhook_events') is not null then
    select
      coalesce(sum(greatest(coalesce(price_usd, 0), 0)) filter (
        where environment = 'PRODUCTION'
          and event_type <> 'TEST'
          and event_type in (
            'INITIAL_PURCHASE',
            'RENEWAL',
            'NON_RENEWING_PURCHASE',
            'UNCANCELLATION',
            'SUBSCRIPTION_EXTENDED'
          )
          and received_at >= date_trunc('day', now())
      ), 0),
      coalesce(sum(greatest(coalesce(price_usd, 0), 0)) filter (
        where environment = 'PRODUCTION'
          and event_type <> 'TEST'
          and event_type in (
            'INITIAL_PURCHASE',
            'RENEWAL',
            'NON_RENEWING_PURCHASE',
            'UNCANCELLATION',
            'SUBSCRIPTION_EXTENDED'
          )
          and received_at >= now() - interval '30 days'
      ), 0)
    into revenue_today, revenue_30d
    from public.revenuecat_webhook_events;
  end if;

  if to_regclass('public.wasil_cost_observations') is not null then
    execute $dynamic$
      select
        coalesce(sum(
          case
            when public.oummah_jsonb_timestamp(
              to_jsonb(cost_row),
              'created_at',
              'observed_at',
              'measured_at',
              'timestamp'
            ) >= date_trunc('day', now())
            then public.oummah_jsonb_numeric(
              to_jsonb(cost_row),
              'cost_usd',
              'estimated_cost_usd',
              'total_cost_usd',
              'usd_cost',
              'actual_cost_usd'
            )
            else 0
          end
        ), 0),
        coalesce(sum(
          case
            when public.oummah_jsonb_timestamp(
              to_jsonb(cost_row),
              'created_at',
              'observed_at',
              'measured_at',
              'timestamp'
            ) >= now() - interval '30 days'
            then public.oummah_jsonb_numeric(
              to_jsonb(cost_row),
              'cost_usd',
              'estimated_cost_usd',
              'total_cost_usd',
              'usd_cost',
              'actual_cost_usd'
            )
            else 0
          end
        ), 0)
      from public.wasil_cost_observations cost_row
    $dynamic$
    into ai_cost_today, ai_cost_30d;
  end if;

  margin_today := revenue_today - ai_cost_today;
  margin_30d := revenue_30d - ai_cost_30d;

  avg_cost_question :=
    case
      when questions_30d > 0 then ai_cost_30d / questions_30d
      else 0
    end;

  if to_regclass('public.wasil_wallets') is not null then
    select
      coalesce(sum(balance), 0),
      coalesce(sum(total_spent), 0)
    into credits_available, credits_spent
    from public.wasil_wallets;
  end if;

  if to_regclass('public.admin_system_alerts') is not null then
    select
      count(*) filter (where status = 'open'),
      count(*) filter (
        where status = 'open'
          and severity = 'critical'
      )
    into open_alerts, critical_alerts
    from public.admin_system_alerts;
  end if;

  if to_regclass('public.support_tickets') is not null then
    select
      count(*) filter (
        where status in ('open', 'in_progress')
      ),
      count(*) filter (
        where status in ('open', 'in_progress')
          and priority = 'urgent'
      )
    into open_support, urgent_support
    from public.support_tickets;
  end if;

  if to_regclass('public.mosque_submissions') is not null then
    select count(*)
    into pending_mosques
    from public.mosque_submissions
    where validation_status = 'pending';
  end if;

  if to_regclass('public.mosque_reports') is not null then
    select count(*)
    into pending_reports
    from public.mosque_reports
    where status = 'pending';
  end if;

  if to_regclass('public.admin_alert_monitor_runs') is not null then
    select
      started_at,
      case
        when status = 'failed' then 'critical'
        when started_at < now() - interval '2 hours' then 'critical'
        else 'healthy'
      end,
      (
        select count(*)
        from public.admin_alert_monitor_runs
        where started_at >= now() - interval '24 hours'
          and status = 'failed'
      )
    into last_monitor_run, system_health, failures_24h
    from public.admin_alert_monitor_runs
    order by started_at desc
    limit 1;

    if last_monitor_run is null then
      system_health := 'never_run';
    end if;
  end if;

  select coalesce(job.active, false)
  into cron_enabled
  from cron.job job
  where job.jobname = 'oummah-admin-alert-monitor-hourly'
  limit 1;

  if not cron_enabled and system_health = 'healthy' then
    system_health := 'warning';
  end if;

  days_elapsed := extract(day from now())::numeric;
  days_in_month := extract(
    day from (
      date_trunc('month', now())
      + interval '1 month'
      - interval '1 day'
    )
  )::numeric;

  projected_revenue :=
    case when days_elapsed > 0
      then (revenue_30d / least(days_elapsed, 30)) * days_in_month
      else 0
    end;

  projected_cost :=
    case when days_elapsed > 0
      then (ai_cost_30d / least(days_elapsed, 30)) * days_in_month
      else 0
    end;

  projected_margin := projected_revenue - projected_cost;

  status_value :=
    case
      when critical_alerts > 0
        or system_health = 'critical'
        or margin_30d < 0
      then 'critical'
      when open_alerts > 0
        or urgent_support > 0
        or system_health = 'warning'
      then 'watch'
      when users_today > 0
        or revenue_today > 0
        or active_7d > active_30d * 0.35
      then 'growth'
      else 'stable'
    end;

  status_label :=
    case status_value
      when 'growth' then 'OUMMAH en croissance'
      when 'critical' then 'OUMMAH à surveiller'
      when 'watch' then 'OUMMAH sous surveillance'
      else 'OUMMAH stable'
    end;

  if to_regclass('public.analytics_events') is not null then
    with days as (
      select generate_series(
        date_trunc('day', now()) - interval '13 days',
        date_trunc('day', now()),
        interval '1 day'
      )::date as day
    ),
    activity as (
      select
        created_at::date as day,
        count(distinct user_id) as active_users,
        count(*) filter (
          where event_name = 'wasil_question'
        ) as wasil_questions
      from public.analytics_events
      where created_at >= date_trunc('day', now()) - interval '13 days'
      group by created_at::date
    ),
    revenue as (
      select
        received_at::date as day,
        sum(
          case
            when event_type in (
              'INITIAL_PURCHASE',
              'RENEWAL',
              'NON_RENEWING_PURCHASE',
              'UNCANCELLATION',
              'SUBSCRIPTION_EXTENDED'
            )
            then greatest(coalesce(price_usd, 0), 0)
            when event_type = 'REFUND'
            then -abs(coalesce(price_usd, 0))
            else 0
          end
        ) as revenue_usd
      from public.revenuecat_webhook_events
      where environment = 'PRODUCTION'
        and event_type <> 'TEST'
        and received_at >= date_trunc('day', now()) - interval '13 days'
      group by received_at::date
    )
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'day', days.day,
          'active_users', coalesce(activity.active_users, 0),
          'wasil_questions', coalesce(activity.wasil_questions, 0),
          'revenue_usd', coalesce(revenue.revenue_usd, 0),
          'ai_cost_usd',
            coalesce(activity.wasil_questions, 0) * avg_cost_question
        )
        order by days.day
      ),
      '[]'::jsonb
    )
    into trends_value
    from days
    left join activity on activity.day = days.day
    left join revenue on revenue.day = days.day;
  end if;

  select coalesce(
    jsonb_agg(priority_row),
    '[]'::jsonb
  )
  into priorities_value
  from (
    select jsonb_build_object(
      'severity', 'critical',
      'title', 'Alertes critiques ouvertes',
      'description',
        critical_alerts::text || ' alerte(s) critique(s) nécessitent une action.',
      'route', '/admin/alerts'
    ) as priority_row
    where critical_alerts > 0

    union all

    select jsonb_build_object(
      'severity', 'warning',
      'title', 'Tickets support urgents',
      'description',
        urgent_support::text || ' ticket(s) urgent(s) attendent une réponse.',
      'route', '/admin/support'
    )
    where urgent_support > 0

    union all

    select jsonb_build_object(
      'severity', 'warning',
      'title', 'Mosquées à valider',
      'description',
        pending_mosques::text || ' proposition(s) attendent une validation.',
      'route', '/admin/mosques'
    )
    where pending_mosques > 0

    union all

    select jsonb_build_object(
      'severity',
        case when margin_30d < 0 then 'critical' else 'warning' end,
      'title', 'Rentabilité Wasil',
      'description',
        'Marge sur 30 jours : ' || round(margin_30d, 2)::text || ' $.',
      'route', '/admin/wasil-finance'
    )
    where margin_30d <= 0 and (revenue_30d > 0 or ai_cost_30d > 0)

    limit 6
  ) priorities;

  return jsonb_build_object(
    'status', status_value,
    'status_label', status_label,
    'generated_at', now(),
    'users', jsonb_build_object(
      'total', users_total,
      'new_today', users_today,
      'active_1d', active_1d,
      'active_7d', active_7d,
      'active_30d', active_30d
    ),
    'premium', jsonb_build_object(
      'active_revenuecat', premium_revenuecat,
      'active_manual', premium_manual,
      'trials', premium_trials,
      'conversion_rate', conversion_rate
    ),
    'finance', jsonb_build_object(
      'revenue_today_usd', revenue_today,
      'revenue_30d_usd', revenue_30d,
      'ai_cost_today_usd', ai_cost_today,
      'ai_cost_30d_usd', ai_cost_30d,
      'margin_today_usd', margin_today,
      'margin_30d_usd', margin_30d,
      'projected_month_revenue_usd', projected_revenue,
      'projected_month_cost_usd', projected_cost,
      'projected_month_margin_usd', projected_margin
    ),
    'wasil', jsonb_build_object(
      'questions_today', questions_today,
      'questions_7d', questions_7d,
      'questions_30d', questions_30d,
      'average_cost_per_question_usd', avg_cost_question,
      'credits_available', credits_available,
      'credits_spent', credits_spent
    ),
    'operations', jsonb_build_object(
      'open_alerts', open_alerts,
      'critical_alerts', critical_alerts,
      'open_support', open_support,
      'urgent_support', urgent_support,
      'pending_mosques', pending_mosques,
      'pending_mosque_reports', pending_reports
    ),
    'system', jsonb_build_object(
      'health', system_health,
      'cron_enabled', cron_enabled,
      'last_monitor_run_at', last_monitor_run,
      'failures_24h', failures_24h
    ),
    'trends', trends_value,
    'priorities', priorities_value
  );
end;
$$;

revoke all on function public.admin_get_founder_cockpit() from public;
grant execute on function public.admin_get_founder_cockpit()
to authenticated;

notify pgrst, 'reload schema';
