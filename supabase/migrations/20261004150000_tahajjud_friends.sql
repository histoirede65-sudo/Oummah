-- OUMMAH — Tahajjud phase 4 : amis, activité selon la confidentialité, encouragements prédéfinis.
--
-- Règles :
--  * Pas de classement, pas de score comparatif : on voit seulement si un ami est réveillé / a prié
--    cette nuit et son nombre de nuits sur 7 jours, et uniquement s'il l'a autorisé.
--  * Blocage : coupe l'amitié, masque dans la recherche, empêche demandes et encouragements.
--  * Encouragements : messages prédéfinis uniquement (pas de texte libre), limités.

alter table public.community_profiles
  add column if not exists share_with_friends boolean not null default true,
  add column if not exists accept_friend_requests boolean not null default true;

create table if not exists public.community_friendships (
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (requester, addressee),
  check (requester <> addressee)
);
create unique index if not exists community_friendships_pair_idx
  on public.community_friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists community_friendships_addressee_idx on public.community_friendships (addressee, status);

create table if not exists public.community_blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

create table if not exists public.community_user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references auth.users (id) on delete cascade,
  reported uuid not null references auth.users (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (reporter, reported)
);

create table if not exists public.community_encouragements (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists community_encouragements_recipient_idx on public.community_encouragements (recipient, created_at desc);
create index if not exists community_encouragements_sender_idx on public.community_encouragements (sender, created_at desc);

-- No direct access: functions only.
alter table public.community_friendships enable row level security;
alter table public.community_blocks enable row level security;
alter table public.community_user_reports enable row level security;
alter table public.community_encouragements enable row level security;
revoke all on public.community_friendships, public.community_blocks, public.community_user_reports, public.community_encouragements from anon, authenticated;

-- ----- Helpers -----------------------------------------------------------------------------------

create or replace function public.community_require_profile()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.community_profiles where user_id = auth.uid()) then raise exception 'PROFILE_REQUIRED'; end if;
end;
$$;

create or replace function public.community_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;

create or replace function public.community_are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_friendships
    where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- Push to one member (Tahajjud channel). Silent if no token.
create or replace function public.community_push(p_user uuid, p_title text, p_body text, p_route text)
returns void language plpgsql security definer set search_path = public, net as $$
declare v_tokens text[];
begin
  select array_agg(distinct expo_push_token) into v_tokens from public.user_push_tokens where user_id = p_user and enabled;
  if v_tokens is null then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
    body := (select jsonb_agg(jsonb_build_object(
      'to', token, 'title', p_title, 'body', p_body, 'sound', 'default',
      'channelId', 'oummah-tahajjud-v1', 'data', jsonb_build_object('route', p_route)))
      from unnest(v_tokens) as token),
    timeout_milliseconds := 10000
  );
end;
$$;
revoke execute on function public.community_push(uuid, text, text, text) from public, anon, authenticated;

-- ----- Friends -----------------------------------------------------------------------------------

-- Search by pseudo (prefix, then contains). Blocked members (either way) never appear.
create or replace function public.friend_search(p_query text)
returns table (user_id uuid, pseudo text, avatar text, relation text)
language plpgsql stable security definer set search_path = public as $$
declare v_query text := lower(trim(coalesce(p_query, '')));
begin
  perform public.community_require_profile();
  if length(v_query) < 2 then return; end if;
  return query
    select c.user_id, c.pseudo, c.avatar,
      case
        when f.status = 'accepted' then 'friend'
        when f.status = 'pending' and f.requester = auth.uid() then 'sent'
        when f.status = 'pending' then 'received'
        else 'none'
      end
    from public.community_profiles c
    left join public.community_friendships f
      on (f.requester = auth.uid() and f.addressee = c.user_id) or (f.requester = c.user_id and f.addressee = auth.uid())
    where c.user_id <> auth.uid()
      and lower(c.pseudo) like '%' || replace(replace(v_query, '%', ''), '_', '\_') || '%'
      and not public.community_blocked_between(auth.uid(), c.user_id)
    order by (lower(c.pseudo) like replace(replace(v_query, '%', ''), '_', '\_') || '%') desc, length(c.pseudo), c.pseudo
    limit 15;
end;
$$;
grant execute on function public.friend_search(text) to authenticated;

