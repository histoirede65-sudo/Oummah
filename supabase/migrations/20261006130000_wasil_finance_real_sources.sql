-- OUMMAH — finances Wasil branchées sur les vraies données.
--
-- Avant : tout s'affichait à 0 $.
--  * Le coût IA était cherché dans des colonnes « *_usd » qui n'existent pas : il est enregistré en
--    micro-dollars (wasil_cost_observations.estimated_cost_microdollars).
--  * Les revenus RevenueCat étaient ensuite écrasés par wasil_credit_purchases, qui n'a pas de prix.
-- Maintenant : coût réel mesuré par requête, revenus = achats de packs Wasil en production (RevenueCat),
-- nombre d'achats = wasil_credit_purchases en production.

create or replace function public.admin_get_wasil_finance_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  v_questions_today numeric; v_questions_30d numeric; v_active_users numeric;
  v_cost_today numeric; v_cost_30d numeric; v_cost_lifetime numeric;
  v_revenue_today numeric; v_revenue_30d numeric; v_revenue_lifetime numeric; v_refunds_30d numeric;
  v_credits_available numeric := 0; v_credits_spent numeric := 0; v_purchases_30d numeric;
  v_average_cost numeric; v_margin numeric; v_profitability text;
  v_top jsonb; v_daily jsonb; v_projections jsonb;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;

  select count(*) filter (where created_at >= date_trunc('day', now())),
         count(*) filter (where created_at >= now() - interval '30 days'),
         count(distinct user_id) filter (where created_at >= now() - interval '30 days')
    into v_questions_today, v_questions_30d, v_active_users
    from public.analytics_events where event_name = 'wasil_question';

  select coalesce(sum(estimated_cost_microdollars) filter (where coalesce(measured_at, created_at) >= date_trunc('day', now())), 0) / 1e6,
         coalesce(sum(estimated_cost_microdollars) filter (where coalesce(measured_at, created_at) >= now() - interval '30 days'), 0) / 1e6,
         coalesce(sum(estimated_cost_microdollars), 0) / 1e6
    into v_cost_today, v_cost_30d, v_cost_lifetime
    from public.wasil_cost_observations;

  -- Wasil packs only (Premium subscriptions are counted in « Revenus »).
  select coalesce(sum(greatest(coalesce(price_usd, 0), 0)) filter (where event_type <> 'REFUND' and received_at >= date_trunc('day', now())), 0),
         coalesce(sum(greatest(coalesce(price_usd, 0), 0)) filter (where event_type <> 'REFUND' and received_at >= now() - interval '30 days'), 0),
         coalesce(sum(greatest(coalesce(price_usd, 0), 0)) filter (where event_type <> 'REFUND'), 0),
         coalesce(sum(abs(coalesce(price_usd, 0))) filter (where event_type = 'REFUND' and received_at >= now() - interval '30 days'), 0)
    into v_revenue_today, v_revenue_30d, v_revenue_lifetime, v_refunds_30d
    from public.revenuecat_webhook_events
    where environment = 'PRODUCTION' and product_id like 'oummah.wasil.%'
      and event_type in ('INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE', 'REFUND');

  select count(*) into v_purchases_30d from public.wasil_credit_purchases
    where environment = 'PRODUCTION' and coalesce(purchased_at, created_at) >= now() - interval '30 days';

  select coalesce(sum(balance), 0), coalesce(sum(total_spent), 0) into v_credits_available, v_credits_spent from public.wasil_wallets;

  v_margin := v_revenue_30d - v_refunds_30d - v_cost_30d;
  v_average_cost := case when v_questions_30d > 0 then v_cost_30d / v_questions_30d else 0 end;
  v_profitability := case
    when v_revenue_30d > 0 and v_margin / v_revenue_30d >= 0.70 then 'very_profitable'
    when v_revenue_30d > 0 and v_margin > 0 then 'profitable'
    when v_margin < 0 then 'loss'
    else 'watch' end;

  select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', r.user_id, 'email', u.email, 'balance', r.balance, 'total_spent', r.total_spent,
      'questions_30d', r.questions_30d, 'estimated_cost_30d_usd', r.questions_30d * v_average_cost)
    order by r.total_spent desc, r.questions_30d desc), '[]'::jsonb)
    into v_top
    from (
      select w.user_id, w.balance, w.total_spent,
        (select count(*) from public.analytics_events e
          where e.user_id = w.user_id and e.event_name = 'wasil_question' and e.created_at >= now() - interval '30 days')::int as questions_30d
      from public.wasil_wallets w order by w.total_spent desc limit 50
    ) r left join auth.users u on u.id = r.user_id;

  with days as (
    select generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day')::date as day
  ), q as (
    select created_at::date as day, count(*)::int as questions from public.analytics_events
    where event_name = 'wasil_question' and created_at >= date_trunc('day', now()) - interval '29 days' group by 1
  ), c as (
    select coalesce(measured_at, created_at)::date as day, sum(estimated_cost_microdollars) / 1e6 as cost from public.wasil_cost_observations
    where coalesce(measured_at, created_at) >= date_trunc('day', now()) - interval '29 days' group by 1
  ), r as (
    select received_at::date as day,
      sum(case when event_type = 'REFUND' then -abs(coalesce(price_usd, 0)) else greatest(coalesce(price_usd, 0), 0) end) as revenue
    from public.revenuecat_webhook_events
    where environment = 'PRODUCTION' and product_id like 'oummah.wasil.%'
      and event_type in ('INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE', 'REFUND')
      and received_at >= date_trunc('day', now()) - interval '29 days' group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object('day', days.day, 'questions', coalesce(q.questions, 0),
      'ai_cost_usd', coalesce(c.cost, 0), 'revenue_usd', coalesce(r.revenue, 0)) order by days.day), '[]'::jsonb)
    into v_daily
    from days left join q using (day) left join c using (day) left join r using (day);

  select jsonb_agg(jsonb_build_object(
      'users', n,
      'projected_questions', round(case when v_active_users > 0 then v_questions_30d / v_active_users else 0 end * n),
      'projected_ai_cost_usd', case when v_active_users > 0 then v_cost_30d / v_active_users else 0 end * n,
      'projected_revenue_usd', case when v_active_users > 0 then v_revenue_30d / v_active_users else 0 end * n,
      'projected_margin_usd', case when v_active_users > 0 then (v_revenue_30d - v_cost_30d) / v_active_users else 0 end * n)
    order by n)
    into v_projections
    from unnest(array[100, 1000, 10000]::numeric[]) as n;

  return jsonb_build_object(
    'overview', jsonb_build_object(
      'questions_today', v_questions_today, 'questions_30d', v_questions_30d,
      'ai_cost_today_usd', v_cost_today, 'ai_cost_30d_usd', v_cost_30d, 'ai_cost_lifetime_usd', v_cost_lifetime,
      'revenue_today_usd', v_revenue_today, 'revenue_30d_usd', v_revenue_30d, 'revenue_lifetime_usd', v_revenue_lifetime,
      'refunds_30d_usd', v_refunds_30d, 'net_margin_30d_usd', v_margin, 'average_cost_per_question_usd', v_average_cost,
      'credits_available', v_credits_available, 'credits_spent', v_credits_spent,
      'credit_purchase_count_30d', v_purchases_30d, 'profitability', v_profitability),
    'top_users', v_top,
    'daily', v_daily,
    'projections', v_projections,
    'diagnostics', jsonb_build_array(
      'Coût IA : mesuré pour chaque question (wasil_cost_observations).',
      'Revenus : packs Wasil achetés en production (RevenueCat), hors abonnements Premium et achats de test.'));
end;
$$;

notify pgrst, 'reload schema';
