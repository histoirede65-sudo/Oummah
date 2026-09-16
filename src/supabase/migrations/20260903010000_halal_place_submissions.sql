-- OUMMAH — établissements halal proposés par la communauté.
-- Les nouvelles adresses restent en attente jusqu'à validation manuelle.

create extension if not exists pgcrypto;

create table if not exists public.halal_place_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  category text not null check (category in ('restaurant', 'fast_food', 'butcher', 'grocery', 'bakery', 'other')),
  address text not null check (char_length(trim(address)) between 3 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  phone text,
  website text,
  opening_hours text,
  note text check (note is null or char_length(note) <= 1500),
  contributor_type text not null default 'community'
    check (contributor_type in ('community', 'owner')),
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists halal_place_submissions_status_coordinates_idx
  on public.halal_place_submissions (validation_status, latitude, longitude);

alter table public.halal_place_submissions enable row level security;

drop policy if exists "Public can read approved halal places" on public.halal_place_submissions;
create policy "Public can read approved halal places"
  on public.halal_place_submissions
  for select
  to anon, authenticated
  using (validation_status = 'approved');

drop policy if exists "Public can submit pending halal places" on public.halal_place_submissions;
create policy "Public can submit pending halal places"
  on public.halal_place_submissions
  for insert
  to anon, authenticated
  with check (validation_status = 'pending' and reviewed_at is null);

grant select, insert on public.halal_place_submissions to anon, authenticated;
revoke update, delete on public.halal_place_submissions from anon, authenticated;

-- Validation dans Supabase > Table Editor > halal_place_submissions :
-- validation_status = 'approved', reviewed_at = now().
