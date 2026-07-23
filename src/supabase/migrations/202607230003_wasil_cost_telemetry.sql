create table if not exists public.wasil_pricing_catalogs (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_from timestamptz not null,
  source_url text not null,
  currency text not null default 'USD',
  rounding_policy text not null default 'round_half_up',
  created_at timestamptz not null default now(),
  constraint wasil_pricing_catalogs_effective_from_key
    unique (effective_from)
);

create table if not exists public.wasil_pricing_models (
  catalog_id uuid not null
    references public.wasil_pricing_catalogs(id) on delete cascade,
  model text not null,
  cache_write_applicable boolean not null,
  primary key (catalog_id, model)
);

create table if not exists public.wasil_pricing_rates (
  catalog_id uuid not null,
  model text not null,
  processing_mode text not null default 'standard',
  context_tier text not null default 'short',
  input_uncached_usd_per_million numeric(14, 6) not null,
  input_cached_usd_per_million numeric(14, 6) not null,
  cache_write_usd_per_million numeric(14, 6) not null,
  output_usd_per_million numeric(14, 6) not null,
  web_call_usd numeric(14, 6) not null default 0,
  primary key (catalog_id, model, processing_mode, context_tier),
  foreign key (catalog_id, model)
    references public.wasil_pricing_models(catalog_id, model)
    on delete cascade,
  check (input_uncached_usd_per_million >= 0),
  check (input_cached_usd_per_million >= 0),
  check (cache_write_usd_per_million >= 0),
  check (output_usd_per_million >= 0),
  check (web_call_usd >= 0)
);

create table if not exists public.wasil_pricing_model_aliases (
  catalog_id uuid not null
    references public.wasil_pricing_catalogs(id) on delete cascade,
  model_identifier text not null,
  canonical_model text not null,
  primary key (catalog_id, model_identifier),
  foreign key (catalog_id, canonical_model)
    references public.wasil_pricing_models(catalog_id, model)
    on delete cascade
);

create table if not exists public.wasil_request_measurements (
  request_id uuid primary key references public.wasil_requests(id) on delete cascade,
  pricing_catalog_id uuid references public.wasil_pricing_catalogs(id),
  requested_model text not null,
  returned_model text,
  input_tokens bigint,
  cached_input_tokens bigint,
  cache_write_tokens bigint,
  cache_write_status text not null,
  output_tokens_total bigint,
  reasoning_tokens bigint,
  web_call_count integer,
  classification text,
  wasil_mode text not null,
  provider_response_id text,
  token_cost_microdollars numeric(20, 6),
  cache_write_cost_microdollars numeric(20, 6),
  web_cost_microdollars numeric(20, 6),
  estimated_cost_microdollars bigint,
  measured_at timestamptz not null default now(),
  check (wasil_mode in ('standard', 'deep')),
  check (input_tokens is null or input_tokens >= 0),
  check (cached_input_tokens is null or cached_input_tokens >= 0),
  check (cache_write_tokens is null or cache_write_tokens >= 0),
  check (
    cache_write_status in (
      'confirmed_zero',
      'confirmed_positive',
      'not_applicable',
      'unknown'
    )
  ),
  check (
    input_tokens is null
    or cached_input_tokens is null
    or cached_input_tokens <= input_tokens
  ),
  check (
    input_tokens is null
    or cached_input_tokens is null
    or cache_write_tokens is null
    or cached_input_tokens + cache_write_tokens <= input_tokens
  ),
  check (output_tokens_total is null or output_tokens_total >= 0),
  check (reasoning_tokens is null or reasoning_tokens >= 0),
  check (
    output_tokens_total is null
    or reasoning_tokens is null
    or reasoning_tokens <= output_tokens_total
  ),
  check (web_call_count is null or web_call_count >= 0),
  check (token_cost_microdollars is null or token_cost_microdollars >= 0),
  check (
    cache_write_cost_microdollars is null
    or cache_write_cost_microdollars >= 0
  ),
  check (web_cost_microdollars is null or web_cost_microdollars >= 0),
  check (
    estimated_cost_microdollars is null
    or estimated_cost_microdollars >= 0
  )
);

create index if not exists wasil_measurements_measured_at_idx
  on public.wasil_request_measurements(measured_at desc);
create index if not exists wasil_measurements_model_mode_idx
  on public.wasil_request_measurements(returned_model, wasil_mode, measured_at desc);

alter table public.wasil_pricing_catalogs enable row level security;
alter table public.wasil_pricing_models enable row level security;
alter table public.wasil_pricing_rates enable row level security;
alter table public.wasil_pricing_model_aliases enable row level security;
alter table public.wasil_request_measurements enable row level security;

create or replace view public.wasil_cost_observations
with (security_invoker = true)
as
select
  measurement.request_id,
  request.created_at,
  request.status as billing_status,
  request.credits,
  measurement.requested_model,
  measurement.returned_model,
  measurement.wasil_mode,
  measurement.classification,
  measurement.input_tokens,
  measurement.cached_input_tokens,
  measurement.cache_write_tokens,
  measurement.cache_write_status,
  measurement.output_tokens_total,
  measurement.reasoning_tokens,
  measurement.web_call_count,
  (measurement.web_call_count > 0) as used_web,
  measurement.token_cost_microdollars,
  measurement.cache_write_cost_microdollars,
  measurement.web_cost_microdollars,
  measurement.estimated_cost_microdollars,
  measurement.pricing_catalog_id,
  measurement.measured_at
from public.wasil_request_measurements as measurement
join public.wasil_requests as request on request.id = measurement.request_id;

revoke all on table public.wasil_pricing_catalogs from public, anon, authenticated;
revoke all on table public.wasil_pricing_models from public, anon, authenticated;
revoke all on table public.wasil_pricing_rates from public, anon, authenticated;
revoke all on table public.wasil_pricing_model_aliases from public, anon, authenticated;
revoke all on table public.wasil_request_measurements from public, anon, authenticated;
revoke all on table public.wasil_cost_observations from public, anon, authenticated;

grant all on table public.wasil_pricing_catalogs to service_role;
grant all on table public.wasil_pricing_models to service_role;
grant all on table public.wasil_pricing_rates to service_role;
grant all on table public.wasil_pricing_model_aliases to service_role;
grant all on table public.wasil_request_measurements to service_role;
grant select on table public.wasil_requests to service_role;
grant select on table public.wasil_cost_observations to service_role;
