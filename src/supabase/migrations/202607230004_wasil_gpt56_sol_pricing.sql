insert into public.wasil_pricing_catalogs (
  version,
  effective_from,
  source_url,
  currency,
  rounding_policy
)
values (
  'openai-2026-07-23-gpt-5.6-sol-v1',
  '2026-07-23T00:00:00Z'::timestamptz,
  'https://developers.openai.com/api/docs/pricing',
  'USD',
  'round_half_up'
)
on conflict (version) do update
set
  effective_from = excluded.effective_from,
  source_url = excluded.source_url,
  currency = excluded.currency,
  rounding_policy = excluded.rounding_policy;

insert into public.wasil_pricing_models (
  catalog_id,
  model,
  cache_write_applicable
)
select
  catalog.id,
  'gpt-5.6-sol',
  true
from public.wasil_pricing_catalogs as catalog
where catalog.version = 'openai-2026-07-23-gpt-5.6-sol-v1'
on conflict (catalog_id, model) do update
set cache_write_applicable = excluded.cache_write_applicable;

insert into public.wasil_pricing_rates (
  catalog_id,
  model,
  processing_mode,
  context_tier,
  input_uncached_usd_per_million,
  input_cached_usd_per_million,
  cache_write_usd_per_million,
  output_usd_per_million,
  web_call_usd
)
select
  catalog.id,
  'gpt-5.6-sol',
  'standard',
  'short',
  5.00,
  0.50,
  6.25,
  30.00,
  0.010
from public.wasil_pricing_catalogs as catalog
where catalog.version = 'openai-2026-07-23-gpt-5.6-sol-v1'
on conflict (catalog_id, model, processing_mode, context_tier) do update
set
  input_uncached_usd_per_million = excluded.input_uncached_usd_per_million,
  input_cached_usd_per_million = excluded.input_cached_usd_per_million,
  cache_write_usd_per_million = excluded.cache_write_usd_per_million,
  output_usd_per_million = excluded.output_usd_per_million,
  web_call_usd = excluded.web_call_usd;
