-- OUMMAH Hadith foundation V1.
-- Structure only: no religious corpus data is inserted.

create table if not exists public.hadith_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  official_url text,
  description text,
  status text not null default 'En étude',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hadith_sources_name_not_blank check (length(btrim(name)) > 0),
  constraint hadith_sources_status_allowed check (status in ('En étude', 'En validation', 'Validée', 'Rejetée', 'Archivée'))
);

create table if not exists public.hadith_source_versions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.hadith_sources(id) on delete restrict,
  version text not null,
  edition text,
  language_code text,
  license text,
  attribution text,
  terms_url text,
  source_url text,
  imported_at timestamptz,
  validated_at timestamptz,
  status text not null default 'Importée',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hadith_source_versions_version_not_blank check (length(btrim(version)) > 0),
  constraint hadith_source_versions_status_allowed check (status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée')),
  constraint hadith_source_versions_source_version_key unique (source_id, version, language_code)
);

create table if not exists public.hadith_resource_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null,
  resource_type text not null,
  previous_status text,
  new_status text not null,
  occurred_at timestamptz not null default now(),
  decision_author text not null,
  justification text not null,
  evidence_reference text,
  version text not null,
  created_at timestamptz not null default now(),
  constraint hadith_resource_events_type_allowed check (resource_type in ('collection', 'book', 'chapter', 'hadith', 'source_version', 'translation', 'explanation', 'lesson')),
  constraint hadith_resource_events_author_not_blank check (length(btrim(decision_author)) > 0),
  constraint hadith_resource_events_justification_not_blank check (length(btrim(justification)) > 0),
  constraint hadith_resource_events_version_not_blank check (length(btrim(version)) > 0)
);

alter table public.hadith_collections
  add column if not exists lifecycle_status text not null default 'Importée';
alter table public.hadith_books
  add column if not exists lifecycle_status text not null default 'Importée';
alter table public.hadith_chapters
  add column if not exists lifecycle_status text not null default 'Importée';
alter table public.hadiths
  add column if not exists source_id uuid references public.hadith_sources(id) on delete restrict;
alter table public.hadiths
  add column if not exists source_version_id uuid references public.hadith_source_versions(id) on delete restrict;
alter table public.hadiths
  add column if not exists lifecycle_status text not null default 'Importée';

alter table public.hadith_translations
  add column if not exists source_id uuid references public.hadith_sources(id) on delete restrict;
alter table public.hadith_translations
  add column if not exists source_version_id uuid references public.hadith_source_versions(id) on delete restrict;
alter table public.hadith_translations
  add column if not exists editor text;
alter table public.hadith_translations
  add column if not exists attribution text;
alter table public.hadith_translations
  add column if not exists lifecycle_status text not null default 'Importée';
alter table public.hadith_translations
  add column if not exists imported_at timestamptz not null default now();

alter table public.hadith_explanations
  add column if not exists source_id uuid references public.hadith_sources(id) on delete restrict;
alter table public.hadith_explanations
  add column if not exists source_version_id uuid references public.hadith_source_versions(id) on delete restrict;
alter table public.hadith_explanations
  add column if not exists author text;
alter table public.hadith_explanations
  add column if not exists editor text;
alter table public.hadith_explanations
  add column if not exists attribution text;
alter table public.hadith_explanations
  add column if not exists lifecycle_status text not null default 'Importée';

alter table public.hadith_lessons
  add column if not exists source_id uuid references public.hadith_sources(id) on delete restrict;
alter table public.hadith_lessons
  add column if not exists source_version_id uuid references public.hadith_source_versions(id) on delete restrict;
alter table public.hadith_lessons
  add column if not exists author text;
alter table public.hadith_lessons
  add column if not exists editor text;
alter table public.hadith_lessons
  add column if not exists attribution text;
alter table public.hadith_lessons
  add column if not exists lifecycle_status text not null default 'Importée';

alter table public.hadith_translations drop constraint if exists hadith_translations_hadith_language_key;
create unique index if not exists hadith_translations_hadith_language_source_version_key
  on public.hadith_translations(hadith_id, language_code, source_version_id)
  where source_version_id is not null;

alter table public.hadith_translations drop constraint if exists hadith_translations_language_allowed;
alter table public.hadith_translations add constraint hadith_translations_language_code_format
  check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$');

create index if not exists hadith_source_versions_source_status_idx
  on public.hadith_source_versions(source_id, status);
create index if not exists hadiths_source_version_idx
  on public.hadiths(source_version_id);
