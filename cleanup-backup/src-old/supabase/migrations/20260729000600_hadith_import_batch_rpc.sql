-- OUMMAH Hadith import: phase 1 validation foundations only.
-- No table writes and no public import RPC are defined in this phase.

create or replace function public.hadith_import_raise_error(
  p_code text,
  p_resource text,
  p_identifier text default null,
  p_index integer default null,
  p_field text default null,
  p_message text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_error jsonb;
begin
  v_error := jsonb_build_object(
    'code', p_code,
    'resource', p_resource,
    'identifier', p_identifier,
    'index', p_index,
    'field', p_field,
    'message', p_message
  );
  raise exception using message = 'HADITH_IMPORT_ERROR:' || v_error::text,
    errcode = 'P0001';
end;
$$;

create or replace function public.hadith_import_validate_context(
  p_lifecycle_author text,
  p_lifecycle_justification text,
  p_lifecycle_version text,
  p_lifecycle_evidence text,
  p_source_hadith_id_justification text,
  p_source_hadith_id_evidence text
)
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_value text;
begin
  v_value := p_lifecycle_author; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.lifecycle_author', null, 'hadith.lifecycle_author', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.lifecycle_author', btrim(v_value), true);
  v_value := p_lifecycle_justification; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.lifecycle_justification', null, 'hadith.lifecycle_justification', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.lifecycle_justification', btrim(v_value), true);
  v_value := p_lifecycle_version; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.lifecycle_version', null, 'hadith.lifecycle_version', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.lifecycle_version', btrim(v_value), true);
  v_value := p_lifecycle_evidence; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.lifecycle_evidence', null, 'hadith.lifecycle_evidence', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.lifecycle_evidence', btrim(v_value), true);
  v_value := p_source_hadith_id_justification; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.source_hadith_id_justification', null, 'hadith.source_hadith_id_justification', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.source_hadith_id_justification', btrim(v_value), true);
  v_value := p_source_hadith_id_evidence; if v_value is null or nullif(btrim(v_value), '') is null then perform public.hadith_import_raise_error('INVALID_CONTEXT', 'context', 'hadith.source_hadith_id_evidence', null, 'hadith.source_hadith_id_evidence', 'Context value is required and must not be blank.'); end if; perform set_config('hadith.source_hadith_id_evidence', btrim(v_value), true);
end;
$$;

create or replace function public.hadith_import_validate_json_text(
  p_object jsonb,
  p_field text,
  p_resource text,
  p_index integer,
  p_required boolean default true
)
returns text
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_value text;
begin
  if not (p_object ? p_field) or p_object -> p_field = 'null'::jsonb then
    if p_required then perform public.hadith_import_raise_error('INVALID_STRING_FIELD', p_resource, null, p_index, p_field, 'Required string field is missing.'); end if;
    return null;
  end if;
  if jsonb_typeof(p_object -> p_field) <> 'string' then
    perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', p_resource, null, p_index, p_field, 'Field must be a JSON string.');
  end if;
  v_value := btrim(p_object ->> p_field);
  if p_required and v_value = '' then
    perform public.hadith_import_raise_error('INVALID_STRING_FIELD', p_resource, null, p_index, p_field, 'String field must not be blank.');
  end if;
  return nullif(v_value, '');
end;
$$;

create or replace function public.hadith_import_validate_json_integer(
  p_object jsonb,
  p_field text,
  p_resource text,
  p_index integer,
  p_positive boolean default true
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_raw text;
  v_value integer;
begin
  if not (p_object ? p_field) or p_object -> p_field = 'null'::jsonb then
    perform public.hadith_import_raise_error('INVALID_INTEGER_FIELD', p_resource, null, p_index, p_field, 'Required integer field is missing.');
  end if;
  if jsonb_typeof(p_object -> p_field) <> 'number' then
    perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', p_resource, null, p_index, p_field, 'Field must be a JSON number.');
  end if;
  v_raw := p_object ->> p_field;
  if v_raw !~ '^-?[0-9]+$' then
    perform public.hadith_import_raise_error('INVALID_INTEGER_FIELD', p_resource, null, p_index, p_field, 'Field must be an integer, not a decimal.');
  end if;
  v_value := v_raw::integer;
  if p_positive and v_value <= 0 then
    perform public.hadith_import_raise_error('INVALID_INTEGER_FIELD', p_resource, null, p_index, p_field, 'Field must be positive.');
  end if;
  return v_value;
end;
$$;

create or replace function public.hadith_import_reject_status_fields(p_value jsonb, p_path text default '$')
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_pair record;
  v_key text;
begin
  if jsonb_typeof(p_value) = 'object' then
    for v_pair in select key, value from jsonb_each(p_value) loop
      v_key := lower(v_pair.key);
      if v_key = 'verificationstatus' and (p_path like '%translationFrench%' or p_path like '%explanationFrench%' or p_path like '%lessonsFrench%') then
        if jsonb_typeof(v_pair.value) <> 'string' or v_pair.value #>> '{}' not in ('unverified', 'partially_verified', 'verified') then
          perform public.hadith_import_raise_error('INVALID_STRING_FIELD', p_path, null, null, v_pair.key, 'verificationStatus must be a valid documentary verification value.');
        end if;
      elsif v_key in ('status', 'lifecycle_status', 'publication_status', 'verification_status', 'is_published', 'published_at', 'validated_at', 'imported_at', 'lifecyclestatus') then
        perform public.hadith_import_raise_error('FORBIDDEN_STATUS_FIELD', p_path, null, null, v_pair.key, 'Lifecycle or publication fields are controlled by the server.');
      end if;
      perform public.hadith_import_reject_status_fields(v_pair.value, p_path || '.' || v_pair.key);
    end loop;
  elsif jsonb_typeof(p_value) = 'array' then
    for v_pair in select value from jsonb_array_elements(p_value) loop
      perform public.hadith_import_reject_status_fields(v_pair.value, p_path || '[]');
    end loop;
  end if;
end;
$$;

create or replace function public.hadith_import_validate_payload(p_payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_rows jsonb;
  v_row jsonb;
  v_book jsonb;
  v_chapter jsonb;
  v_source_id text;
  v_index integer := 0;
  v_first_index integer;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'payload', null, null, null, 'Payload must be a JSON object.');
  end if;
  perform public.hadith_import_reject_status_fields(p_payload);
  if not (p_payload ? 'source') or jsonb_typeof(p_payload -> 'source') <> 'object' then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'payload', null, null, 'source', 'source must be an object.');
  end if;
  if not (p_payload ? 'collection') or jsonb_typeof(p_payload -> 'collection') <> 'object' then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'payload', null, null, 'collection', 'collection must be an object.');
  end if;
  if not (p_payload ? 'hadiths') or jsonb_typeof(p_payload -> 'hadiths') <> 'array' then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'payload', null, null, 'hadiths', 'hadiths must be an array.');
  end if;
  v_rows := p_payload -> 'hadiths';
  if jsonb_array_length(v_rows) not between 1 and 50 then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'payload', null, null, 'hadiths', 'hadiths must contain between 1 and 50 elements.');
  end if;
  for v_row in select value from jsonb_array_elements(v_rows) loop
    if jsonb_typeof(v_row) <> 'object' then
      perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'hadith', null, v_index, null, 'Hadith entry must be an object.');
    end if;
    perform public.hadith_import_reject_status_fields(v_row, '$.hadiths[' || v_index || ']');
    if jsonb_typeof(v_row -> 'lessonsFrench') = 'array' and exists (
      select 1
      from jsonb_array_elements(v_row -> 'lessonsFrench') lesson
      group by lesson ->> 'sourceName', coalesce(lesson ->> 'sourceItemId', ''), coalesce(lesson ->> 'corpusVersion', ''), lesson ->> 'order'
      having count(*) > 1
    ) then
      perform public.hadith_import_raise_error('DUPLICATE_CHILD_RESOURCE', 'lesson', null, v_index, 'lessonsFrench', 'Duplicate lesson identity in the same hadith payload.');
    end if;
    v_source_id := public.hadith_import_validate_json_text(v_row, 'sourceHadithId', 'hadith', v_index, true);
    perform public.hadith_import_validate_json_integer(v_row, 'globalNumber', 'hadith', v_index, true);
    perform public.hadith_import_validate_json_integer(v_row, 'hadithNumberInBook', 'hadith', v_index, true);
    perform public.hadith_import_validate_json_text(v_row, 'arabicText', 'hadith', v_index, true);
    if jsonb_typeof(v_row -> 'book') <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'hadith', null, v_index, 'book', 'book must be an object.'); end if;
    v_book := v_row -> 'book';
    perform public.hadith_import_validate_json_integer(v_book, 'number', 'book', v_index, true);
    perform public.hadith_import_validate_json_text(v_book, 'sourceId', 'book', v_index, true);
    perform public.hadith_import_validate_json_text(v_book, 'titleFrench', 'book', v_index, true);
    if v_row ? 'chapter' and v_row -> 'chapter' is not null then
      if jsonb_typeof(v_row -> 'chapter') <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'hadith', null, v_index, 'chapter', 'chapter must be an object.'); end if;
      v_chapter := v_row -> 'chapter';
      perform public.hadith_import_validate_json_integer(v_chapter, 'number', 'chapter', v_index, true);
      perform public.hadith_import_validate_json_text(v_chapter, 'sourceId', 'chapter', v_index, true);
      perform public.hadith_import_validate_json_text(v_chapter, 'titleFrench', 'chapter', v_index, true);
    end if;
    select min(i) into v_first_index from generate_series(0, v_index - 1) i where btrim(v_rows -> i ->> 'sourceHadithId') = v_source_id;
    if v_first_index is not null then
      perform public.hadith_import_raise_error('DUPLICATE_SOURCE_HADITH_ID', 'hadith', v_source_id, v_index, 'sourceHadithId', 'sourceHadithId already appears at index ' || v_first_index || '.');
    end if;
    v_index := v_index + 1;
  end loop;
