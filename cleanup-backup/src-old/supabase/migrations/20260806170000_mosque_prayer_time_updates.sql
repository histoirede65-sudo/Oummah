-- OUMMAH — horaires réels des mosquées et validation communautaire
create table if not exists public.mosque_prayer_time_updates (
  id uuid primary key default gen_random_uuid(),
  mosque_id text not null,
  mosque_name text not null,
  mosque_address text,
  fajr text,
  dhuhr text,
  asr text,
  maghrib text,
  isha text,
  jumuah text,
  note text,
  submitted_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mosque_prayer_time_at_least_one check (
    nullif(trim(coalesce(fajr,'')), '') is not null or
    nullif(trim(coalesce(dhuhr,'')), '') is not null or
    nullif(trim(coalesce(asr,'')), '') is not null or
    nullif(trim(coalesce(maghrib,'')), '') is not null or
    nullif(trim(coalesce(isha,'')), '') is not null or
    nullif(trim(coalesce(jumuah,'')), '') is not null
  )
);

create index if not exists mosque_prayer_time_updates_mosque_status_idx
  on public.mosque_prayer_time_updates(mosque_id, status, reviewed_at desc, created_at desc);

alter table public.mosque_prayer_time_updates enable row level security;

drop policy if exists "Public reads approved mosque prayer times" on public.mosque_prayer_time_updates;
create policy "Public reads approved mosque prayer times"
  on public.mosque_prayer_time_updates for select to anon, authenticated
  using (status = 'approved' or submitted_by = auth.uid() or public.is_oummah_admin());

drop policy if exists "Authenticated proposes mosque prayer times" on public.mosque_prayer_time_updates;
create policy "Authenticated proposes mosque prayer times"
  on public.mosque_prayer_time_updates for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending');

grant select on public.mosque_prayer_time_updates to anon, authenticated;
grant insert on public.mosque_prayer_time_updates to authenticated;

create or replace function public.get_approved_mosque_prayer_times(p_mosque_id text)
returns table (
  mosque_id text, fajr text, dhuhr text, asr text, maghrib text, isha text,
  jumuah text, updated_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select u.mosque_id, u.fajr, u.dhuhr, u.asr, u.maghrib, u.isha, u.jumuah,
         coalesce(u.reviewed_at, u.updated_at)
  from public.mosque_prayer_time_updates u
  where u.mosque_id = p_mosque_id and u.status = 'approved'
  order by coalesce(u.reviewed_at, u.updated_at) desc
  limit 1;
$$;
grant execute on function public.get_approved_mosque_prayer_times(text) to anon, authenticated;

create or replace function public.admin_list_mosque_prayer_time_updates(p_status text default 'pending')
returns setof public.mosque_prayer_time_updates
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query select * from public.mosque_prayer_time_updates
    where p_status is null or status = p_status
    order by created_at desc;
end;
$$;
grant execute on function public.admin_list_mosque_prayer_time_updates(text) to authenticated;

create or replace function public.admin_review_mosque_prayer_time_update(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  if p_approve then
    update public.mosque_prayer_time_updates
      set status='rejected', reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
      where mosque_id=(select mosque_id from public.mosque_prayer_time_updates where id=p_id)
        and status='approved';
  end if;
  update public.mosque_prayer_time_updates
    set status=case when p_approve then 'approved' else 'rejected' end,
        reviewed_by=auth.uid(), reviewed_at=now(), updated_at=now()
    where id=p_id;
end;
$$;
grant execute on function public.admin_review_mosque_prayer_time_update(uuid, boolean) to authenticated;
