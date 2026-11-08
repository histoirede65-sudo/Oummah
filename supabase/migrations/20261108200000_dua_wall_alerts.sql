-- Mur des duas : être prévenu quand une nouvelle dua est publiée (choix de chaque utilisateur, désactivé par défaut).
create table if not exists public.dua_wall_subscribers (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  language text not null default 'fr' check (language in ('fr', 'en')),
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.dua_wall_subscribers enable row level security;
revoke all on public.dua_wall_subscribers from anon;
grant select, insert, update, delete on public.dua_wall_subscribers to authenticated;

drop policy if exists dua_wall_subscribers_owner on public.dua_wall_subscribers;
create policy dua_wall_subscribers_owner on public.dua_wall_subscribers for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.dua_wall_alerts_get() returns boolean
language sql security definer set search_path = public, auth as $$
  select exists (select 1 from public.dua_wall_subscribers where user_id = auth.uid());
$$;

create or replace function public.dua_wall_alerts_set(p_on boolean, p_language text default 'fr') returns boolean
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_on then
    insert into public.dua_wall_subscribers (user_id, language) values (auth.uid(), case when p_language = 'en' then 'en' else 'fr' end)
      on conflict (user_id) do update set language = excluded.language;
  else
    delete from public.dua_wall_subscribers where user_id = auth.uid();
  end if;
  return p_on;
end;
$$;

revoke all on function public.dua_wall_alerts_get() from public, anon;
revoke all on function public.dua_wall_alerts_set(boolean, text) from public, anon;
grant execute on function public.dua_wall_alerts_get() to authenticated;
grant execute on function public.dua_wall_alerts_set(boolean, text) to authenticated;
