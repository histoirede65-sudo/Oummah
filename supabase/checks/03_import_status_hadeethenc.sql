-- Lecture seule. Permet de suivre le nombre déjà importé après une interruption.
select
  v.version,
  v.language_code,
  v.status,
  count(h.id) as imported_records,
  min(h.created_at) as first_record_at,
  max(h.created_at) as last_record_at
from public.hadith_sources s
join public.hadith_source_versions v on v.source_id = s.id
left join public.hadiths h on h.source_version_id = v.id
where s.name = 'HadeethEnc'
group by v.version, v.language_code, v.status
order by max(v.imported_at) desc;
