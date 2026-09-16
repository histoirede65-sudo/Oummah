-- OUMMAH Scan: neutral scientific review queue for unknown additives.
create table if not exists public.food_additive_review_queue (
  code text primary key,
  scan_count integer not null default 0 check (scan_count >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  product_count integer not null default 0 check (product_count >= 0),
  observed_barcodes jsonb not null default '[]'::jsonb,
  review_status text not null default 'pending' check (review_status in ('pending', 'in_review', 'reviewed', 'ignored')),
  priority integer not null default 0 check (priority >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_additive_review_queue enable row level security;
revoke all on table public.food_additive_review_queue from anon, authenticated;

create or replace function public.record_food_additive_review_candidates(p_barcode text, p_codes jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_code text;
  normalized_code text;
  known_barcode boolean;
begin
  if p_codes is null or jsonb_typeof(p_codes) <> 'array' then return; end if;
  for raw_code in select value from jsonb_array_elements_text(p_codes) loop
    normalized_code := upper(regexp_replace(raw_code, '^.*?(E[0-9]{3,4}[A-Z]?).*$', '\1'));
    if normalized_code !~ '^E[0-9]{3,4}[A-Z]?$' then continue; end if;
    if exists (select 1 from public.food_additive_science where code = normalized_code) then continue; end if;
    select p_barcode = any(select jsonb_array_elements_text(observed_barcodes)) into known_barcode
      from public.food_additive_review_queue where code = normalized_code;
    known_barcode := coalesce(known_barcode, false);
    insert into public.food_additive_review_queue (code, scan_count, product_count, observed_barcodes, priority)
    values (normalized_code, 1, case when nullif(p_barcode, '') is null or known_barcode then 0 else 1 end,
      case when nullif(p_barcode, '') is null then '[]'::jsonb else jsonb_build_array(p_barcode) end, 1)
    on conflict (code) do update set
      scan_count = food_additive_review_queue.scan_count + 1,
      product_count = food_additive_review_queue.product_count + case when nullif(p_barcode, '') is null or known_barcode then 0 else 1 end,
      observed_barcodes = case when nullif(p_barcode, '') is null or known_barcode then food_additive_review_queue.observed_barcodes else food_additive_review_queue.observed_barcodes || jsonb_build_array(p_barcode) end,
      last_seen_at = now(),
      priority = food_additive_review_queue.scan_count + 1,
      updated_at = now();
  end loop;
end;
$$;

revoke all on function public.record_food_additive_review_candidates(text, jsonb) from public;
grant execute on function public.record_food_additive_review_candidates(text, jsonb) to anon, authenticated;
