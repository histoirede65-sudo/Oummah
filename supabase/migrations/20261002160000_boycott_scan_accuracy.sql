-- OUMMAH Scan — justesse et couverture (2026-10-02).

-- 1) Participations partielles : le statut reste "À boycotter" (participation significative du groupe),
--    mais la fiche dit exactement quelle part le groupe détient.
update public.boycott_entities
set summary = name || ' est fabriquée par Cereal Partners Worldwide, coentreprise détenue à 50 % par Nestlé et à 50 % par General Mills. OUMMAH maintient le statut À boycotter en raison de cette participation significative de Nestlé, groupe classé pour son lien documenté avec Osem-Nestlé.',
    sources = sources || jsonb_build_array(jsonb_build_object('label', 'Cereal Partners Worldwide — coentreprise Nestlé / General Mills (50/50)', 'url', 'https://en.wikipedia.org/wiki/Cereal_Partners_Worldwide')),
    last_verified_at = '2026-10-02', updated_at = now()
where slug in ('cheerios', 'chocapic', 'cini-minis', 'cookie-crisp', 'fitness', 'nestle-fitness', 'golden-grahams', 'lion-cereals', 'nesquik-cereal', 'shreddies');

update public.boycott_entities
set summary = name || ' appartient à Froneri, coentreprise de glaces détenue à 50 % par Nestlé et à 50 % par le fonds PAI Partners. OUMMAH maintient le statut À boycotter en raison de cette participation significative de Nestlé.',
    sources = sources || jsonb_build_array(jsonb_build_object('label', 'Froneri — coentreprise Nestlé / PAI Partners', 'url', 'https://en.wikipedia.org/wiki/Froneri')),
    last_verified_at = '2026-10-02', updated_at = now()
where slug in ('extreme', 'movenpick');

update public.boycott_entities
set summary = 'Les pizzas ' || name || ' sont produites depuis 2023 par European Pizza Group, coentreprise entre Nestlé et le fonds PAI Partners ; Nestlé y détient une participation non majoritaire avec des droits de vote égaux. OUMMAH maintient le statut À boycotter en raison de cette participation significative de Nestlé.',
    sources = sources || jsonb_build_array(jsonb_build_object('label', 'Nestlé — coentreprise pizzas surgelées avec PAI (2023)', 'url', 'https://www.nestle.com/media/pressreleases/allpressreleases/joint-venture-frozen-pizza-europe')),
    last_verified_at = '2026-10-02', updated_at = now()
where slug in ('wagner', 'buitoni');

update public.boycott_entities
set summary = 'La Laitière est commercialisée par Lactalis Nestlé Produits Frais, coentreprise détenue à 60 % par Lactalis et à 40 % par Nestlé. OUMMAH maintient le statut À boycotter en raison de cette participation significative de Nestlé.',
    sources = sources || jsonb_build_array(jsonb_build_object('label', 'Lactalis Nestlé Produits Frais — 60 % Lactalis / 40 % Nestlé', 'url', 'https://fr.wikipedia.org/wiki/Lactalis_Nestl%C3%A9_produits_frais')),
    last_verified_at = '2026-10-02', updated_at = now()
where slug = 'la-laitiere';

-- 2) Marques propres Carrefour vendues sans le mot "Carrefour" (les gammes "Carrefour …" sont déjà reconnues).
insert into public.boycott_entities (slug, name, aliases, category, parent_group, summary, evidence_kind, sources, last_verified_at, is_active)
select v.slug, v.name, v.aliases, 'retail', 'Carrefour',
  v.name || ' est une marque propre de Carrefour, vendue dans ses magasins. OUMMAH lui applique le statut de Carrefour, que BDS cite parmi ses cibles prioritaires ; cela ne vise pas les producteurs qui fabriquent ces produits.',
  'parent_group',
  jsonb_build_array(jsonb_build_object('label', 'BDS — campagnes de boycott (Carrefour)', 'url', 'https://www.bdsmovement.net/get-involved-boycott'), jsonb_build_object('label', 'Carrefour — page officielle de la marque', 'url', v.url)),
  '2026-10-02', true
from (values
  ('reflets-de-france', 'Reflets de France', array[]::text[], 'https://www.carrefour.fr/marques/reflets-de-france'),
  ('simpl', 'Simpl', array[]::text[], 'https://www.carrefour.fr/enseignes/garantie-prix-bas/modalites-produits-simpl'),
  ('filiere-qualite-carrefour', 'Filière Qualité Carrefour', array['FQC']::text[], 'https://www.carrefour.fr/marques/fili%C3%A8re-qualite-carrefour')
) as v(slug, name, aliases, url)
on conflict (slug) do nothing;

update public.boycott_entities
set sources = sources || jsonb_build_array(
      jsonb_build_object('label', 'Teva — acquisition de ratiopharm (2010)', 'url', 'https://ir.tevapharm.com/news-and-events/press-releases/press-release-details/2010/Teva-To-Acquire-ratiopharm/default.aspx'),
      jsonb_build_object('label', 'Teva — acquisition d’Actavis Generics (2016)', 'url', 'https://www.tevapharm.com/news-and-media/latest-news/teva-completes-acquisition-of-actavis-generics/')),
    aliases = (select array(select distinct unnest(aliases || array['Teva Santé', 'ratiopharm', 'Actavis'])))
where slug = 'teva';

-- 3) Produits connus par code-barres hors Open Food Facts (ex. médicaments, base publique ANSM).
create table if not exists public.boycott_known_products (
  barcode text primary key,
  product_name text not null,
  brand text,
  entity_slug text,
  product_kind text not null default 'other',
  source text not null,
  source_url text,
  updated_at timestamptz not null default now(),
  constraint boycott_known_products_barcode_valid check (barcode ~ '^[0-9]{8,14}$'),
  constraint boycott_known_products_kind_allowed check (product_kind in ('medicine', 'food', 'cosmetic', 'other'))
);

create index if not exists boycott_known_products_entity_idx on public.boycott_known_products (entity_slug);

alter table public.boycott_known_products enable row level security;

drop policy if exists "Public can read known products" on public.boycott_known_products;
create policy "Public can read known products"
  on public.boycott_known_products
  for select
  to anon, authenticated
  using (true);

grant select on public.boycott_known_products to anon, authenticated;
