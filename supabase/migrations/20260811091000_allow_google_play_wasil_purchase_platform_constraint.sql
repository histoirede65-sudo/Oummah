-- OUMMAH — autorise Google Play sur les achats Wasil.
-- Contrainte actuelle : revenuecat_test, ios, android.

alter table public.wasil_credit_purchases
  drop constraint if exists wasil_credit_purchases_platform_allowed;

alter table public.wasil_credit_purchases
  add constraint wasil_credit_purchases_platform_allowed
  check (platform in ('revenuecat_test', 'ios', 'android', 'google_play'));
