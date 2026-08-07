-- OUMMAH — centre de support utilisateurs

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'support_ticket_category'
  ) then
    create type public.support_ticket_category as enum (
      'bug',
      'help',
      'suggestion',
      'account',
      'other'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'support_ticket_priority'
  ) then
    create type public.support_ticket_priority as enum (
      'low',
      'normal',
      'high',
      'urgent'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'support_ticket_status'
  ) then
    create type public.support_ticket_status as enum (
      'open',
      'in_progress',
      'resolved',
      'closed'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'support_sender_type'
  ) then
    create type public.support_sender_type as enum (
      'user',
      'admin'
    );
  end if;
end
$$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.support_ticket_category not null,
  priority public.support_ticket_priority not null default 'normal',
  status public.support_ticket_status not null default 'open',
  subject text not null
    check (char_length(trim(subject)) between 4 and 120),
  unread_by_admin boolean not null default true,
  unread_by_user boolean not null default false,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id)
    on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_type public.support_sender_type not null,
  body text not null
    check (char_length(trim(body)) between 2 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_created_idx
on public.support_tickets(user_id, created_at desc);

create index if not exists support_tickets_status_priority_idx
on public.support_tickets(status, priority, last_message_at desc);

create index if not exists support_messages_ticket_created_idx
on public.support_messages(ticket_id, created_at asc);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

revoke all on public.support_tickets from anon, authenticated;
revoke all on public.support_messages from anon, authenticated;

create or replace function public.create_support_ticket(
  p_category public.support_ticket_category,
  p_priority public.support_ticket_priority,
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  ticket_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if char_length(trim(p_subject)) < 4 then
    raise exception 'SUPPORT_SUBJECT_TOO_SHORT';
  end if;

  if char_length(trim(p_message)) < 10 then
    raise exception 'SUPPORT_MESSAGE_TOO_SHORT';
  end if;

  insert into public.support_tickets (
    user_id,
    category,
    priority,
    subject
  )
  values (
    auth.uid(),
    p_category,
    p_priority,
    trim(p_subject)
  )
  returning id into ticket_id;

  insert into public.support_messages (
    ticket_id,
    sender_id,
    sender_type,
    body
  )
  values (
    ticket_id,
    auth.uid(),
    'user',
    trim(p_message)
  );

  return ticket_id;
end;
$$;

create or replace function public.list_my_support_tickets()
returns table (
  id uuid,
  category public.support_ticket_category,
  priority public.support_ticket_priority,
  status public.support_ticket_status,
  subject text,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  unread_by_user boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  return query
  select
    ticket.id,
    ticket.category,
    ticket.priority,
    ticket.status,
    ticket.subject,
    ticket.created_at,
    ticket.updated_at,
    ticket.last_message_at,
    ticket.unread_by_user
  from public.support_tickets ticket
  where ticket.user_id = auth.uid()
  order by ticket.last_message_at desc;
end;
$$;

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
    from public.support_tickets
    where id = p_ticket_id
      and user_id = auth.uid()
  ) then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;

  update public.support_tickets
  set unread_by_user = false
  where id = p_ticket_id;

  return query
  select
    message.id,
    message.ticket_id,
    message.sender_type,
    account.email::text,
    message.body,
    message.created_at
  from public.support_messages message
  left join auth.users account
    on account.id = message.sender_id
  where message.ticket_id = p_ticket_id
  order by message.created_at asc;
end;
$$;

create or replace function public.reply_to_my_support_ticket(
  p_ticket_id uuid,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.support_tickets
    where id = p_ticket_id
      and user_id = auth.uid()
      and status <> 'closed'
  ) then
    raise exception 'SUPPORT_TICKET_NOT_REPLYABLE';
  end if;

  insert into public.support_messages (
    ticket_id,
    sender_id,
    sender_type,
    body
  )
  values (
    p_ticket_id,
    auth.uid(),
    'user',
    trim(p_body)
  );

  update public.support_tickets
  set
    unread_by_admin = true,
    unread_by_user = false,
    last_message_at = now(),
    updated_at = now(),
    status = case
      when status = 'resolved' then 'open'
      else status
    end,
    resolved_at = case
      when status = 'resolved' then null
      else resolved_at
    end
  where id = p_ticket_id;
end;
$$;

create or replace function public.admin_list_support_tickets(
  p_status public.support_ticket_status default null
)
returns table (
  id uuid,
  user_id uuid,
  user_email text,
  category public.support_ticket_category,
  priority public.support_ticket_priority,
  status public.support_ticket_status,
  subject text,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  unread_by_admin boolean
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
    ticket.id,
    ticket.user_id,
    account.email::text,
    ticket.category,
    ticket.priority,
    ticket.status,
    ticket.subject,
    ticket.created_at,
    ticket.updated_at,
    ticket.last_message_at,
    ticket.unread_by_admin
  from public.support_tickets ticket
  left join auth.users account on account.id = ticket.user_id
  where p_status is null or ticket.status = p_status
  order by
    case ticket.priority
      when 'urgent' then 0
      when 'high' then 1
      when 'normal' then 2
      else 3
    end,
    ticket.unread_by_admin desc,
    ticket.last_message_at desc;
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
    from public.support_tickets
    where id = p_ticket_id
  ) then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;

  update public.support_tickets
  set unread_by_admin = false
  where id = p_ticket_id;

  return query
  select
    message.id,
    message.sender_type,
    account.email::text,
    message.body,
    message.created_at
  from public.support_messages message
  left join auth.users account
    on account.id = message.sender_id
  where message.ticket_id = p_ticket_id
  order by message.created_at asc;
end;
$$;

create or replace function public.admin_reply_support_ticket(
  p_ticket_id uuid,
  p_body text
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

  if not exists (
    select 1
    from public.support_tickets
    where id = p_ticket_id
      and status <> 'closed'
  ) then
    raise exception 'SUPPORT_TICKET_NOT_REPLYABLE';
  end if;

  insert into public.support_messages (
    ticket_id,
    sender_id,
    sender_type,
    body
  )
  values (
    p_ticket_id,
    auth.uid(),
    'admin',
    trim(p_body)
  );

  update public.support_tickets
  set
    unread_by_user = true,
    unread_by_admin = false,
    assigned_admin_id = auth.uid(),
    last_message_at = now(),
    updated_at = now(),
    status = case
      when status = 'open' then 'in_progress'
      else status
    end
  where id = p_ticket_id;
end;
$$;

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status public.support_ticket_status,
  p_priority public.support_ticket_priority
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

  update public.support_tickets
  set
    status = p_status,
    priority = p_priority,
    assigned_admin_id = auth.uid(),
    updated_at = now(),
    resolved_at = case
      when p_status = 'resolved' then now()
      else null
    end,
    closed_at = case
      when p_status = 'closed' then now()
      else null
    end
  where id = p_ticket_id;

  if not found then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.create_support_ticket(
  public.support_ticket_category,
  public.support_ticket_priority,
  text,
  text
) from public;

revoke all on function public.list_my_support_tickets() from public;
revoke all on function public.list_my_support_messages(uuid) from public;
revoke all on function public.reply_to_my_support_ticket(uuid, text) from public;
revoke all on function public.admin_list_support_tickets(
  public.support_ticket_status
) from public;
revoke all on function public.admin_list_support_messages(uuid) from public;
revoke all on function public.admin_reply_support_ticket(uuid, text) from public;
revoke all on function public.admin_update_support_ticket(
  uuid,
  public.support_ticket_status,
  public.support_ticket_priority
) from public;

grant execute on function public.create_support_ticket(
  public.support_ticket_category,
  public.support_ticket_priority,
  text,
  text
) to authenticated;

grant execute on function public.list_my_support_tickets() to authenticated;
grant execute on function public.list_my_support_messages(uuid) to authenticated;
grant execute on function public.reply_to_my_support_ticket(uuid, text)
to authenticated;

grant execute on function public.admin_list_support_tickets(
  public.support_ticket_status
) to authenticated;
grant execute on function public.admin_list_support_messages(uuid)
to authenticated;
grant execute on function public.admin_reply_support_ticket(uuid, text)
to authenticated;
grant execute on function public.admin_update_support_ticket(
  uuid,
  public.support_ticket_status,
  public.support_ticket_priority
) to authenticated;

notify pgrst, 'reload schema';