create index if not exists hadith_translations_source_version_idx
  on public.hadith_translations(source_version_id);
create index if not exists hadith_translations_published_language_idx
  on public.hadith_translations(language_code, lifecycle_status, hadith_id);
create index if not exists hadith_explanations_source_version_idx
  on public.hadith_explanations(source_version_id);
create index if not exists hadith_lessons_source_version_idx
  on public.hadith_lessons(source_version_id);

create index if not exists hadiths_arabic_search_idx
  on public.hadiths using gin (to_tsvector('simple', arabic_text));
create index if not exists hadith_translations_search_idx
  on public.hadith_translations using gin (to_tsvector('simple', translation_text));
create index if not exists hadith_explanations_search_idx
  on public.hadith_explanations using gin (to_tsvector('simple', explanation_text));

create or replace view public.hadith_published_translations as
select
  h.id as hadith_id,
  h.collection_id,
  h.book_id,
  h.chapter_id,
  h.global_number,
  h.hadith_number_in_book,
  h.arabic_text,
  h.narrator,
  h.chain_text,
  h.authenticity_grade,
  h.source_reference,
  t.id as translation_id,
  t.language_code,
  t.translation_text,
  t.translator,
  t.editor,
  t.source_name,
  t.source_url,
  t.license,
  t.attribution,
  t.corpus_version,
  t.source_version_id
from public.hadiths h
join public.hadith_translations t on t.hadith_id = h.id
where h.lifecycle_status = 'Disponible en production'
  and t.lifecycle_status = 'Disponible en production'
  and t.verification_status = 'verified';

create or replace function public.prevent_hadith_resource_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Hadith lifecycle events are immutable';
end;
$$;

drop trigger if exists hadith_resource_events_immutable_update
  on public.hadith_resource_lifecycle_events;
create trigger hadith_resource_events_immutable_update
before update or delete on public.hadith_resource_lifecycle_events
for each row execute function public.prevent_hadith_resource_event_mutation();

create table if not exists public.hadith_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hadith_id uuid not null references public.hadiths(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, hadith_id)
);

create table if not exists public.hadith_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hadith_id uuid not null references public.hadiths(id) on delete cascade,
  language_code text,
  note_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hadith_notes_text_not_blank check (length(btrim(note_text)) > 0)
);

create table if not exists public.hadith_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hadith_id uuid not null references public.hadiths(id) on delete cascade,
  language_code text,
  position_seconds numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.hadith_reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hadith_id uuid not null references public.hadiths(id) on delete cascade,
  language_code text,
  translation_id uuid references public.hadith_translations(id) on delete set null,
  last_position_seconds numeric,
  last_read_at timestamptz not null default now(),
  unique (user_id, hadith_id, language_code)
);

create index if not exists hadith_favorites_user_idx on public.hadith_favorites(user_id, created_at desc);
create index if not exists hadith_notes_user_idx on public.hadith_notes(user_id, updated_at desc);
create index if not exists hadith_bookmarks_user_idx on public.hadith_bookmarks(user_id, created_at desc);
create index if not exists hadith_history_user_idx on public.hadith_reading_history(user_id, last_read_at desc);

alter table public.hadith_sources enable row level security;
alter table public.hadith_source_versions enable row level security;
alter table public.hadith_resource_lifecycle_events enable row level security;
alter table public.hadith_favorites enable row level security;
alter table public.hadith_notes enable row level security;
alter table public.hadith_bookmarks enable row level security;
alter table public.hadith_reading_history enable row level security;

revoke all on table public.hadith_sources, public.hadith_source_versions, public.hadith_resource_lifecycle_events from public, anon, authenticated;
grant select on public.hadith_sources, public.hadith_source_versions to anon, authenticated;
grant all on public.hadith_sources, public.hadith_source_versions, public.hadith_resource_lifecycle_events to service_role;

grant select, insert, update, delete on public.hadith_favorites, public.hadith_notes, public.hadith_bookmarks, public.hadith_reading_history to authenticated;

drop policy if exists hadith_sources_public_read on public.hadith_sources;
create policy hadith_sources_public_read on public.hadith_sources for select to anon, authenticated using (status in ('Validée', 'Archivée'));
drop policy if exists hadith_source_versions_public_read on public.hadith_source_versions;
create policy hadith_source_versions_public_read on public.hadith_source_versions for select to anon, authenticated using (status in ('Disponible en développement', 'Disponible en bêta', 'Disponible en production'));