end;
$$;

-- UUIDs below are internal OUMMAH identifiers. They are never treated as
-- identifiers supplied by an external publisher.
create or replace function public.hadith_import_validate_uuid_text(
  p_value text,
  p_resource text,
  p_index integer,
  p_field text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  if p_value is null or nullif(btrim(p_value), '') is null or btrim(p_value) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    perform public.hadith_import_raise_error('INVALID_UUID_FIELD', p_resource, null, p_index, p_field, 'Field must contain a valid internal UUID.');
  end if;
  return btrim(p_value)::uuid;
end;
$$;

-- Resolves public.hadith_sources. The optional sourceId is an internal UUID;
-- without it, name plus supplied metadata must identify zero or one candidate.
create or replace function public.hadith_import_resolve_source(
  p_source jsonb,
  p_index integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_id uuid;
  v_candidate public.hadith_sources%rowtype;
  v_count integer;
  v_name text;
  v_organization text;
  v_url text;
  v_description text;
begin
  if jsonb_typeof(p_source) <> 'object' then
    perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'source', null, p_index, 'source', 'Source must be an object.');
  end if;
  v_name := public.hadith_import_validate_json_text(p_source, 'name', 'source', p_index, true);
  v_organization := public.hadith_import_validate_json_text(p_source, 'organization', 'source', p_index, false);
  v_url := coalesce(public.hadith_import_validate_json_text(p_source, 'officialUrl', 'source', p_index, false), public.hadith_import_validate_json_text(p_source, 'url', 'source', p_index, false));
  v_description := public.hadith_import_validate_json_text(p_source, 'description', 'source', p_index, false);
  if not (p_source ? 'sourceId') then
    perform pg_advisory_xact_lock(hashtextextended(coalesce(v_name, '') || chr(31) || coalesce(v_organization, '') || chr(31) || coalesce(v_url, ''), 0));
  end if;

  if p_source ? 'sourceId' then
    if jsonb_typeof(p_source -> 'sourceId') <> 'string' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'source', null, p_index, 'sourceId', 'sourceId must be a JSON string.'); end if;
    v_id := public.hadith_import_validate_uuid_text(p_source ->> 'sourceId', 'source', p_index, 'sourceId');
    select * into v_candidate from public.hadith_sources where id = v_id;
    if not found then perform public.hadith_import_raise_error('SOURCE_NOT_FOUND', 'source', v_id::text, p_index, 'sourceId', 'Internal source UUID was not found.'); end if;
  else
    select count(*) into v_count from public.hadith_sources s where s.name = v_name and (v_organization is null or s.organization = v_organization) and (v_url is null or s.official_url = v_url);
    if v_count > 1 then perform public.hadith_import_raise_error('AMBIGUOUS_SOURCE', 'source', v_name, p_index, 'name', 'More than one source matches the supplied documentary identity.'); end if;
    if v_count = 1 then select * into v_candidate from public.hadith_sources s where s.name = v_name and (v_organization is null or s.organization = v_organization) and (v_url is null or s.official_url = v_url) limit 1; end if;
    if v_count = 0 then
      insert into public.hadith_sources(name, organization, official_url, description)
      values (v_name, v_organization, v_url, v_description)
      returning * into v_candidate;
      return jsonb_build_object('id', v_candidate.id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
    end if;
  end if;
  if p_source ? 'name' and v_candidate.name is distinct from v_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source', v_candidate.id::text, p_index, 'name', 'Existing source name differs.'); end if;
  if p_source ? 'organization' and v_candidate.organization is distinct from v_organization then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source', v_candidate.id::text, p_index, 'organization', 'Existing source organization differs.'); end if;
  if (p_source ? 'officialUrl' or p_source ? 'url') and v_candidate.official_url is distinct from v_url then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source', v_candidate.id::text, p_index, 'official_url', 'Existing source URL differs.'); end if;
  if p_source ? 'description' and v_candidate.description is distinct from v_description then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source', v_candidate.id::text, p_index, 'description', 'Existing source description differs.'); end if;
  return jsonb_build_object('id', v_candidate.id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

-- Resolves a source version by its internal UUID when supplied, otherwise by
-- the schema identity source_id + version + language_code.
create or replace function public.hadith_import_resolve_source_version(
  p_source jsonb,
  p_source_id uuid,
  p_index integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_version public.hadith_source_versions%rowtype;
  v_id uuid;
  v_version_name text;
  v_language text;
  v_edition text;
  v_license text;
  v_attribution text;
  v_terms_url text;
  v_source_url text;
  v_count integer;
begin
  v_version_name := coalesce(public.hadith_import_validate_json_text(p_source, 'version', 'source_version', p_index, false), public.hadith_import_validate_json_text(p_source, 'corpusVersion', 'source_version', p_index, true));
  v_language := public.hadith_import_validate_json_text(p_source, 'languageCode', 'source_version', p_index, false);
  if v_language is not null and v_language !~ '^[a-z]{2,3}(-[A-Z]{2})?$' then perform public.hadith_import_raise_error('INVALID_STRING_FIELD', 'source_version', null, p_index, 'languageCode', 'Invalid language code format.'); end if;
  v_edition := public.hadith_import_validate_json_text(p_source, 'edition', 'source_version', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_source, 'license', 'source_version', p_index, false);
  v_attribution := public.hadith_import_validate_json_text(p_source, 'attribution', 'source_version', p_index, false);
  v_terms_url := public.hadith_import_validate_json_text(p_source, 'termsUrl', 'source_version', p_index, false);
  v_source_url := coalesce(public.hadith_import_validate_json_text(p_source, 'sourceUrl', 'source_version', p_index, false), public.hadith_import_validate_json_text(p_source, 'url', 'source_version', p_index, false));
  if p_source ? 'sourceVersionId' then
    if jsonb_typeof(p_source -> 'sourceVersionId') <> 'string' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'source_version', null, p_index, 'sourceVersionId', 'sourceVersionId must be a JSON string.'); end if;
    v_id := public.hadith_import_validate_uuid_text(p_source ->> 'sourceVersionId', 'source_version', p_index, 'sourceVersionId');
    select * into v_version from public.hadith_source_versions where id = v_id;
    if not found then perform public.hadith_import_raise_error('SOURCE_VERSION_NOT_FOUND', 'source_version', v_id::text, p_index, 'sourceVersionId', 'Internal source version UUID was not found.'); end if;
    if v_version.source_id <> p_source_id then perform public.hadith_import_raise_error('SOURCE_VERSION_SOURCE_MISMATCH', 'source_version', v_id::text, p_index, 'source_id', 'Source version does not belong to the resolved source.'); end if;
  else
    select count(*) into v_count from public.hadith_source_versions where source_id = p_source_id and version = v_version_name and language_code is not distinct from v_language;
    if v_count > 1 then perform public.hadith_import_raise_error('AMBIGUOUS_SOURCE', 'source_version', v_version_name, p_index, 'version', 'More than one source version matches.'); end if;
    if v_count = 1 then select * into v_version from public.hadith_source_versions where source_id = p_source_id and version = v_version_name and language_code is not distinct from v_language; end if;
    if v_count = 0 then
      insert into public.hadith_source_versions(source_id, version, edition, language_code, license, attribution, terms_url, source_url)
      values (p_source_id, v_version_name, v_edition, v_language, v_license, v_attribution, v_terms_url, v_source_url)
      returning * into v_version;
      return jsonb_build_object('id', v_version.id, 'source_id', p_source_id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
    end if;
  end if;
  if p_source ? 'version' or p_source ? 'corpusVersion' then if v_version.version is distinct from v_version_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source_version', v_version.id::text, p_index, 'version', 'Existing version differs.'); end if; end if;
  if p_source ? 'edition' and v_version.edition is distinct from v_edition then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source_version', v_version.id::text, p_index, 'edition', 'Existing edition differs.'); end if;
  if p_source ? 'license' and p_source -> 'license' <> 'null'::jsonb and v_version.license is distinct from v_license then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source_version', v_version.id::text, p_index, 'license', 'Existing license differs.'); end if;
  if p_source ? 'attribution' and p_source -> 'attribution' <> 'null'::jsonb and v_version.attribution is distinct from v_attribution then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'source_version', v_version.id::text, p_index, 'attribution', 'Existing attribution differs.'); end if;
  return jsonb_build_object('id', v_version.id, 'source_id', p_source_id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_collection(
  p_collection jsonb,
  p_index integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_collections%rowtype;
  v_slug text;
  v_name text;
  v_arabic text;
  v_source_name text;
  v_source_url text;
  v_license text;
  v_corpus_version text;
  v_sort_order integer;
begin
  if jsonb_typeof(p_collection) <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'collection', null, p_index, 'collection', 'Collection must be an object.'); end if;
  v_slug := public.hadith_import_validate_json_text(p_collection, 'sourceId', 'collection', p_index, true);
  v_name := public.hadith_import_validate_json_text(p_collection, 'nameFrench', 'collection', p_index, true);
  v_arabic := public.hadith_import_validate_json_text(p_collection, 'nameArabic', 'collection', p_index, false);
  v_source_name := public.hadith_import_validate_json_text(p_collection, 'sourceName', 'collection', p_index, true);
  v_source_url := public.hadith_import_validate_json_text(p_collection, 'sourceUrl', 'collection', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_collection, 'license', 'collection', p_index, false);
  v_corpus_version := public.hadith_import_validate_json_text(p_collection, 'corpusVersion', 'collection', p_index, false);
  if p_collection ? 'sortOrder' then v_sort_order := public.hadith_import_validate_json_integer(p_collection, 'sortOrder', 'collection', p_index, false); end if;
  select * into v_row from public.hadith_collections where slug = v_slug;
  if not found then
    insert into public.hadith_collections(slug, name, arabic_name, source_name, source_url, license, corpus_version, sort_order)
    values (v_slug, v_name, v_arabic, v_source_name, v_source_url, v_license, coalesce(v_corpus_version, 'unspecified'), coalesce(v_sort_order, 0)) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.name is distinct from v_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'name', 'Existing collection name differs.'); end if;
  if p_collection ? 'nameArabic' and p_collection -> 'nameArabic' <> 'null'::jsonb and v_row.arabic_name is distinct from v_arabic then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'nameArabic', 'Existing Arabic collection name differs.'); end if;
  if p_collection ? 'sourceName' and p_collection -> 'sourceName' <> 'null'::jsonb and v_row.source_name is distinct from v_source_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'sourceName', 'Existing collection source differs.'); end if;
  if p_collection ? 'sourceUrl' and p_collection -> 'sourceUrl' <> 'null'::jsonb and v_row.source_url is distinct from v_source_url then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'sourceUrl', 'Existing collection URL differs.'); end if;
  if p_collection ? 'license' and p_collection -> 'license' <> 'null'::jsonb and v_row.license is distinct from v_license then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'license', 'Existing collection license differs.'); end if;
  if p_collection ? 'corpusVersion' and p_collection -> 'corpusVersion' <> 'null'::jsonb and v_row.corpus_version is distinct from v_corpus_version then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'corpusVersion', 'Existing collection version differs.'); end if;
  if p_collection ? 'sortOrder' and p_collection -> 'sortOrder' <> 'null'::jsonb and v_row.sort_order is distinct from v_sort_order then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'collection', v_slug, p_index, 'sortOrder', 'Existing collection order differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_book(
  p_book jsonb,
  p_collection_id uuid,
  p_index integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_books%rowtype;
  v_number integer;
  v_name text;
  v_arabic text;
  v_source_number text;
