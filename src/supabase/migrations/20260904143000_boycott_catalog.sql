-- OUMMAH Boycott module. Isolated tables only; no changes to existing modules.
create table if not exists public.boycott_entities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  aliases text[] not null default '{}',
  category text not null,
  parent_group text,
  summary text not null,
  evidence_kind text not null,
  sources jsonb not null default '[]'::jsonb,
  barcode_prefixes text[] not null default '{}',
  product_barcodes text[] not null default '{}',
  alternative_ids text[] not null default '{}',
  last_verified_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boycott_entities_name_not_blank check (length(btrim(name)) > 0),
  constraint boycott_entities_category_allowed check (category in ('restaurant','beverage','food','technology','retail','finance','travel','energy','automotive','other'))
);

create table if not exists public.boycott_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  brand text,
  category text not null,
  barcode text,
  source_url text,
  note text,
  validation_status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint boycott_submissions_name_not_blank check (length(btrim(name)) > 0),
  constraint boycott_submissions_status_allowed check (validation_status in ('pending','approved','rejected')),
  constraint boycott_submissions_category_allowed check (category in ('restaurant','beverage','food','technology','retail','finance','travel','energy','automotive','other'))
);

alter table public.boycott_entities enable row level security;
alter table public.boycott_submissions enable row level security;

drop policy if exists "boycott entities public read" on public.boycott_entities;
create policy "boycott entities public read" on public.boycott_entities for select to anon, authenticated using (is_active = true);

drop policy if exists "boycott submissions public insert" on public.boycott_submissions;
create policy "boycott submissions public insert" on public.boycott_submissions for insert to anon, authenticated with check (validation_status = 'pending');

drop policy if exists "boycott submissions own read" on public.boycott_submissions;
create policy "boycott submissions own read" on public.boycott_submissions for select to authenticated using (user_id = auth.uid());

create index if not exists boycott_entities_name_idx on public.boycott_entities (lower(name));
create index if not exists boycott_entities_category_idx on public.boycott_entities (category) where is_active = true;
create index if not exists boycott_submissions_status_idx on public.boycott_submissions (validation_status, created_at desc);
