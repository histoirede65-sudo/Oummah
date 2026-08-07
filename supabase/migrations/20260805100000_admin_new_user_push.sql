create or replace function public.notify_admins_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, net
as $$
declare
  messages jsonb;
begin
  if to_regclass('public.user_push_tokens') is null
    or to_regclass('public.oummah_admin_users') is null
  then
    return new;
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'to', token.expo_push_token,
      'title', 'Nouvel utilisateur OUMMAH',
      'body', 'Un nouvel utilisateur vient de créer un compte.',
      'sound', 'default',
      'channelId', 'oummah-admin',
      'data', jsonb_build_object(
        'route', '/admin'
      )
    )
  )
  into messages
  from public.user_push_tokens token
  join public.oummah_admin_users admin_user
    on admin_user.user_id = token.user_id
  where token.enabled = true;

  if messages is not null and jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := messages,
      timeout_milliseconds := 10000
    );
  end if;

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notify_admins_new_user_trigger on auth.users;
create trigger notify_admins_new_user_trigger
  after insert on auth.users
  for each row
  execute function public.notify_admins_new_user();

revoke all on function public.notify_admins_new_user() from public;
