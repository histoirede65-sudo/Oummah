-- OUMMAH — notification push à la publication d'une annonce ou d'un événement de mosquée.
--
-- Un utilisateur connecté s'abonne aux annonces d'une mosquée (interrupteur « Annonces et événements »
-- de la fiche). Quand un administrateur valide une annonce, la base envoie aussitôt une notification
-- Expo à tous les abonnés de la mosquée (toutes sources confondues), comme pour les alertes admin.

create table if not exists public.mosque_post_subscriptions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mosque_id uuid not null references public.mosques (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, mosque_id)
);
create index if not exists mosque_post_subscriptions_mosque_idx on public.mosque_post_subscriptions (mosque_id);

alter table public.mosque_post_subscriptions enable row level security;
drop policy if exists "Users manage their mosque subscriptions" on public.mosque_post_subscriptions;
create policy "Users manage their mosque subscriptions" on public.mosque_post_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.mosque_post_subscriptions to authenticated;

-- Encodage d'URL (paramètres de la route ouverte par la notification).
create or replace function public.oummah_url_encode(p_value text)
returns text language sql immutable as $$
  select coalesce(string_agg(
    case when ch ~ '^[A-Za-z0-9_.~-]$' then ch
         else upper(regexp_replace(encode(convert_to(ch, 'UTF8'), 'hex'), '(..)', '%\1', 'g')) end,
    '' order by i), '')
  from regexp_split_to_table(coalesce(p_value, ''), '') with ordinality as t(ch, i);
$$;

-- Envoi aux abonnés (par paquets de 100, limite d'Expo).
create or replace function public.notify_mosque_post_subscribers(p_post_id uuid)
returns integer
language plpgsql security definer set search_path = public, net
as $$
declare
  v_post public.mosque_posts;
  v_mosque public.mosques;
  v_title text;
  v_body text;
  v_route text;
  v_tokens text[];
  v_sent integer := 0;
  v_chunk text[];
begin
  select * into v_post from public.mosque_posts where id = p_post_id and status = 'approved';
  if v_post.id is null then return 0; end if;

  select m.* into v_mosque from public.mosques m
  where m.id = coalesce(
    (select e.mosque_id from public.mosque_external_ids e where e.external_id = v_post.mosque_id),
    (select x.id from public.mosques x where x.id::text = v_post.mosque_id));
  if v_mosque.id is null then return 0; end if;

  select array_agg(distinct t.expo_push_token) into v_tokens
  from public.mosque_post_subscriptions s
  join public.user_push_tokens t on t.user_id = s.user_id and t.enabled
  where s.mosque_id = v_mosque.id
    and s.user_id is distinct from v_post.submitted_by;
  if v_tokens is null then return 0; end if;

  v_title := case when v_post.kind = 'event' then 'Nouvel événement · ' else 'Annonce · ' end || v_post.mosque_name;
  v_body := v_post.title || case
    when v_post.kind = 'event' and v_post.starts_at is not null
      then ' — ' || to_char(v_post.starts_at at time zone 'Europe/Paris', 'DD/MM à HH24"h"MI')
    else '' end;
  v_route := '/mosque/' || public.oummah_url_encode(v_post.mosque_id)
    || '?name=' || public.oummah_url_encode(v_mosque.name)
    || '&address=' || public.oummah_url_encode(coalesce(v_mosque.address, ''))
    || '&latitude=' || v_mosque.latitude::text
    || '&longitude=' || v_mosque.longitude::text;

  for i in 0 .. (array_length(v_tokens, 1) - 1) / 100 loop
    v_chunk := v_tokens[i * 100 + 1 : i * 100 + 100];
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := (select jsonb_agg(jsonb_build_object(
        'to', token, 'title', v_title, 'body', v_body, 'sound', 'default',
        'channelId', 'oummah-mosque-v1',
        'data', jsonb_build_object('route', v_route, 'postId', v_post.id)))
        from unnest(v_chunk) as token),
      timeout_milliseconds := 10000
    );
    v_sent := v_sent + array_length(v_chunk, 1);
  end loop;
  return v_sent;
end;
$$;
revoke execute on function public.notify_mosque_post_subscribers(uuid) from public, anon, authenticated;

-- Validation : la publication déclenche l'envoi (une seule fois).
create or replace function public.admin_review_mosque_post(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_previous text;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  select status into v_previous from public.mosque_posts where id = p_id;
  update public.mosque_posts
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where id = p_id;
  if p_approve and v_previous is distinct from 'approved' then
    perform public.notify_mosque_post_subscribers(p_id);
  end if;
end;
$$;

notify pgrst, 'reload schema';
