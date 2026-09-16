create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mosque_validation_status') then
    create type public.mosque_validation_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.mosque_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  address text not null check (char_length(trim(address)) between 5 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  image_key text not null,
  alternative_name text,
  arabic_name text,
  phone text,
  email text,
  website text,
  opening_hours text,
  operator text,
  denomination text,
  wheelchair text not null default 'unknown' check (wheelchair in ('yes','no','limited','unknown')),
  women_space text not null default 'unknown' check (women_space in ('yes','no','limited','unknown')),
  ablutions text not null default 'unknown' check (ablutions in ('yes','no','limited','unknown')),
  parking text not null default 'unknown' check (parking in ('yes','no','limited','unknown')),
  toilets text not null default 'unknown' check (toilets in ('yes','no','limited','unknown')),
  languages text[] not null default '{}',
  service_times text[] not null default '{}',
  submitted_by uuid references auth.users(id) on delete set null default auth.uid(),
  validation_status public.mosque_validation_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mosque_submissions_status_created_idx
  on public.mosque_submissions(validation_status, created_at desc);

create or replace function public.touch_mosque_submission_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mosque_submissions_touch_updated_at on public.mosque_submissions;
create trigger mosque_submissions_touch_updated_at
before update on public.mosque_submissions
for each row execute function public.touch_mosque_submission_updated_at();

alter table public.mosque_submissions enable row level security;

drop policy if exists "Public reads approved mosques" on public.mosque_submissions;
create policy "Public reads approved mosques"
on public.mosque_submissions for select
to anon, authenticated
using (validation_status = 'approved');

drop policy if exists "Users submit pending mosques" on public.mosque_submissions;
create policy "Users submit pending mosques"
on public.mosque_submissions for insert
to anon, authenticated
with check (
  validation_status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and rejection_reason is null
);

drop policy if exists "Mosque admin reads every submission" on public.mosque_submissions;
create policy "Mosque admin reads every submission"
on public.mosque_submissions for select
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr');

drop policy if exists "Mosque admin updates submissions" on public.mosque_submissions;
create policy "Mosque admin updates submissions"
on public.mosque_submissions for update
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr');

grant select, insert on public.mosque_submissions to anon, authenticated;
grant update on public.mosque_submissions to authenticated;
revoke delete on public.mosque_submissions from anon, authenticated;