begin
  if jsonb_typeof(p_book) <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'book', null, p_index, 'book', 'Book must be an object.'); end if;
  v_number := public.hadith_import_validate_json_integer(p_book, 'number', 'book', p_index, true);
  v_name := public.hadith_import_validate_json_text(p_book, 'titleFrench', 'book', p_index, true);
  v_arabic := public.hadith_import_validate_json_text(p_book, 'titleArabic', 'book', p_index, false);
  v_source_number := public.hadith_import_validate_json_text(p_book, 'sourceId', 'book', p_index, false);
  select * into v_row from public.hadith_books where collection_id = p_collection_id and book_number = v_number;
  if not found then
    insert into public.hadith_books(collection_id, book_number, name, arabic_name, source_book_number)
    values (p_collection_id, v_number, v_name, v_arabic, v_source_number) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'collection_id', p_collection_id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.name is distinct from v_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'book', p_collection_id::text || '/' || v_number, p_index, 'titleFrench', 'Existing book title differs.'); end if;
  if p_book ? 'titleArabic' and v_row.arabic_name is distinct from v_arabic then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'book', p_collection_id::text || '/' || v_number, p_index, 'titleArabic', 'Existing Arabic book title differs.'); end if;
  if p_book ? 'sourceId' and v_row.source_book_number is distinct from v_source_number then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'book', p_collection_id::text || '/' || v_number, p_index, 'sourceId', 'Existing source book number differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'collection_id', p_collection_id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_chapter(
  p_chapter jsonb,
  p_book_id uuid,
  p_index integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_chapters%rowtype;
  v_number integer;
  v_name text;
  v_arabic text;
  v_reference text;
