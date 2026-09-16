-- OUMMAH Health Index v1.0. Additive migration: no data deletion or mass rewrite.
alter table public.boycott_scanned_products
  add column if not exists health_grade text,
  add column if not exists health_score_version text,
  add column if not exists health_calculated_at timestamptz;

alter table public.boycott_scanned_products
  drop constraint if exists boycott_scanned_products_health_grade_allowed;
alter table public.boycott_scanned_products
  add constraint boycott_scanned_products_health_grade_allowed
  check (health_grade is null or health_grade in ('A','B','C','D','E'));
