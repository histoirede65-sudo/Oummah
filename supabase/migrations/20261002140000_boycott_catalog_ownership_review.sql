-- OUMMAH Boycott — revue de propriété du 2026-10-02.
-- Règle inchangée : une marque hérite du statut de son groupe (parent_group) uniquement
-- lorsqu'une source officielle établit la propriété. Aucune nouvelle décision de boycott de groupe.

-- 1) Corrections : la propriété retenue n'est plus exacte pour le marché français.
--    Désactivation (réversible) plutôt que suppression.
--    Herta : Nestlé a cédé ses 40 % restants à Casa Tarradellas le 23/12/2025 (RIA, 08/01/2026).
--    Schweppes : en France, la marque appartient à Suntory Beverage & Food France depuis 2009.
update public.boycott_entities
set is_active = false, updated_at = now()
where slug in ('herta', 'schweppes');

-- 2) Marques du portefeuille de groupes déjà classés, propriété vérifiée sur source officielle.
with sources as (
  select
    jsonb_build_object('label', 'BDS — Coca-Cola ciblée', 'url', 'https://www.bdsmovement.net/get-involved-boycott') as bds_coca,
    jsonb_build_object('label', 'BDS — appel au boycott de L’Oréal (historique documenté)', 'url', 'https://www.bdsmovement.net/news/l%25E2%2580%2599oreal-makeup-israeli-apartheid-0') as bds_loreal,
    jsonb_build_object('label', 'L’Oréal Groupe — portefeuille officiel', 'url', 'https://www.loreal.com/en/our-global-brands-portfolio/') as loreal_portfolio,
    jsonb_build_object('label', 'L’Oréal — communiqué du 03/09/2026 (marques L’Oréal France : Mixa, DOP, Narta, Cadum…)', 'url', 'https://www.loreal.com/fr/press-release/group/jep-2026/') as loreal_france,
    jsonb_build_object('label', 'L’Oréal France — dossier de presse mai 2017 (Ushuaïa)', 'url', 'https://www.loreal.com/-/media/project/loreal/brand-sites/corp/master/lcorp/documents-media/publications/sbwa/2017-lengagement-de-loreal-france-et-de-ses-marques-en-matiere-de-developpement-durable.pdf') as loreal_ushuaia,
    jsonb_build_object('label', 'L’Oréal — finalisation de l’acquisition de Kering Beauté (Creed), 31/03/2026', 'url', 'https://www.loreal-finance.com/eng/press-release/loreal-completes-acquisition-kering-beaute-within-framework-its-strategic-alliance') as loreal_kering
),
new_brands(slug, name, aliases, category, parent_group, source_key) as (
  values
    ('cappy', 'Cappy', array['Cappy Pulpy']::text[], 'beverage', 'The Coca-Cola Company', 'cappy'),
    ('chaudfontaine', 'Chaudfontaine', array[]::text[], 'beverage', 'The Coca-Cola Company', 'chaudfontaine'),
    ('dop', 'DOP', array['Dop', 'P''tit Dop', 'Vivelle Dop']::text[], 'other', 'L''Oréal Groupe', 'loreal_france'),
    ('narta', 'Narta', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_france'),
    ('cadum', 'Cadum', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_france'),
    ('ushuaia', 'Ushuaïa', array['Ushuaia']::text[], 'other', 'L''Oréal Groupe', 'loreal_ushuaia'),
    ('dr-g', 'Dr.G', array['Dr. G', 'Dr G']::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('thayers', 'Thayers', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('dark-and-lovely', 'Dark & Lovely', array['Dark and Lovely']::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('niely', 'Niely', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('aesop', 'Aesop', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('atelier-cologne', 'Atelier Cologne', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('jacquemus-parfums', 'Jacquemus', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('medik8', 'Medik8', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('miu-miu-beauty', 'Miu Miu', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('urban-decay', 'Urban Decay', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('carita', 'Carita', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('cacharel-parfums', 'Cacharel', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('diesel-parfums', 'Diesel', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('it-cosmetics', 'IT Cosmetics', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_portfolio'),
    ('creed', 'Creed', array[]::text[], 'other', 'L''Oréal Groupe', 'loreal_kering')
)
insert into public.boycott_entities (slug, name, aliases, category, parent_group, summary, evidence_kind, sources, last_verified_at, is_active)
select
  b.slug,
  b.name,
  b.aliases,
  b.category,
  b.parent_group,
  case when b.parent_group = 'The Coca-Cola Company'
    then b.name || ' fait partie du portefeuille de The Coca-Cola Company. OUMMAH lui applique le statut rouge par héritage du groupe, le lien documenté retenu concernant Coca-Cola ; cela ne signifie pas que cette marque a, elle-même, financé directement l’armée israélienne.'
    else b.name || ' appartient au portefeuille L’Oréal Groupe. OUMMAH applique le statut rouge par héritage du groupe à partir d’un lien historique documenté par BDS ; la fiche ne prétend pas que cette marque finance directement l’armée israélienne.'
  end,
  'parent_group',
  case b.source_key
    when 'cappy' then jsonb_build_array(s.bds_coca, jsonb_build_object('label', 'Coca-Cola — page officielle Cappy', 'url', 'https://www.coca-cola.com/ch/fr/brands/cappy'))
    when 'chaudfontaine' then jsonb_build_array(s.bds_coca, jsonb_build_object('label', 'Coca-Cola Belgique — Chaudfontaine (acquise en 2003)', 'url', 'https://www.coca-cola.com/be/fr/media-center/le-site-d-embouteillage-de-chaudfontaine-fete-son-100e-anniversa'))
    when 'loreal_france' then jsonb_build_array(s.bds_loreal, s.loreal_france)
    when 'loreal_ushuaia' then jsonb_build_array(s.bds_loreal, s.loreal_ushuaia)
    when 'loreal_kering' then jsonb_build_array(s.bds_loreal, s.loreal_kering)
    else jsonb_build_array(s.bds_loreal, s.loreal_portfolio)
  end,
  '2026-10-02'::timestamptz,
  true
from new_brands b cross join sources s
on conflict (slug) do nothing;
