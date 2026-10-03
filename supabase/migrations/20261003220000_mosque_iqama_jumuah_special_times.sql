-- OUMMAH — horaires des mosquées, phase 2 : iqama, plusieurs Joumou'a, Ramadan et Aïd.
--
-- Toujours des propositions de la communauté, validées par un administrateur.
--   kind = 'regular'  : adhan des 5 prières (écart au calcul, voir 20261003210000), iqama, Joumou'a.
--   kind = 'ramadan'  : heure des tarawih, du premier au dernier jour du Ramadan.
--   kind = 'eid_fitr' / 'eid_adha' : date et heure(s) de la prière de l'Aïd.
-- iqama        : {"fajr": {"after": 20}, "dhuhr": {"at": "13:45"}, …}  (minutes après l'adhan, ou heure fixe)
-- jumuah_times : [{"time": "12:45", "language": "Français"}, {"time": "13:45"}]
-- eid_times    : ["07:45", "09:00"]

alter table public.mosque_prayer_time_updates
  add column if not exists kind text not null default 'regular',
  add column if not exists iqama jsonb,
  add column if not exists jumuah_times jsonb,
  add column if not exists tarawih text,
  add column if not exists eid_times jsonb,
  add column if not exists valid_from date,
  add column if not exists valid_to date;

alter table public.mosque_prayer_time_updates drop constraint if exists mosque_prayer_time_updates_kind_check;
alter table public.mosque_prayer_time_updates add constraint mosque_prayer_time_updates_kind_check
  check (kind in ('regular', 'ramadan', 'eid_fitr', 'eid_adha'));

alter table public.mosque_prayer_time_updates drop constraint if exists mosque_prayer_time_updates_shape_check;
alter table public.mosque_prayer_time_updates add constraint mosque_prayer_time_updates_shape_check check (
  (iqama is null or jsonb_typeof(iqama) = 'object')
  and (jumuah_times is null or (jsonb_typeof(jumuah_times) = 'array' and jsonb_array_length(jumuah_times) <= 4))
  and (eid_times is null or (jsonb_typeof(eid_times) = 'array' and jsonb_array_length(eid_times) <= 4))
  and (tarawih is null or tarawih ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
  and (kind <> 'ramadan' or (valid_from is not null and valid_to is not null and valid_to >= valid_from and valid_to - valid_from <= 31))
  and (kind not in ('eid_fitr', 'eid_adha') or valid_from is not null)
);

alter table public.mosque_prayer_time_updates drop constraint if exists mosque_prayer_time_at_least_one;
alter table public.mosque_prayer_time_updates add constraint mosque_prayer_time_at_least_one check (
  nullif(trim(coalesce(fajr, '')), '') is not null or
  nullif(trim(coalesce(dhuhr, '')), '') is not null or
  nullif(trim(coalesce(asr, '')), '') is not null or
  nullif(trim(coalesce(maghrib, '')), '') is not null or
  nullif(trim(coalesce(isha, '')), '') is not null or
  nullif(trim(coalesce(jumuah, '')), '') is not null or
  nullif(trim(coalesce(tarawih, '')), '') is not null or
  coalesce(iqama, '{}'::jsonb) <> '{}'::jsonb or
  coalesce(jsonb_array_length(jumuah_times), 0) > 0 or
  coalesce(jsonb_array_length(eid_times), 0) > 0
);

-- Horaires habituels validés (le plus récent).
drop function if exists public.get_approved_mosque_prayer_times(text);
create function public.get_approved_mosque_prayer_times(p_mosque_id text)
returns table (
  mosque_id text, fajr text, dhuhr text, asr text, maghrib text, isha text,
  jumuah text, updated_at timestamptz, reference_at timestamptz,
  latitude double precision, longitude double precision,
  iqama jsonb, jumuah_times jsonb
)
language sql stable security definer set search_path = public
as $$
  select u.mosque_id, u.fajr, u.dhuhr, u.asr, u.maghrib, u.isha, u.jumuah,
         coalesce(u.reviewed_at, u.updated_at),
         u.created_at,
         m.latitude, m.longitude,
         u.iqama, u.jumuah_times
  from public.mosque_prayer_time_updates u
  left join public.mosque_external_ids e on e.external_id = u.mosque_id
  left join public.mosques m on m.id = coalesce(e.mosque_id, (select x.id from public.mosques x where x.id::text = u.mosque_id))
  where u.mosque_id = any(public.mosque_related_ids(p_mosque_id))
    and u.status = 'approved' and u.kind = 'regular'
  order by coalesce(u.reviewed_at, u.updated_at) desc
  limit 1;
$$;
grant execute on function public.get_approved_mosque_prayer_times(text) to anon, authenticated;

-- Ramadan et Aïd validés, en cours ou à venir (le plus récent de chaque type).
create or replace function public.get_mosque_special_times(p_mosque_id text)
returns table (
  kind text, tarawih text, eid_times jsonb, valid_from date, valid_to date, note text, updated_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select distinct on (u.kind) u.kind, u.tarawih, u.eid_times, u.valid_from, u.valid_to, u.note,
         coalesce(u.reviewed_at, u.updated_at)
  from public.mosque_prayer_time_updates u
  where u.mosque_id = any(public.mosque_related_ids(p_mosque_id))
    and u.status = 'approved' and u.kind <> 'regular'
    and coalesce(u.valid_to, u.valid_from) >= current_date - 1
  order by u.kind, coalesce(u.reviewed_at, u.updated_at) desc;
$$;
grant execute on function public.get_mosque_special_times(text) to anon, authenticated;

-- Validation : la nouvelle proposition remplace l'ancienne du même type, pour la mosquée entière.
create or replace function public.admin_review_mosque_prayer_time_update(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_mosque_id text;
  v_kind text;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  select mosque_id, kind into v_mosque_id, v_kind from public.mosque_prayer_time_updates where id = p_id;
  if p_approve then
    update public.mosque_prayer_time_updates
      set status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
      where mosque_id = any(public.mosque_related_ids(v_mosque_id))
        and kind = v_kind and status='approved' and id <> p_id;
  end if;
  update public.mosque_prayer_time_updates
    set status=case when p_approve then 'approved' else 'rejected' end,
        reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
    where id=p_id;
end;
$$;
