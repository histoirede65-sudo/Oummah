-- OUMMAH — identité unique des mosquées et favoris liés au compte.
--
-- Une même mosquée peut venir de plusieurs sources (OpenStreetMap « node-123 », Google « google-… »,
-- islamic.app « islamic-app-… », ajout d'un utilisateur = uuid de mosque_submissions). Chaque identifiant
-- de source est rattaché à une seule ligne de public.mosques, pour que favoris, horaires et signalements
-- portent sur la mosquée et non sur la source.

create table if not exists public.mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mosques_position_idx on public.mosques (latitude, longitude);

create table if not exists public.mosque_external_ids (
  external_id text primary key check (length(external_id) between 1 and 200),
  mosque_id uuid not null references public.mosques (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists mosque_external_ids_mosque_idx on public.mosque_external_ids (mosque_id);

alter table public.mosques enable row level security;
alter table public.mosque_external_ids enable row level security;
drop policy if exists "Public reads mosques" on public.mosques;
create policy "Public reads mosques" on public.mosques for select to anon, authenticated using (true);
drop policy if exists "Public reads mosque external ids" on public.mosque_external_ids;
create policy "Public reads mosque external ids" on public.mosque_external_ids for select to anon, authenticated using (true);
grant select on public.mosques, public.mosque_external_ids to anon, authenticated;

-- Nom comparable : minuscules, sans accents ni ponctuation, sans les mots génériques.
create or replace function public.mosque_comparable_name(p_name text)
returns text language sql immutable set search_path = public as $$
  select trim(regexp_replace(regexp_replace(
    regexp_replace(
      lower(translate(coalesce(p_name, ''), 'àâäáãéèêëíîïóôöõúùûüçñÀÂÄÁÃÉÈÊËÍÎÏÓÔÖÕÚÙÛÜÇÑ''’', 'aaaaaeeeeiiiioooouuuucnaaaaaeeeeiiiioooouuuucn  ')),
      '[^a-z0-9]+', ' ', 'g'),
    '\m(mosquee|mosque|masjid|masdjid|jamaa|djamaa|centre|center|culturel|cultural|islamique|islamic|association|des|du|de|la|le|les|l|d|et)\M', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;

create or replace function public.mosque_distance_meters(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)));
$$;

-- Identifiant de source → mosquée unique. Rattache à une mosquée existante si le même bâtiment est
-- déjà connu (≤ 25 m, ou ≤ 80 m avec un nom proche), sinon la crée.
create or replace function public.resolve_mosque(
  p_external_id text, p_name text, p_address text, p_latitude double precision, p_longitude double precision
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_name text := left(coalesce(nullif(trim(p_name), ''), 'Mosquée'), 200);
  v_comparable text := public.mosque_comparable_name(p_name);
begin
  if p_external_id is null or length(p_external_id) not between 1 and 200 then raise exception 'INVALID_EXTERNAL_ID'; end if;
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'INVALID_POSITION';
  end if;

  -- Déjà rattaché (identifiant de source, ou identifiant OUMMAH lui-même).
  select mosque_id into v_id from public.mosque_external_ids where external_id = p_external_id;
  if v_id is not null then return v_id; end if;
  select id into v_id from public.mosques where id::text = p_external_id;
  if v_id is not null then return v_id; end if;

  -- Même bâtiment déjà connu via une autre source.
  select m.id into v_id
  from public.mosques m
  where m.latitude between p_latitude - 0.001 and p_latitude + 0.001
    and m.longitude between p_longitude - 0.0015 and p_longitude + 0.0015
    and (
      public.mosque_distance_meters(m.latitude, m.longitude, p_latitude, p_longitude) <= 25
      or (
        public.mosque_distance_meters(m.latitude, m.longitude, p_latitude, p_longitude) <= 80
        and v_comparable <> '' and public.mosque_comparable_name(m.name) <> ''
        and (public.mosque_comparable_name(m.name) like '%' || v_comparable || '%'
             or v_comparable like '%' || public.mosque_comparable_name(m.name) || '%')
      )
    )
  order by public.mosque_distance_meters(m.latitude, m.longitude, p_latitude, p_longitude)
  limit 1;

  if v_id is null then
    insert into public.mosques (name, address, latitude, longitude)
    values (v_name, left(nullif(trim(p_address), ''), 300), p_latitude, p_longitude)
    returning id into v_id;
  end if;

  insert into public.mosque_external_ids (external_id, mosque_id) values (p_external_id, v_id)
  on conflict (external_id) do nothing;
  select mosque_id into v_id from public.mosque_external_ids where external_id = p_external_id;
  return v_id;
end;
$$;
grant execute on function public.resolve_mosque(text, text, text, double precision, double precision) to anon, authenticated;

-- Tous les identifiants connus d'une même mosquée (identifiant OUMMAH + identifiants de source).
create or replace function public.mosque_related_ids(p_id text)
returns text[] language sql stable security definer set search_path = public as $$
  with target as (
    select coalesce(
      (select mosque_id from public.mosque_external_ids where external_id = p_id),
      (select id from public.mosques where id::text = p_id)
    ) as mosque_id
  )
  select coalesce(
    (select array_agg(distinct x) from (
       select t.mosque_id::text as x from target t where t.mosque_id is not null
       union select e.external_id from public.mosque_external_ids e join target t on e.mosque_id = t.mosque_id
     ) ids),
    array[p_id]
  ) || array[p_id];
$$;
grant execute on function public.mosque_related_ids(text) to anon, authenticated;

-- Horaires validés : communs à tous les identifiants de la mosquée.
create or replace function public.get_approved_mosque_prayer_times(p_mosque_id text)
returns table (
  mosque_id text, fajr text, dhuhr text, asr text, maghrib text, isha text,
  jumuah text, updated_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select u.mosque_id, u.fajr, u.dhuhr, u.asr, u.maghrib, u.isha, u.jumuah,
         coalesce(u.reviewed_at, u.updated_at)
  from public.mosque_prayer_time_updates u
  where u.mosque_id = any(public.mosque_related_ids(p_mosque_id)) and u.status = 'approved'
  order by coalesce(u.reviewed_at, u.updated_at) desc
  limit 1;
$$;

-- Validation : la nouvelle proposition remplace l'ancienne pour la mosquée entière, toutes sources confondues.
create or replace function public.admin_review_mosque_prayer_time_update(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_mosque_id text;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  select mosque_id into v_mosque_id from public.mosque_prayer_time_updates where id = p_id;
  if p_approve then
    update public.mosque_prayer_time_updates
      set status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
      where mosque_id = any(public.mosque_related_ids(v_mosque_id))
        and status='approved' and id <> p_id;
  end if;
  update public.mosque_prayer_time_updates
    set status=case when p_approve then 'approved' else 'rejected' end,
        reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
    where id=p_id;
end;
$$;

-- Favoris et mosquée principale liés au compte. snapshot = fiche affichable hors connexion.
create table if not exists public.user_mosque_favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mosque_id uuid not null references public.mosques (id) on delete cascade,
  is_main boolean not null default false,
  is_favorite boolean not null default false,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, mosque_id)
);
alter table public.user_mosque_favorites add column if not exists is_favorite boolean not null default false;
create unique index if not exists user_mosque_favorites_one_main_idx on public.user_mosque_favorites (user_id) where is_main;

alter table public.user_mosque_favorites enable row level security;
drop policy if exists "Users manage their mosque favorites" on public.user_mosque_favorites;
create policy "Users manage their mosque favorites" on public.user_mosque_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_mosque_favorites to authenticated;

-- Reprise de l'existant : les mosquées ajoutées par les utilisateurs et validées.
do $$
declare r record;
begin
  for r in select id, name, address, latitude, longitude from public.mosque_submissions
           where validation_status = 'approved' and latitude is not null and longitude is not null loop
    perform public.resolve_mosque(r.id::text, r.name, r.address, r.latitude, r.longitude);
  end loop;
end $$;
