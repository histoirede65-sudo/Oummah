-- OUMMAH Hadith legal validation and publication guards.
-- Structure only. No corpus data is inserted and no existing import RPC is modified.

create table if not exists public.hadith_source_legal_reviews (
  id uuid primary key default gen_random_uuid(),
  source_version_id uuid not null
    references public.hadith_source_versions(id)
    on delete restrict,
  decision text not null,
  redistribution_allowed boolean,
  commercial_use_allowed boolean,
  modification_allowed boolean,
  license_identifier text,
  license_evidence_reference text not null,
  attribution_snapshot text not null,
  terms_url_snapshot text,
  source_url_snapshot text not null,
  metadata_fingerprint text not null,
  reviewed_by text not null,
  reviewed_at timestamptz not null default now(),
  justification text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint hadith_source_legal_reviews_decision_allowed
    check (decision in ('pending', 'approved', 'rejected', 'revoked')),
  constraint hadith_source_legal_reviews_reviewer_not_blank
    check (length(btrim(reviewed_by)) > 0),
  constraint hadith_source_legal_reviews_justification_not_blank
    check (length(btrim(justification)) > 0),
  constraint hadith_source_legal_reviews_evidence_not_blank
    check (length(btrim(license_evidence_reference)) > 0),
  constraint hadith_source_legal_reviews_attribution_not_blank
    check (length(btrim(attribution_snapshot)) > 0),
  constraint hadith_source_legal_reviews_source_url_not_blank
    check (length(btrim(source_url_snapshot)) > 0),
  constraint hadith_source_legal_reviews_fingerprint_format
    check (metadata_fingerprint ~ '^[0-9a-f]{32}$'),
  constraint hadith_source_legal_reviews_approved_requirements
    check (
      decision <> 'approved'
      or (
        redistribution_allowed is true
        and nullif(btrim(license_identifier), '') is not null
      )
    )
);

create index if not exists hadith_source_legal_reviews_version_date_idx
  on public.hadith_source_legal_reviews(source_version_id, reviewed_at desc, created_at desc);

create unique index if not exists hadith_source_legal_reviews_one_current_approval_idx
  on public.hadith_source_legal_reviews(source_version_id)
  where decision = 'approved';

create or replace function public.hadith_source_version_legal_fingerprint(
  p_source_version_id uuid
)
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select md5(
    concat_ws(
      E'\x1f',
      coalesce(v.license, ''),
      coalesce(v.attribution, ''),
      coalesce(v.terms_url, ''),
      coalesce(v.source_url, ''),
      coalesce(v.version, ''),
      coalesce(v.language_code, '')
    )
  )
  from public.hadith_source_versions v
  where v.id = p_source_version_id;
$$;

create or replace function public.hadith_source_version_is_legally_publishable(
  p_source_version_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.hadith_source_versions v
    join public.hadith_sources s on s.id = v.source_id
    join public.hadith_source_legal_reviews r
      on r.source_version_id = v.id
     and r.decision = 'approved'
    where v.id = p_source_version_id
      and s.status = 'Validée'
      and nullif(btrim(v.license), '') is not null
      and nullif(btrim(v.attribution), '') is not null
      and nullif(btrim(v.source_url), '') is not null
      and r.redistribution_allowed is true
      and r.license_identifier = v.license
      and r.attribution_snapshot = v.attribution
      and r.source_url_snapshot = v.source_url
      and r.terms_url_snapshot is not distinct from v.terms_url
      and r.metadata_fingerprint = public.hadith_source_version_legal_fingerprint(v.id)
  );
$$;

create or replace function public.guard_hadith_source_version_publication()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.status = 'Disponible en production'
     and not public.hadith_source_version_is_legally_publishable(new.id) then
    raise exception using
      errcode = '23514',
      message = 'HADITH_LEGAL_VALIDATION_REQUIRED',
      detail = 'La version source ne peut pas être publiée sans source validée, licence, attribution, URL source et revue juridique approuvée correspondant aux métadonnées courantes.';
  end if;
  return new;
end;
$$;

drop trigger if exists hadith_source_versions_publication_guard
  on public.hadith_source_versions;
create trigger hadith_source_versions_publication_guard
before insert or update of status, license, attribution, terms_url, source_url, version, language_code
on public.hadith_source_versions
for each row execute function public.guard_hadith_source_version_publication();

create or replace function public.prevent_hadith_legal_review_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Hadith legal reviews are immutable';
end;
$$;

drop trigger if exists hadith_source_legal_reviews_immutable
  on public.hadith_source_legal_reviews;
create trigger hadith_source_legal_reviews_immutable
before update or delete on public.hadith_source_legal_reviews
for each row execute function public.prevent_hadith_legal_review_mutation();

create or replace view public.hadith_source_legal_readiness as
select
  v.id as source_version_id,
  v.source_id,
  s.name as source_name,
  v.version,
  v.language_code,
  v.status,
  (nullif(btrim(v.license), '') is not null) as has_license,
  (nullif(btrim(v.attribution), '') is not null) as has_attribution,
  (nullif(btrim(v.source_url), '') is not null) as has_source_url,
  exists (
    select 1
    from public.hadith_source_legal_reviews r
    where r.source_version_id = v.id
      and r.decision = 'approved'
  ) as has_approved_review,
  public.hadith_source_version_is_legally_publishable(v.id) as is_legally_publishable
from public.hadith_source_versions v
join public.hadith_sources s on s.id = v.source_id;

-- Public readers only see production source versions that still satisfy the legal guard.
drop policy if exists hadith_source_versions_public_read
  on public.hadith_source_versions;
create policy hadith_source_versions_public_read
  on public.hadith_source_versions
  for select
  to anon, authenticated
  using (
    status = 'Disponible en production'
    and public.hadith_source_version_is_legally_publishable(id)
  );

-- Strengthen the canonical published translation view.
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
  and t.verification_status = 'verified'
  and h.source_version_id is not null
  and t.source_version_id is not null
  and public.hadith_source_version_is_legally_publishable(h.source_version_id)
  and public.hadith_source_version_is_legally_publishable(t.source_version_id);

alter table public.hadith_source_legal_reviews enable row level security;
revoke all on table public.hadith_source_legal_reviews from public, anon, authenticated;
grant all on table public.hadith_source_legal_reviews to service_role;

revoke all on function public.hadith_source_version_legal_fingerprint(uuid) from public, anon, authenticated;
revoke all on function public.hadith_source_version_is_legally_publishable(uuid) from public, anon, authenticated;
grant execute on function public.hadith_source_version_legal_fingerprint(uuid) to service_role;
grant execute on function public.hadith_source_version_is_legally_publishable(uuid) to service_role;

revoke all on public.hadith_source_legal_readiness from public, anon, authenticated;
grant select on public.hadith_source_legal_readiness to service_role;
