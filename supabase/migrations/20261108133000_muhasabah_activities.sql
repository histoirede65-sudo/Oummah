create table if not exists public.muhasabah_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  activity_date date not null,
  kind text not null check (kind in ('quran_verse', 'hadith', 'tafsir', 'dua', 'dhikr', 'content')),
  title text not null check (length(trim(title)) between 1 and 120),
  detail text not null check (length(trim(detail)) between 1 and 500),
  reference text not null check (length(trim(reference)) between 1 and 160),
  created_at timestamptz not null default now(),
  constraint muhasabah_activities_once_per_reference unique (user_id, activity_date, kind, reference)
);

create index if not exists muhasabah_activities_user_date_idx on public.muhasabah_activities(user_id, activity_date desc, created_at desc);

alter table public.muhasabah_activities enable row level security;
revoke all on public.muhasabah_activities from anon;
grant select, insert, delete on public.muhasabah_activities to authenticated;

create policy muhasabah_activities_owner on public.muhasabah_activities
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
