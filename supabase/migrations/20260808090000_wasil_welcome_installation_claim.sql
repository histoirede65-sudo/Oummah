create table if not exists public.wasil_welcome_installation_claims (
  installation_device_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default timezone('utc', now())
);

alter table public.wasil_welcome_installation_claims enable row level security;
revoke all on table public.wasil_welcome_installation_claims from public, anon, authenticated;
grant all on table public.wasil_welcome_installation_claims to service_role;

create or replace function public.ensure_wasil_wallet_for_installation(
  p_user_id uuid,
  p_initial_balance integer,
  p_installation_device_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
  v_balance integer;
begin
  if nullif(btrim(p_installation_device_id), '') is not null then
    insert into public.wasil_welcome_installation_claims (
      installation_device_id,
      user_id
    ) values (
      btrim(p_installation_device_id),
      p_user_id
    ) on conflict (installation_device_id) do nothing;

    v_claimed := found;
  end if;

  select public.ensure_wasil_wallet(
    p_user_id,
    case when v_claimed then greatest(p_initial_balance, 0) else 0 end
  ) into v_balance;

  return coalesce(v_balance, 0);
end;
$$;

revoke all on function public.ensure_wasil_wallet_for_installation(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.ensure_wasil_wallet_for_installation(uuid, integer, text) to service_role;
