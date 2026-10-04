-- OUMMAH — Qiyam al-Layl : binôme de réveil.
--
-- Un membre demande à des amis (ou à un de ses groupes) de le réveiller cette nuit. Le premier ami
-- debout touche « Réveiller » : le membre reçoit une notification (son OUMMAH) qui ouvre le mode
-- « Je suis debout ». Une demande par nuit ; uniquement entre amis, jamais si l'un a bloqué l'autre.

create table if not exists public.qiyam_wake_requests (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users (id) on delete cascade,
  night_key text not null check (night_key ~ '^\d{4}-\d{2}-\d{2}$'),
  wake_at timestamptz,
  created_at timestamptz not null default now(),
  woken_by uuid references auth.users (id) on delete set null,
  woken_at timestamptz,
  unique (requester, night_key)
);

create table if not exists public.qiyam_wake_targets (
  request_id uuid not null references public.qiyam_wake_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (request_id, user_id)
);
create index if not exists qiyam_wake_targets_user_idx on public.qiyam_wake_targets (user_id);

alter table public.qiyam_wake_requests enable row level security;
alter table public.qiyam_wake_targets enable row level security;
revoke all on public.qiyam_wake_requests, public.qiyam_wake_targets from anon, authenticated;

-- Ask friends (p_users) and/or the members of one of my groups (p_group) to wake me tonight.
create or replace function public.wake_request_create(p_night text, p_users uuid[], p_group uuid default null, p_wake_at timestamptz default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_targets uuid[]; v_me text;
begin
  perform public.community_require_profile();
  if p_night !~ '^\d{4}-\d{2}-\d{2}$' or abs(p_night::date - current_date) > 1 then raise exception 'INVALID'; end if;
  if p_group is not null and not public.group_is_member(p_group) then raise exception 'NOT_MEMBER'; end if;

  select array_agg(distinct candidate) into v_targets
  from (
    select unnest(coalesce(p_users, '{}')) as candidate
    union
    select m.user_id from public.community_group_members m where p_group is not null and m.group_id = p_group
  ) c
  where candidate <> auth.uid()
    and public.community_are_friends(auth.uid(), candidate)
    and not public.community_blocked_between(auth.uid(), candidate);
  if v_targets is null then raise exception 'NO_TARGET'; end if;

  insert into public.qiyam_wake_requests (requester, night_key, wake_at)
  values (auth.uid(), p_night, p_wake_at)
  on conflict (requester, night_key) do update set wake_at = excluded.wake_at, woken_by = null, woken_at = null, created_at = now()
  returning id into v_id;
  delete from public.qiyam_wake_targets where request_id = v_id;
  insert into public.qiyam_wake_targets (request_id, user_id) select v_id, unnest(v_targets);

  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.community_push(t, '🌙 ' || v_me || ' compte sur vous cette nuit', 'Si vous vous levez pour prier, touchez « Réveiller » dans Qiyam al-Layl.', '/tahajjud')
  from unnest(v_targets) t;
  return array_length(v_targets, 1);
end;
$$;
grant execute on function public.wake_request_create(text, uuid[], uuid, timestamptz) to authenticated;

create or replace function public.wake_request_cancel(p_night text)
returns void language sql security definer set search_path = public as $$
  delete from public.qiyam_wake_requests where requester = auth.uid() and night_key = p_night;
$$;
grant execute on function public.wake_request_cancel(text) to authenticated;

-- My request for a night: how many friends, and who woke me.
create or replace function public.wake_request_mine(p_night text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', r.id,
    'targets', (select count(*) from public.qiyam_wake_targets t where t.request_id = r.id),
    'wakeAt', r.wake_at,
    'wokenBy', c.pseudo,
    'wokenAt', r.woken_at)
  from public.qiyam_wake_requests r
  left join public.community_profiles c on c.user_id = r.woken_by
  where r.requester = auth.uid() and r.night_key = p_night;
$$;
grant execute on function public.wake_request_mine(text) to authenticated;

-- People who count on me tonight (requests of the last 16 hours).
create or replace function public.wake_requests_for_me()
returns table (id uuid, pseudo text, avatar text, wake_at timestamptz, woken boolean, woken_by_me boolean)
language sql stable security definer set search_path = public as $$
  select r.id, c.pseudo, c.avatar, r.wake_at, r.woken_at is not null, r.woken_by = auth.uid()
  from public.qiyam_wake_targets t
  join public.qiyam_wake_requests r on r.id = t.request_id
  join public.community_profiles c on c.user_id = r.requester
  where t.user_id = auth.uid()
    and r.created_at > now() - interval '16 hours'
    and not public.community_blocked_between(auth.uid(), r.requester)
  order by r.woken_at is not null, coalesce(r.wake_at, r.created_at);
$$;
grant execute on function public.wake_requests_for_me() to authenticated;

-- « Réveiller » : one notification to the requester (messages channel, OUMMAH sound).
create or replace function public.wake_send(p_request uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_request public.qiyam_wake_requests; v_me text;
begin
  perform public.community_require_profile();
  select * into v_request from public.qiyam_wake_requests where id = p_request;
  if v_request.id is null or not exists (
    select 1 from public.qiyam_wake_targets where request_id = p_request and user_id = auth.uid()
  ) then raise exception 'NOT_FOUND'; end if;
  if public.community_blocked_between(auth.uid(), v_request.requester) then raise exception 'NOT_FOUND'; end if;
  if v_request.woken_at is not null then
    return (select pseudo from public.community_profiles where user_id = v_request.woken_by);
  end if;
  update public.qiyam_wake_requests set woken_by = auth.uid(), woken_at = now() where id = p_request;
  select pseudo into v_me from public.community_profiles where user_id = auth.uid();
  perform public.community_push_message(array[v_request.requester],
    '☀️ ' || v_me || ' est debout et vous réveille',
    'C’est l’heure de la prière de la nuit. Qu’Allah vous facilite.',
    '/tahajjud/awake');
  return null;
end;
$$;
grant execute on function public.wake_send(uuid) to authenticated;

notify pgrst, 'reload schema';
