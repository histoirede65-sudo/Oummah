-- OUMMAH — photos communautaires pour "Halal autour de moi".
-- Une photo envoyée par un utilisateur reste invisible dans l'application
-- tant qu'un administrateur n'a pas passé validation_status à "approved".

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'halal-place-photos',
  'halal-place-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.halal_place_photo_submissions (
  id uuid primary key default gen_random_uuid(),
  place_key text not null check (char_length(trim(place_key)) between 3 and 400),
  place_name text not null check (char_length(trim(place_name)) between 2 and 160),
  place_address text not null check (char_length(trim(place_address)) between 3 and 500),
  storage_path text not null unique check (storage_path like 'pending/%'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')),
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'approved', 'rejected')),
  submitted_by uuid default auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists halal_place_photo_submissions_place_status_idx
  on public.halal_place_photo_submissions (place_key, validation_status, reviewed_at desc, created_at desc);

alter table public.halal_place_photo_submissions enable row level security;

drop policy if exists "Public can read approved halal place photos" on public.halal_place_photo_submissions;
create policy "Public can read approved halal place photos"
  on public.halal_place_photo_submissions
  for select
  to anon, authenticated
  using (validation_status = 'approved');

drop policy if exists "Public can submit pending halal place photos" on public.halal_place_photo_submissions;
create policy "Public can submit pending halal place photos"
  on public.halal_place_photo_submissions
  for insert
  to anon, authenticated
  with check (
    validation_status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
    and storage_path like 'pending/%'
  );

grant select, insert on public.halal_place_photo_submissions to anon, authenticated;
revoke update, delete on public.halal_place_photo_submissions from anon, authenticated;

-- Les clients peuvent uniquement déposer un nouveau fichier dans le dossier pending/.
drop policy if exists "Public can upload pending halal place photos" on storage.objects;
create policy "Public can upload pending halal place photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'halal-place-photos'
    and (storage.foldername(name))[1] = 'pending'
  );

-- Validation admin : dans Supabase > Table Editor > halal_place_photo_submissions,
-- passer validation_status = 'approved', reviewed_at = now().
-- La photo n'est récupérée par OUMMAH qu'après cette validation.