-- Send a request (or accept it if the other member already asked).
create or replace function public.friend_request(p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_pseudo text;
begin
  perform public.community_require_profile();
  if p_user = auth.uid() then raise exception 'INVALID'; end if;
  if public.community_blocked_between(auth.uid(), p_user) then raise exception 'NOT_FOUND'; end if;
  if not exists (select 1 from public.community_profiles where user_id = p_user) then raise exception 'NOT_FOUND'; end if;
  if public.community_are_friends(auth.uid(), p_user) then return 'friend'; end if;

  if exists (select 1 from public.community_friendships where requester = p_user and addressee = auth.uid()) then
    update public.community_friendships set status = 'accepted', responded_at = now() where requester = p_user and addressee = auth.uid();
    select pseudo into v_pseudo from public.community_profiles where user_id = auth.uid();
    perform public.community_push(p_user, 'Nouvel ami', v_pseudo || ' a accepté votre demande d’ami.', '/tahajjud/friends');
    return 'friend';
  end if;

  if exists (select 1 from public.community_friendships where requester = auth.uid() and addressee = p_user) then return 'sent'; end if;
  if not (select accept_friend_requests from public.community_profiles where user_id = p_user) then raise exception 'REQUESTS_CLOSED'; end if;
  if (select count(*) from public.community_friendships where requester = auth.uid() and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT';
  end if;

  insert into public.community_friendships (requester, addressee) values (auth.uid(), p_user);
  select pseudo into v_pseudo from public.community_profiles where user_id = auth.uid();
  perform public.community_push(p_user, 'Demande d’ami', v_pseudo || ' souhaite vous ajouter en ami sur OUMMAH.', '/tahajjud/friends');
  return 'sent';
end;
$$;
grant execute on function public.friend_request(uuid) to authenticated;

create or replace function public.friend_respond(p_user uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_pseudo text;
begin
  perform public.community_require_profile();
  if p_accept then
    update public.community_friendships set status = 'accepted', responded_at = now()
      where requester = p_user and addressee = auth.uid() and status = 'pending';
    if found then
      select pseudo into v_pseudo from public.community_profiles where user_id = auth.uid();
      perform public.community_push(p_user, 'Nouvel ami', v_pseudo || ' a accepté votre demande d’ami.', '/tahajjud/friends');
    end if;
  else
    delete from public.community_friendships where requester = p_user and addressee = auth.uid() and status = 'pending';
  end if;
end;
$$;
grant execute on function public.friend_respond(uuid, boolean) to authenticated;

-- Remove a friend or cancel a sent request.
create or replace function public.friend_remove(p_user uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.community_friendships
  where (requester = auth.uid() and addressee = p_user) or (requester = p_user and addressee = auth.uid());
$$;
grant execute on function public.friend_remove(uuid) to authenticated;

create or replace function public.community_block(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_user = auth.uid() then raise exception 'INVALID'; end if;
  delete from public.community_friendships
    where (requester = auth.uid() and addressee = p_user) or (requester = p_user and addressee = auth.uid());
  insert into public.community_blocks (blocker, blocked) values (auth.uid(), p_user) on conflict do nothing;
end;
$$;
grant execute on function public.community_block(uuid) to authenticated;

create or replace function public.community_unblock(p_user uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.community_blocks where blocker = auth.uid() and blocked = p_user;
$$;
grant execute on function public.community_unblock(uuid) to authenticated;

create or replace function public.community_report_user(p_user uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public, auth, net as $$
declare v_pseudo text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.community_user_reports (reporter, reported, reason) values (auth.uid(), p_user, left(p_reason, 300))
    on conflict (reporter, reported) do nothing;
  if found then
    select pseudo into v_pseudo from public.community_profiles where user_id = p_user;
    perform public.create_admin_alert_and_notify(
      'community_user_reported', 'community-user:' || p_user::text || ':' || auth.uid()::text, 'warning',
      'Membre signalé : ' || coalesce(v_pseudo, '?'), coalesce(left(p_reason, 120), 'Signalement depuis Tahajjud (amis)'), true,
      jsonb_build_object('user_id', p_user, 'reports', (select count(*) from public.community_user_reports where reported = p_user))
    );
  end if;
end;
$$;
grant execute on function public.community_report_user(uuid, text) to authenticated;

-- Everything the friends screen needs in one call.
create or replace function public.friends_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  perform public.community_require_profile();
  return jsonb_build_object(
    'friends', coalesce((
      select jsonb_agg(row_to_json(x) order by x.tonight is null, x.pseudo)
      from (
        select c.user_id as id, c.pseudo, c.avatar, c.share_with_friends as shared,
          case when c.share_with_friends then (
            select p.status from public.tahajjud_presence p
            where p.user_id = c.user_id and p.updated_at > now() - interval '12 hours'
            order by p.updated_at desc limit 1) end as tonight,
          case when c.share_with_friends then (
            select count(*) from public.tahajjud_presence p
            where p.user_id = c.user_id and p.status = 'prayed' and p.night_key::date > current_date - 7)::int end as week
        from public.community_friendships f
        join public.community_profiles c on c.user_id = case when f.requester = v_me then f.addressee else f.requester end
        where f.status = 'accepted' and (f.requester = v_me or f.addressee = v_me)
      ) x), '[]'::jsonb),
    'received', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.user_id, 'pseudo', c.pseudo, 'avatar', c.avatar, 'at', f.created_at) order by f.created_at desc)
      from public.community_friendships f join public.community_profiles c on c.user_id = f.requester
      where f.addressee = v_me and f.status = 'pending'), '[]'::jsonb),
    'sent', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.user_id, 'pseudo', c.pseudo, 'avatar', c.avatar, 'at', f.created_at) order by f.created_at desc)
      from public.community_friendships f join public.community_profiles c on c.user_id = f.addressee
      where f.requester = v_me and f.status = 'pending'), '[]'::jsonb),
    'blocked', coalesce((
      select jsonb_agg(jsonb_build_object('id', b.blocked, 'pseudo', coalesce(c.pseudo, 'Membre'), 'avatar', coalesce(c.avatar, 'moon')))
      from public.community_blocks b left join public.community_profiles c on c.user_id = b.blocked
      where b.blocker = v_me), '[]'::jsonb),
    'encouragements', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'from', c.pseudo, 'avatar', c.avatar, 'kind', e.kind, 'at', e.created_at, 'unread', e.read_at is null)
        order by e.created_at desc)
      from (select * from public.community_encouragements
            where recipient = v_me and created_at > now() - interval '30 days'
            order by created_at desc limit 30) e
      join public.community_profiles c on c.user_id = e.sender
      where not public.community_blocked_between(v_me, e.sender)), '[]'::jsonb)
  );
