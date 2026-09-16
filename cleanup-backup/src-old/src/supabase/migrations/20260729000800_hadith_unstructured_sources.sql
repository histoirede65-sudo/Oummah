-- HadeethEnc documentary-source support.
-- Schema and RPC only: this migration inserts no religious corpus data.
--
-- IMPORTANT:
-- - public.hadiths remains the single Hadith identity table.
-- - public.import_hadith_batch is not modified.
-- - HadeethEnc-specific French/Arabic documentary fields are staged in
--   hadith_documentary_metadata while lifecycle_status = 'Importée'.
-- - No book, chapter or numbering is fabricated.

begin;

-- ---------------------------------------------------------------------------
-- 1. One Hadith identity, two structural modes
-- ---------------------------------------------------------------------------

alter table public.hadiths
  add column if not exists document_structure_type text
  not null
  default 'structured_collection';

alter table public.hadiths alter column collection_id drop not null;
alter table public.hadiths alter column book_id drop not null;
alter table public.hadiths alter column global_number drop not null;
alter table public.hadiths alter column hadith_number_in_book drop not null;

alter table public.hadiths
  drop constraint if exists hadiths_global_number_positive;
alter table public.hadiths
  drop constraint if exists hadiths_number_in_book_positive;
alter table public.hadiths
  drop constraint if exists hadiths_collection_global_number_key;
alter table public.hadiths
  drop constraint if exists hadiths_book_number_in_book_key;

alter table public.hadiths
  drop constraint if exists hadiths_document_structure_type_allowed;
alter table public.hadiths
  add constraint hadiths_document_structure_type_allowed
  check (
    document_structure_type in (
      'structured_collection',
      'documentary_source'
    )
  );

alter table public.hadiths
  drop constraint if exists hadiths_structure_requirements;
alter table public.hadiths
  add constraint hadiths_structure_requirements
  check (
    (
      document_structure_type = 'structured_collection'
      and collection_id is not null
      and book_id is not null
      and global_number is not null
      and global_number > 0
      and hadith_number_in_book is not null
      and hadith_number_in_book > 0
    )
    or
    (
      document_structure_type = 'documentary_source'
      and collection_id is null
      and book_id is null
      and chapter_id is null
      and global_number is null
      and hadith_number_in_book is null
      and source_id is not null
      and source_version_id is not null
      and nullif(btrim(source_hadith_id), '') is not null
    )
  );

create unique index if not exists hadiths_structured_collection_global_key
  on public.hadiths(collection_id, global_number)
  where document_structure_type = 'structured_collection';

create unique index if not exists hadiths_structured_book_number_key
  on public.hadiths(book_id, hadith_number_in_book)
  where document_structure_type = 'structured_collection';

create index if not exists hadiths_document_structure_type_idx
  on public.hadiths(
    document_structure_type,
    lifecycle_status,
    source_version_id
  );

-- ---------------------------------------------------------------------------
-- 2. HadeethEnc documentary metadata
-- ---------------------------------------------------------------------------

create table if not exists public.hadith_documentary_metadata (
  hadith_id uuid primary key
    references public.hadiths(id)
    on delete cascade,

  source_version_id uuid not null
    references public.hadith_source_versions(id)
    on delete restrict,

  title text,
  translation_french text,
  introduction_french text,
  introduction_arabic text,
  attribution_french text,
  attribution_arabic text,
  grade_french text,
  grade_arabic text,
  explanation_french text,
  explanation_arabic text,

  hints_french jsonb,
  hints_arabic jsonb,
  words_meanings_arabic jsonb,

  retrieved_at timestamptz not null,
  document_hash text not null,
  source_reference text,

  lifecycle_status text not null default 'Importée',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_documentary_metadata_hash_format
    check (document_hash ~ '^[0-9a-f]{64}$'),

  constraint hadith_documentary_metadata_json_shapes
    check (
      (hints_french is null or jsonb_typeof(hints_french) = 'array')
      and (hints_arabic is null or jsonb_typeof(hints_arabic) = 'array')
      and (
        words_meanings_arabic is null
        or jsonb_typeof(words_meanings_arabic) = 'array'
      )
    ),

  constraint hadith_documentary_metadata_status
    check (
      lifecycle_status in (
        'Importée',
        'Validée',
        'Juridiquement validée',
        'Disponible en développement',
        'Disponible en bêta',
        'Disponible en production',
        'Suspendue',
        'Retirée',
        'Archivée',
        'Rejetée'
      )
    ),

  constraint hadith_documentary_metadata_identity
    unique (hadith_id, source_version_id)
);

