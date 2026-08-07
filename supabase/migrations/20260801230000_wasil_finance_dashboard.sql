-- OUMMAH — dashboard financier Wasil
-- Extraction tolérante aux noms de colonnes existants.

create or replace function public.oummah_jsonb_numeric(
  p_value jsonb,
  variadic p_keys text[]
)
returns numeric
language plpgsql
immutable
as $$
declare
  key_name text;
  raw_value text;
  result numeric;
begin
  foreach key_name in array p_keys loop
    raw_value := nullif(p_value ->> key_name, '');

    if raw_value is not null then
      begin
        result := raw_value::numeric;
        return result;
      exception when others then
        null;
      end;
    end if;
  end loop;

  return 0;
end;
$$;

create or replace function public.oummah_jsonb_timestamp(
  p_value jsonb,
  variadic p_keys text[]
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  key_name text;
  raw_value text;
  result timestamptz;
begin
  foreach key_name in array p_keys loop
    raw_value := nullif(p_value ->> key_name, '');

    if raw_value is not null then
      begin
        result := raw_value::timestamptz;
        return result;
      exception when others then
        null;
      end;
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.oummah_jsonb_uuid(
  p_value jsonb,
  variadic p_keys text[]
)
returns uuid
language plpgsql
immutable
as $$
declare
  key_name text;
  raw_value text;
  result uuid;
begin
  foreach key_name in array p_keys loop
    raw_value := nullif(p_value ->> key_name, '');

    if raw_value is not null then
      begin
        result := raw_value::uuid;
        return result;
      exception when others then
        null;
      end;
    end if;
  end loop;

  return null;
end;
$$;

create or replace function public.admin_get_wasil_finance_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  questions_today numeric := 0;
  questions_30d numeric := 0;
  ai_cost_today numeric := 0;
  ai_cost_30d numeric := 0;
  ai_cost_lifetime numeric := 0;
  revenue_today numeric := 0;
  revenue_30d numeric := 0;
  revenue_lifetime numeric := 0;
  refunds_30d numeric := 0;
  credits_available numeric := 0;
  credits_spent numeric := 0;
  purchase_count_30d numeric := 0;
  average_cost numeric := 0;
  margin_30d numeric := 0;
  profitability text := 'watch';
  active_users_30d numeric := 0;
  average_questions_per_user numeric := 0;
  average_revenue_per_user numeric := 0;
  average_cost_per_user numeric := 0;
  overview_value jsonb;
  top_users_value jsonb := '[]'::jsonb;
  daily_value jsonb := '[]'::jsonb;
  projections_value jsonb := '[]'::jsonb;
  diagnostics_value jsonb := '[]'::jsonb;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if to_regclass('public.analytics_events') is not null then
    select
      count(*) filter (
        where event_name = 'wasil_question'
          and created_at >= date_trunc('day', now())
      ),
      count(*) filter (
        where event_name = 'wasil_question'
          and created_at >= now() - interval '30 days'
      ),
      count(distinct user_id) filter (
        where event_name = 'wasil_question'
          and created_at >= now() - interval '30 days'
      )
    into questions_today, questions_30d, active_users_30d
    from public.analytics_events;
  elsif to_regclass('public.wasil_requests') is not null then
    execute $dynamic$
      select
        count(*) filter (
          where public.oummah_jsonb_timestamp(
            to_jsonb(request_row),
            'created_at',
            'requested_at',
            'started_at',
            'timestamp'
          ) >= date_trunc('day', now())
        ),
        count(*) filter (
          where public.oummah_jsonb_timestamp(
            to_jsonb(request_row),
            'created_at',
            'requested_at',
            'started_at',
            'timestamp'
          ) >= now() - interval '30 days'
        ),
        count(distinct public.oummah_jsonb_uuid(
          to_jsonb(request_row),
          'user_id',
          'profile_id'
        )) filter (
          where public.oummah_jsonb_timestamp(
            to_jsonb(request_row),
            'created_at',
            'requested_at',
            'started_at',
            'timestamp'
          ) >= now() - interval '30 days'
        )
      from public.wasil_requests request_row
    $dynamic$
    into questions_today, questions_30d, active_users_30d;

    diagnostics_value := diagnostics_value || jsonb_build_array(
      'Questions calculées depuis wasil_requests, car analytics_events est absente.'
    );
  else
    diagnostics_value := diagnostics_value || jsonb_build_array(
      'Aucune source de comptage des questions Wasil n’a été trouvée.'
    );
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
        ), 0),
        coalesce(sum(
          public.oummah_jsonb_numeric(
            to_jsonb(cost_row),
            'cost_usd',
            'estimated_cost_usd',
            'total_cost_usd',
            'usd_cost',
            'actual_cost_usd'
          )
        ), 0)
      from public.wasil_cost_observations cost_row
    $dynamic$
    into ai_cost_today, ai_cost_30d, ai_cost_lifetime;
  else
    diagnostics_value := diagnostics_value || jsonb_build_array(
      'La table wasil_cost_observations est absente : coût IA indisponible.'
    );
  end if;

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
      ), 0),
      coalesce(sum(abs(coalesce(price_usd, 0))) filter (
        where environment = 'PRODUCTION'
          and event_type = 'REFUND'
          and received_at >= now() - interval '30 days'
      ), 0)
    into
      revenue_today,
      revenue_30d,
      revenue_lifetime,
      refunds_30d
    from public.revenuecat_webhook_events;
  else
    diagnostics_value := diagnostics_value || jsonb_build_array(
      'Le webhook RevenueCat n’est pas installé : revenus abonnements indisponibles.'
    );
  end if;

  if to_regclass('public.wasil_credit_purchases') is not null then
    execute $dynamic$
      select
        coalesce(sum(
          case
            when public.oummah_jsonb_timestamp(
              to_jsonb(purchase_row),
              'created_at',
              'purchased_at',
              'completed_at',
              'timestamp'
            ) >= date_trunc('day', now())
            then public.oummah_jsonb_numeric(
              to_jsonb(purchase_row),
              'revenue_usd',
              'amount_usd',
              'gross_usd',
              'price_usd'
            )
            else 0
          end
        ), 0),
        coalesce(sum(
          case
            when public.oummah_jsonb_timestamp(
              to_jsonb(purchase_row),
              'created_at',
              'purchased_at',
              'completed_at',
              'timestamp'
            ) >= now() - interval '30 days'
            then public.oummah_jsonb_numeric(
              to_jsonb(purchase_row),
              'revenue_usd',
              'amount_usd',
              'gross_usd',
              'price_usd'
            )
            else 0
          end
        ), 0),
        coalesce(sum(
          public.oummah_jsonb_numeric(
            to_jsonb(purchase_row),
            'revenue_usd',
            'amount_usd',
            'gross_usd',
            'price_usd'
          )
        ), 0),
        count(*) filter (
          where public.oummah_jsonb_timestamp(
            to_jsonb(purchase_row),
            'created_at',
            'purchased_at',
            'completed_at',
            'timestamp'
          ) >= now() - interval '30 days'
        )
      from public.wasil_credit_purchases purchase_row
    $dynamic$
    into
      revenue_today,
      revenue_30d,
      revenue_lifetime,
      purchase_count_30d;

    diagnostics_value := diagnostics_value || jsonb_build_array(
      'Les revenus de packs sont ajoutés uniquement lorsque wasil_credit_purchases contient un champ USD reconnu.'
    );
  end if;

  if to_regclass('public.wasil_wallets') is not null then
    select
      coalesce(sum(balance), 0),
      coalesce(sum(total_spent), 0)
    into credits_available, credits_spent
    from public.wasil_wallets;
  end if;

  margin_30d := revenue_30d - refunds_30d - ai_cost_30d;

  average_cost :=
    case
      when questions_30d > 0 then ai_cost_30d / questions_30d
      else 0
    end;

  profitability :=
    case
      when revenue_30d > 0 and margin_30d / revenue_30d >= 0.70
        then 'very_profitable'
      when revenue_30d > 0 and margin_30d > 0
        then 'profitable'
      when revenue_30d = 0 and ai_cost_30d = 0
        then 'watch'
      when margin_30d < 0
        then 'loss'
      else 'watch'
    end;

  average_questions_per_user :=
    case when active_users_30d > 0
      then questions_30d / active_users_30d
      else 0
    end;

  average_revenue_per_user :=
    case when active_users_30d > 0
      then revenue_30d / active_users_30d
      else 0
    end;

  average_cost_per_user :=
    case when active_users_30d > 0
      then ai_cost_30d / active_users_30d
      else 0
    end;

  if to_regclass('public.wasil_wallets') is not null then
    if to_regclass('public.analytics_events') is not null then
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_id', ranked.user_id,
            'email', account.email,
            'balance', ranked.balance,
            'total_spent', ranked.total_spent,
            'questions_30d', ranked.questions_30d,
            'estimated_cost_30d_usd',
              ranked.questions_30d * average_cost
          )
          order by ranked.total_spent desc, ranked.questions_30d desc
        ),
        '[]'::jsonb
      )
      into top_users_value
      from (
        select
          wallet.user_id,
          wallet.balance,
          wallet.total_spent,
          count(event_row.id) filter (
            where event_row.event_name = 'wasil_question'
              and event_row.created_at >= now() - interval '30 days'
          )::integer as questions_30d
        from public.wasil_wallets wallet
        left join public.analytics_events event_row
          on event_row.user_id = wallet.user_id
        group by wallet.user_id, wallet.balance, wallet.total_spent
        order by wallet.total_spent desc
        limit 50
      ) ranked
      left join auth.users account on account.id = ranked.user_id;
    else
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_id', wallet.user_id,
            'email', account.email,
            'balance', wallet.balance,
            'total_spent', wallet.total_spent,
            'questions_30d', 0,
            'estimated_cost_30d_usd', 0
          )
          order by wallet.total_spent desc
        ),
        '[]'::jsonb
      )
      into top_users_value
      from (
        select *
        from public.wasil_wallets
        order by total_spent desc
        limit 50
      ) wallet
      left join auth.users account on account.id = wallet.user_id;
    end if;
  end if;

  with days as (
    select generate_series(
      date_trunc('day', now()) - interval '29 days',
      date_trunc('day', now()),
      interval '1 day'
    )::date as day
  ),
  question_rows as (
    select
      created_at::date as day,
      count(*)::integer as questions
    from public.analytics_events
    where event_name = 'wasil_question'
      and created_at >= date_trunc('day', now()) - interval '29 days'
    group by created_at::date
  ),
  revenue_rows as (
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
      ) as revenue
    from public.revenuecat_webhook_events
    where environment = 'PRODUCTION'
      and event_type <> 'TEST'
      and received_at >= date_trunc('day', now()) - interval '29 days'
    group by received_at::date
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'day', days.day,
        'questions', coalesce(question_rows.questions, 0),
        'ai_cost_usd',
          coalesce(question_rows.questions, 0) * average_cost,
        'revenue_usd', coalesce(revenue_rows.revenue, 0)
      )
      order by days.day
    ),
    '[]'::jsonb
  )
  into daily_value
  from days
  left join question_rows on question_rows.day = days.day
  left join revenue_rows on revenue_rows.day = days.day;

  select jsonb_agg(
    jsonb_build_object(
      'users', projection.users,
      'projected_questions',
        round(average_questions_per_user * projection.users),
      'projected_ai_cost_usd',
        average_cost_per_user * projection.users,
      'projected_revenue_usd',
        average_revenue_per_user * projection.users,
      'projected_margin_usd',
        (average_revenue_per_user - average_cost_per_user) * projection.users
    )
    order by projection.users
  )
  into projections_value
  from (
    values (100::numeric), (1000::numeric), (10000::numeric)
  ) as projection(users);

  overview_value := jsonb_build_object(
    'questions_today', questions_today,
    'questions_30d', questions_30d,
    'ai_cost_today_usd', ai_cost_today,
    'ai_cost_30d_usd', ai_cost_30d,
    'ai_cost_lifetime_usd', ai_cost_lifetime,
    'revenue_today_usd', revenue_today,
    'revenue_30d_usd', revenue_30d,
    'revenue_lifetime_usd', revenue_lifetime,
    'refunds_30d_usd', refunds_30d,
    'net_margin_30d_usd', margin_30d,
    'average_cost_per_question_usd', average_cost,
    'credits_available', credits_available,
    'credits_spent', credits_spent,
    'credit_purchase_count_30d', purchase_count_30d,
    'profitability', profitability
  );

  return jsonb_build_object(
    'overview', overview_value,
    'top_users', top_users_value,
    'daily', daily_value,
    'projections', projections_value,
    'diagnostics', diagnostics_value
  );
end;
$$;

revoke all on function public.oummah_jsonb_numeric(
  jsonb,
  variadic text[]
) from public;
revoke all on function public.oummah_jsonb_timestamp(
  jsonb,
  variadic text[]
) from public;
revoke all on function public.oummah_jsonb_uuid(
  jsonb,
  variadic text[]
) from public;
revoke all on function public.admin_get_wasil_finance_dashboard()
from public;

grant execute on function public.admin_get_wasil_finance_dashboard()
to authenticated;

notify pgrst, 'reload schema';
