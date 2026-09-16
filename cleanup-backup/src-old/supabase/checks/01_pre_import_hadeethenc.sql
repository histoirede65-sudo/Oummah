-- Lecture seule. À exécuter avant l'import.
select
  to_regclass('public.hadiths') as hadiths,
  to_regclass('public.hadith_sources') as hadith_sources,
  to_regclass('public.hadith_source_versions') as hadith_source_versions,
  to_regclass('public.hadith_documentary_metadata') as hadith_documentary_metadata,
  to_regprocedure('public.import_hadeethenc_batch(jsonb,text,text,text,text)') as import_rpc;

select
  s.name,
  v.version,
  v.language_code,
  v.status,
  count(h.id) as hadith_count
from public.hadith_sources s
left join public.hadith_source_versions v on v.source_id = s.id
left join public.hadiths h on h.source_version_id = v.id
where s.name = 'HadeethEnc'
group by s.name, v.version, v.language_code, v.status
order by v.version;
