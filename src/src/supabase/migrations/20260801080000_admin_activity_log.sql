-- OUMMAH — journal d'activité et compteurs administrateur

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
      select count(*)
      from auth.users
      where created_at >= date_trunc('day', now())
    ),
    'mosque_pending', (
      select count(*)
      from public.mosque_submissions
      where validation_status = 'pending'
    ),
    'mosque_approved', (
      select count(*)
      from public.mosque_submissions
      where validation_status = 'approved'
    ),
    'mosque_rejected', (
      select count(*)
      from public.mosque_submissions
      where validation_status = 'rejected'
    ),
    'wallets_total', (
      select count(*)
      from public.wasil_wallets
    ),
    'credits_available', (
      select coalesce(sum(balance), 0)
      from public.wasil_wallets
    ),
    'credits_spent', (
      select coalesce(sum(total_spent), 0)
      from public.wasil_wallets
    ),
    'mosque_reports_pending', (
      select count(*)
      from public.mosque_reports
      where status = 'pending'
    ),
    'admin_actions_today', (
      (
        select count(*)
        from public.admin_credit_adjustments
        where created_at >= date_trunc('day', now())
      )
      +
      (
        select count(*)
        from public.mosque_review_history
        where created_at >= date_trunc('day', now())
      )
      +
      (
        select count(*)
        from public.mosque_reports
        where reviewed_at >= date_trunc('day', now())
      )
    )
  )
  into result;

  return result;
end;
$$;

create or replace function public.admin_list_activity(
  p_limit integer default 100
)
returns table (
  id text,
  kind text,
  title text,
  description text,
  admin_email text,
  created_at timestamptz,
  amount integer,
  status text
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
  select *
  from (
    select
      adjustment.id::text as id,
      'credit_adjustment'::text as kind,
      'Ajustement de crédits Wasil'::text as title,
      (
        coalesce(target.email::text, adjustment.target_user_id::text)
        || ' · '
        || adjustment.reason
      )::text as description,
      admin_user.email::text as admin_email,
      adjustment.created_at,
      adjustment.amount,
      'completed'::text as status
    from public.admin_credit_adjustments adjustment
    left join auth.users admin_user
      on admin_user.id = adjustment.admin_user_id
    left join auth.users target
      on target.id = adjustment.target_user_id

    union all

    select
      history.id::text as id,
      'mosque_review'::text as kind,
      case
        when history.previous_status = history.new_status
          and history.rejection_reason = 'Mosquée masquée du public'
          then 'Mosquée masquée'
        when history.previous_status = history.new_status
          and history.rejection_reason = 'Mosquée réaffichée au public'
          then 'Mosquée réaffichée'
        when history.previous_status = history.new_status
          then 'Informations de mosquée corrigées'
        when history.new_status = 'approved'
          then 'Mosquée validée'
        when history.new_status = 'rejected'
          then 'Mosquée refusée'
        else 'Statut de mosquée modifié'
      end::text as title,
      (
        coalesce(submission.name, 'Mosquée')
        ||
        case
          when history.rejection_reason is not null
            then ' · ' || history.rejection_reason
          else ''
        end
      )::text as description,
      admin_user.email::text as admin_email,
      history.created_at,
      null::integer as amount,
      history.new_status::text as status
    from public.mosque_review_history history
    left join public.mosque_submissions submission
      on submission.id = history.submission_id
    left join auth.users admin_user
      on admin_user.id = history.admin_user_id

    union all

    select
      report.id::text as id,
      'mosque_report'::text as kind,
      case
        when report.status = 'resolved'
          then 'Signalement résolu'
        when report.status = 'ignored'
          then 'Signalement ignoré'
        else 'Nouveau signalement'
      end::text as title,
      (
        report.mosque_name
        || ' · '
        || report.reason::text
        ||
        case
          when report.details is not null and trim(report.details) <> ''
            then ' · ' || report.details
          else ''
        end
      )::text as description,
      admin_user.email::text as admin_email,
      coalesce(report.reviewed_at, report.created_at) as created_at,
      null::integer as amount,
      report.status::text as status
    from public.mosque_reports report
    left join auth.users admin_user
      on admin_user.id = report.reviewed_by
  ) activity
  order by activity.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
end;
$$;

revoke all on function public.admin_list_activity(integer) from public;
grant execute on function public.admin_list_activity(integer) to authenticated;

notify pgrst, 'reload schema';
