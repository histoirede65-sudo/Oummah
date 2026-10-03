-- Alternatives produits précalculées (scripts/product-alternatives/build_product_alternatives.py).
-- « Même type » = la catégorie Open Food Facts la plus précise du produit scanné qui compte assez de
-- produits en France. Le filtre boycott est appliqué dans l'app, au moment du scan, avec le catalogue
-- à jour : ces tables ne contiennent aucun jugement de boycott.

-- Produits candidats (marqués, vendus en France, avec Nutri-Score).
create table if not exists public.product_alternative_candidates (
  barcode text primary key,
  product_name text not null,
  brands text,
  brands_tags text[] not null default '{}',
  nutriscore_grade text not null check (nutriscore_grade in ('a', 'b', 'c', 'd', 'e')),
  nutriscore_score integer,
  nova_group integer,
  popularity bigint not null default 0,
  halal_labels text[] not null default '{}',
  quantity text,
  image_url text,
  owner text,
  build_id text not null,
  updated_at timestamptz not null default now()
);
alter table public.product_alternative_candidates drop column if exists category;
alter table public.product_alternative_candidates drop column if exists category_size;
drop index if exists public.product_alternative_candidates_category_idx;

-- Catégories « type » : profondeur dans la taxonomie Open Food Facts, nombre de produits en France et
-- nom français. L'app retient la plus profonde du produit scanné (puis la plus petite).
create table if not exists public.product_alternative_categories (
  category text primary key,
  size integer not null,
  depth integer not null default 0,
  name_fr text,
  build_id text not null
);
alter table public.product_alternative_categories add column if not exists depth integer not null default 0;
alter table public.product_alternative_categories add column if not exists name_fr text;

-- Pour chaque catégorie type, les produits les plus populaires de chaque Nutri-Score.
create table if not exists public.product_alternative_category_products (
  category text not null,
  barcode text not null references public.product_alternative_candidates (barcode) on delete cascade,
  nutriscore_grade text not null,
  popularity bigint not null default 0,
  build_id text not null,
  primary key (category, barcode)
);

alter table public.product_alternative_candidates enable row level security;
alter table public.product_alternative_categories enable row level security;
alter table public.product_alternative_category_products enable row level security;

drop policy if exists "product_alternative_candidates_public_read" on public.product_alternative_candidates;
create policy "product_alternative_candidates_public_read" on public.product_alternative_candidates for select to anon, authenticated using (true);
drop policy if exists "product_alternative_categories_public_read" on public.product_alternative_categories;
create policy "product_alternative_categories_public_read" on public.product_alternative_categories for select to anon, authenticated using (true);
drop policy if exists "product_alternative_category_products_public_read" on public.product_alternative_category_products;
create policy "product_alternative_category_products_public_read" on public.product_alternative_category_products for select to anon, authenticated using (true);

-- Additifs : l'app calcule le Score Santé OUMMAH des alternatives avec le même moteur que la fiche.
alter table public.product_alternative_candidates add column if not exists additives_tags text[] not null default '{}';

-- Index : cascade de suppression (barcode) et purge des anciens builds (build_id).
create index if not exists product_alternative_category_products_barcode_idx on public.product_alternative_category_products (barcode);
create index if not exists product_alternative_category_products_build_idx on public.product_alternative_category_products (build_id);
create index if not exists product_alternative_candidates_build_idx on public.product_alternative_candidates (build_id);
create index if not exists product_alternative_categories_build_idx on public.product_alternative_categories (build_id);
