-- OUMMAH — horaires validés : date de référence et position de la mosquée.
--
-- Un horaire proposé (« Maghrib 20:02 ») n'est vrai que le jour où il a été relevé : le soleil se couche
-- chaque jour à une heure différente. L'application garde donc l'écart de la mosquée par rapport au
-- calcul de ce jour-là (+20 min) et l'applique au calcul du jour. Pour cela elle a besoin de la date du
-- relevé et de la position de la mosquée.

drop function if exists public.get_approved_mosque_prayer_times(text);

create function public.get_approved_mosque_prayer_times(p_mosque_id text)
returns table (
  mosque_id text, fajr text, dhuhr text, asr text, maghrib text, isha text,
  jumuah text, updated_at timestamptz, reference_at timestamptz,
  latitude double precision, longitude double precision
)
language sql stable security definer set search_path = public
as $$
  select u.mosque_id, u.fajr, u.dhuhr, u.asr, u.maghrib, u.isha, u.jumuah,
         coalesce(u.reviewed_at, u.updated_at),
         u.created_at,
         m.latitude, m.longitude
  from public.mosque_prayer_time_updates u
  left join public.mosque_external_ids e on e.external_id = u.mosque_id
  left join public.mosques m on m.id = coalesce(e.mosque_id, (select x.id from public.mosques x where x.id::text = u.mosque_id))
  where u.mosque_id = any(public.mosque_related_ids(p_mosque_id)) and u.status = 'approved'
  order by coalesce(u.reviewed_at, u.updated_at) desc
  limit 1;
$$;
grant execute on function public.get_approved_mosque_prayer_times(text) to anon, authenticated;