create policy hadith_favorites_own_rows on public.hadith_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hadith_notes_own_rows on public.hadith_notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hadith_bookmarks_own_rows on public.hadith_bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hadith_history_own_rows on public.hadith_reading_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.hadith_published_translations from public, anon, authenticated;
grant select on public.hadith_published_translations to anon, authenticated;

-- Critical integrity guards: lifecycle, documentary provenance and publication.

alter table public.hadith_collections
  drop constraint if exists hadith_collections_lifecycle_status_allowed;
alter table public.hadith_collections
  add constraint hadith_collections_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_books
  drop constraint if exists hadith_books_lifecycle_status_allowed;
alter table public.hadith_books
  add constraint hadith_books_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_chapters
  drop constraint if exists hadith_chapters_lifecycle_status_allowed;
alter table public.hadith_chapters
  add constraint hadith_chapters_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadiths
  drop constraint if exists hadiths_lifecycle_status_allowed;
alter table public.hadiths
  add constraint hadiths_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_translations
  drop constraint if exists hadith_translations_lifecycle_status_allowed;
alter table public.hadith_translations
  add constraint hadith_translations_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_explanations
  drop constraint if exists hadith_explanations_lifecycle_status_allowed;
alter table public.hadith_explanations
  add constraint hadith_explanations_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_lessons
  drop constraint if exists hadith_lessons_lifecycle_status_allowed;
alter table public.hadith_lessons
  add constraint hadith_lessons_lifecycle_status_allowed
  check (lifecycle_status in ('Importée', 'Validée', 'Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production', 'Suspendue', 'Retirée', 'Archivée', 'Rejetée'));

alter table public.hadith_source_versions
  drop constraint if exists hadith_source_versions_id_source_key;
alter table public.hadith_source_versions
  add constraint hadith_source_versions_id_source_key unique (id, source_id);

alter table public.hadiths
  drop constraint if exists hadiths_source_version_source_key;
alter table public.hadiths
  add constraint hadiths_source_version_source_key
  foreign key (source_version_id, source_id)
  references public.hadith_source_versions(id, source_id)
  match full
  on delete restrict;

alter table public.hadith_translations
  drop constraint if exists hadith_translations_source_version_source_key;
alter table public.hadith_translations
  add constraint hadith_translations_source_version_source_key
  foreign key (source_version_id, source_id)
  references public.hadith_source_versions(id, source_id)
  match full
  on delete restrict;

alter table public.hadith_explanations
  drop constraint if exists hadith_explanations_source_version_source_key;
alter table public.hadith_explanations
  add constraint hadith_explanations_source_version_source_key
  foreign key (source_version_id, source_id)
  references public.hadith_source_versions(id, source_id)
  match full
  on delete restrict;

alter table public.hadith_lessons
  drop constraint if exists hadith_lessons_source_version_source_key;
alter table public.hadith_lessons
  add constraint hadith_lessons_source_version_source_key
  foreign key (source_version_id, source_id)
  references public.hadith_source_versions(id, source_id)
  match full
  on delete restrict;

create or replace function public.require_hadith_publication_metadata()
returns trigger
language plpgsql
as $$
declare
  version_status text;
  version_license text;
  version_attribution text;
  source_status text;
begin
  if new.lifecycle_status <> 'Disponible en production' then
    return new;
  end if;

  if new.source_id is null or new.source_version_id is null then
    raise exception 'A production Hadith resource requires source_id and source_version_id';
  end if;

  if not exists (
    select 1
      from public.hadiths h
     where h.id = new.hadith_id
       and h.lifecycle_status = 'Disponible en production'
  ) then
    raise exception 'A production translation requires a production Hadith parent';
  end if;

  if tg_table_name = 'hadith_translations'
     and (new.license is null or length(btrim(new.license)) = 0
       or new.attribution is null or length(btrim(new.attribution)) = 0) then
    raise exception 'A production translation requires a license and attribution';
  end if;

  select v.status, v.license, v.attribution, s.status
    into version_status, version_license, version_attribution, source_status
    from public.hadith_source_versions v
    join public.hadith_sources s on s.id = v.source_id
   where v.id = new.source_version_id
     and v.source_id = new.source_id;

  if not found then
    raise exception 'The Hadith source version does not belong to the declared source';
  end if;

  if source_status <> 'Validée'
     or version_status not in ('Juridiquement validée', 'Disponible en développement', 'Disponible en bêta', 'Disponible en production')
     or version_license is null or length(btrim(version_license)) = 0
     or version_attribution is null or length(btrim(version_attribution)) = 0 then
    raise exception 'The Hadith source version is not legally publishable';
  end if;

  return new;
