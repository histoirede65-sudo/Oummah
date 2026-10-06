-- OUMMAH — profil communautaire automatique et messages « OUMMAH » dans la messagerie.
--
-- Règles :
--  * Chaque compte a son profil dès sa création : plus d'inscription ni de choix de nom.
--    Le nom vient de l'adresse e-mail (le premier mot, ex. « jean.dupont@… » → « Jean »).
--  * Deux noms identiques : un chiffre est ajouté automatiquement (« Jean 2 », « Jean 3 »…).
--  * Le nom peut être changé une fois tous les 7 jours.
--  * L'équipe envoie des messages signés « OUMMAH » (à tous ou à un membre), lus dans la messagerie.

-- ----- Nom unique et automatique -----------------------------------------------------------------

alter table public.community_profiles drop constraint if exists community_profiles_pseudo_check;
alter table public.community_profiles add constraint community_profiles_pseudo_check
  check (length(trim(pseudo)) between 2 and 24 and pseudo ~ '^[[:alnum:] _.''’-]+$');
alter table public.community_profiles add column if not exists pseudo_changed_at timestamptz;

-- First word of the e-mail, letters only, capitalised. « Membre » when nothing usable.
create or replace function public.community_name_from_email(p_email text)
returns text language sql immutable as $$
  select coalesce(
    nullif(initcap(left(substring(split_part(coalesce(p_email, ''), '@', 1) from '[[:alpha:]]{2,}'), 18)), ''),
    'Membre');
$$;

-- The name itself if free, otherwise the same name followed by the first free number.
create or replace function public.community_unique_pseudo(p_base text, p_user uuid default null)
returns text language plpgsql stable security definer set search_path = public as $$
declare v_base text := left(trim(regexp_replace(p_base, '\s+', ' ', 'g')), 20); v_candidate text := v_base; v_n integer := 1;
begin
  while exists (select 1 from public.community_profiles where lower(trim(pseudo)) = lower(v_candidate) and user_id is distinct from p_user) loop
    v_n := v_n + 1;
    v_candidate := v_base || ' ' || v_n;
  end loop;
  return v_candidate;
end;
$$;
revoke execute on function public.community_unique_pseudo(text, uuid) from public, anon, authenticated;

create or replace function public.community_create_profile_for(p_user uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.community_profiles where user_id = p_user) then return; end if;
  -- Two sign-ups with the same name at the same instant: retry with the next number.
  for i in 1 .. 5 loop
    begin
      insert into public.community_profiles (user_id, pseudo)
      values (p_user, public.community_unique_pseudo(public.community_name_from_email(p_email)));
      return;
    exception when unique_violation then
      if exists (select 1 from public.community_profiles where user_id = p_user) then return; end if;
    end;
  end loop;
end;
$$;
revoke execute on function public.community_create_profile_for(uuid, text) from public, anon, authenticated;

-- Every new account gets its profile at once.
create or replace function public.community_profile_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.community_create_profile_for(new.id, new.email);
  return new;
exception when others then
  return new; -- never block a sign-up
end;
$$;
drop trigger if exists community_profile_on_signup on auth.users;
create trigger community_profile_on_signup after insert on auth.users
  for each row execute function public.community_profile_on_signup();

-- Existing accounts.
do $$
declare r record;
begin
  for r in select id, email from auth.users order by created_at loop
    perform public.community_create_profile_for(r.id, r.email);
  end loop;
end;
$$;

-- Safety net called by the app: creates the profile if it is still missing.
create or replace function public.ensure_community_profile()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  perform public.community_create_profile_for(auth.uid(), (select email from auth.users where id = auth.uid()));
end;
$$;
grant execute on function public.ensure_community_profile() to authenticated;

-- The old « profile required » check now creates the profile instead of refusing.
create or replace function public.community_require_profile()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.community_profiles where user_id = auth.uid()) then
    perform public.community_create_profile_for(auth.uid(), (select email from auth.users where id = auth.uid()));
  end if;
end;
$$;

