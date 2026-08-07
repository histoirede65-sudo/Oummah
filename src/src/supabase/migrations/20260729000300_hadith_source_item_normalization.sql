-- Make source-item identity addressable by PostgREST without expression indexes.

alter table public.hadith_explanations
  add column if not exists source_item_id_normalized text
  generated always as (coalesce(source_item_id, '')) stored;

alter table public.hadith_lessons
  add column if not exists source_item_id_normalized text
  generated always as (coalesce(source_item_id, '')) stored;

drop index if exists public.hadith_explanations_logical_key_idx;
drop index if exists public.hadith_lessons_logical_key_idx;
drop index if exists public.hadith_explanations_active_key_idx;
drop index if exists public.hadith_lessons_active_key_idx;

alter table public.hadith_explanations
  add constraint hadith_explanations_logical_key
  unique (hadith_id, language_code, source_name, source_item_id_normalized, corpus_version);

alter table public.hadith_lessons
  add constraint hadith_lessons_logical_key
  unique (hadith_id, language_code, source_name, source_item_id_normalized, corpus_version, lesson_order);

create unique index hadith_explanations_active_key_idx
  on public.hadith_explanations
  (hadith_id, language_code, source_name, source_item_id_normalized)
  where is_active = true;

create unique index hadith_lessons_active_key_idx
  on public.hadith_lessons
  (hadith_id, language_code, source_name, source_item_id_normalized, lesson_order)
  where is_active = true;
