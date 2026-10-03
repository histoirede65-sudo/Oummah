-- OUMMAH Scan: cleaned product photos (background removed, square, WebP).
-- Generated offline by scripts/product-images from Open Food Facts photos (CC BY-SA 3.0).
-- The app reads only rows with status = 'ready'; 'rejected' rows stop the batch from retrying.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  1048576,
  array['image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.product_images (
  barcode text primary key,
  status text not null,
  storage_path text,
  width integer,
  height integer,
  source text not null default 'openfoodfacts',
  source_url text,
  license text not null default 'CC-BY-SA-3.0',
  reject_reason text,
  processed_at timestamptz not null default now(),
  constraint product_images_barcode_valid check (barcode ~ '^[0-9]{8,14}$'),
  constraint product_images_status_allowed check (status in ('ready', 'rejected')),
  constraint product_images_ready_has_path check (status <> 'ready' or storage_path is not null)
);

alter table public.product_images enable row level security;

drop policy if exists "Public can read ready product images" on public.product_images;
create policy "Public can read ready product images"
  on public.product_images
  for select
  to anon, authenticated
  using (status = 'ready');

grant select on public.product_images to anon, authenticated;