end;
$$;
grant execute on function public.friends_overview() to authenticated;

-- ----- Encouragements (predefined only) ----------------------------------------------------------

create or replace function public.encouragement_text(p_kind text)
returns text language sql immutable as $$
  select case p_kind
    when 'wake' then 'On se réveille pour Tahajjud cette nuit ?'
    when 'ease' then 'Qu’Allah te facilite ta nuit.'
    when 'dua' then 'J’ai fait doua pour toi cette nuit.'
    when 'keep' then 'Barak Allahou fik, continue comme ça !'
    when 'mashallah' then 'Ma sha Allah, qu’Allah t’accorde la constance.'
  end;
$$;
grant execute on function public.encouragement_text(text) to anon, authenticated;

create or replace function public.send_encouragement(p_user uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare v_text text := public.encouragement_text(p_kind); v_pseudo text;
begin
  perform public.community_require_profile();
  if v_text is null then raise exception 'INVALID'; end if;
  if not public.community_are_friends(auth.uid(), p_user) or public.community_blocked_between(auth.uid(), p_user) then
    raise exception 'NOT_FRIENDS';
  end if;
  if exists (select 1 from public.community_encouragements
             where sender = auth.uid() and recipient = p_user and created_at > now() - interval '6 hours') then
    raise exception 'ALREADY_SENT';
  end if;
  if (select count(*) from public.community_encouragements where sender = auth.uid() and created_at > now() - interval '24 hours') >= 30 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.community_encouragements (sender, recipient, kind) values (auth.uid(), p_user, p_kind);
  select pseudo into v_pseudo from public.community_profiles where user_id = auth.uid();
  perform public.community_push(p_user, v_pseudo || ' vous encourage', v_text, '/tahajjud/friends');
end;
$$;
grant execute on function public.send_encouragement(uuid, text) to authenticated;

create or replace function public.mark_encouragements_read()
returns void language sql security definer set search_path = public as $$
  update public.community_encouragements set read_at = now() where recipient = auth.uid() and read_at is null;
$$;
grant execute on function public.mark_encouragements_read() to authenticated;

-- ----- Presence : also kept for friends; « La Oummah cette nuit » gains a friends count ----------

create or replace function public.declare_tahajjud(p_night text, p_status text, p_lat double precision, p_lng double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile public.community_profiles;
  v_zone_lat numeric;
  v_zone_lng numeric;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_profile from public.community_profiles where user_id = auth.uid();
  if v_profile.user_id is null then raise exception 'PROFILE_REQUIRED'; end if;
  if not v_profile.share_tahajjud and not v_profile.share_with_friends then return; end if;
  if p_status not in ('awake', 'prayed') then raise exception 'INVALID_STATUS'; end if;
  if p_night !~ '^\d{4}-\d{2}-\d{2}$' or abs(p_night::date - current_date) > 1 then raise exception 'INVALID_NIGHT'; end if;

  if v_profile.share_tahajjud and v_profile.share_zone and p_lat between -90 and 90 and p_lng between -180 and 180 then
    select z.zone_lat, z.zone_lng into v_zone_lat, v_zone_lng from public.tahajjud_zone(p_lat, p_lng) z;
  end if;

  insert into public.tahajjud_presence (user_id, night_key, status, zone_lat, zone_lng, updated_at)
  values (auth.uid(), p_night, p_status, v_zone_lat, v_zone_lng, now())
  on conflict (user_id, night_key) do update set
    status = case when public.tahajjud_presence.status = 'prayed' then 'prayed' else excluded.status end,
    zone_lat = coalesce(excluded.zone_lat, public.tahajjud_presence.zone_lat),
    zone_lng = coalesce(excluded.zone_lng, public.tahajjud_presence.zone_lng),
    updated_at = now();
end;
$$;

create or replace function public.tahajjud_live()
returns jsonb language sql stable security definer set search_path = public as $$
  with recent as (
    select p.* from public.tahajjud_presence p
    where p.updated_at > now() - interval '12 hours'
  ),
  shared as (
    select r.* from recent r join public.community_profiles c on c.user_id = r.user_id and c.share_tahajjud
  ),
  zones as (
    select zone_lat, zone_lng, count(*) as members
    from shared where zone_lat is not null
    group by zone_lat, zone_lng
    having count(*) >= 3
  ),
  friends as (
    select r.status from recent r
    join public.community_profiles c on c.user_id = r.user_id and c.share_with_friends
    where auth.uid() is not null and public.community_are_friends(auth.uid(), r.user_id)
  )
  select jsonb_build_object(
    'awake', (select count(*) from shared),
    'prayed', (select count(*) from shared where status = 'prayed'),
    'friends', (select count(*) from friends),
    'friendsPrayed', (select count(*) from friends where status = 'prayed'),
    'zones', coalesce((select jsonb_agg(jsonb_build_object('lat', zone_lat, 'lng', zone_lng, 'count', members)) from zones), '[]'::jsonb),
    'generatedAt', now()
  );
$$;
grant execute on function public.tahajjud_live() to anon, authenticated;

-- ----- Pseudo : unique et définitif, lié au compte ------------------------------------------------

-- Uniqueness ignores case and extra spaces (« Abd  Allah » = « abd allah »).
drop index if exists public.community_profiles_pseudo_idx;
create unique index community_profiles_pseudo_idx on public.community_profiles (lower(regexp_replace(trim(pseudo), '\s+', ' ', 'g')));

create or replace function public.community_profiles_lock_pseudo()
returns trigger language plpgsql as $$
begin
  if new.pseudo is distinct from old.pseudo and not public.is_oummah_admin() then raise exception 'PSEUDO_LOCKED'; end if;
  new.user_id := old.user_id;
  return new;
end;
$$;
drop trigger if exists community_profiles_lock_pseudo_trigger on public.community_profiles;
create trigger community_profiles_lock_pseudo_trigger before update on public.community_profiles
for each row execute function public.community_profiles_lock_pseudo();

-- A profile can't be deleted to free / change the pseudo (it goes away with the account).
drop policy if exists "Users manage their community profile" on public.community_profiles;
drop policy if exists "Users create their community profile" on public.community_profiles;
drop policy if exists "Users update their community profile" on public.community_profiles;
create policy "Users create their community profile" on public.community_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "Users update their community profile" on public.community_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke delete on public.community_profiles from authenticated;

notify pgrst, 'reload schema';
