-- OUMMAH — source unique des alertes et de l'attention administrateur.

alter table public.admin_system_alerts
  add column if not exists requires_action boolean not null default true,
  add column if not exists read_at timestamptz,
  add column if not exists read_by uuid references auth.users(id) on delete set null;

create index if not exists admin_system_alerts_attention_idx
  on public.admin_system_alerts(status, requires_action, read_at, last_detected_at desc);

create or replace function public.create_admin_alert_and_notify(
  p_alert_type text,
  p_source_key text,
  p_severity public.admin_alert_severity,
  p_title text,
  p_description text,
  p_requires_action boolean default true,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, net
as $$
declare
  alert_id uuid;
  messages jsonb;
begin
  select id into alert_id
  from public.admin_system_alerts
  where source_key = p_source_key;

  if alert_id is not null then
    return alert_id;
  end if;

  insert into public.admin_system_alerts (
    alert_type, source_key, severity, status, title, description,
    requires_action, metadata, first_detected_at, last_detected_at,
    read_at, read_by
  )
  values (
    p_alert_type, p_source_key, p_severity, 'open', p_title, p_description,
    p_requires_action, coalesce(p_metadata, '{}'::jsonb), now(), now(),
    null, null
  )
  on conflict (source_key) do nothing
  returning id into alert_id;

  if alert_id is null then
    select id into alert_id from public.admin_system_alerts where source_key = p_source_key;
    return alert_id;
  end if;

  select jsonb_agg(jsonb_build_object(
    'to', token.expo_push_token,
    'title', p_title,
    'body', p_description,
    'sound', 'default',
    'channelId', 'oummah-admin',
    'data', jsonb_build_object(
      'route', '/admin',
      'alertId', alert_id,
      'alertType', p_alert_type
    )
  ))
  into messages
  from public.user_push_tokens token
  join public.oummah_admin_users admin_user on admin_user.user_id = token.user_id
  where token.enabled = true;

  if messages is not null and jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := messages,
      timeout_milliseconds := 10000
    );
  end if;

  return alert_id;
end;
$$;

create or replace function public.admin_get_attention_state()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare result jsonb;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  select jsonb_build_object(
    'attention_count', count(*) filter (
      where status = 'open' and (requires_action or read_at is null)
    ),
    'action_count', count(*) filter (where status = 'open' and requires_action),
    'unread_count', count(*) filter (where status = 'open' and not requires_action and read_at is null),
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'type', alert_type, 'title', title, 'description', description,
      'requiresAction', requires_action, 'status', status, 'createdAt', created_at,
      'metadata', metadata
    ) order by requires_action desc, last_detected_at desc) filter (
      where status = 'open' and (requires_action or read_at is null)
    ), '[]'::jsonb)
  ) into result
  from public.admin_system_alerts;
  return result;
end;
$$;

create or replace function public.admin_mark_alert_read(p_alert_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  update public.admin_system_alerts
  set read_at = now(), read_by = auth.uid(), updated_at = now()
  where id = p_alert_id and requires_action = false and status = 'open';
end;
$$;

create or replace function public.notify_admins_new_user()
returns trigger language plpgsql security definer set search_path = public, auth, net
as $$
begin
  perform public.create_admin_alert_and_notify(
    'new_user', 'user:' || new.id::text, 'info',
    'Nouvel utilisateur OUMMAH',
    'Un nouvel utilisateur vient de créer un compte.', false,
    jsonb_build_object('user_id', new.id, 'created_at', new.created_at)
  );
  return new;
exception when others then
  raise log 'notify_admins_new_user erreur=%', sqlerrm;
  return new;
end;
$$;

create or replace function public.notify_admins_new_mosque_submission()
returns trigger language plpgsql security definer set search_path = public, auth, net
as $$
begin
  if new.validation_status = 'pending' then
    perform public.create_admin_alert_and_notify(
      'mosque_submission_pending', 'mosque-submission:' || new.id::text, 'warning',
      'Nouvelle mosquée à valider',
      new.name || ' nécessite une validation.', true,
      jsonb_build_object('submission_id', new.id, 'mosque_name', new.name)
    );
  end if;
  return new;
end;
$$;

create or replace function public.notify_admins_new_prayer_time_update()
returns trigger language plpgsql security definer set search_path = public, auth, net
as $$
begin
  if new.status = 'pending' then
    perform public.create_admin_alert_and_notify(
      'mosque_prayer_time_pending', 'mosque-prayer-time:' || new.id::text, 'warning',
      'Horaires de mosquée à valider',
      new.mosque_name || ' propose de nouveaux horaires.', true,
      jsonb_build_object('update_id', new.id, 'mosque_id', new.mosque_id, 'mosque_name', new.mosque_name)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_admins_new_mosque_submission_trigger on public.mosque_submissions;
create trigger notify_admins_new_mosque_submission_trigger
after insert on public.mosque_submissions
for each row execute function public.notify_admins_new_mosque_submission();

drop trigger if exists notify_admins_new_prayer_time_update_trigger on public.mosque_prayer_time_updates;
create trigger notify_admins_new_prayer_time_update_trigger
after insert on public.mosque_prayer_time_updates
for each row execute function public.notify_admins_new_prayer_time_update();

grant execute on function public.create_admin_alert_and_notify(text,text,public.admin_alert_severity,text,text,boolean,jsonb) to service_role;
grant execute on function public.admin_get_attention_state() to authenticated;
grant execute on function public.admin_mark_alert_read(uuid) to authenticated;

notify pgrst, 'reload schema';
