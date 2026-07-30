-- OUMMAH Hadith corpus: French explanations and ordered lessons.

create table if not exists public.hadith_explanations (
  id uuid primary key default gen_random_uuid(),
  hadith_id uuid not null
    references public.hadiths(id)
    on delete cascade,
  language_code text not null default 'fr',
  explanation_text text not null,
  source_name text not null,
  source_url text,
  source_reference text,
  source_item_id text,
  license text,
  corpus_version text not null,
  verification_status text not null default 'unverified',
  source_hash text not null,
  is_active boolean not null default true,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_explanations_language_fr_only
    check (language_code = 'fr'),
  constraint hadith_explanations_text_not_blank
    check (length(btrim(explanation_text)) > 0),
  constraint hadith_explanations_source_name_not_blank
    check (length(btrim(source_name)) > 0),
  constraint hadith_explanations_corpus_version_not_blank
    check (length(btrim(corpus_version)) > 0),
  constraint hadith_explanations_source_hash_sha256
    check (source_hash ~ '^[0-9a-f]{64}$'),
  constraint hadith_explanations_verification_status_allowed
    check (verification_status in ('unverified', 'partially_verified', 'verified'))
);

create table if not exists public.hadith_lessons (
  id uuid primary key default gen_random_uuid(),
  hadith_id uuid not null
    references public.hadiths(id)
    on delete cascade,
  language_code text not null default 'fr',
  lesson_order integer not null,
  lesson_text text not null,
  source_name text not null,
  source_url text,
  source_reference text,
  source_item_id text,
  license text,
  corpus_version text not null,
  verification_status text not null default 'unverified',
  source_hash text not null,
  is_active boolean not null default true,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_lessons_language_fr_only
    check (language_code = 'fr'),
  constraint hadith_lessons_order_positive
    check (lesson_order > 0),
  constraint hadith_lessons_text_not_blank
    check (length(btrim(lesson_text)) > 0),
  constraint hadith_lessons_source_name_not_blank
    check (length(btrim(source_name)) > 0),
  constraint hadith_lessons_corpus_version_not_blank
    check (length(btrim(corpus_version)) > 0),
  constraint hadith_lessons_source_hash_sha256
    check (source_hash ~ '^[0-9a-f]{64}$'),
  constraint hadith_lessons_verification_status_allowed
    check (verification_status in ('unverified', 'partially_verified', 'verified'))
);

create unique index if not exists hadith_explanations_logical_key_idx
  on public.hadith_explanations (
    hadith_id,
    language_code,
    source_name,
    coalesce(source_item_id, ''),
    corpus_version
  );

create unique index if not exists hadith_lessons_logical_key_idx
  on public.hadith_lessons (
    hadith_id,
    language_code,
    source_name,
    coalesce(source_item_id, ''),
    corpus_version,
    lesson_order
  );

create unique index if not exists hadith_explanations_active_key_idx
  on public.hadith_explanations (
    hadith_id,
    language_code,
    source_name,
    coalesce(source_item_id, '')
  )
  where is_active = true;

create unique index if not exists hadith_lessons_active_key_idx
  on public.hadith_lessons (
    hadith_id,
    language_code,
    source_name,
    coalesce(source_item_id, ''),
    lesson_order
  )
  where is_active = true;

create index if not exists hadith_explanations_hadith_idx
  on public.hadith_explanations(hadith_id);

create index if not exists hadith_explanations_active_idx
  on public.hadith_explanations(hadith_id, language_code, is_active);

create index if not exists hadith_explanations_verification_idx
  on public.hadith_explanations(verification_status);

create index if not exists hadith_lessons_hadith_idx
  on public.hadith_lessons(hadith_id);

create index if not exists hadith_lessons_active_order_idx
  on public.hadith_lessons(hadith_id, language_code, is_active, lesson_order);

create index if not exists hadith_lessons_verification_idx
  on public.hadith_lessons(verification_status);

create or replace function public.set_hadith_corpus_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hadith_explanations_set_updated_at
  on public.hadith_explanations;

create trigger hadith_explanations_set_updated_at
before update on public.hadith_explanations
for each row
execute function public.set_hadith_corpus_updated_at();

drop trigger if exists hadith_lessons_set_updated_at
  on public.hadith_lessons;

create trigger hadith_lessons_set_updated_at
before update on public.hadith_lessons
for each row
execute function public.set_hadith_corpus_updated_at();

alter table public.hadith_explanations enable row level security;
alter table public.hadith_lessons enable row level security;

revoke all on table public.hadith_explanations from public, anon, authenticated;
revoke all on table public.hadith_lessons from public, anon, authenticated;

grant select on table public.hadith_explanations to anon, authenticated;
grant select on table public.hadith_lessons to anon, authenticated;

grant all on table public.hadith_explanations to service_role;
grant all on table public.hadith_lessons to service_role;

drop policy if exists hadith_explanations_public_read
  on public.hadith_explanations;

create policy hadith_explanations_public_read
  on public.hadith_explanations
  for select
  to anon, authenticated
  using (true);

drop policy if exists hadith_lessons_public_read
  on public.hadith_lessons;

create policy hadith_lessons_public_read
  on public.hadith_lessons
  for select
  to anon, authenticated
  using (true);
