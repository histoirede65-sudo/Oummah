-- Lecture seule. Résultat attendu: 1790 hadiths documentaires pour la version importée.
with target_version as (
  select v.id, v.version, v.status
  from public.hadith_source_versions v
  join public.hadith_sources s on s.id = v.source_id
  where s.name = 'HadeethEnc'
    and v.language_code = 'fr'
  order by v.imported_at desc
  limit 1
)
select
  tv.version,
  tv.status as source_version_status,
  count(*) as total_hadiths,
  count(*) filter (where nullif(btrim(h.arabic_text), '') is not null) as arabic,
  count(*) filter (where nullif(btrim(m.translation_french), '') is not null) as french,
  count(*) filter (where nullif(btrim(m.explanation_french), '') is not null) as explanations,
  count(*) filter (
    where jsonb_typeof(m.hints_french) = 'array'
      and jsonb_array_length(m.hints_french) > 0
  ) as benefits
from target_version tv
join public.hadiths h on h.source_version_id = tv.id
join public.hadith_documentary_metadata m on m.hadith_id = h.id
where h.document_structure_type = 'documentary_source'
group by tv.version, tv.status;

-- Contrôles d'intégrité: chaque compteur doit être égal à 0.
with target_version as (
  select v.id
  from public.hadith_source_versions v
  join public.hadith_sources s on s.id = v.source_id
  where s.name = 'HadeethEnc' and v.language_code = 'fr'
  order by v.imported_at desc
  limit 1
)
select
  count(*) filter (where h.source_hadith_id is null or btrim(h.source_hadith_id) = '') as missing_source_id,
  count(*) filter (where m.document_hash !~ '^[0-9a-f]{64}$') as invalid_hash,
  count(*) filter (where m.hadith_id is null) as missing_metadata
from target_version tv
join public.hadiths h on h.source_version_id = tv.id
left join public.hadith_documentary_metadata m on m.hadith_id = h.id;