end;
$$;

drop trigger if exists hadith_translations_publication_guard on public.hadith_translations;
create trigger hadith_translations_publication_guard
before insert or update of hadith_id, lifecycle_status, source_id, source_version_id, license, attribution
on public.hadith_translations
for each row execute function public.require_hadith_publication_metadata();

create or replace function public.validate_hadith_lifecycle_event()
returns trigger
language plpgsql
as $$
declare
  resource_exists boolean;
begin
  execute format('select exists (select 1 from public.%I where id = $1)',
    case new.resource_type
      when 'collection' then 'hadith_collections'
      when 'book' then 'hadith_books'
      when 'chapter' then 'hadith_chapters'
      when 'hadith' then 'hadiths'
      when 'source_version' then 'hadith_source_versions'
      when 'translation' then 'hadith_translations'
      when 'explanation' then 'hadith_explanations'
      when 'lesson' then 'hadith_lessons'
    end)
    into resource_exists using new.resource_id;

  if not resource_exists then
    raise exception 'Hadith lifecycle event references a missing resource';
  end if;

  return new;
end;
$$;

drop trigger if exists hadith_lifecycle_event_reference_guard on public.hadith_resource_lifecycle_events;
create trigger hadith_lifecycle_event_reference_guard
before insert on public.hadith_resource_lifecycle_events
for each row execute function public.validate_hadith_lifecycle_event();

create or replace function public.record_hadith_lifecycle_transition()
returns trigger
language plpgsql
as $$
declare
  old_status text;
  new_status text;
  author text;
  justification text;
  evidence text;
  version text;
  resource_type text;
begin
  if tg_op = 'INSERT' then
    old_status := null;
  elsif tg_table_name = 'hadith_source_versions' then
    old_status := old.status;
  else
    old_status := old.lifecycle_status;
  end if;

  if tg_table_name = 'hadith_source_versions' then
    new_status := new.status;
  else
    new_status := new.lifecycle_status;
  end if;

  if tg_op = 'UPDATE' and old_status is not distinct from new_status then
    return new;
  end if;

  author := nullif(current_setting('hadith.lifecycle_author', true), '');
  justification := nullif(current_setting('hadith.lifecycle_justification', true), '');
  evidence := nullif(current_setting('hadith.lifecycle_evidence', true), '');
  version := nullif(current_setting('hadith.lifecycle_version', true), '');

  if author is null or justification is null or evidence is null or version is null then
    raise exception 'Every Hadith lifecycle transition requires author, justification, evidence and version session context';
  end if;

  resource_type := case tg_table_name
    when 'hadith_collections' then 'collection'
    when 'hadith_books' then 'book'
    when 'hadith_chapters' then 'chapter'
    when 'hadiths' then 'hadith'
    when 'hadith_source_versions' then 'source_version'
    when 'hadith_translations' then 'translation'
    when 'hadith_explanations' then 'explanation'
    when 'hadith_lessons' then 'lesson'
  end;

  insert into public.hadith_resource_lifecycle_events
    (resource_id, resource_type, previous_status, new_status, decision_author, justification, evidence_reference, version)
  values
    (new.id, resource_type, old_status, new_status, author, justification, evidence, version);

  return new;
end;
$$;

drop trigger if exists hadith_collections_lifecycle_audit on public.hadith_collections;
create trigger hadith_collections_lifecycle_audit after insert or update of lifecycle_status on public.hadith_collections for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_books_lifecycle_audit on public.hadith_books;
create trigger hadith_books_lifecycle_audit after insert or update of lifecycle_status on public.hadith_books for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_chapters_lifecycle_audit on public.hadith_chapters;
create trigger hadith_chapters_lifecycle_audit after insert or update of lifecycle_status on public.hadith_chapters for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadiths_lifecycle_audit on public.hadiths;
create trigger hadiths_lifecycle_audit after insert or update of lifecycle_status on public.hadiths for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_source_versions_lifecycle_audit on public.hadith_source_versions;
create trigger hadith_source_versions_lifecycle_audit after insert or update of status on public.hadith_source_versions for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_translations_lifecycle_audit on public.hadith_translations;
create trigger hadith_translations_lifecycle_audit after insert or update of lifecycle_status on public.hadith_translations for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_explanations_lifecycle_audit on public.hadith_explanations;
create trigger hadith_explanations_lifecycle_audit after insert or update of lifecycle_status on public.hadith_explanations for each row execute function public.record_hadith_lifecycle_transition();
drop trigger if exists hadith_lessons_lifecycle_audit on public.hadith_lessons;
create trigger hadith_lessons_lifecycle_audit after insert or update of lifecycle_status on public.hadith_lessons for each row execute function public.record_hadith_lifecycle_transition();

