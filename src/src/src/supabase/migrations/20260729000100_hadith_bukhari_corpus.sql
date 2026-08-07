-- OUMMAH Hadith Corpus foundation: Sahih al-Bukhari only.
-- Schema only: no corpus data is inserted by this migration.

create extension if not exists pg_trgm with schema extensions;

create table if not exists public.hadith_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  arabic_name text,
  description text,
  source_name text not null,
  source_url text,
  license text,
  corpus_version text not null,
  verification_status text not null default 'unverified',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_collections_slug_not_blank
    check (length(btrim(slug)) > 0),
  constraint hadith_collections_name_not_blank
    check (length(btrim(name)) > 0),
  constraint hadith_collections_source_name_not_blank
    check (length(btrim(source_name)) > 0),
  constraint hadith_collections_corpus_version_not_blank
    check (length(btrim(corpus_version)) > 0),
  constraint hadith_collections_verification_status_allowed
    check (verification_status in ('unverified', 'partially_verified', 'verified')),
  constraint hadith_collections_slug_key
    unique (slug)
);

create table if not exists public.hadith_books (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null
    references public.hadith_collections(id)
    on delete cascade,
  book_number integer not null,
  name text not null,
  arabic_name text,
  source_book_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_books_book_number_positive
    check (book_number > 0),
  constraint hadith_books_name_not_blank
    check (length(btrim(name)) > 0),
  constraint hadith_books_id_collection_key
    unique (id, collection_id),
  constraint hadith_books_collection_book_number_key
    unique (collection_id, book_number)
);

create table if not exists public.hadith_chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null
    references public.hadith_books(id)
    on delete cascade,
  chapter_number integer not null,
  name text not null,
  arabic_name text,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_chapters_chapter_number_positive
    check (chapter_number > 0),
  constraint hadith_chapters_name_not_blank
    check (length(btrim(name)) > 0),
  constraint hadith_chapters_id_book_key
    unique (id, book_id),
  constraint hadith_chapters_book_chapter_number_key
    unique (book_id, chapter_number)
);

create table if not exists public.hadiths (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null,
  book_id uuid not null,
  chapter_id uuid,
  global_number integer not null,
  hadith_number_in_book integer not null,
  arabic_text text not null,
  narrator text,
  chain_text text,
  authenticity_grade text,
  source_reference text,
  source_name text not null,
  source_url text,
  license text,
  verification_status text not null default 'unverified',
  corpus_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadiths_global_number_positive
    check (global_number > 0),
  constraint hadiths_number_in_book_positive
    check (hadith_number_in_book > 0),
  constraint hadiths_arabic_text_not_blank
    check (length(btrim(arabic_text)) > 0),
  constraint hadiths_source_name_not_blank
    check (length(btrim(source_name)) > 0),
  constraint hadiths_corpus_version_not_blank
    check (length(btrim(corpus_version)) > 0),
  constraint hadiths_verification_status_allowed
    check (verification_status in ('unverified', 'partially_verified', 'verified')),
  constraint hadiths_collection_id_fkey
    foreign key (collection_id)
    references public.hadith_collections(id)
    on delete cascade,
  constraint hadiths_book_collection_fkey
    foreign key (book_id, collection_id)
    references public.hadith_books(id, collection_id)
    on delete restrict,
  constraint hadiths_chapter_book_fkey
    foreign key (chapter_id, book_id)
    references public.hadith_chapters(id, book_id)
    on delete restrict,
  constraint hadiths_collection_global_number_key
    unique (collection_id, global_number),
  constraint hadiths_book_number_in_book_key
    unique (book_id, hadith_number_in_book)
);

create table if not exists public.hadith_translations (
  id uuid primary key default gen_random_uuid(),
  hadith_id uuid not null
    references public.hadiths(id)
    on delete cascade,
  language_code text not null,
  translation_text text not null,
  translator text,
  source_name text not null,
  source_url text,
  license text,
  verification_status text not null default 'unverified',
  corpus_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_translations_language_allowed
    check (language_code in ('fr', 'en')),
  constraint hadith_translations_text_not_blank
    check (length(btrim(translation_text)) > 0),
  constraint hadith_translations_source_name_not_blank
    check (length(btrim(source_name)) > 0),
  constraint hadith_translations_corpus_version_not_blank
    check (length(btrim(corpus_version)) > 0),
  constraint hadith_translations_verification_status_allowed
    check (verification_status in ('unverified', 'partially_verified', 'verified')),
  constraint hadith_translations_hadith_language_key
    unique (hadith_id, language_code)
);

create index if not exists hadiths_collection_pagination_idx
  on public.hadiths(collection_id, global_number, id);

create index if not exists hadiths_book_pagination_idx
  on public.hadiths(book_id, hadith_number_in_book, id);

create index if not exists hadiths_source_reference_trigram_idx
  on public.hadiths using gin (source_reference extensions.gin_trgm_ops);

create index if not exists hadiths_arabic_trigram_idx
  on public.hadiths using gin (arabic_text extensions.gin_trgm_ops);

create index if not exists hadith_translations_language_idx
  on public.hadith_translations(language_code, hadith_id);

create index if not exists hadith_translations_trigram_idx
  on public.hadith_translations using gin (translation_text extensions.gin_trgm_ops);

alter table public.hadith_collections enable row level security;
alter table public.hadith_books enable row level security;
alter table public.hadith_chapters enable row level security;
alter table public.hadiths enable row level security;
alter table public.hadith_translations enable row level security;

revoke all on table public.hadith_collections from public, anon, authenticated;
revoke all on table public.hadith_books from public, anon, authenticated;
revoke all on table public.hadith_chapters from public, anon, authenticated;
revoke all on table public.hadiths from public, anon, authenticated;
revoke all on table public.hadith_translations from public, anon, authenticated;

grant select on table public.hadith_collections to anon, authenticated;
grant select on table public.hadith_books to anon, authenticated;
grant select on table public.hadith_chapters to anon, authenticated;
grant select on table public.hadiths to anon, authenticated;
grant select on table public.hadith_translations to anon, authenticated;

grant all on table public.hadith_collections to service_role;
grant all on table public.hadith_books to service_role;
grant all on table public.hadith_chapters to service_role;
grant all on table public.hadiths to service_role;
grant all on table public.hadith_translations to service_role;

drop policy if exists hadith_collections_public_read on public.hadith_collections;
create policy hadith_collections_public_read
  on public.hadith_collections
  for select
  to anon, authenticated
  using (true);

drop policy if exists hadith_books_public_read on public.hadith_books;
create policy hadith_books_public_read
  on public.hadith_books
  for select
  to anon, authenticated
  using (true);

drop policy if exists hadith_chapters_public_read on public.hadith_chapters;
create policy hadith_chapters_public_read
  on public.hadith_chapters
  for select
  to anon, authenticated
  using (true);

drop policy if exists hadiths_public_read on public.hadiths;
create policy hadiths_public_read
  on public.hadiths
  for select
  to anon, authenticated
  using (true);

drop policy if exists hadith_translations_public_read on public.hadith_translations;
create policy hadith_translations_public_read
  on public.hadith_translations
  for select
  to anon, authenticated
  using (true);