-- ---------------------------------------------------------------------------
-- 3. Source categories, distinct from OUMMAH themes
-- ---------------------------------------------------------------------------

create table if not exists public.hadith_source_categories (
  id uuid primary key default gen_random_uuid(),

  source_id uuid not null
    references public.hadith_sources(id)
    on delete restrict,

  source_version_id uuid not null
    references public.hadith_source_versions(id)
    on delete restrict,

  source_category_id text not null,
  source_category_label text not null,
  language_code text not null,
  parent_source_category_id text,
  source_hadeeths_count integer,
  retrieved_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint hadith_source_categories_identity
    unique (
      source_version_id,
      source_category_id,
      language_code
    ),

  constraint hadith_source_categories_id_not_blank
    check (length(btrim(source_category_id)) > 0),

  constraint hadith_source_categories_label_not_blank
    check (length(btrim(source_category_label)) > 0),

  constraint hadith_source_categories_language_not_blank
    check (length(btrim(language_code)) > 0),

  constraint hadith_source_categories_count_non_negative
    check (
      source_hadeeths_count is null
      or source_hadeeths_count >= 0
    )
);

create table if not exists public.hadith_source_category_assignments (
  hadith_id uuid not null
    references public.hadiths(id)
    on delete cascade,

  source_category_id uuid not null
    references public.hadith_source_categories(id)
    on delete restrict,

  source_version_id uuid not null
    references public.hadith_source_versions(id)
    on delete restrict,

  association_origin text not null default 'source',
  validation_status text not null default 'unvalidated',
  associated_at timestamptz not null default now(),

  primary key (hadith_id, source_category_id),

  constraint hadith_source_category_origin
    check (association_origin = 'source'),

  constraint hadith_source_category_status
    check (
      validation_status in (
        'unvalidated',
        'validated',
        'rejected'
      )
    )
);

create index if not exists hadith_documentary_metadata_source_idx
  on public.hadith_documentary_metadata(
    source_version_id,
    lifecycle_status
  );

create index if not exists hadith_source_categories_source_idx
  on public.hadith_source_categories(
    source_version_id,
    source_category_id
  );

create index if not exists hadith_source_category_assignments_hadith_idx
  on public.hadith_source_category_assignments(hadith_id);

create index if not exists hadith_source_category_assignments_category_idx
  on public.hadith_source_category_assignments(
    source_category_id,
    hadith_id
  );

create index if not exists hadith_source_category_assignments_status_idx
  on public.hadith_source_category_assignments(validation_status);

-- ---------------------------------------------------------------------------
-- 4. RLS and privileges
-- ---------------------------------------------------------------------------

alter table public.hadith_documentary_metadata enable row level security;
alter table public.hadith_source_categories enable row level security;
alter table public.hadith_source_category_assignments enable row level security;

revoke all
  on public.hadith_documentary_metadata,
     public.hadith_source_categories,
     public.hadith_source_category_assignments
  from public, anon, authenticated;

grant select
  on public.hadith_documentary_metadata,
     public.hadith_source_categories,
     public.hadith_source_category_assignments
  to anon, authenticated;

grant all
  on public.hadith_documentary_metadata,
     public.hadith_source_categories,
     public.hadith_source_category_assignments
  to service_role;

drop policy if exists hadith_documentary_metadata_public_read
  on public.hadith_documentary_metadata;
create policy hadith_documentary_metadata_public_read
  on public.hadith_documentary_metadata
  for select
  to anon, authenticated
  using (
    lifecycle_status = 'Disponible en production'
    and exists (
      select 1
      from public.hadiths h
      join public.hadith_source_versions v
        on v.id = h.source_version_id
      where h.id = hadith_id
        and h.document_structure_type = 'documentary_source'
        and h.lifecycle_status = 'Disponible en production'
        and v.status = 'Disponible en production'
    )
  );

drop policy if exists hadith_source_categories_public_read
  on public.hadith_source_categories;
