create table if not exists public.wasil_credit_products (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  credits integer not null,
  environment text not null,
  platform text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wasil_credit_products_product_id_not_blank
    check (length(btrim(product_id)) > 0),
  constraint wasil_credit_products_credits_positive
    check (credits > 0),
  constraint wasil_credit_products_environment_allowed
    check (environment in ('test', 'production')),
  constraint wasil_credit_products_platform_allowed
    check (platform in ('revenuecat_test', 'ios', 'android')),
  constraint wasil_credit_products_product_environment_platform_key
    unique (product_id, environment, platform)
);

create or replace function public.set_wasil_credit_products_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wasil_credit_products_set_updated_at
  on public.wasil_credit_products;

create trigger wasil_credit_products_set_updated_at
before update on public.wasil_credit_products
for each row
execute function public.set_wasil_credit_products_updated_at();

alter table public.wasil_credit_products enable row level security;

revoke all on table public.wasil_credit_products from anon, authenticated;
revoke all on table public.wasil_credit_products from public;
grant all on table public.wasil_credit_products to service_role;

insert into public.wasil_credit_products (
  product_id,
  credits,
  environment,
  platform
)
values
  ('oummah.wasil.credits25', 25, 'test', 'revenuecat_test'),
  ('oummah.wasil.credits75', 75, 'test', 'revenuecat_test'),
  ('oummah.wasil.credits180', 180, 'test', 'revenuecat_test'),
  ('oummah.wasil.credits400', 400, 'test', 'revenuecat_test')
on conflict (product_id, environment, platform) do update
set credits = excluded.credits,
    active = true;
