-- Objectif du lendemain : l'effort écrit dans un bilan devient l'objectif du jour suivant, validable.
alter table public.muhasabah_entries
  add column if not exists effort_result text check (effort_result in ('done', 'partial', 'not_yet')),
  add column if not exists effort_result_at timestamptz;