-- Change one's name: once every 7 days, same filter as the Dua wall, number added if taken.
create or replace function public.community_rename(p_pseudo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_clean text := trim(regexp_replace(coalesce(p_pseudo, ''), '\s+', ' ', 'g')); v_last timestamptz; v_current text; v_final text;
begin
  perform public.community_require_profile();
  select pseudo, pseudo_changed_at into v_current, v_last from public.community_profiles where user_id = auth.uid();
  if length(v_clean) < 2 or length(v_clean) > 20 or v_clean !~ '^[[:alnum:] _.''’-]+$' then raise exception 'PSEUDO_INVALID'; end if;
  if not public.dua_wall_text_allowed(v_clean) then raise exception 'PSEUDO_REFUSED'; end if;
  if lower(v_clean) = lower(regexp_replace(v_current, ' \d+$', '')) then
    return jsonb_build_object('pseudo', v_current, 'changedAt', v_last);
  end if;
  if v_last is not null and v_last > now() - interval '7 days' then
    raise exception 'PSEUDO_WAIT:%', to_char(v_last + interval '7 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;
  v_final := public.community_unique_pseudo(v_clean, auth.uid());
  update public.community_profiles set pseudo = v_final, pseudo_changed_at = now(), updated_at = now() where user_id = auth.uid();
  return jsonb_build_object('pseudo', v_final, 'changedAt', now());
end;
$$;
grant execute on function public.community_rename(text) to authenticated;

-- The name only changes through community_rename (weekly limit enforced there).
revoke update (pseudo, pseudo_changed_at) on public.community_profiles from authenticated;
revoke update on public.community_profiles from authenticated;
grant update (avatar, share_tahajjud, share_zone, share_with_friends, accept_friend_requests, accept_messages, updated_at)
  on public.community_profiles to authenticated;

-- ----- Messages « OUMMAH » ------------------------------------------------------------------------

create table if not exists public.oummah_messages (
  id uuid primary key default gen_random_uuid(),
  /** null = every member. */
  recipient uuid references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists oummah_messages_recipient_idx on public.oummah_messages (recipient, created_at desc);

create table if not exists public.oummah_message_reads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  read_at timestamptz not null default now()
);

alter table public.oummah_messages enable row level security;
alter table public.oummah_message_reads enable row level security;
revoke all on public.oummah_messages, public.oummah_message_reads from anon, authenticated;

-- Messages a member sees: those addressed to them, and the messages to everyone sent since their account exists.
create or replace function public.oummah_visible(p_user uuid)
returns setof public.oummah_messages language sql stable security definer set search_path = public, auth as $$
  select m.* from public.oummah_messages m
  where m.recipient = p_user
     or (m.recipient is null and m.created_at >= (select created_at from auth.users where id = p_user) - interval '1 day');
$$;
revoke execute on function public.oummah_visible(uuid) from public, anon, authenticated;

create or replace function public.oummah_thread(p_before timestamptz default null, p_limit integer default 40)
returns table (id uuid, body text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.oummah_message_reads (user_id, read_at) values (auth.uid(), now())
    on conflict (user_id) do update set read_at = now();
  return query
    select m.id, m.body, m.created_at from public.oummah_visible(auth.uid()) m
    where p_before is null or m.created_at < p_before
    order by m.created_at desc
    limit least(greatest(coalesce(p_limit, 40), 1), 100);
end;
$$;
grant execute on function public.oummah_thread(timestamptz, integer) to authenticated;

-- Last message and unread count, for the pinned « OUMMAH » row.
create or replace function public.oummah_summary()
returns jsonb language sql stable security definer set search_path = public as $$
  with visible as (select * from public.oummah_visible(auth.uid())),
  last_read as (select read_at from public.oummah_message_reads where user_id = auth.uid())
  select case when auth.uid() is null or not exists (select 1 from visible) then null else jsonb_build_object(
    'lastBody', (select body from visible order by created_at desc limit 1),
    'lastAt', (select max(created_at) from visible),
    'unread', (select count(*) from visible where created_at > coalesce((select read_at from last_read), '-infinity'::timestamptz))
  ) end;
$$;
grant execute on function public.oummah_summary() to authenticated;

-- The header badge counts OUMMAH messages too.
create or replace function public.chat_unread_count()
returns integer language sql stable security definer set search_path = public as $$
  select (
    select count(*)::int from public.community_messages m
    where m.recipient = auth.uid() and m.read_at is null and not public.community_blocked_between(auth.uid(), m.sender)
  ) + (
    select count(*)::int from public.oummah_visible(auth.uid()) o
    where o.created_at > coalesce((select read_at from public.oummah_message_reads where user_id = auth.uid()), '-infinity'::timestamptz)
  );
$$;

-- ----- Admin ----------------------------------------------------------------------------------------

-- Send a message signed « OUMMAH », to one member (p_user) or to everyone (null), with a notification.
create or replace function public.admin_send_oummah_message(p_body text, p_user uuid default null, p_push boolean default true)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_body text := trim(coalesce(p_body, '')); v_id uuid; v_users uuid[];
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  if length(v_body) = 0 or length(v_body) > 2000 then raise exception 'INVALID'; end if;
  if p_user is not null and not exists (select 1 from auth.users where id = p_user) then raise exception 'NOT_FOUND'; end if;

  insert into public.oummah_messages (recipient, body, created_by) values (p_user, v_body, auth.uid()) returning id into v_id;

  if p_push then
    if p_user is null then
      select array_agg(distinct user_id) into v_users from public.user_push_tokens where enabled and user_id is not null;
    else
      v_users := array[p_user];
    end if;
    if v_users is not null then
      perform public.community_push_message(v_users, 'OUMMAH', left(v_body, 160), '/tahajjud/oummah');
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'devices',
    (select count(distinct expo_push_token) from public.user_push_tokens where enabled and p_push and (p_user is null or user_id = p_user)));
end;
$$;
grant execute on function public.admin_send_oummah_message(text, uuid, boolean) to authenticated;

create or replace function public.admin_list_oummah_messages()
returns table (id uuid, body text, created_at timestamptz, recipient uuid, recipient_name text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query
    select m.id, m.body, m.created_at, m.recipient,
      coalesce((select c.pseudo from public.community_profiles c where c.user_id = m.recipient), (select u.email::text from auth.users u where u.id = m.recipient))
    from public.oummah_messages m order by m.created_at desc limit 50;
end;
$$;
grant execute on function public.admin_list_oummah_messages() to authenticated;

create or replace function public.admin_delete_oummah_message(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  delete from public.oummah_messages where id = p_id;
end;
$$;
grant execute on function public.admin_delete_oummah_message(uuid) to authenticated;

notify pgrst, 'reload schema';
