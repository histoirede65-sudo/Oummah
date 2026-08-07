-- OUMMAH — gestion des rôles administrateurs

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'oummah_admin_role'
  ) then
    create type public.oummah_admin_role as enum (
      'owner',
      'admin',
      'mosque_moderator',
      'support'
    );
  end if;
end
$$;

create table if not exists public.oummah_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.oummah_admin_role not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.oummah_admin_users enable row level security;

-- Création automatique du propriétaire historique.
insert into public.oummah_admin_users (
  user_id,
  role,
  created_by
)
select
  id,
  'owner'::public.oummah_admin_role,
  id
from auth.users
where lower(email) = 'bahri13015@hotmail.fr'
on conflict (user_id)
do update set role = 'owner';

create or replace function public.get_my_admin_role()
returns public.oummah_admin_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role
  from public.oummah_admin_users
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_oummah_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.oummah_admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.is_oummah_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.oummah_admin_users
    where user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.admin_list_admin_members()
returns table (
  user_id uuid,
  email text,
  role public.oummah_admin_role,
  created_at timestamptz,
  created_by_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_owner() then
    raise exception 'ADMIN_OWNER_REQUIRED';
  end if;

  return query
  select
    member.user_id,
    account.email::text,
    member.role,
    member.created_at,
    creator.email::text
  from public.oummah_admin_users member
  join auth.users account
    on account.id = member.user_id
  left join auth.users creator
    on creator.id = member.created_by
  order by
    case member.role
      when 'owner' then 0
      when 'admin' then 1
      when 'mosque_moderator' then 2
      else 3
    end,
    member.created_at asc;
end;
$$;

create or replace function public.admin_add_admin_member(
  p_email text,
  p_role public.oummah_admin_role
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not public.is_oummah_owner() then
    raise exception 'ADMIN_OWNER_REQUIRED';
  end if;

  if p_role = 'owner' then
    raise exception 'ADMIN_OWNER_ROLE_PROTECTED';
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if target_user_id is null then
    raise exception 'ADMIN_USER_NOT_FOUND';
  end if;

  insert into public.oummah_admin_users (
    user_id,
    role,
    created_by
  )
  values (
    target_user_id,
    p_role,
    auth.uid()
  )
  on conflict (user_id)
  do update set
    role = excluded.role,
    updated_at = now();
end;
$$;

create or replace function public.admin_update_admin_member_role(
  p_user_id uuid,
  p_role public.oummah_admin_role
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role public.oummah_admin_role;
begin
  if not public.is_oummah_owner() then
    raise exception 'ADMIN_OWNER_REQUIRED';
  end if;

  select role
  into current_role
  from public.oummah_admin_users
  where user_id = p_user_id
  for update;

  if current_role is null then
    raise exception 'ADMIN_MEMBER_NOT_FOUND';
  end if;

  if current_role = 'owner' or p_role = 'owner' then
    raise exception 'ADMIN_OWNER_ROLE_PROTECTED';
  end if;

  update public.oummah_admin_users
  set
    role = p_role,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

create or replace function public.admin_remove_admin_member(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_role public.oummah_admin_role;
begin
  if not public.is_oummah_owner() then
    raise exception 'ADMIN_OWNER_REQUIRED';
  end if;

  select role
  into current_role
  from public.oummah_admin_users
  where user_id = p_user_id;

  if current_role is null then
    raise exception 'ADMIN_MEMBER_NOT_FOUND';
  end if;

  if current_role = 'owner' then
    raise exception 'ADMIN_OWNER_CANNOT_BE_REMOVED';
  end if;

  delete from public.oummah_admin_users
  where user_id = p_user_id;
end;
$$;

revoke all on public.oummah_admin_users from anon, authenticated;
revoke all on function public.get_my_admin_role() from public;
revoke all on function public.is_oummah_admin() from public;
revoke all on function public.is_oummah_owner() from public;
revoke all on function public.admin_list_admin_members() from public;
revoke all on function public.admin_add_admin_member(text, public.oummah_admin_role) from public;
revoke all on function public.admin_update_admin_member_role(uuid, public.oummah_admin_role) from public;
revoke all on function public.admin_remove_admin_member(uuid) from public;

grant execute on function public.get_my_admin_role() to authenticated;
grant execute on function public.is_oummah_admin() to authenticated;
grant execute on function public.is_oummah_owner() to authenticated;
grant execute on function public.admin_list_admin_members() to authenticated;
grant execute on function public.admin_add_admin_member(text, public.oummah_admin_role) to authenticated;
grant execute on function public.admin_update_admin_member_role(uuid, public.oummah_admin_role) to authenticated;
grant execute on function public.admin_remove_admin_member(uuid) to authenticated;

notify pgrst, 'reload schema';
