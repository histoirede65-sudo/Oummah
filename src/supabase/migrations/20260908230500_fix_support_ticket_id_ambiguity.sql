-- OUMMAH — correction support : références `id` ambiguës dans les fonctions
-- RETURNS TABLE. PostgreSQL expose les colonnes de sortie comme variables
-- PL/pgSQL ; `where id = ...` devenait donc ambigu avec support_tickets.id.

create or replace function public.list_my_support_messages(
  p_ticket_id uuid
)
returns table (
  id uuid,
  ticket_id uuid,
  sender_type public.support_sender_type,
  sender_email text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.support_tickets as ticket
    where ticket.id = p_ticket_id
      and ticket.user_id = auth.uid()
  ) then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;

  update public.support_tickets as ticket
  set unread_by_user = false
  where ticket.id = p_ticket_id;

  return query
  select
    message.id,
    message.ticket_id,
    message.sender_type,
    account.email::text,
    message.body,
    message.created_at
  from public.support_messages as message
  left join auth.users as account
    on account.id = message.sender_id
  where message.ticket_id = p_ticket_id
  order by message.created_at asc;
end;
$$;

create or replace function public.admin_list_support_messages(
  p_ticket_id uuid
)
returns table (
  id uuid,
  sender_type public.support_sender_type,
  sender_email text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.support_tickets as ticket
    where ticket.id = p_ticket_id
  ) then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;

  update public.support_tickets as ticket
  set unread_by_admin = false
  where ticket.id = p_ticket_id;

  return query
  select
    message.id,
    message.sender_type,
    account.email::text,
    message.body,
    message.created_at
  from public.support_messages as message
  left join auth.users as account
    on account.id = message.sender_id
  where message.ticket_id = p_ticket_id
  order by message.created_at asc;
end;
$$;

revoke all on function public.list_my_support_messages(uuid) from public;
revoke all on function public.admin_list_support_messages(uuid) from public;

grant execute on function public.list_my_support_messages(uuid) to authenticated;
grant execute on function public.admin_list_support_messages(uuid) to authenticated;

notify pgrst, 'reload schema';
