-- OUMMAH — communauté Tahajjud : profil public minimal, « La Oummah cette nuit ».
--
-- Règles :
--  * Participation volontaire, profil OUMMAH requis (compte connecté + pseudo).
--  * Uniquement de vraies déclarations (« je suis réveillé ») et validations (« j'ai prié ») : aucun
--    faux compteur.
--  * Position : jamais la position précise. Le serveur ne reçoit qu'une zone arrondie (~28 km) et
--    n'affiche une zone que si au moins 3 personnes s'y trouvent.

create table if not exists public.community_profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pseudo text not null check (length(trim(pseudo)) between 3 and 24 and pseudo ~ '^[[:alnum:] _.''’-]+$'),
  avatar text not null default 'moon' check (length(avatar) <= 32),
  /** Appears in the counter and on the map. */
  share_tahajjud boolean not null default true,
  /** Gives an approximate zone (otherwise counted without zone). */
  share_zone boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists community_profiles_pseudo_idx on public.community_profiles (lower(trim(pseudo)));

alter table public.community_profiles enable row level security;
drop policy if exists "Members read community profiles" on public.community_profiles;
create policy "Members read community profiles" on public.community_profiles for select to authenticated using (true);
drop policy if exists "Users manage their community profile" on public.community_profiles;
create policy "Users manage their community profile" on public.community_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.community_profiles to authenticated;

create table if not exists public.tahajjud_presence (
  user_id uuid not null references auth.users (id) on delete cascade,
  night_key text not null check (night_key ~ '^\d{4}-\d{2}-\d{2}$'),
  status text not null check (status in ('awake', 'prayed')),
  zone_lat numeric(6,2),
  zone_lng numeric(6,2),
  updated_at timestamptz not null default now(),
  primary key (user_id, night_key)
);
create index if not exists tahajjud_presence_recent_idx on public.tahajjud_presence (updated_at desc);

-- No direct access: only the functions below (aggregates only).
alter table public.tahajjud_presence enable row level security;
revoke all on public.tahajjud_presence from anon, authenticated;

-- Zone of ~28 km: 0.25° in latitude, longitude step widened with latitude.
create or replace function public.tahajjud_zone(p_lat double precision, p_lng double precision)
returns table (zone_lat numeric, zone_lng numeric) language sql immutable as $$
  select round((floor(p_lat / 0.25) * 0.25 + 0.125)::numeric, 2),
         round((floor(p_lng / (0.25 / greatest(cos(radians(p_lat)), 0.2))) * (0.25 / greatest(cos(radians(p_lat)), 0.2))
               + (0.125 / greatest(cos(radians(p_lat)), 0.2)))::numeric, 2);
$$;

-- « Je suis réveillé » / « J'ai prié » : one row per night, « prayed » never goes back to « awake ».
create or replace function public.declare_tahajjud(p_night text, p_status text, p_lat double precision, p_lng double precision)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile public.community_profiles;
  v_zone record;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_profile from public.community_profiles where user_id = auth.uid();
  if v_profile.user_id is null then raise exception 'PROFILE_REQUIRED'; end if;
  if not v_profile.share_tahajjud then return; end if;
  if p_status not in ('awake', 'prayed') then raise exception 'INVALID_STATUS'; end if;
  if p_night !~ '^\d{4}-\d{2}-\d{2}$' or abs(p_night::date - current_date) > 1 then raise exception 'INVALID_NIGHT'; end if;

  if v_profile.share_zone and p_lat between -90 and 90 and p_lng between -180 and 180 then
    select * into v_zone from public.tahajjud_zone(p_lat, p_lng);
  end if;

  insert into public.tahajjud_presence (user_id, night_key, status, zone_lat, zone_lng, updated_at)
  values (auth.uid(), p_night, p_status, v_zone.zone_lat, v_zone.zone_lng, now())
  on conflict (user_id, night_key) do update set
    status = case when public.tahajjud_presence.status = 'prayed' then 'prayed' else excluded.status end,
    zone_lat = coalesce(excluded.zone_lat, public.tahajjud_presence.zone_lat),
    zone_lng = coalesce(excluded.zone_lng, public.tahajjud_presence.zone_lng),
    updated_at = now();
end;
$$;
grant execute on function public.declare_tahajjud(text, text, double precision, double precision) to authenticated;

create or replace function public.withdraw_tahajjud(p_night text)
returns void language sql security definer set search_path = public as $$
  delete from public.tahajjud_presence where user_id = auth.uid() and night_key = p_night;
$$;
grant execute on function public.withdraw_tahajjud(text) to authenticated;

-- « La Oummah cette nuit » : the last 12 hours (the night moves around the globe), aggregates only.
create or replace function public.tahajjud_live()
returns jsonb language sql stable security definer set search_path = public as $$
  with recent as (
    select p.* from public.tahajjud_presence p
    join public.community_profiles c on c.user_id = p.user_id and c.share_tahajjud
    where p.updated_at > now() - interval '12 hours'
  ),
  zones as (
    select zone_lat, zone_lng, count(*) as members
    from recent where zone_lat is not null
    group by zone_lat, zone_lng
    having count(*) >= 3
  )
  select jsonb_build_object(
    'awake', (select count(*) from recent),
    'prayed', (select count(*) from recent where status = 'prayed'),
    'zones', coalesce((select jsonb_agg(jsonb_build_object('lat', zone_lat, 'lng', zone_lng, 'count', members)) from zones), '[]'::jsonb),
    'generatedAt', now()
  );
$$;
grant execute on function public.tahajjud_live() to anon, authenticated;

-- My own declaration for a night (to show « Je suis réveillé ✓ »).
create or replace function public.my_tahajjud_presence(p_night text)
returns text language sql stable security definer set search_path = public as $$
  select status from public.tahajjud_presence where user_id = auth.uid() and night_key = p_night;
$$;
grant execute on function public.my_tahajjud_presence(text) to authenticated;

notify pgrst, 'reload schema';
