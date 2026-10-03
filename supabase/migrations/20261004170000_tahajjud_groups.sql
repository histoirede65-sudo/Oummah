-- OUMMAH — Tahajjud : groupes d'amis (nom libre), discussion de groupe, rappels programmés,
-- et notifications de messages façon messagerie (nom + texte, canal et son OUMMAH dédiés).
--
-- Règles :
--  * On crée un groupe avec ses amis ; chaque membre peut ajouter ses propres amis.
--  * Le créateur peut renommer et retirer des membres ; chacun peut quitter ou couper les notifications.
--  * Rappels : un message « rappel » avec une heure, envoyé en notification à tous les membres
--    (une fois ou chaque jour), via pg_cron chaque minute.
--  * Filtre de mots, limites, signalement : comme les messages privés.

-- ----- Message push (channel « oummah-messages-v1 », custom sound) -------------------------------

create or replace function public.community_push_message(p_users uuid[], p_title text, p_body text, p_route text)
returns void language plpgsql security definer set search_path = public, net as $$
declare v_tokens text[]; v_chunk text[];
begin
  select array_agg(distinct expo_push_token) into v_tokens
  from public.user_push_tokens where user_id = any(p_users) and enabled;
  if v_tokens is null then return; end if;
  for i in 0 .. (array_length(v_tokens, 1) - 1) / 100 loop
    v_chunk := v_tokens[i * 100 + 1 : i * 100 + 100];
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := (select jsonb_agg(jsonb_build_object(
        'to', token, 'title', p_title, 'body', p_body, 'sound', 'oummah_message.wav', 'priority', 'high',
        'channelId', 'oummah-messages-v1', 'data', jsonb_build_object('route', p_route)))
        from unnest(v_chunk) as token),
      timeout_milliseconds := 10000
    );
  end loop;
end;
$$;
revoke execute on function public.community_push_message(uuid[], text, text, text) from public, anon, authenticated;

-- Private messages: one notification per message, like a messaging app (sender name + text).
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

  select pseudo, avatar into v_pseudo, v_avatar from public.community_profiles where user_id = auth.uid();
  perform public.community_push_message(array[p_user], v_pseudo, left(v_body, 200),
    '/tahajjud/chat?id=' || auth.uid()::text || '&pseudo=' || public.oummah_url_encode(v_pseudo) || '&avatar=' || public.oummah_url_encode(v_avatar));
  return v_id;
end;
$$;
grant execute on function public.chat_send(uuid, text) to authenticated;

-- ----- Tables ------------------------------------------------------------------------------------