begin
  if jsonb_typeof(p_chapter) <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'chapter', null, p_index, 'chapter', 'Chapter must be an object.'); end if;
  v_number := public.hadith_import_validate_json_integer(p_chapter, 'number', 'chapter', p_index, true);
  v_name := public.hadith_import_validate_json_text(p_chapter, 'titleFrench', 'chapter', p_index, true);
  v_arabic := public.hadith_import_validate_json_text(p_chapter, 'titleArabic', 'chapter', p_index, false);
  v_reference := public.hadith_import_validate_json_text(p_chapter, 'sourceReference', 'chapter', p_index, false);
  select * into v_row from public.hadith_chapters where book_id = p_book_id and chapter_number = v_number;
  if not found then
    insert into public.hadith_chapters(book_id, chapter_number, name, arabic_name, source_reference)
    values (p_book_id, v_number, v_name, v_arabic, v_reference) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'book_id', p_book_id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.name is distinct from v_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'chapter', p_book_id::text || '/' || v_number, p_index, 'titleFrench', 'Existing chapter title differs.'); end if;
  if p_chapter ? 'titleArabic' and v_row.arabic_name is distinct from v_arabic then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'chapter', p_book_id::text || '/' || v_number, p_index, 'titleArabic', 'Existing Arabic chapter title differs.'); end if;
  if p_chapter ? 'sourceReference' and v_row.source_reference is distinct from v_reference then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'chapter', p_book_id::text || '/' || v_number, p_index, 'sourceReference', 'Existing chapter reference differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'book_id', p_book_id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_hadith(
  p_hadith jsonb,
  p_source_id uuid,
  p_source_version_id uuid,
  p_collection_id uuid,
  p_book_id uuid,
  p_chapter_id uuid,
  p_index integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadiths%rowtype;
  v_historical public.hadiths%rowtype;
  v_source_hadith_id text;
  v_global_number integer;
  v_book_number integer;
  v_arabic text;
  v_hadith_number integer;
  v_narrator text;
  v_chain text;
  v_grade text;
  v_reference text;
  v_source_name text;
  v_source_url text;
  v_license text;
  v_corpus_version text;
