-- OUMMAH — Tahajjud : messagerie privée entre amis.
--
-- Règles :
--  * Uniquement entre amis acceptés, jamais si l'un a bloqué l'autre.
--  * Chacun peut refuser les messages (réglage du profil OUMMAH).
--  * Filtre de mots du Mur des duas, limite quotidienne, signalement d'un message (alerte admin).
--  * Supprimer son message le retire pour les deux.

alter table public.community_profiles add column if not exists accept_messages boolean not null default true;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender <> recipient)
);
create index if not exists community_messages_pair_idx
  on public.community_messages (least(sender, recipient), greatest(sender, recipient), created_at desc);
create index if not exists community_messages_unread_idx on public.community_messages (recipient) where read_at is null;

create table if not exists public.community_message_reports (
  message_id uuid not null references public.community_messages (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, reporter)
);

alter table public.community_messages enable row level security;
alter table public.community_message_reports enable row level security;
revoke all on public.community_messages, public.community_message_reports from anon, authenticated;

create or replace function public.chat_send(p_user uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_body text := trim(coalesce(p_body, '')); v_pseudo text; v_avatar text;
begin
  perform public.community_require_profile();
  if length(v_body) = 0 or length(v_body) > 1000 then raise exception 'INVALID'; end if;
  if not public.community_are_friends(auth.uid(), p_user) or public.community_blocked_between(auth.uid(), p_user) then
    raise exception 'NOT_FRIENDS';
  end if;
  if not (select accept_messages from public.community_profiles where user_id = p_user) then raise exception 'MESSAGES_CLOSED'; end if;
  if not public.dua_wall_text_allowed(v_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.community_messages where sender = auth.uid() and created_at > now() - interval '24 hours') >= 300 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.community_messages (sender, recipient, body) values (auth.uid(), p_user, v_body) returning id into v_id;

  -- One push per burst: only if the recipient had no unread message from me in the last 3 minutes.
  if not exists (
    select 1 from public.community_messages
    where sender = auth.uid() and recipient = p_user and read_at is null and id <> v_id and created_at > now() - interval '3 minutes'
  ) then
    select pseudo, avatar into v_pseudo, v_avatar from public.community_profiles where user_id = auth.uid();
    perform public.community_push(p_user, v_pseudo, left(v_body, 120),
      '/tahajjud/chat?id=' || auth.uid()::text || '&pseudo=' || public.oummah_url_encode(v_pseudo) || '&avatar=' || public.oummah_url_encode(v_avatar));
  end if;
  return v_id;
end;
$$;
grant execute on function public.chat_send(uuid, text) to authenticated;

-- A conversation, newest first (pagination with p_before). Marks received messages as read.
create or replace function public.chat_thread(p_user uuid, p_before timestamptz default null, p_limit integer default 40)
returns table (id uuid, body text, mine boolean, created_at timestamptz, read boolean)
language plpgsql security definer set search_path = public as $$
begin
  perform public.community_require_profile();
  if public.community_blocked_between(auth.uid(), p_user) then return; end if;
  update public.community_messages m set read_at = now()
    where m.sender = p_user and m.recipient = auth.uid() and m.read_at is null;
  return query
    select m.id, m.body, m.sender = auth.uid(), m.created_at, m.read_at is not null
    from public.community_messages m
    where ((m.sender = auth.uid() and m.recipient = p_user) or (m.sender = p_user and m.recipient = auth.uid()))
      and (p_before is null or m.created_at < p_before)
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 40), 1), 100);
end;
$$;
grant execute on function public.chat_thread(uuid, timestamptz, integer) to authenticated;

-- Last message and unread count per friend.
create or replace function public.chat_conversations()
returns table (user_id uuid, last_body text, last_mine boolean, last_at timestamptz, unread integer)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.community_require_profile();
  return query
    with mine as (
      select case when m.sender = auth.uid() then m.recipient else m.sender end as other, m.*
      from public.community_messages m
      where m.sender = auth.uid() or m.recipient = auth.uid()
    ),
    last as (
      select distinct on (other) other, body, sender = auth.uid() as last_mine, created_at
      from mine order by other, created_at desc
    )
    select l.other, l.body, l.last_mine, l.created_at,
      (select count(*)::int from mine u where u.other = l.other and u.recipient = auth.uid() and u.read_at is null)
    from last l
    where not public.community_blocked_between(auth.uid(), l.other)
    order by l.created_at desc;
end;
$$;
grant execute on function public.chat_conversations() to authenticated;

create or replace function public.chat_unread_count()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.community_messages m
  where m.recipient = auth.uid() and m.read_at is null and not public.community_blocked_between(auth.uid(), m.sender);
$$;
grant execute on function public.chat_unread_count() to authenticated;

create or replace function public.chat_delete(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.community_messages where id = p_id and sender = auth.uid();
$$;
grant execute on function public.chat_delete(uuid) to authenticated;

create or replace function public.chat_report(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth, net as $$
declare v_message public.community_messages; v_pseudo text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.community_messages where id = p_id and recipient = auth.uid();
  if v_message.id is null then raise exception 'NOT_FOUND'; end if;
  insert into public.community_message_reports (message_id, reporter) values (p_id, auth.uid()) on conflict do nothing;
  if found then
    select pseudo into v_pseudo from public.community_profiles where user_id = v_message.sender;
    perform public.create_admin_alert_and_notify(
      'community_message_reported', 'community-message:' || p_id::text, 'warning',
      'Message signalé de ' || coalesce(v_pseudo, '?'), left(v_message.body, 120), true,
      jsonb_build_object('message_id', p_id, 'sender', v_message.sender, 'recipient', v_message.recipient)
    );
  end if;
end;
$$;
grant execute on function public.chat_report(uuid) to authenticated;

notify pgrst, 'reload schema';

-- Exact order of messages sent in a burst.
alter table public.community_messages alter column created_at set default clock_timestamp();