create policy hadith_source_categories_public_read
  on public.hadith_source_categories
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.hadith_source_versions v
      where v.id = source_version_id
        and v.status = 'Disponible en production'
    )
  );

drop policy if exists hadith_source_category_assignments_public_read
  on public.hadith_source_category_assignments;
create policy hadith_source_category_assignments_public_read
  on public.hadith_source_category_assignments
  for select
  to anon, authenticated
  using (
    validation_status = 'validated'
    and exists (
      select 1
      from public.hadiths h
      join public.hadith_source_versions v
        on v.id = h.source_version_id
      where h.id = hadith_id
        and h.lifecycle_status = 'Disponible en production'
        and v.status = 'Disponible en production'
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Transactional HadeethEnc import RPC
-- ---------------------------------------------------------------------------

create or replace function public.import_hadeethenc_batch(
  p_payload jsonb,
  p_lifecycle_author text,
  p_lifecycle_justification text,
  p_lifecycle_version text,
  p_lifecycle_evidence text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_source jsonb;
  v_record jsonb;
  v_category jsonb;
  v_theme jsonb;

  v_source_id uuid;
  v_source_version_id uuid;
  v_hadith_id uuid;
  v_category_id uuid;
  v_theme_id uuid;

  v_source_name text;
  v_language_code text;
  v_corpus_version text;
  v_source_hadith_id text;
  v_document_hash text;
  v_source_category_id text;
  v_source_category_label text;

  v_source_matches integer;
  v_records_processed integer := 0;
  v_records_created integer := 0;
  v_records_existing integer := 0;
  v_categories_created integer := 0;
  v_category_assignments_created integer := 0;
  v_theme_assignments_created integer := 0;

  v_existing_hadith public.hadiths%rowtype;
  v_existing_category public.hadith_source_categories%rowtype;
begin
  if p_payload is null
     or jsonb_typeof(p_payload) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'INVALID_PAYLOAD';
  end if;

  if nullif(btrim(p_lifecycle_author), '') is null
     or nullif(btrim(p_lifecycle_justification), '') is null
     or nullif(btrim(p_lifecycle_version), '') is null
     or nullif(btrim(p_lifecycle_evidence), '') is null then
    raise exception using
      errcode = '22023',
      message = 'INVALID_CONTEXT';
  end if;

  if jsonb_typeof(p_payload -> 'records') <> 'array'
     or jsonb_array_length(p_payload -> 'records') not between 1 and 50 then
    raise exception using
      errcode = '22023',
      message = 'INVALID_BATCH_SIZE';
  end if;

  if p_payload ?| array[
    'status',
    'lifecycleStatus',
    'lifecycle_status',
    'publicationStatus',
    'isPublished'
  ] then
    raise exception using
      errcode = '22023',
      message = 'FORBIDDEN_STATUS_FIELD';
  end if;

  v_source := p_payload -> 'source';

  if jsonb_typeof(v_source) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'INVALID_SOURCE';
  end if;

  v_source_name := nullif(btrim(v_source ->> 'name'), '');
  v_language_code := coalesce(
    nullif(btrim(v_source ->> 'language'), ''),
    'fr'
  );
  v_corpus_version := coalesce(
    nullif(btrim(v_source ->> 'corpusVersion'), ''),
    nullif(btrim(p_lifecycle_version), '')
  );

  if v_source_name is null
     or v_corpus_version is null
     or nullif(
       btrim(coalesce(v_source ->> 'officialUrl', v_source ->> 'url')),
       ''
     ) is null
     or nullif(btrim(v_source ->> 'attribution'), '') is null then
    raise exception using
      errcode = '22023',
      message = 'INCOMPLETE_SOURCE';
  end if;

  select count(*)
  into v_source_matches
  from public.hadith_sources
  where name = v_source_name;

  if v_source_matches > 1 then
    raise exception using
      errcode = 'P0001',
      message = 'AMBIGUOUS_SOURCE';
  elsif v_source_matches = 1 then
    select id
    into v_source_id
    from public.hadith_sources
    where name = v_source_name;
  elsif v_source_matches = 0 then
    insert into public.hadith_sources(
      name,
      organization,
      official_url,
      status
    )
    values (
      v_source_name,
      nullif(btrim(v_source ->> 'organization'), ''),
      coalesce(v_source ->> 'officialUrl', v_source ->> 'url'),
      'En validation'
    )
    returning id into v_source_id;
  end if;

  select id
  into v_source_version_id
  from public.hadith_source_versions
  where source_id = v_source_id
    and version = v_corpus_version
    and language_code = v_language_code;

  if v_source_version_id is null then
    insert into public.hadith_source_versions(
      source_id,
      version,
      language_code,
      license,
      attribution,
      terms_url,
      source_url,
      imported_at,
      status
    )
    values (
      v_source_id,
      v_corpus_version,
      v_language_code,
      nullif(btrim(v_source ->> 'license'), ''),
      btrim(v_source ->> 'attribution'),
      nullif(btrim(v_source ->> 'termsUrl'), ''),
      coalesce(v_source ->> 'officialUrl', v_source ->> 'url'),
      now(),
      'Importée'
    )
    returning id into v_source_version_id;
  end if;

  for v_record in
    select value
    from jsonb_array_elements(p_payload -> 'records')
  loop
    if jsonb_typeof(v_record) <> 'object' then
      raise exception using
        errcode = '22023',
        message = 'INVALID_DOCUMENTARY_RECORD';
    end if;

    if v_record ?| array[
      'status',
      'lifecycleStatus',
      'lifecycle_status',
      'publicationStatus',
      'isPublished'
    ] then
      raise exception using
        errcode = '22023',
        message = 'FORBIDDEN_STATUS_FIELD';
    end if;

    v_source_hadith_id := nullif(
      btrim(v_record ->> 'sourceHadithId'),
      ''
    );
    v_document_hash := lower(
      nullif(btrim(v_record ->> 'documentHash'), '')
    );

    if v_source_hadith_id is null
       or nullif(btrim(v_record ->> 'hadeethAr'), '') is null
       or v_document_hash is null
       or v_document_hash !~ '^[0-9a-f]{64}$' then
      raise exception using
        errcode = '22023',
        message = 'INVALID_DOCUMENTARY_RECORD';
    end if;

    if v_record ? 'categories'
       and jsonb_typeof(v_record -> 'categories') <> 'array' then
      raise exception using
        errcode = '22023',
        message = 'INVALID_CATEGORIES';
    end if;

    if v_record ? 'themes'
       and jsonb_typeof(v_record -> 'themes') <> 'array' then
      raise exception using
        errcode = '22023',
        message = 'INVALID_THEMES';
    end if;

    select *
    into v_existing_hadith
    from public.hadiths
    where source_version_id = v_source_version_id
      and source_hadith_id = v_source_hadith_id;

    if v_existing_hadith.id is not null then
      if v_existing_hadith.document_structure_type <> 'documentary_source'
         or not exists (
           select 1
           from public.hadith_documentary_metadata m
           where m.hadith_id = v_existing_hadith.id
             and m.source_version_id = v_source_version_id
             and m.document_hash = v_document_hash
         ) then
        raise exception using
          errcode = 'P0001',
          message = 'DOCUMENTARY_CONFLICT';
      end if;

      v_hadith_id := v_existing_hadith.id;
      v_records_existing := v_records_existing + 1;
    else
      insert into public.hadiths(
        document_structure_type,
        collection_id,
        book_id,
        chapter_id,
        global_number,
        hadith_number_in_book,
        arabic_text,
        narrator,
        authenticity_grade,
        source_reference,
        source_name,
        source_url,
        license,
        corpus_version,
        source_id,
        source_version_id,
        source_hadith_id,
        lifecycle_status
      )
      values (
        'documentary_source',
        null,
        null,
        null,
        null,
        null,
        btrim(v_record ->> 'hadeethAr'),
        nullif(btrim(v_record ->> 'attribution'), ''),
        nullif(btrim(v_record ->> 'grade'), ''),
        nullif(btrim(v_record ->> 'sourceReference'), ''),
        v_source_name,
        coalesce(
          nullif(btrim(v_record ->> 'sourceUrl'), ''),
          v_source ->> 'officialUrl',
          v_source ->> 'url'
        ),
        nullif(btrim(v_source ->> 'license'), ''),
        v_corpus_version,
        v_source_id,
        v_source_version_id,
        v_source_hadith_id,
        'Importée'
      )
      returning id into v_hadith_id;

      insert into public.hadith_documentary_metadata(
        hadith_id,
        source_version_id,
        title,
        translation_french,
        introduction_french,
        introduction_arabic,
        attribution_french,
        attribution_arabic,
        grade_french,
        grade_arabic,
        explanation_french,
        explanation_arabic,
        hints_french,
        hints_arabic,
        words_meanings_arabic,
        retrieved_at,
        document_hash,
        source_reference,
        lifecycle_status
      )
      values (
        v_hadith_id,
        v_source_version_id,
        nullif(btrim(v_record ->> 'title'), ''),
        nullif(btrim(v_record ->> 'hadeeth'), ''),
        nullif(btrim(v_record ->> 'hadeethIntro'), ''),
        nullif(btrim(v_record ->> 'hadeethIntroAr'), ''),
        nullif(btrim(v_record ->> 'attribution'), ''),
        nullif(btrim(v_record ->> 'attributionAr'), ''),
        nullif(btrim(v_record ->> 'grade'), ''),
        nullif(btrim(v_record ->> 'gradeAr'), ''),
        nullif(btrim(v_record ->> 'explanation'), ''),
        nullif(btrim(v_record ->> 'explanationAr'), ''),
        case
          when v_record ? 'hints'
           and jsonb_typeof(v_record -> 'hints') = 'array'
          then v_record -> 'hints'
          else null
        end,
        case
          when v_record ? 'hintsAr'
           and jsonb_typeof(v_record -> 'hintsAr') = 'array'
          then v_record -> 'hintsAr'
          else null
        end,
        case
          when v_record ? 'wordsMeaningsAr'
           and jsonb_typeof(v_record -> 'wordsMeaningsAr') = 'array'
          then v_record -> 'wordsMeaningsAr'
          else null
        end,
        coalesce(
          nullif(btrim(v_record ->> 'retrievedAt'), '')::timestamptz,
          now()
        ),
        v_document_hash,
        nullif(btrim(v_record ->> 'sourceReference'), ''),
        'Importée'
      );

      if nullif(btrim(v_record ->> 'hadeeth'), '') is not null then
        insert into public.hadith_translations(
          hadith_id,
          language_code,
          translation_text,
          translator,
          source_name,
          source_url,
          license,
          corpus_version,
          source_id,
          source_version_id,
          lifecycle_status
        )
        values (
          v_hadith_id,
          v_language_code,
          btrim(v_record ->> 'hadeeth'),
          null,
          v_source_name,
          coalesce(v_record ->> 'sourceUrl', v_source ->> 'officialUrl', v_source ->> 'url'),
          nullif(btrim(v_source ->> 'license'), ''),
          v_corpus_version,
          v_source_id,
          v_source_version_id,
          'ImportÃ©e'
        );
      end if;

      v_records_created := v_records_created + 1;
    end if;

    for v_category in
      select value
      from jsonb_array_elements(
        coalesce(v_record -> 'categories', '[]'::jsonb)
      )
    loop
      if jsonb_typeof(v_category) <> 'object' then
        raise exception using
          errcode = '22023',
          message = 'INVALID_SOURCE_CATEGORY';
      end if;

      v_source_category_id := nullif(
        btrim(v_category ->> 'sourceCategoryId'),
        ''
      );
      v_source_category_label := nullif(
        btrim(v_category ->> 'sourceCategoryLabel'),
        ''
      );

      if v_source_category_id is null
         or v_source_category_label is null then
        raise exception using
          errcode = '22023',
          message = 'INVALID_SOURCE_CATEGORY';
      end if;

      select *
      into v_existing_category
      from public.hadith_source_categories
      where source_version_id = v_source_version_id
        and source_category_id = v_source_category_id
        and language_code = coalesce(
          nullif(btrim(v_category ->> 'language'), ''),
          v_language_code
        );

      if v_existing_category.id is null then
        insert into public.hadith_source_categories(
          source_id,
          source_version_id,
          source_category_id,
          source_category_label,
          language_code,
          parent_source_category_id,
          source_hadeeths_count,
          retrieved_at
        )
        values (
          v_source_id,
          v_source_version_id,
          v_source_category_id,
          v_source_category_label,
          coalesce(
            nullif(btrim(v_category ->> 'language'), ''),
            v_language_code
          ),
          nullif(
            btrim(v_category ->> 'parentSourceCategoryId'),
            ''
          ),
          case
            when nullif(
              btrim(v_category ->> 'sourceHadeethsCount'),
              ''
            ) is null then null
            else (v_category ->> 'sourceHadeethsCount')::integer
          end,
          coalesce(
            nullif(
              btrim(v_category ->> 'retrievedAt'),
              ''
            )::timestamptz,
            now()
          )
        )
        returning id into v_category_id;

        v_categories_created := v_categories_created + 1;
      else
        if v_existing_category.source_id <> v_source_id
           or v_existing_category.source_category_label
              <> v_source_category_label then
          raise exception using
            errcode = 'P0001',
            message = 'SOURCE_CATEGORY_CONFLICT';
        end if;

        v_category_id := v_existing_category.id;
      end if;

      if not exists (
        select 1
        from public.hadith_source_category_assignments a
        where a.hadith_id = v_hadith_id
          and a.source_category_id = v_category_id
      ) then
        insert into public.hadith_source_category_assignments(
          hadith_id,
          source_category_id,
          source_version_id,
          association_origin,
          validation_status
        )
        values (
          v_hadith_id,
          v_category_id,
          v_source_version_id,
          'source',
          'unvalidated'
        );

        v_category_assignments_created :=
          v_category_assignments_created + 1;
      end if;
    end loop;

    for v_theme in
      select value
      from jsonb_array_elements(
        coalesce(v_record -> 'themes', '[]'::jsonb)
      )
    loop
      if jsonb_typeof(v_theme) <> 'object' then
        raise exception using
          errcode = '22023',
          message = 'INVALID_THEME_MAPPING';
      end if;

      if v_theme ->> 'status' in ('exact', 'certain') then
        if nullif(btrim(v_theme ->> 'stableKey'), '') is null then
          raise exception using
            errcode = '22023',
            message = 'INVALID_THEME_MAPPING';
        end if;

        select id
        into v_theme_id
        from public.hadith_themes
        where stable_key = v_theme ->> 'stableKey';

        if v_theme_id is null then
          raise exception using
            errcode = 'P0001',
            message = 'UNKNOWN_THEME';
        end if;

        if not exists (
          select 1
          from public.hadith_theme_assignments a
          where a.hadith_id = v_hadith_id
            and a.theme_id = v_theme_id
            and a.association_origin = 'automatic_unvalidated'
            and a.source_version_id = v_source_version_id
            and coalesce(a.source_category_id, '')
              = coalesce(v_theme ->> 'sourceCategoryId', '')
        ) then
          insert into public.hadith_theme_assignments(
            hadith_id,
            theme_id,
            association_origin,
            source_category_id,
            source_category_label,
            source_version_id,
            validation_status,
            version
          )
          values (
            v_hadith_id,
            v_theme_id,
            'automatic_unvalidated',
            nullif(btrim(v_theme ->> 'sourceCategoryId'), ''),
            nullif(btrim(v_theme ->> 'sourceCategoryLabel'), ''),
            v_source_version_id,
            'unvalidated',
            v_corpus_version
          );

          v_theme_assignments_created :=
            v_theme_assignments_created + 1;
        end if;
      elsif v_theme ->> 'status' not in ('ambiguous', 'unmapped') then
        raise exception using
          errcode = '22023',
          message = 'INVALID_THEME_MAPPING_STATUS';
      end if;
    end loop;

    v_records_processed := v_records_processed + 1;
  end loop;

  return jsonb_build_object(
    'status', 'success',
    'rpc_version', 'hadith-hadeethenc-v2',
    'records_created', v_records_created,
    'records_existing', v_records_existing,
    'records_processed', v_records_processed,
    'categories_created', v_categories_created,
    'category_assignments_created',
      v_category_assignments_created,
    'theme_assignments_created',
      v_theme_assignments_created,
    'source_version_id', v_source_version_id,
    'lifecycle_status', 'Importée',
    'warnings', '[]'::jsonb
  );
end;
$$;

revoke all
  on function public.import_hadeethenc_batch(
    jsonb,
    text,
    text,
    text,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.import_hadeethenc_batch(
    jsonb,
    text,
    text,
    text,
    text
  )
  to service_role;

commit;