begin
  if jsonb_typeof(p_hadith) <> 'object' then perform public.hadith_import_raise_error('INVALID_FIELD_TYPE', 'hadith', null, p_index, 'hadith', 'Hadith must be an object.'); end if;
  v_source_hadith_id := public.hadith_import_validate_json_text(p_hadith, 'sourceHadithId', 'hadith', p_index, true);
  v_global_number := public.hadith_import_validate_json_integer(p_hadith, 'globalNumber', 'hadith', p_index, true);
  v_hadith_number := public.hadith_import_validate_json_integer(p_hadith, 'hadithNumberInBook', 'hadith', p_index, true);
  v_arabic := public.hadith_import_validate_json_text(p_hadith, 'arabicText', 'hadith', p_index, true);
  v_narrator := public.hadith_import_validate_json_text(p_hadith, 'narrator', 'hadith', p_index, false);
  v_chain := public.hadith_import_validate_json_text(p_hadith, 'chainText', 'hadith', p_index, false);
  v_grade := public.hadith_import_validate_json_text(p_hadith, 'authenticityGrade', 'hadith', p_index, false);
  v_reference := public.hadith_import_validate_json_text(p_hadith, 'sourceReference', 'hadith', p_index, false);
  v_source_name := public.hadith_import_validate_json_text(p_hadith, 'sourceName', 'hadith', p_index, true);
  v_source_url := public.hadith_import_validate_json_text(p_hadith, 'sourceUrl', 'hadith', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_hadith, 'license', 'hadith', p_index, false);
  v_corpus_version := public.hadith_import_validate_json_text(p_hadith, 'corpusVersion', 'hadith', p_index, true);

  select * into v_row from public.hadiths where source_version_id = p_source_version_id and source_hadith_id = v_source_hadith_id;
  select * into v_historical from public.hadiths where collection_id = p_collection_id and global_number = v_global_number;
  if found and (v_row.id is null or v_historical.id <> v_row.id) then
    perform public.hadith_import_raise_error('IDENTITY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'globalNumber', 'Documentary identity conflicts with collection_id/global_number.');
  end if;
  select * into v_historical from public.hadiths where book_id = p_book_id and hadith_number_in_book = v_hadith_number;
  if found and (v_row.id is null or v_historical.id <> v_row.id) then
    perform public.hadith_import_raise_error('IDENTITY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'hadithNumberInBook', 'Documentary identity conflicts with book_id/hadith_number_in_book.');
  end if;

  if v_row.id is null then
    insert into public.hadiths(collection_id, book_id, chapter_id, global_number, hadith_number_in_book, arabic_text, narrator, chain_text, authenticity_grade, source_reference, source_name, source_url, license, corpus_version, source_id, source_version_id, source_hadith_id)
    values (p_collection_id, p_book_id, p_chapter_id, v_global_number, v_hadith_number, v_arabic, v_narrator, v_chain, v_grade, v_reference, v_source_name, v_source_url, v_license, v_corpus_version, p_source_id, p_source_version_id, v_source_hadith_id)
    returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'source_hadith_id', v_source_hadith_id, 'global_number', v_global_number, 'hadith_number_in_book', v_hadith_number, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;

  if v_row.collection_id is distinct from p_collection_id then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'collection', 'Existing collection differs.'); end if;
  if v_row.book_id is distinct from p_book_id then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'book', 'Existing book differs.'); end if;
  if v_row.chapter_id is distinct from p_chapter_id then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'chapter', 'Existing chapter differs.'); end if;
  if v_row.global_number is distinct from v_global_number then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'globalNumber', 'Existing global number differs.'); end if;
  if v_row.hadith_number_in_book is distinct from v_hadith_number then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'hadithNumberInBook', 'Existing book number differs.'); end if;
  if v_row.arabic_text is distinct from v_arabic then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'arabicText', 'Existing Arabic text differs.'); end if;
  if p_hadith ? 'narrator' and p_hadith -> 'narrator' <> 'null'::jsonb and v_row.narrator is distinct from v_narrator then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'narrator', 'Existing narrator differs.'); end if;
  if p_hadith ? 'chainText' and p_hadith -> 'chainText' <> 'null'::jsonb and v_row.chain_text is distinct from v_chain then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'chainText', 'Existing chain differs.'); end if;
  if p_hadith ? 'authenticityGrade' and p_hadith -> 'authenticityGrade' <> 'null'::jsonb and v_row.authenticity_grade is distinct from v_grade then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'authenticityGrade', 'Existing authenticity grade differs.'); end if;
  if p_hadith ? 'sourceReference' and p_hadith -> 'sourceReference' <> 'null'::jsonb and v_row.source_reference is distinct from v_reference then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'sourceReference', 'Existing source reference differs.'); end if;
  if p_hadith ? 'sourceName' and p_hadith -> 'sourceName' <> 'null'::jsonb and v_row.source_name is distinct from v_source_name then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'sourceName', 'Existing source name differs.'); end if;
  if p_hadith ? 'sourceUrl' and p_hadith -> 'sourceUrl' <> 'null'::jsonb and v_row.source_url is distinct from v_source_url then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'sourceUrl', 'Existing source URL differs.'); end if;
  if p_hadith ? 'license' and p_hadith -> 'license' <> 'null'::jsonb and v_row.license is distinct from v_license then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'license', 'Existing license differs.'); end if;
  if p_hadith ? 'corpusVersion' and p_hadith -> 'corpusVersion' <> 'null'::jsonb and v_row.corpus_version is distinct from v_corpus_version then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'corpusVersion', 'Existing corpus version differs.'); end if;
  if v_row.source_id is distinct from p_source_id or v_row.source_version_id is distinct from p_source_version_id then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'hadith', p_source_version_id::text || '/' || v_source_hadith_id, p_index, 'sourceVersionId', 'Existing source identity differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'source_hadith_id', v_source_hadith_id, 'global_number', v_global_number, 'hadith_number_in_book', v_hadith_number, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_translation(
  p_translation jsonb,
  p_hadith_id uuid,
  p_default_source_id uuid,
  p_default_source_version_id uuid,
  p_index integer,
  p_child_index integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_translations%rowtype;
  v_language text;
  v_text text;
  v_translator text;
  v_editor text;
  v_source_name text;
  v_source_url text;
  v_license text;
  v_attribution text;
  v_corpus_version text;
  v_source_id uuid := p_default_source_id;
  v_version_id uuid := p_default_source_version_id;
