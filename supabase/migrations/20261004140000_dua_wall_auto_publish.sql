-- Mur des duas : publication immédiate (plus de validation préalable).
-- La modération se fait a posteriori : masquage automatique à 3 signalements + alerte admin.

alter table public.dua_wall_posts alter column status set default 'approved';
update public.dua_wall_posts set status = 'approved', reviewed_at = coalesce(reviewed_at, now()) where status = 'pending';

drop trigger if exists notify_admins_new_dua_post_trigger on public.dua_wall_posts;
drop function if exists public.notify_admins_new_dua_post();

create or replace function public.dua_wall_report(p_type text, p_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public, auth, net as $$
declare v_count integer; v_body text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.dua_wall_reports (target_type, target_id, user_id, reason) values (p_type, p_id, auth.uid(), left(p_reason, 200))
  on conflict do nothing;
  if p_type = 'post' then
    update public.dua_wall_posts set report_count = (select count(*) from public.dua_wall_reports where target_type = 'post' and target_id = p_id)
      where id = p_id returning report_count, body into v_count, v_body;
  else
    update public.dua_wall_replies set report_count = (select count(*) from public.dua_wall_reports where target_type = 'reply' and target_id = p_id)
      where id = p_id returning report_count, body into v_count, v_body;
  end if;
  -- Masqué automatiquement à 3 signalements : on prévient l'admin à ce moment-là.
  if v_count = 3 then
    perform public.create_admin_alert_and_notify(
      'dua_wall_reported', 'dua-wall:' || p_type || ':' || p_id::text, 'warning',
      case when p_type = 'post' then 'Doua masquée (3 signalements)' else 'Réponse masquée (3 signalements)' end,
      left(v_body, 120), true,
      jsonb_build_object('kind', p_type, 'id', p_id)
    );
  end if;
end;
$$;
grant execute on function public.dua_wall_report(text, uuid, text) to authenticated;