create or replace view public.hadith_published_translations as
select
  h.id as hadith_id,
  h.collection_id,
  h.book_id,
  h.chapter_id,
  h.global_number,
  h.hadith_number_in_book,
  h.arabic_text,
  h.narrator,
  h.chain_text,
  h.authenticity_grade,
  h.source_reference,
  t.id as translation_id,
  t.language_code,
  t.translation_text,
  t.translator,
  t.editor,
  t.source_name,
  t.source_url,
  t.license,
  t.attribution,
  t.corpus_version,
  t.source_version_id
from public.hadiths h
join public.hadith_translations t on t.hadith_id = h.id
join public.hadith_source_versions v on v.id = t.source_version_id and v.source_id = t.source_id
join public.hadith_sources s on s.id = t.source_id
where h.lifecycle_status = 'Disponible en production'
  and t.lifecycle_status = 'Disponible en production'
  and t.verification_status = 'verified'
  and s.status = 'Validée'
  and v.status = 'Disponible en production'
  and t.license is not null and length(btrim(t.license)) > 0
  and t.attribution is not null and length(btrim(t.attribution)) > 0
  and v.license is not null and length(btrim(v.license)) > 0
  and v.attribution is not null and length(btrim(v.attribution)) > 0;

drop policy if exists hadith_collections_public_read on public.hadith_collections;
create policy hadith_collections_public_read on public.hadith_collections
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');
drop policy if exists hadith_books_public_read on public.hadith_books;
create policy hadith_books_public_read on public.hadith_books
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');
drop policy if exists hadith_chapters_public_read on public.hadith_chapters;
create policy hadith_chapters_public_read on public.hadith_chapters
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');
drop policy if exists hadiths_public_read on public.hadiths;
create policy hadiths_public_read on public.hadiths
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');
drop policy if exists hadith_translations_public_read on public.hadith_translations;
create policy hadith_translations_public_read on public.hadith_translations
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and source_id is not null
    and source_version_id is not null
    and license is not null and length(btrim(license)) > 0
    and attribution is not null and length(btrim(attribution)) > 0
  );
drop policy if exists hadith_explanations_public_read on public.hadith_explanations;
create policy hadith_explanations_public_read on public.hadith_explanations
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');
drop policy if exists hadith_lessons_public_read on public.hadith_lessons;
create policy hadith_lessons_public_read on public.hadith_lessons
  for select to anon, authenticated using (lifecycle_status = 'Disponible en production');

-- Final publication guards.

alter table public.hadith_translations
  add column if not exists source_version_identity text
  generated always as (coalesce(source_version_id::text, '')) stored;

drop index if exists public.hadith_translations_hadith_language_source_version_key;
alter table public.hadith_translations
  drop constraint if exists hadith_translations_document_identity_key;
alter table public.hadith_translations
  add constraint hadith_translations_document_identity_key
  unique (hadith_id, language_code, source_version_identity);

create or replace function public.hadith_translation_is_public(p_translation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
      from public.hadith_translations t
      join public.hadiths h on h.id = t.hadith_id
      join public.hadith_source_versions v
        on v.id = t.source_version_id
       and v.source_id = t.source_id
      join public.hadith_sources s on s.id = t.source_id
     where t.id = p_translation_id
       and h.lifecycle_status = 'Disponible en production'
       and t.lifecycle_status = 'Disponible en production'
       and t.verification_status = 'verified'
       and t.source_id is not null
       and t.source_version_id is not null
       and t.license is not null and length(btrim(t.license)) > 0
       and t.attribution is not null and length(btrim(t.attribution)) > 0
       and s.status = 'Validée'
       and v.status = 'Disponible en production'
       and v.license is not null and length(btrim(v.license)) > 0
       and v.attribution is not null and length(btrim(v.attribution)) > 0
  );
$$;

create or replace function public.hadith_has_public_translation(p_hadith_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
      from public.hadith_translations t
     where t.hadith_id = p_hadith_id
       and public.hadith_translation_is_public(t.id)
  );
$$;

