-- OUMMAH — compteurs support et notification de réponse

create or replace function public.get_my_unread_support_count()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select count(*)::integer
  from public.support_tickets
  where user_id = auth.uid()
    and unread_by_user = true;
$$;

create or replace function public.admin_get_support_counts()
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
      from public.support_tickets
      where status = 'open'
    ),
    'in_progress_count', (
      select count(*)
      from public.support_tickets
      where status = 'in_progress'
    ),
    'urgent_count', (
      select count(*)
      from public.support_tickets
      where priority = 'urgent'
        and status in ('open', 'in_progress')
    ),
    'unread_count', (
      select count(*)
      from public.support_tickets
      where unread_by_admin = true
        and status <> 'closed'
    )
  );
end;
$$;

create or replace function public.admin_get_support_push_target(
  p_ticket_id uuid
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

  select jsonb_build_object(
    'user_id', ticket.user_id,
    'subject', ticket.subject,
    'tokens', coalesce(
      (
        select jsonb_agg(token.expo_push_token)
        from public.user_push_tokens token
        where token.user_id = ticket.user_id
          and token.enabled = true
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.support_tickets ticket
  where ticket.id = p_ticket_id;

  if result is null then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;

  return result;
end;
$$;

revoke all on function public.get_my_unread_support_count() from public;
revoke all on function public.admin_get_support_counts() from public;
revoke all on function public.admin_get_support_push_target(uuid) from public;

grant execute on function public.get_my_unread_support_count() to authenticated;
grant execute on function public.admin_get_support_counts() to authenticated;
grant execute on function public.admin_get_support_push_target(uuid) to authenticated;

notify pgrst, 'reload schema';
