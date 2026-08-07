alter table public.wasil_credit_products
  drop constraint if exists wasil_credit_products_platform_allowed;

alter table public.wasil_credit_products
  add constraint wasil_credit_products_platform_allowed
  check (platform in ('revenuecat_test', 'ios', 'android', 'google_play'));

insert into public.wasil_credit_products (
  product_id,
  credits,
  environment,
  platform
)
values
  ('oummah.wasil.credits25', 25, 'production', 'google_play'),
  ('oummah.wasil.credits75', 75, 'production', 'google_play'),
  ('oummah.wasil.credits180', 180, 'production', 'google_play'),
  ('oummah.wasil.credits400', 400, 'production', 'google_play')
on conflict (product_id, environment, platform) do update
set credits = excluded.credits,
    active = true;
