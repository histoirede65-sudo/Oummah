create table if not exists public.muhasabah_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  good_deeds text not null default '',
  could_improve text not null default '',
  effort text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint muhasabah_entries_one_per_day unique (user_id, entry_date),
  constraint muhasabah_entries_has_text check (length(trim(good_deeds)) > 0 or length(trim(could_improve)) > 0 or length(trim(effort)) > 0)
);

create table if not exists public.muhasabah_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null check (length(trim(text)) between 1 and 500),
  status text not null default 'active' check (status in ('active', 'progressing', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.muhasabah_followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  commitment_id uuid not null references public.muhasabah_commitments(id) on delete cascade,
  response text not null check (response in ('success', 'progress', 'not_yet')),
  created_at timestamptz not null default now()
);

create index if not exists muhasabah_entries_user_date_idx on public.muhasabah_entries(user_id, entry_date desc);
create index if not exists muhasabah_commitments_user_status_idx on public.muhasabah_commitments(user_id, status, updated_at desc);
create index if not exists muhasabah_followups_commitment_idx on public.muhasabah_followups(commitment_id, created_at desc);

alter table public.muhasabah_entries enable row level security;
alter table public.muhasabah_commitments enable row level security;
alter table public.muhasabah_followups enable row level security;

revoke all on public.muhasabah_entries, public.muhasabah_commitments, public.muhasabah_followups from anon;
grant select, insert, update, delete on public.muhasabah_entries, public.muhasabah_commitments, public.muhasabah_followups to authenticated;

create policy muhasabah_entries_owner on public.muhasabah_entries for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy muhasabah_commitments_owner on public.muhasabah_commitments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy muhasabah_followups_owner on public.muhasabah_followups for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.muhasabah_commitments c where c.id = commitment_id and c.user_id = (select auth.uid())));

create or replace function public.muhasabah_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists muhasabah_entries_updated_at on public.muhasabah_entries;
create trigger muhasabah_entries_updated_at before update on public.muhasabah_entries for each row execute function public.muhasabah_set_updated_at();
drop trigger if exists muhasabah_commitments_updated_at on public.muhasabah_commitments;
create trigger muhasabah_commitments_updated_at before update on public.muhasabah_commitments for each row execute function public.muhasabah_set_updated_at();
