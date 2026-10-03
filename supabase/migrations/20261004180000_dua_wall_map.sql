-- OUMMAH — Mur des duas sur la carte « La Oummah cette nuit ».
--
-- * Une doua garde une zone approximative (~28 km, même grille que les halos), jamais une position
--   précise, et seulement si son auteur a activé « Ma zone sur la carte ».
-- * La carte reçoit des zones (centre de la grille) avec les dernières duas : pas d'auteur si anonyme.

alter table public.dua_wall_posts
  add column if not exists zone_lat numeric(6,2),
  add column if not exists zone_lng numeric(6,2);
create index if not exists dua_wall_posts_zone_idx on public.dua_wall_posts (created_at desc) where zone_lat is not null;

create or replace function public.dua_wall_publish(p_body text, p_anonymous boolean, p_lat double precision, p_lng double precision)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_zone_lat numeric; v_zone_lng numeric;
begin
  perform public.dua_wall_require_profile();
  if not public.dua_wall_text_allowed(p_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.dua_wall_posts where user_id = auth.uid() and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'RATE_LIMIT';
  end if;
  if (select share_zone from public.community_profiles where user_id = auth.uid())
     and p_lat between -90 and 90 and p_lng between -180 and 180 then
    select z.zone_lat, z.zone_lng into v_zone_lat, v_zone_lng from public.tahajjud_zone(p_lat, p_lng) z;
  end if;
  insert into public.dua_wall_posts (user_id, body, anonymous, zone_lat, zone_lng)
  values (auth.uid(), trim(p_body), coalesce(p_anonymous, true), v_zone_lat, v_zone_lng)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.dua_wall_publish(text, boolean, double precision, double precision) to authenticated;

-- One post (opened from the map or a notification).
create or replace function public.dua_wall_post(p_post uuid)
returns table (
  id uuid, body text, author text, author_avatar text, answered boolean, gratitude text,
  ameen_count integer, reply_count integer, my_ameen boolean, mine boolean, status text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.body,
         case when p.anonymous then null else c.pseudo end,
         case when p.anonymous then null else c.avatar end,
         p.answered, p.gratitude, p.ameen_count, p.reply_count,
         exists (select 1 from public.dua_wall_ameens a where a.post_id = p.id and a.user_id = auth.uid()),
         p.user_id = auth.uid(), p.status, p.created_at
  from public.dua_wall_posts p
  left join public.community_profiles c on c.user_id = p.user_id
  where p.id = p_post and p.status = 'approved' and (p.report_count < 3 or p.user_id = auth.uid());
$$;
grant execute on function public.dua_wall_post(uuid) to anon, authenticated;

-- Zones with duas of the last p_days days, each with its latest duas (excerpts).
create or replace function public.dua_wall_map(p_days integer default 14)
returns jsonb language sql stable security definer set search_path = public as $$
  with recent as (
    select p.*, row_number() over (partition by p.zone_lat, p.zone_lng order by p.created_at desc) as rank
    from public.dua_wall_posts p
    join public.community_profiles c on c.user_id = p.user_id and c.share_zone
    where p.status = 'approved' and p.report_count < 3 and p.zone_lat is not null
      and p.created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 14), 1), 60))
  )
  select coalesce(jsonb_agg(zone order by (zone->>'count')::int desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'lat', zone_lat, 'lng', zone_lng, 'count', count(*),
      'posts', jsonb_agg(jsonb_build_object(
        'id', id, 'excerpt', left(body, 140), 'answered', answered, 'ameenCount', ameen_count,
        'replyCount', reply_count, 'createdAt', created_at) order by created_at desc) filter (where rank <= 8)
    ) as zone
    from recent
    group by zone_lat, zone_lng
  ) zones;
$$;
grant execute on function public.dua_wall_map(integer) to anon, authenticated;

notify pgrst, 'reload schema';
