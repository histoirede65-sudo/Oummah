-- Suppression complète d'un compte depuis l'espace administrateur.
-- Réservée au propriétaire; les FK ON DELETE CASCADE nettoient les données liées.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_owner() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  if p_user_id is null then
    raise exception 'USER_ID_REQUIRED';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'CANNOT_DELETE_CURRENT_ADMIN';
  end if;

  if exists (
    select 1
    from public.oummah_admin_users
    where user_id = p_user_id
  ) then
    raise exception 'CANNOT_DELETE_ADMIN';
  end if;

  delete from auth.users
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
