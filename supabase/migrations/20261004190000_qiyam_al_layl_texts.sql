-- Le module s'appelle désormais « Qiyam al-Layl » : textes envoyés par le serveur.

create or replace function public.encouragement_text(p_kind text)
returns text language sql immutable as $$
  select case p_kind
    when 'wake' then 'On se réveille pour prier cette nuit ?'
    when 'ease' then 'Qu’Allah te facilite ta nuit.'
    when 'dua' then 'J’ai fait doua pour toi cette nuit.'
    when 'keep' then 'Barak Allahou fik, continue comme ça !'
    when 'mashallah' then 'Ma sha Allah, qu’Allah t’accorde la constance.'
  end;
$$;
grant execute on function public.encouragement_text(text) to anon, authenticated;

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
      'Membre signalé : ' || coalesce(v_pseudo, '?'), coalesce(left(p_reason, 120), 'Signalement depuis Qiyam al-Layl (amis)'), true,
      jsonb_build_object('user_id', p_user, 'reports', (select count(*) from public.community_user_reports where reported = p_user))
    );
  end if;
end;
$$;
grant execute on function public.community_report_user(uuid, text) to authenticated;
