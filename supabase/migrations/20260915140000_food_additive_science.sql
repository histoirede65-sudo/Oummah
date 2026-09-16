-- OUMMAH Scan: provenance-backed additive science catalog.
-- This table is intentionally separate from regulatory status and the product health score.
create table if not exists public.food_additive_science (
  code text primary key,
  canonical_name text not null,
  function_classes jsonb not null default '[]'::jsonb,
  regulatory_status text,
  eu_authorized boolean,
  eu_conditions jsonb not null default '{}'::jsonb,
  adi_value numeric,
  adi_unit text,
  severity text not null check (severity in ('none', 'low', 'moderate', 'serious')),
  evidence_strength text not null check (evidence_strength in ('insufficient', 'limited', 'moderate', 'strong')),
  exposure_concern text not null check (exposure_concern in ('none', 'unlikely', 'possible', 'concerning', 'unknown')),
  scientific_classification text not null check (scientific_classification in ('no_particular_signal', 'limited_concern', 'moderate_concern', 'high_concern', 'insufficient_data')),
  scientific_summary text,
  sensitive_populations jsonb not null default '[]'::jsonb,
  sources jsonb not null,
  regulatory_source_updated_at timestamptz,
  scientific_reviewed_at timestamptz,
  needs_scientific_review boolean not null default true,
  data_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_additive_science_sources_array check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0)
);

alter table public.food_additive_science enable row level security;

drop policy if exists "food additive science public read" on public.food_additive_science;
create policy "food additive science public read"
  on public.food_additive_science for select
  to anon, authenticated
  using (true);

create index if not exists food_additive_science_review_idx
  on public.food_additive_science (needs_scientific_review, scientific_reviewed_at desc);
