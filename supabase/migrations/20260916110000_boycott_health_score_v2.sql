-- OUMMAH Scan: persistence for the versioned Health Index v2.
alter table public.boycott_scanned_products
  add column if not exists health_score numeric,
  add column if not exists health_components jsonb;

alter table public.boycott_scanned_products
  drop constraint if exists boycott_scanned_products_health_score_range;
alter table public.boycott_scanned_products
  add constraint boycott_scanned_products_health_score_range
  check (health_score is null or (health_score >= 0 and health_score <= 100));

create or replace function public.record_boycott_scan_knowledge(p_knowledge jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_knowledge is null or coalesce(p_knowledge->>'barcode','') !~ '^[0-9]{8,14}$' then return; end if;
  insert into public.boycott_scanned_products (barcode, product_name, brand, image_url, categories, generic_name, data_completeness, needs_review, review_reasons, health_grade, health_score, health_components, health_score_version, health_calculated_at, first_seen_at, last_seen_at, scan_count, last_enriched_at, openfoodfacts_updated_at)
  values (p_knowledge->>'barcode', nullif(btrim(p_knowledge->>'product_name'), ''), nullif(btrim(p_knowledge->>'brand'), ''), nullif(btrim(p_knowledge->>'image_url'), ''), p_knowledge->'categories', nullif(btrim(p_knowledge->>'generic_name'), ''), case when p_knowledge->>'data_completeness' in ('complete','partial','poor','unknown') then p_knowledge->>'data_completeness' else 'unknown' end, coalesce((p_knowledge->>'needs_review')::boolean, false), coalesce(p_knowledge->'review_reasons','[]'::jsonb), nullif(p_knowledge->>'health_grade',''), nullif(p_knowledge->>'health_score','')::numeric, p_knowledge->'health_components', nullif(p_knowledge->>'health_score_version',''), nullif(p_knowledge->>'health_calculated_at','')::timestamptz, now(), now(), 1, now(), nullif(p_knowledge->>'openfoodfacts_updated_at','')::timestamptz)
  on conflict (barcode) do update set
    product_name = coalesce(excluded.product_name, boycott_scanned_products.product_name), brand = coalesce(excluded.brand, boycott_scanned_products.brand), image_url = coalesce(excluded.image_url, boycott_scanned_products.image_url), categories = coalesce(excluded.categories, boycott_scanned_products.categories), generic_name = coalesce(excluded.generic_name, boycott_scanned_products.generic_name), data_completeness = excluded.data_completeness, needs_review = excluded.needs_review, review_reasons = excluded.review_reasons, health_grade = coalesce(excluded.health_grade, boycott_scanned_products.health_grade), health_score = coalesce(excluded.health_score, boycott_scanned_products.health_score), health_components = coalesce(excluded.health_components, boycott_scanned_products.health_components), health_score_version = coalesce(excluded.health_score_version, boycott_scanned_products.health_score_version), health_calculated_at = coalesce(excluded.health_calculated_at, boycott_scanned_products.health_calculated_at), last_seen_at = now(), scan_count = boycott_scanned_products.scan_count + 1, last_enriched_at = now(), openfoodfacts_updated_at = coalesce(excluded.openfoodfacts_updated_at, boycott_scanned_products.openfoodfacts_updated_at);
end;
$$;
revoke all on function public.record_boycott_scan_knowledge(jsonb) from public;
grant execute on function public.record_boycott_scan_knowledge(jsonb) to anon, authenticated;
