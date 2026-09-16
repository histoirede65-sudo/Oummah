do $$
begin
  if not exists (select 1 from pg_type where typname='mosque_report_reason') then
    create type public.mosque_report_reason as enum ('wrong_address','wrong_hours','closed','duplicate','wrong_information','other');
  end if;
  if not exists (select 1 from pg_type where typname='mosque_report_status') then
    create type public.mosque_report_status as enum ('pending','resolved','ignored');
  end if;
end $$;

create table if not exists public.mosque_reports (
  id uuid primary key default gen_random_uuid(),
  mosque_id text not null,
  mosque_name text not null,
  mosque_address text not null,
  latitude double precision not null check(latitude between -90 and 90),
  longitude double precision not null check(longitude between -180 and 180),
  reason public.mosque_report_reason not null,
  details text check(details is null or char_length(details)<=1000),
  status public.mosque_report_status not null default 'pending',
  reported_by uuid references auth.users(id) on delete set null default auth.uid(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mosque_reports enable row level security;
drop policy if exists "Users can submit mosque reports" on public.mosque_reports;
create policy "Users can submit mosque reports" on public.mosque_reports for insert to anon,authenticated
with check(status='pending' and reviewed_by is null and reviewed_at is null);
grant insert on public.mosque_reports to anon,authenticated;
revoke select,update,delete on public.mosque_reports from anon,authenticated;

create or replace function public.admin_list_mosque_reports(p_status public.mosque_report_status default 'pending')
returns table(id uuid,mosque_id text,mosque_name text,mosque_address text,latitude double precision,longitude double precision,reason public.mosque_report_reason,details text,status public.mosque_report_status,reporter_email text,created_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query select r.id,r.mosque_id,r.mosque_name,r.mosque_address,r.latitude,r.longitude,r.reason,r.details,r.status,u.email::text,r.created_at
  from public.mosque_reports r left join auth.users u on u.id=r.reported_by
  where r.status=p_status order by r.created_at desc;
end $$;

create or replace function public.admin_review_mosque_report(p_report_id uuid,p_status public.mosque_report_status,p_hide_mosque boolean default false)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare report_row public.mosque_reports%rowtype;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  if p_status not in ('resolved','ignored') then raise exception 'INVALID_REPORT_STATUS'; end if;
  select * into report_row from public.mosque_reports where id=p_report_id for update;
  if not found then raise exception 'MOSQUE_REPORT_NOT_FOUND'; end if;
  update public.mosque_reports set status=p_status,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_report_id;
  if coalesce(p_hide_mosque,false) then
    update public.mosque_submissions set is_hidden=true,hidden_at=now(),hidden_by=auth.uid(),updated_at=now()
    where id::text=report_row.mosque_id and validation_status='approved';
  end if;
  return jsonb_build_object('id',p_report_id,'status',p_status,'mosque_hidden',coalesce(p_hide_mosque,false));
end $$;

revoke all on function public.admin_list_mosque_reports(public.mosque_report_status) from public;
revoke all on function public.admin_review_mosque_report(uuid,public.mosque_report_status,boolean) from public;
grant execute on function public.admin_list_mosque_reports(public.mosque_report_status) to authenticated;
grant execute on function public.admin_review_mosque_report(uuid,public.mosque_report_status,boolean) to authenticated;
notify pgrst,'reload schema';