begin
  v_language := public.hadith_import_validate_json_text(p_translation, 'languageCode', 'translation', p_index, true);
  if v_language !~ '^[a-z]{2,3}(-[A-Z]{2})?$' then perform public.hadith_import_raise_error('INVALID_STRING_FIELD', 'translation', null, p_index, 'languageCode', 'Invalid language code.'); end if;
  v_text := public.hadith_import_validate_json_text(p_translation, 'text', 'translation', p_index, true);
  v_translator := public.hadith_import_validate_json_text(p_translation, 'translator', 'translation', p_index, false);
  v_editor := public.hadith_import_validate_json_text(p_translation, 'editor', 'translation', p_index, false);
  v_source_name := public.hadith_import_validate_json_text(p_translation, 'sourceName', 'translation', p_index, true);
  v_source_url := public.hadith_import_validate_json_text(p_translation, 'sourceUrl', 'translation', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_translation, 'license', 'translation', p_index, false);
  v_attribution := public.hadith_import_validate_json_text(p_translation, 'attribution', 'translation', p_index, false);
  v_corpus_version := public.hadith_import_validate_json_text(p_translation, 'corpusVersion', 'translation', p_index, true);
  if p_translation ? 'sourceId' then v_source_id := public.hadith_import_validate_uuid_text(p_translation ->> 'sourceId', 'translation', p_index, 'sourceId'); end if;
  if p_translation ? 'sourceVersionId' then v_version_id := public.hadith_import_validate_uuid_text(p_translation ->> 'sourceVersionId', 'translation', p_index, 'sourceVersionId'); end if;
  if v_source_id is null or v_version_id is null then perform public.hadith_import_raise_error('INVALID_PAYLOAD', 'translation', null, p_index, 'sourceVersionId', 'Translation source and version are required.'); end if;
  if v_source_id <> p_default_source_id then perform public.hadith_import_raise_error('SOURCE_VERSION_SOURCE_MISMATCH', 'translation', v_version_id::text, p_index, 'sourceId', 'Translation source differs from the orchestration source.'); end if;
  if not exists (select 1 from public.hadith_source_versions where id = v_version_id and source_id = v_source_id) then perform public.hadith_import_raise_error('SOURCE_VERSION_SOURCE_MISMATCH', 'translation', v_version_id::text, p_index, 'sourceVersionId', 'Translation version does not belong to its source.'); end if;
  select * into v_row from public.hadith_translations where hadith_id = p_hadith_id and language_code = v_language and source_version_id = v_version_id;
  if not found then
    insert into public.hadith_translations(hadith_id, language_code, translation_text, translator, editor, source_name, source_url, license, attribution, corpus_version, source_id, source_version_id)
    values (p_hadith_id, v_language, v_text, v_translator, v_editor, v_source_name, v_source_url, v_license, v_attribution, v_corpus_version, v_source_id, v_version_id) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.translation_text is distinct from v_text then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'text', 'Existing translation text differs.'); end if;
  if p_translation ? 'translator' and p_translation -> 'translator' <> 'null'::jsonb and v_row.translator is distinct from v_translator then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'translator', 'Existing translator differs.'); end if;
  if p_translation ? 'editor' and p_translation -> 'editor' <> 'null'::jsonb and v_row.editor is distinct from v_editor then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'editor', 'Existing editor differs.'); end if;
  if p_translation ? 'sourceUrl' and p_translation -> 'sourceUrl' <> 'null'::jsonb and v_row.source_url is distinct from v_source_url then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'sourceUrl', 'Existing translation URL differs.'); end if;
  if p_translation ? 'license' and p_translation -> 'license' <> 'null'::jsonb and v_row.license is distinct from v_license then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'license', 'Existing translation license differs.'); end if;
  if p_translation ? 'attribution' and p_translation -> 'attribution' <> 'null'::jsonb and v_row.attribution is distinct from v_attribution then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'translation', v_row.id::text, p_index, 'attribution', 'Existing translation attribution differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_explanation(
  p_explanation jsonb,
  p_hadith_id uuid,
  p_index integer,
  p_child_index integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_explanations%rowtype;
  v_language text; v_text text; v_source_name text; v_source_url text; v_reference text; v_item text; v_license text; v_attribution text; v_version text; v_hash text;
begin
  v_language := public.hadith_import_validate_json_text(p_explanation, 'languageCode', 'explanation', p_index, true);
  if v_language <> 'fr' then perform public.hadith_import_raise_error('INVALID_STRING_FIELD', 'explanation', null, p_index, 'languageCode', 'Explanations are limited to fr by the schema.'); end if;
  v_text := public.hadith_import_validate_json_text(p_explanation, 'text', 'explanation', p_index, true);
  v_source_name := public.hadith_import_validate_json_text(p_explanation, 'sourceName', 'explanation', p_index, true);
  v_source_url := public.hadith_import_validate_json_text(p_explanation, 'sourceUrl', 'explanation', p_index, false);
  v_reference := public.hadith_import_validate_json_text(p_explanation, 'sourceReference', 'explanation', p_index, false);
  v_item := public.hadith_import_validate_json_text(p_explanation, 'sourceItemId', 'explanation', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_explanation, 'license', 'explanation', p_index, false);
  v_attribution := public.hadith_import_validate_json_text(p_explanation, 'attribution', 'explanation', p_index, false);
  v_version := public.hadith_import_validate_json_text(p_explanation, 'corpusVersion', 'explanation', p_index, true);
  v_hash := repeat(md5(v_text), 2);
  select * into v_row from public.hadith_explanations where hadith_id = p_hadith_id and language_code = v_language and source_name = v_source_name and source_item_id_normalized = coalesce(v_item, '') and corpus_version = v_version;
  if not found then
    insert into public.hadith_explanations(hadith_id, language_code, explanation_text, source_name, source_url, source_reference, source_item_id, license, attribution, corpus_version, source_hash)
    values (p_hadith_id, v_language, v_text, v_source_name, v_source_url, v_reference, v_item, v_license, v_attribution, v_version, v_hash) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.explanation_text is distinct from v_text or (p_explanation ? 'sourceUrl' and p_explanation -> 'sourceUrl' <> 'null'::jsonb and v_row.source_url is distinct from v_source_url) or (p_explanation ? 'sourceReference' and p_explanation -> 'sourceReference' <> 'null'::jsonb and v_row.source_reference is distinct from v_reference) or (p_explanation ? 'license' and p_explanation -> 'license' <> 'null'::jsonb and v_row.license is distinct from v_license) or (p_explanation ? 'attribution' and p_explanation -> 'attribution' <> 'null'::jsonb and v_row.attribution is distinct from v_attribution) then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'explanation', v_row.id::text, p_index, 'text', 'Existing explanation differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