create or replace function public.hadith_source_is_public(p_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
      from public.hadith_sources s
      join public.hadith_source_versions v on v.source_id = s.id
     where s.id = p_source_id
       and s.status = 'Validée'
       and v.status = 'Disponible en production'
       and v.license is not null and length(btrim(v.license)) > 0
       and v.attribution is not null and length(btrim(v.attribution)) > 0
  );
$$;

drop policy if exists hadith_sources_public_read on public.hadith_sources;
create policy hadith_sources_public_read on public.hadith_sources
  for select to anon, authenticated using (public.hadith_source_is_public(id));

drop policy if exists hadith_source_versions_public_read on public.hadith_source_versions;
create policy hadith_source_versions_public_read on public.hadith_source_versions
  for select to anon, authenticated using (
    status = 'Disponible en production'
    and public.hadith_source_is_public(source_id)
  );

drop policy if exists hadith_translations_public_read on public.hadith_translations;
create policy hadith_translations_public_read on public.hadith_translations
  for select to anon, authenticated using (public.hadith_translation_is_public(id));

drop policy if exists hadith_explanations_public_read on public.hadith_explanations;
create policy hadith_explanations_public_read on public.hadith_explanations
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and source_id is not null
    and source_version_id is not null
    and license is not null and length(btrim(license)) > 0
    and attribution is not null and length(btrim(attribution)) > 0
    and exists (
      select 1
        from public.hadith_source_versions v
        join public.hadith_sources s on s.id = v.source_id
       where v.id = hadith_explanations.source_version_id
         and v.source_id = hadith_explanations.source_id
         and s.status = 'Validée'
         and v.status = 'Disponible en production'
         and v.license is not null and length(btrim(v.license)) > 0
         and v.attribution is not null and length(btrim(v.attribution)) > 0
    )
    and exists (
      select 1 from public.hadiths h
       where h.id = hadith_id
         and h.lifecycle_status = 'Disponible en production'
         and public.hadith_has_public_translation(h.id)
    )
  );

drop policy if exists hadith_lessons_public_read on public.hadith_lessons;
create policy hadith_lessons_public_read on public.hadith_lessons
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and source_id is not null
    and source_version_id is not null
    and license is not null and length(btrim(license)) > 0
    and attribution is not null and length(btrim(attribution)) > 0
    and exists (
      select 1
        from public.hadith_source_versions v
        join public.hadith_sources s on s.id = v.source_id
       where v.id = hadith_lessons.source_version_id
         and v.source_id = hadith_lessons.source_id
         and s.status = 'Validée'
         and v.status = 'Disponible en production'
         and v.license is not null and length(btrim(v.license)) > 0
         and v.attribution is not null and length(btrim(v.attribution)) > 0
    )
    and exists (
      select 1 from public.hadiths h
       where h.id = hadith_id
         and h.lifecycle_status = 'Disponible en production'
         and public.hadith_has_public_translation(h.id)
    )
  );

drop policy if exists hadiths_public_read on public.hadiths;
create policy hadiths_public_read on public.hadiths
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and public.hadith_has_public_translation(id)
  );

drop policy if exists hadith_collections_public_read on public.hadith_collections;
create policy hadith_collections_public_read on public.hadith_collections
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and exists (
      select 1
        from public.hadiths h
       where h.collection_id = id
         and public.hadith_has_public_translation(h.id)
    )
  );

drop policy if exists hadith_books_public_read on public.hadith_books;
create policy hadith_books_public_read on public.hadith_books
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and exists (
      select 1
        from public.hadiths h
       where h.book_id = id
         and public.hadith_has_public_translation(h.id)
    )
  );

drop policy if exists hadith_chapters_public_read on public.hadith_chapters;
create policy hadith_chapters_public_read on public.hadith_chapters
  for select to anon, authenticated using (
    lifecycle_status = 'Disponible en production'
    and exists (
      select 1
        from public.hadiths h
       where h.chapter_id = id
         and public.hadith_has_public_translation(h.id)
    )
  );

-- Import context: callers must set these transaction-local values before inserting
-- or changing a Hadith resource lifecycle status. The initial status remains
-- "Importée"; it is not silently promoted. Evidence is mandatory for auditability.
-- Example, executed by the controlled importer in the same transaction:
--   select set_config('hadith.lifecycle_author', 'IMPORTER_ID', true);
--   select set_config('hadith.lifecycle_justification', 'DOCUMENTED_REASON', true);
--   select set_config('hadith.lifecycle_version', 'CORPUS_VERSION', true);
--   select set_config('hadith.lifecycle_evidence', 'SOURCE_OR_AUDIT_REFERENCE', true);
