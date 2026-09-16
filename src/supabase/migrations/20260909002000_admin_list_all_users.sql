-- Afficher tous les utilisateurs dans l’accueil administrateur.
create or replace function public.admin_list_users(
  p_search text default null,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  balance integer,
  total_spent integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    coalesce(w.balance, 0)::integer,
    coalesce(w.total_spent, 0)::integer
  from auth.users as u
  left join public.wasil_wallets as w on w.user_id = u.id
  where
    p_search is null
    or trim(p_search) = ''
    or lower(coalesce(u.email, '')) like '%' || lower(trim(p_search)) || '%'
  order by u.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 5000);
end;
$$;

revoke all on function public.admin_list_users(text, integer) from public;
grant execute on function public.admin_list_users(text, integer) to authenticated;
notify pgrst, 'reload schema';