create or replace function public.hadith_import_resolve_lesson(
  p_lesson jsonb,
  p_hadith_id uuid,
  p_index integer,
  p_child_index integer
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_row public.hadith_lessons%rowtype;
  v_language text; v_text text; v_source_name text; v_source_url text; v_reference text; v_item text; v_license text; v_attribution text; v_version text; v_order integer; v_hash text;
begin
  v_language := public.hadith_import_validate_json_text(p_lesson, 'languageCode', 'lesson', p_index, true);
  if v_language <> 'fr' then perform public.hadith_import_raise_error('INVALID_STRING_FIELD', 'lesson', null, p_index, 'languageCode', 'Lessons are limited to fr by the schema.'); end if;
  v_order := public.hadith_import_validate_json_integer(p_lesson, 'order', 'lesson', p_index, true);
  v_text := public.hadith_import_validate_json_text(p_lesson, 'text', 'lesson', p_index, true);
  v_source_name := public.hadith_import_validate_json_text(p_lesson, 'sourceName', 'lesson', p_index, true);
  v_source_url := public.hadith_import_validate_json_text(p_lesson, 'sourceUrl', 'lesson', p_index, false);
  v_reference := public.hadith_import_validate_json_text(p_lesson, 'sourceReference', 'lesson', p_index, false);
  v_item := public.hadith_import_validate_json_text(p_lesson, 'sourceItemId', 'lesson', p_index, false);
  v_license := public.hadith_import_validate_json_text(p_lesson, 'license', 'lesson', p_index, false);
  v_attribution := public.hadith_import_validate_json_text(p_lesson, 'attribution', 'lesson', p_index, false);
  v_version := public.hadith_import_validate_json_text(p_lesson, 'corpusVersion', 'lesson', p_index, true);
  v_hash := repeat(md5(v_text || ':' || v_order::text), 2);
  select * into v_row from public.hadith_lessons where hadith_id = p_hadith_id and language_code = v_language and source_name = v_source_name and source_item_id_normalized = coalesce(v_item, '') and corpus_version = v_version and lesson_order = v_order;
  if not found then
    insert into public.hadith_lessons(hadith_id, language_code, lesson_order, lesson_text, source_name, source_url, source_reference, source_item_id, license, attribution, corpus_version, source_hash)
    values (p_hadith_id, v_language, v_order, v_text, v_source_name, v_source_url, v_reference, v_item, v_license, v_attribution, v_version, v_hash) returning * into v_row;
    return jsonb_build_object('id', v_row.id, 'created', true, 'existing', false, 'warnings', '[]'::jsonb);
  end if;
  if v_row.lesson_text is distinct from v_text or (p_lesson ? 'sourceUrl' and p_lesson -> 'sourceUrl' <> 'null'::jsonb and v_row.source_url is distinct from v_source_url) or (p_lesson ? 'sourceReference' and p_lesson -> 'sourceReference' <> 'null'::jsonb and v_row.source_reference is distinct from v_reference) or (p_lesson ? 'license' and p_lesson -> 'license' <> 'null'::jsonb and v_row.license is distinct from v_license) or (p_lesson ? 'attribution' and p_lesson -> 'attribution' <> 'null'::jsonb and v_row.attribution is distinct from v_attribution) then perform public.hadith_import_raise_error('DOCUMENTARY_CONFLICT', 'lesson', v_row.id::text, p_index, 'text', 'Existing lesson differs.'); end if;
  return jsonb_build_object('id', v_row.id, 'created', false, 'existing', true, 'warnings', '[]'::jsonb);
end;
$$;

revoke execute on function public.hadith_import_raise_error(text, text, text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.hadith_import_validate_context(text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.hadith_import_validate_json_text(jsonb, text, text, integer, boolean) from public, anon, authenticated;
revoke execute on function public.hadith_import_validate_json_integer(jsonb, text, text, integer, boolean) from public, anon, authenticated;
revoke execute on function public.hadith_import_reject_status_fields(jsonb, text) from public, anon, authenticated;
revoke execute on function public.hadith_import_validate_payload(jsonb) from public, anon, authenticated;
revoke execute on function public.hadith_import_validate_uuid_text(text, text, integer, text) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_source(jsonb, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_source_version(jsonb, uuid, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_collection(jsonb, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_book(jsonb, uuid, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_chapter(jsonb, uuid, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_hadith(jsonb, uuid, uuid, uuid, uuid, uuid, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_translation(jsonb, uuid, uuid, uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_explanation(jsonb, uuid, integer, integer) from public, anon, authenticated;
revoke execute on function public.hadith_import_resolve_lesson(jsonb, uuid, integer, integer) from public, anon, authenticated;

-- Final orchestration. The current source-file contract is documented by the
-- existing importer: source, collection and hadiths[] at the root; book and
-- chapter inside each hadith; translationFrench, explanationFrench and
-- lessonsFrench as the current child fields. The resolver receives a merged
-- hadith object containing source-level fields without changing the payload.
create or replace function public.import_hadith_batch(
  p_payload jsonb,
  p_lifecycle_author text,
  p_lifecycle_justification text,
  p_lifecycle_version text,
  p_lifecycle_evidence text,
  p_source_hadith_id_justification text,
  p_source_hadith_id_evidence text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_source_result jsonb;
  v_version_result jsonb;
  v_collection_result jsonb;
  v_book_result jsonb;
  v_chapter_result jsonb;
  v_hadith_result jsonb;
  v_child_result jsonb;
  v_source jsonb;
  v_collection jsonb;
  v_row jsonb;
  v_child jsonb;
  v_hadith_payload jsonb;
  v_source_id uuid;
  v_version_id uuid;
  v_collection_id uuid;
  v_book_id uuid;
  v_chapter_id uuid;
  v_hadith_id uuid;
  v_index integer := 0;
  v_child_index integer;
  v_count integer;
  v_sources_created integer := 0;
  v_sources_existing integer := 0;
  v_versions_created integer := 0;
  v_versions_existing integer := 0;
  v_collections_created integer := 0;
  v_collections_existing integer := 0;
  v_books_created integer := 0;
  v_books_existing integer := 0;
  v_chapters_created integer := 0;
  v_chapters_existing integer := 0;
  v_hadiths_created integer := 0;
  v_hadiths_existing integer := 0;
  v_translations_created integer := 0;
  v_translations_existing integer := 0;
  v_explanations_created integer := 0;
  v_explanations_existing integer := 0;
  v_lessons_created integer := 0;
  v_lessons_existing integer := 0;
  v_hash text;
begin
  perform public.hadith_import_validate_context(p_lifecycle_author, p_lifecycle_justification, p_lifecycle_version, p_lifecycle_evidence, p_source_hadith_id_justification, p_source_hadith_id_evidence);
  perform public.hadith_import_validate_payload(p_payload);
  v_hash := md5(p_payload::text);
  v_source := p_payload -> 'source';
  v_collection := p_payload -> 'collection';

  v_source_result := public.hadith_import_resolve_source(v_source, null);
  v_source_id := (v_source_result ->> 'id')::uuid;
  if (v_source_result ->> 'created')::boolean then v_sources_created := 1; else v_sources_existing := 1; end if;
  v_version_result := public.hadith_import_resolve_source_version(v_source, v_source_id, null);
  v_version_id := (v_version_result ->> 'id')::uuid;
  if (v_version_result ->> 'created')::boolean then v_versions_created := 1; else v_versions_existing := 1; end if;

  for v_row in select value from jsonb_array_elements(p_payload -> 'hadiths') loop
    v_collection_result := public.hadith_import_resolve_collection(v_collection || jsonb_build_object('sourceName', v_source ->> 'name', 'sourceUrl', coalesce(v_source ->> 'url', v_source ->> 'officialUrl'), 'license', v_source ->> 'license', 'corpusVersion', coalesce(v_source ->> 'corpusVersion', v_source ->> 'version')), v_index);
    v_collection_id := (v_collection_result ->> 'id')::uuid;
    if (v_collection_result ->> 'created')::boolean then v_collections_created := v_collections_created + 1; else v_collections_existing := v_collections_existing + 1; end if;
    v_book_result := public.hadith_import_resolve_book(v_row -> 'book', v_collection_id, v_index);
    v_book_id := (v_book_result ->> 'id')::uuid;
    if (v_book_result ->> 'created')::boolean then v_books_created := v_books_created + 1; else v_books_existing := v_books_existing + 1; end if;
    v_chapter_id := null;
    if v_row ? 'chapter' and v_row -> 'chapter' is not null then
      v_chapter_result := public.hadith_import_resolve_chapter(v_row -> 'chapter', v_book_id, v_index);
      v_chapter_id := (v_chapter_result ->> 'id')::uuid;
      if (v_chapter_result ->> 'created')::boolean then v_chapters_created := v_chapters_created + 1; else v_chapters_existing := v_chapters_existing + 1; end if;
    end if;
    v_hadith_payload := v_row || jsonb_build_object('sourceName', v_source ->> 'name', 'sourceUrl', coalesce(v_source ->> 'url', v_source ->> 'officialUrl'), 'license', v_source ->> 'license', 'corpusVersion', coalesce(v_source ->> 'corpusVersion', v_source ->> 'version'));
    v_hadith_result := public.hadith_import_resolve_hadith(v_hadith_payload, v_source_id, v_version_id, v_collection_id, v_book_id, v_chapter_id, v_index);
    v_hadith_id := (v_hadith_result ->> 'id')::uuid;
    if (v_hadith_result ->> 'created')::boolean then v_hadiths_created := v_hadiths_created + 1; else v_hadiths_existing := v_hadiths_existing + 1; end if;
    if jsonb_typeof(v_row -> 'translationFrench') = 'object' then
      v_child := (v_row -> 'translationFrench') || jsonb_build_object('languageCode', 'fr', 'corpusVersion', coalesce(v_source ->> 'corpusVersion', v_source ->> 'version'));
      v_child_result := public.hadith_import_resolve_translation(v_child, v_hadith_id, v_source_id, v_version_id, v_index, 0);
      if (v_child_result ->> 'created')::boolean then v_translations_created := v_translations_created + 1; else v_translations_existing := v_translations_existing + 1; end if;
    end if;
    if jsonb_typeof(v_row -> 'explanationFrench') = 'object' then
      v_child := (v_row -> 'explanationFrench') || jsonb_build_object('languageCode', 'fr', 'corpusVersion', coalesce(v_source ->> 'corpusVersion', v_source ->> 'version'));
      v_child_result := public.hadith_import_resolve_explanation(v_child, v_hadith_id, v_index, 0);
      if (v_child_result ->> 'created')::boolean then v_explanations_created := v_explanations_created + 1; else v_explanations_existing := v_explanations_existing + 1; end if;
    end if;
    if jsonb_typeof(v_row -> 'lessonsFrench') = 'array' then
      v_child_index := 0;
      for v_child in select value from jsonb_array_elements(v_row -> 'lessonsFrench') loop
        v_child := v_child || jsonb_build_object('languageCode', 'fr', 'corpusVersion', coalesce(v_source ->> 'corpusVersion', v_source ->> 'version'));
        v_child_result := public.hadith_import_resolve_lesson(v_child, v_hadith_id, v_index, v_child_index);
        if (v_child_result ->> 'created')::boolean then v_lessons_created := v_lessons_created + 1; else v_lessons_existing := v_lessons_existing + 1; end if;
        v_child_index := v_child_index + 1;
      end loop;
    end if;
    v_index := v_index + 1;
  end loop;
  -- hadith_sources has no lifecycle trigger in migrations 001-005; all other
  -- created resource types above have one initial lifecycle event.
  v_count := v_versions_created + v_collections_created + v_books_created + v_chapters_created + v_hadiths_created + v_translations_created + v_explanations_created + v_lessons_created;
  return jsonb_build_object('status','success','schema_version','hadith-foundation-v1','rpc_version','hadith-import-batch-v1','batch_hash',v_hash,'batch_hash_algorithm','md5(jsonb::text)','payload_size',octet_length(p_payload::text),'hadith_count',jsonb_array_length(p_payload -> 'hadiths'),'corpus_version',coalesce(v_source ->> 'corpusVersion', v_source ->> 'version'),'sources_created',v_sources_created,'sources_existing',v_sources_existing,'source_versions_created',v_versions_created,'source_versions_existing',v_versions_existing,'collections_created',v_collections_created,'collections_existing',v_collections_existing,'books_created',v_books_created,'books_existing',v_books_existing,'chapters_created',v_chapters_created,'chapters_existing',v_chapters_existing,'hadiths_created',v_hadiths_created,'hadiths_existing',v_hadiths_existing,'translations_created',v_translations_created,'translations_existing',v_translations_existing,'explanations_created',v_explanations_created,'explanations_existing',v_explanations_existing,'lessons_created',v_lessons_created,'lessons_existing',v_lessons_existing,'lifecycle_events_created',v_count,'warnings','[]'::jsonb);
end;
$$;

revoke all on function public.import_hadith_batch(jsonb, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.import_hadith_batch(jsonb, text, text, text, text, text, text) to service_role;
grant execute on function public.hadith_import_raise_error(text, text, text, integer, text, text) to service_role;
grant execute on function public.hadith_import_validate_context(text, text, text, text, text, text) to service_role;
grant execute on function public.hadith_import_validate_payload(jsonb) to service_role;
grant execute on function public.hadith_import_validate_json_text(jsonb, text, text, integer, boolean) to service_role;
grant execute on function public.hadith_import_validate_json_integer(jsonb, text, text, integer, boolean) to service_role;
grant execute on function public.hadith_import_reject_status_fields(jsonb, text) to service_role;
grant execute on function public.hadith_import_validate_uuid_text(text, text, integer, text) to service_role;
grant execute on function public.hadith_import_resolve_source(jsonb, integer) to service_role;
grant execute on function public.hadith_import_resolve_source_version(jsonb, uuid, integer) to service_role;
grant execute on function public.hadith_import_resolve_collection(jsonb, integer) to service_role;
grant execute on function public.hadith_import_resolve_book(jsonb, uuid, integer) to service_role;
grant execute on function public.hadith_import_resolve_chapter(jsonb, uuid, integer) to service_role;
grant execute on function public.hadith_import_resolve_hadith(jsonb, uuid, uuid, uuid, uuid, uuid, integer) to service_role;
grant execute on function public.hadith_import_resolve_translation(jsonb, uuid, uuid, uuid, integer, integer) to service_role;
grant execute on function public.hadith_import_resolve_explanation(jsonb, uuid, integer, integer) to service_role;
grant execute on function public.hadith_import_resolve_lesson(jsonb, uuid, integer, integer) to service_role;

comment on function public.import_hadith_batch(jsonb, text, text, text, text, text, text) is
  'Accepts the current camelCase documentary payload: source, collection and hadiths[]. Each hadith contains book, optional chapter, sourceHadithId, globalNumber, hadithNumberInBook and arabicText; optional children are translationFrench, explanationFrench and lessonsFrench. verificationStatus is accepted only inside those child objects as documentary metadata and is never used as lifecycle status. payload_size is the byte length of PostgreSQL canonical JSONB text; batch_hash is md5 of that text.';
