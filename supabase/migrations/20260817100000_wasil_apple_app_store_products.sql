-- OUMMAH — catalogue de crédits Wasil pour les achats Apple App Store.
-- Les lignes SANDBOX et PRODUCTION restent distinctes afin que les achats
-- TestFlight et App Store créditent chacun le bon environnement iOS.

insert into public.wasil_credit_products (
  product_id,
  credits,
  environment,
  platform
)
values
  ('oummah.wasil.credits25', 25, 'test', 'ios'),
  ('oummah.wasil.credits75', 75, 'test', 'ios'),
  ('oummah.wasil.credits180', 180, 'test', 'ios'),
  ('oummah.wasil.credits400', 400, 'test', 'ios'),
  ('oummah.wasil.credits25', 25, 'production', 'ios'),
  ('oummah.wasil.credits75', 75, 'production', 'ios'),
  ('oummah.wasil.credits180', 180, 'production', 'ios'),
  ('oummah.wasil.credits400', 400, 'production', 'ios')
on conflict (product_id, environment, platform) do update
set credits = excluded.credits,
    active = true;