create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 40),
  owner uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.community_group_members (
  group_id uuid not null references public.community_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_by uuid references auth.users (id) on delete set null,
  muted boolean not null default false,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists community_group_members_user_idx on public.community_group_members (user_id);

create table if not exists public.community_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups (id) on delete cascade,
  sender uuid references auth.users (id) on delete set null,
  kind text not null default 'text' check (kind in ('text', 'reminder', 'system')),
  body text not null check (length(trim(body)) between 1 and 1000),
  remind_at timestamptz,
  repeat_daily boolean not null default false,
  reminder_active boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists community_group_messages_thread_idx on public.community_group_messages (group_id, created_at desc);
create index if not exists community_group_messages_due_idx on public.community_group_messages (remind_at) where reminder_active;

create table if not exists public.community_group_message_reports (
  message_id uuid not null references public.community_group_messages (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, reporter)
);

alter table public.community_groups enable row level security;
alter table public.community_group_members enable row level security;
alter table public.community_group_messages enable row level security;
alter table public.community_group_message_reports enable row level security;
revoke all on public.community_groups, public.community_group_members, public.community_group_messages, public.community_group_message_reports
  from anon, authenticated;

-- ----- Helpers -----------------------------------------------------------------------------------

create or replace function public.group_is_member(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_group_members where group_id = p_group and user_id = p_user);
$$;

create or replace function public.group_require_member(p_group uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  perform public.community_require_profile();
  if not public.group_is_member(p_group) then raise exception 'NOT_MEMBER'; end if;
end;
$$;

create or replace function public.group_route(p_group uuid)
returns text language sql stable security definer set search_path = public as $$
  select '/tahajjud/group?id=' || p_group::text || '&name=' || public.oummah_url_encode(name) from public.community_groups where id = p_group;
$$;

-- Notify every member but the sender (and those who muted the group or blocked the sender).
create or replace function public.group_notify(p_group uuid, p_sender uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare v_users uuid[]; v_name text;
begin
  select name into v_name from public.community_groups where id = p_group;
  select array_agg(m.user_id) into v_users
  from public.community_group_members m
  where m.group_id = p_group and not m.muted and m.user_id is distinct from p_sender
    and (p_sender is null or not public.community_blocked_between(m.user_id, p_sender));
  if v_users is null then return; end if;
  perform public.community_push_message(v_users, v_name, left(p_body, 200), public.group_route(p_group));
end;
$$;
revoke execute on function public.group_notify(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.group_system_message(p_group uuid, p_body text)
returns void language sql security definer set search_path = public as $$
  insert into public.community_group_messages (group_id, sender, kind, body) values (p_group, null, 'system', left(p_body, 1000));
$$;
revoke execute on function public.group_system_message(uuid, text) from public, anon, authenticated;

-- Adds my friends (others are ignored silently). Returns how many were added.
create or replace function public.group_add_friends(p_group uuid, p_members uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare v_added integer := 0; v_user uuid; v_me text; v_names text[] := '{}'; v_pseudo text;
begin
  perform public.group_require_member(p_group);
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  foreach v_user in array coalesce(p_members, '{}') loop
    if v_user <> auth.uid()
       and public.community_are_friends(auth.uid(), v_user)
       and not public.community_blocked_between(auth.uid(), v_user)
       and not public.group_is_member(p_group, v_user)
       and (select count(*) from public.community_group_members where group_id = p_group) < 50 then
      insert into public.community_group_members (group_id, user_id, added_by) values (p_group, v_user, auth.uid());
      select pseudo into v_pseudo from public.community_profiles where user_id = v_user;
      v_names := v_names || v_pseudo;
      v_added := v_added + 1;
    end if;
  end loop;
  if v_added > 0 then
    perform public.group_system_message(p_group, v_me || ' a ajouté ' || array_to_string(v_names, ', '));
  end if;
  return v_added;
end;
$$;
grant execute on function public.group_add_friends(uuid, uuid[]) to authenticated;

-- ----- Groups ------------------------------------------------------------------------------------

create or replace function public.group_create(p_name text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'); v_me text;
begin
  perform public.community_require_profile();
  if length(v_name) = 0 or length(v_name) > 40 then raise exception 'INVALID'; end if;
  if not public.dua_wall_text_allowed(v_name) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.community_groups where owner = auth.uid() and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.community_groups (name, owner) values (v_name, auth.uid()) returning id into v_id;
  insert into public.community_group_members (group_id, user_id, added_by) values (v_id, auth.uid(), auth.uid());
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.group_system_message(v_id, v_me || ' a créé le groupe « ' || v_name || ' »');
  perform public.group_add_friends(v_id, p_members);
  perform public.group_notify(v_id, auth.uid(), v_me || ' vous a ajouté au groupe');
  return v_id;
end;
$$;
grant execute on function public.group_create(text, uuid[]) to authenticated;

create or replace function public.group_rename(p_group uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'); v_me text;
begin
  perform public.group_require_member(p_group);
  if (select owner from public.community_groups where id = p_group) <> auth.uid() then raise exception 'NOT_OWNER'; end if;
  if length(v_name) = 0 or length(v_name) > 40 then raise exception 'INVALID'; end if;
  if not public.dua_wall_text_allowed(v_name) then raise exception 'TEXT_REFUSED'; end if;
  update public.community_groups set name = v_name where id = p_group;
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.group_system_message(p_group, v_me || ' a renommé le groupe « ' || v_name || ' »');
end;
$$;
grant execute on function public.group_rename(uuid, text) to authenticated;

-- Leave (p_user = me) or remove a member (owner only). The oldest member inherits ownership.
create or replace function public.group_remove_member(p_group uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_pseudo text; v_next uuid;
begin
  perform public.group_require_member(p_group);
  select owner into v_owner from public.community_groups where id = p_group;
  if p_user <> auth.uid() and v_owner <> auth.uid() then raise exception 'NOT_OWNER'; end if;
  select pseudo into v_pseudo from public.community_profiles where user_id = p_user;
  delete from public.community_group_members where group_id = p_group and user_id = p_user;
  if not exists (select 1 from public.community_group_members where group_id = p_group) then
    delete from public.community_groups where id = p_group;
    return;
  end if;
  if p_user = v_owner then
    select user_id into v_next from public.community_group_members where group_id = p_group order by joined_at limit 1;
    update public.community_groups set owner = v_next where id = p_group;
  end if;
  perform public.group_system_message(p_group, coalesce(v_pseudo, 'Un membre') || case when p_user = auth.uid() then ' a quitté le groupe' else ' a été retiré du groupe' end);
end;
$$;
grant execute on function public.group_remove_member(uuid, uuid) to authenticated;

create or replace function public.group_set_muted(p_group uuid, p_muted boolean)
returns void language sql security definer set search_path = public as $$
  update public.community_group_members set muted = coalesce(p_muted, false) where group_id = p_group and user_id = auth.uid();
$$;
grant execute on function public.group_set_muted(uuid, boolean) to authenticated;

create or replace function public.group_list()
returns table (id uuid, name text, members integer, is_owner boolean, muted boolean,
               last_body text, last_kind text, last_sender text, last_at timestamptz, unread integer)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.community_require_profile();
  return query
    select g.id, g.name,
      (select count(*)::int from public.community_group_members x where x.group_id = g.id),
      g.owner = auth.uid(), m.muted,
      l.body, l.kind, c.pseudo, coalesce(l.created_at, g.created_at),
      (select count(*)::int from public.community_group_messages u
        where u.group_id = g.id and u.created_at > m.last_read_at and u.sender is distinct from auth.uid() and u.kind <> 'system')
    from public.community_group_members m
    join public.community_groups g on g.id = m.group_id
    left join lateral (
      select * from public.community_group_messages gm where gm.group_id = g.id order by gm.created_at desc limit 1
    ) l on true
    left join public.community_profiles c on c.user_id = l.sender
    where m.user_id = auth.uid()
    order by coalesce(l.created_at, g.created_at) desc;
end;
$$;
grant execute on function public.group_list() to authenticated;

create or replace function public.group_detail(p_group uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.group_require_member(p_group);
  return (
    select jsonb_build_object(
      'id', g.id, 'name', g.name, 'isOwner', g.owner = auth.uid(),
      'muted', (select muted from public.community_group_members where group_id = g.id and user_id = auth.uid()),
      'members', (
        select jsonb_agg(jsonb_build_object('id', m.user_id, 'pseudo', coalesce(c.pseudo, 'Membre'), 'avatar', coalesce(c.avatar, 'moon'),
          'owner', m.user_id = g.owner, 'me', m.user_id = auth.uid()) order by m.user_id <> g.owner, c.pseudo)
        from public.community_group_members m left join public.community_profiles c on c.user_id = m.user_id
        where m.group_id = g.id),
      'reminders', coalesce((
        select jsonb_agg(jsonb_build_object('id', r.id, 'body', r.body, 'remindAt', r.remind_at, 'repeatDaily', r.repeat_daily,
          'by', coalesce(c.pseudo, 'Membre'), 'mine', r.sender = auth.uid()) order by r.remind_at)
        from public.community_group_messages r left join public.community_profiles c on c.user_id = r.sender
        where r.group_id = g.id and r.reminder_active), '[]'::jsonb)
    )
    from public.community_groups g where g.id = p_group
  );
end;
$$;
grant execute on function public.group_detail(uuid) to authenticated;

create or replace function public.group_thread(p_group uuid, p_before timestamptz default null, p_limit integer default 40)
returns table (id uuid, body text, kind text, remind_at timestamptz, repeat_daily boolean, reminder_active boolean,
               sender uuid, sender_pseudo text, sender_avatar text, mine boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  perform public.group_require_member(p_group);
  update public.community_group_members set last_read_at = clock_timestamp() where group_id = p_group and user_id = auth.uid();
  return query
    select m.id, m.body, m.kind, m.remind_at, m.repeat_daily, m.reminder_active,
      m.sender, c.pseudo, c.avatar, m.sender = auth.uid(), m.created_at
    from public.community_group_messages m
    left join public.community_profiles c on c.user_id = m.sender
    where m.group_id = p_group
      and (p_before is null or m.created_at < p_before)
      and (m.sender is null or not public.community_blocked_between(auth.uid(), m.sender))
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 40), 1), 100);
end;
$$;
grant execute on function public.group_thread(uuid, timestamptz, integer) to authenticated;

create or replace function public.group_send(p_group uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_body text := trim(coalesce(p_body, '')); v_me text;
begin
  perform public.group_require_member(p_group);
  if length(v_body) = 0 or length(v_body) > 1000 then raise exception 'INVALID'; end if;
  if not public.dua_wall_text_allowed(v_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.community_group_messages where sender = auth.uid() and created_at > now() - interval '24 hours') >= 500 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.community_group_messages (group_id, sender, body) values (p_group, auth.uid(), v_body) returning id into v_id;
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.group_notify(p_group, auth.uid(), v_me || ' : ' || v_body);
  return v_id;
end;
$$;
grant execute on function public.group_send(uuid, text) to authenticated;

-- Reminder: shown in the conversation, notified to every member at the time (then daily if asked).
create or replace function public.group_add_reminder(p_group uuid, p_body text, p_remind_at timestamptz, p_repeat_daily boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_body text := trim(coalesce(p_body, '')); v_me text;
begin
  perform public.group_require_member(p_group);
  if length(v_body) = 0 or length(v_body) > 200 then raise exception 'INVALID'; end if;
  if p_remind_at is null or p_remind_at < now() - interval '1 minute' or p_remind_at > now() + interval '30 days' then raise exception 'INVALID'; end if;
  if not public.dua_wall_text_allowed(v_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.community_group_messages where group_id = p_group and reminder_active) >= 20 then raise exception 'RATE_LIMIT'; end if;
  insert into public.community_group_messages (group_id, sender, kind, body, remind_at, repeat_daily, reminder_active)
    values (p_group, auth.uid(), 'reminder', v_body, p_remind_at, coalesce(p_repeat_daily, false), true)
    returning id into v_id;
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.group_notify(p_group, auth.uid(), v_me || ' a programmé un rappel : ' || v_body);
  return v_id;
end;
$$;
grant execute on function public.group_add_reminder(uuid, text, timestamptz, boolean) to authenticated;

create or replace function public.group_cancel_reminder(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.community_group_messages m set reminder_active = false
  where m.id = p_id and m.kind = 'reminder'
    and public.group_is_member(m.group_id)
    and (m.sender = auth.uid() or (select owner from public.community_groups g where g.id = m.group_id) = auth.uid());
end;
$$;
grant execute on function public.group_cancel_reminder(uuid) to authenticated;

create or replace function public.group_delete_message(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.community_group_messages where id = p_id and sender = auth.uid();
$$;
grant execute on function public.group_delete_message(uuid) to authenticated;

create or replace function public.group_report_message(p_id uuid)
returns void language plpgsql security definer set search_path = public, auth, net as $$
declare v_message public.community_group_messages; v_pseudo text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_message from public.community_group_messages where id = p_id;
  if v_message.id is null or not public.group_is_member(v_message.group_id) then raise exception 'NOT_FOUND'; end if;
  insert into public.community_group_message_reports (message_id, reporter) values (p_id, auth.uid()) on conflict do nothing;
  if found then
    select pseudo into v_pseudo from public.community_profiles where user_id = v_message.sender;
    perform public.create_admin_alert_and_notify(
      'community_group_message_reported', 'community-group-message:' || p_id::text, 'warning',
      'Message de groupe signalé (' || coalesce(v_pseudo, '?') || ')', left(v_message.body, 120), true,
      jsonb_build_object('message_id', p_id, 'group_id', v_message.group_id, 'sender', v_message.sender)
    );
  end if;
end;
$$;
grant execute on function public.group_report_message(uuid) to authenticated;

-- Unread badge: private messages + groups.
create or replace function public.chat_unread_count()
returns integer language sql stable security definer set search_path = public as $$
  select (
    select count(*)::int from public.community_messages m
    where m.recipient = auth.uid() and m.read_at is null and not public.community_blocked_between(auth.uid(), m.sender)
  ) + (
    select count(*)::int from public.community_group_members gm
    join public.community_group_messages x on x.group_id = gm.group_id
      and x.created_at > gm.last_read_at and x.sender is distinct from auth.uid() and x.kind <> 'system'
    where gm.user_id = auth.uid()
  );
$$;
grant execute on function public.chat_unread_count() to authenticated;

-- ----- Due reminders (pg_cron, every minute) -----------------------------------------------------

create or replace function public.community_send_due_reminders()
returns integer language plpgsql security definer set search_path = public as $$
declare v_reminder record; v_count integer := 0; v_users uuid[]; v_name text;
begin
  for v_reminder in
    select * from public.community_group_messages
    where reminder_active and remind_at <= now() and remind_at > now() - interval '2 hours'
    for update skip locked
  loop
    select name into v_name from public.community_groups where id = v_reminder.group_id;
    select array_agg(user_id) into v_users from public.community_group_members where group_id = v_reminder.group_id and not muted;
    if v_users is not null then
      perform public.community_push_message(v_users, '⏰ ' || v_name, v_reminder.body, public.group_route(v_reminder.group_id));
    end if;
    update public.community_group_messages set
      remind_at = case when repeat_daily then remind_at + interval '1 day' else remind_at end,
      reminder_active = repeat_daily
    where id = v_reminder.id;
    v_count := v_count + 1;
  end loop;
  -- Missed for too long (cron down): roll daily ones forward, close one-shots.
  update public.community_group_messages set
    remind_at = case when repeat_daily then remind_at + (ceil(extract(epoch from now() - remind_at) / 86400) * interval '1 day') else remind_at end,
    reminder_active = repeat_daily
  where reminder_active and remind_at <= now() - interval '2 hours';
  return v_count;
end;
$$;
revoke execute on function public.community_send_due_reminders() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'community-group-reminders';
select cron.schedule('community-group-reminders', '* * * * *', 'select public.community_send_due_reminders()');

notify pgrst, 'reload schema';
