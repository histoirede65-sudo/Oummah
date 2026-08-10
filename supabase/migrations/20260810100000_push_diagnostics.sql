-- Diagnostics temporaires uniquement : aucun comportement fonctionnel modifié.

create or replace function public.register_my_push_token(
  p_expo_push_token text,
  p_platform text,
  p_audience_tier text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_platform not in ('ios', 'android') then
    raise exception 'INVALID_PLATFORM';
  end if;

  if p_audience_tier not in ('free', 'premium') then
    raise exception 'INVALID_AUDIENCE_TIER';
  end if;

  raise log '[PushDiagnostic] register_my_push_token user_id=% token_suffix=% platform=% tier=%',
    auth.uid(), right(trim(p_expo_push_token), 6), p_platform, p_audience_tier;

  insert into public.user_push_tokens (
    user_id,
    expo_push_token,
    platform,
    audience_tier,
    enabled,
    last_seen_at
  )
  values (
    auth.uid(),
    trim(p_expo_push_token),
    p_platform,
    p_audience_tier,
    true,
    now()
  )
  on conflict (expo_push_token)
  do update set
    user_id = auth.uid(),
    platform = excluded.platform,
    audience_tier = excluded.audience_tier,
    enabled = true,
    last_seen_at = now();

  raise log '[PushDiagnostic] register_my_push_token upsert terminé user_id=%', auth.uid();
end;
$$;

create or replace function public.notify_admins_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, net
as $$
declare
  messages jsonb;
  request_id bigint;
begin
  raise log '[PushDiagnostic] notify_admins_new_user trigger exécuté new_user_id=%', new.id;

  if to_regclass('public.user_push_tokens') is null
    or to_regclass('public.oummah_admin_users') is null
  then
    raise log '[PushDiagnostic] tables push/admin absentes';
    return new;
  end if;

  raise log '[PushDiagnostic] admin_users présents=%',
    (select count(*) from public.oummah_admin_users);

  select jsonb_agg(
    jsonb_build_object(
      'to', token.expo_push_token,
      'title', 'Nouvel utilisateur OUMMAH',
      'body', 'Un nouvel utilisateur vient de créer un compte.',
      'sound', 'default',
      'channelId', 'oummah-admin',
      'data', jsonb_build_object('route', '/admin')
    )
  )
  into messages
  from public.user_push_tokens token
  join public.oummah_admin_users admin_user
    on admin_user.user_id = token.user_id
  where token.enabled = true;

  raise log '[PushDiagnostic] tokens admin récupérés=%',
    coalesce(jsonb_array_length(messages), 0);

  if messages is not null and jsonb_array_length(messages) > 0 then
    raise log '[PushDiagnostic] appel Expo Push démarré';
    request_id := net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := messages,
      timeout_milliseconds := 10000
    );
    raise log '[PushDiagnostic] appel Expo Push soumis request_id=%', request_id;
  end if;

  return new;
exception
  when others then
    raise log '[PushDiagnostic] notify_admins_new_user erreur=%', sqlerrm;
    return new;
end;
$$;

revoke all on function public.notify_admins_new_user() from public;
revoke all on function public.register_my_push_token(text, text, text) from public;
grant execute on function public.register_my_push_token(text, text, text) to authenticated;
