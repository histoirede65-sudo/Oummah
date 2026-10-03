-- OUMMAH Scan — fiches des organismes de certification halal (système générique).
-- Règles éditoriales (validées) :
--  * le statut halal d'un produit et la fiche d'un organisme sont distincts : une notice peut mener à
--    « Certification à vérifier », jamais automatiquement à « Non halal » ;
--  * chaque fait a un statut : verified (institution / document officiel indépendant),
--    declared_by_body (site officiel de l'organisme) ; un fait absent s'affiche « Information non vérifiée » ;
--  * sources primaires uniquement ; aucune critique sans source primaire ; aucune note savante
--    tant que les références retenues par OUMMAH ne sont pas fournies.

create table if not exists public.halal_certification_bodies (
  id text primary key,
  name text not null,
  full_name text,
  aliases text[] not null default '{}',
  off_label_tags text[] not null default '{}',
  logo_url text,
  country text,
  official_website text,
  body_type text,
  documentation_level text not null default 'insufficient',
  summary text not null,
  facts jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  criticisms jsonb not null default '[]'::jsonb,
  scholarly_notes jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  last_verified_at date not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint halal_bodies_level_allowed check (documentation_level in ('documented', 'to_verify', 'vigilance', 'insufficient'))
);

alter table public.halal_certification_bodies enable row level security;
drop policy if exists "Public can read halal certification bodies" on public.halal_certification_bodies;
create policy "Public can read halal certification bodies"
  on public.halal_certification_bodies for select to anon, authenticated using (is_active);
grant select on public.halal_certification_bodies to anon, authenticated;

insert into public.halal_certification_bodies (id, name, full_name, aliases, off_label_tags, country, official_website, body_type, documentation_level, summary, facts, warnings, sources, last_verified_at)
values
-- AVS ---------------------------------------------------------------------------------------------
('avs', 'AVS', 'À Votre Service', array['A Votre Service', 'Association À Votre Service', 'AVS Halal'],
 array['fr:a-votre-service', 'fr:controle-certification-avs-halal', 'fr:avs', 'en:avs'],
 'France', 'https://avs.fr', 'Association loi 1901', 'documented',
 'Organisme documenté : AVS publie sur son site officiel sa méthode (présence permanente de contrôleurs, refus de tout étourdissement). Aucune mise en garde documentée par une source primaire n’est intégrée.',
 $j${
  "legalForm": {"value": "Association à but non lucratif (loi 1901), créée en 1991, siège à Saint-Denis (93).", "status": "declared_by_body", "sources": [{"title": "À propos", "organisation": "AVS", "url": "https://avs.fr/about"}]},
  "scope": {"value": "Contrôle et certification halal pour boucheries, restaurants et marques en France métropolitaine.", "status": "declared_by_body", "sources": [{"title": "À propos", "organisation": "AVS", "url": "https://avs.fr/about"}]},
  "stunningPolicy": {"value": "Aucune méthode d’étourdissement acceptée, pour tous les animaux abattus sous son contrôle (ovins, bovins, volailles) ; refus d’authentifier la viande issue d’un animal étourdi.", "status": "declared_by_body", "sources": [{"title": "À propos", "organisation": "AVS", "url": "https://avs.fr/about"}, {"title": "Les procédés de certification utilisés par AVS", "organisation": "AVS", "publishedAt": "2025-06-15", "url": "https://avs.fr/les-procedes-de-certification-utilise-par-avs-pour-garantir-le-caractere-halal-des-viandes/"}]},
  "controlMethod": {"value": "Présence permanente et continue de contrôleurs sur tous les sites de production ; plus d’une centaine de salariés, dont 80 % dédiés au contrôle.", "status": "declared_by_body", "sources": [{"title": "Les procédés de certification utilisés par AVS", "organisation": "AVS", "publishedAt": "2025-06-15", "url": "https://avs.fr/les-procedes-de-certification-utilise-par-avs-pour-garantir-le-caractere-halal-des-viandes/"}]},
  "traceability": {"value": "Contrôleurs présents de l’abattage jusqu’au conditionnement et au scellage ; matériel d’authentification personnalisé, renouvelé et toujours en possession des contrôleurs.", "status": "declared_by_body", "sources": [{"title": "Les procédés de certification utilisés par AVS", "organisation": "AVS", "publishedAt": "2025-06-15", "url": "https://avs.fr/les-procedes-de-certification-utilise-par-avs-pour-garantir-le-caractere-halal-des-viandes/"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "À propos", "organisation": "AVS", "url": "https://avs.fr/about"}, {"title": "Les procédés de certification utilisés par AVS", "organisation": "AVS", "publishedAt": "2025-06-15", "url": "https://avs.fr/les-procedes-de-certification-utilise-par-avs-pour-garantir-le-caractere-halal-des-viandes/"}]$j$::jsonb,
 '2026-10-02'),
-- ARGML -------------------------------------------------------------------------------------------
('argml', 'ARGML', 'Association Rituelle de la Grande Mosquée de Lyon', array['Association Rituelle de la Grande Mosquée de Lyon', 'Grande Mosquée de Lyon', 'Mosquée de Lyon'],
 array['fr:association-rituelle-de-la-grande-mosquee-de-lyon', 'fr:argml', 'en:argml'],
 'France', 'https://argml.com', 'Association rattachée à la Grande Mosquée de Lyon', 'documented',
 'Organisme documenté : la Grande Mosquée de Lyon est agréée par l’État pour habiliter les sacrificateurs rituels (arrêté du 27 juin 1996) et l’ARGML publie sa méthode de contrôle. Aucune mise en garde documentée par une source primaire n’est intégrée.',
 $j${
  "legalForm": {"value": "Organisation indépendante à but non lucratif, créée en 1995 par la Grande Mosquée de Lyon.", "status": "declared_by_body", "sources": [{"title": "The ARGML", "organisation": "ARGML", "url": "https://argml.com/en/the-argml/"}]},
  "officialApproval": {"value": "La Grande Mosquée de Lyon (Association rituelle de la Grande Mosquée de Lyon) est agréée comme organisme religieux habilitant les sacrificateurs rituels.", "status": "verified", "sources": [{"title": "Arrêtés du 27 juin 1996 relatifs à l’agrément d’organismes religieux habilitant des sacrificateurs rituels", "organisation": "Légifrance", "publishedAt": "1996-06-27", "url": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000171295"}]},
  "scope": {"value": "Viandes, produits carnés, plats préparés, produits transformés, cosmétiques, restaurants et boucheries.", "status": "declared_by_body", "sources": [{"title": "The ARGML", "organisation": "ARGML", "url": "https://argml.com/en/the-argml/"}]},
  "controlMethod": {"value": "Près de 80 contrôleurs rituels ; présence permanente d’un ou plusieurs contrôleurs du sacrifice rituel jusqu’au conditionnement final.", "status": "declared_by_body", "sources": [{"title": "The ARGML", "organisation": "ARGML", "url": "https://argml.com/en/the-argml/"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "The ARGML", "organisation": "ARGML", "url": "https://argml.com/en/the-argml/"}, {"title": "Arrêtés du 27 juin 1996 (agrément de la Grande Mosquée de Lyon)", "organisation": "Légifrance", "publishedAt": "1996-06-27", "url": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000171295"}]$j$::jsonb,
 '2026-10-02'),
-- Achahada ----------------------------------------------------------------------------------------
('achahada', 'Achahada', 'Association Achahada', array['ACHAHADA'],
 array['fr:achahada', 'en:achahada'],
 'France', 'https://achahada.com', 'Association', 'documented',
 'Organisme documenté : Achahada publie son cahier des charges (abattage sans étourdissement ni électronarcose, contrôle quotidien) et son dispositif de traçabilité. Aucune mise en garde générale n’est intégrée.',
 $j${
  "slaughterMethod": {"value": "Abattage rituel par un musulman pratiquant, section du larynx, des veines jugulaires et des artères carotides.", "status": "declared_by_body", "sources": [{"title": "L’association Achahada", "organisation": "Achahada", "url": "https://achahada.com/lassociation-achahada/"}]},
  "stunningPolicy": {"value": "Abattage sans étourdissement préalable ; ni électronarcose avant ou après la saignée, ni électrochoc après saignée.", "status": "declared_by_body", "sources": [{"title": "L’association Achahada", "organisation": "Achahada", "url": "https://achahada.com/lassociation-achahada/"}]},
  "controlMethod": {"value": "Contrôle journalier, 7 jours sur 7, par un agent.", "status": "declared_by_body", "sources": [{"title": "L’association Achahada", "organisation": "Achahada", "url": "https://achahada.com/lassociation-achahada/"}]},
  "traceability": {"value": "Estampilles, pics, colsons, rubans et étiquettes à l’effigie d’Achahada ; encre alimentaire avec codes de traçabilité et formes renouvelées chaque semaine ; outils numériques (QR code).", "status": "declared_by_body", "sources": [{"title": "Traçabilité", "organisation": "Achahada", "url": "https://achahada.com/tracabilite/"}]},
  "partners": {"value": "Reconnaît le contrôle d’associations musulmanes répondant au même cahier des charges.", "status": "declared_by_body", "sources": [{"title": "L’association Achahada", "organisation": "Achahada", "url": "https://achahada.com/lassociation-achahada/"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "L’association Achahada", "organisation": "Achahada", "url": "https://achahada.com/lassociation-achahada/"}, {"title": "Traçabilité", "organisation": "Achahada", "url": "https://achahada.com/tracabilite/"}]$j$::jsonb,
 '2026-10-02'),
-- SFCVH -------------------------------------------------------------------------------------------
('sfcvh', 'SFCVH', 'Société Française de Contrôle de Viande Halal', array['Société Française de Contrôle de Viande Halal'],
 array['fr:societe-francaise-de-controle-de-viande-halal', 'en:societe-francaise-de-controle-de-viande-halal', 'en:societe-francaise-de-controle-de-viande-halal-grande-mosquee-de-paris', 'fr:sfcvh'],
 'France', 'https://www.sfcvh.com', 'Société', 'insufficient',
 'Informations insuffisantes : le site officiel ne détaille pas publiquement la méthode de contrôle ni la politique d’étourdissement. Le partenariat avec la Grande Mosquée de Paris a pris fin le 1er juin 2022 (information historique) ; cela ne rend pas, à lui seul, les certifications SFCVH actuelles invalides.',
 $j${
  "scope": {"value": "Contrôle de la viande halal et de ses dérivés, et des produits de l’industrie agroalimentaire.", "status": "declared_by_body", "sources": [{"title": "Certification halal", "organisation": "SFCVH", "url": "https://www.sfcvh.com/certification_halal/"}]}
 }$j$::jsonb,
 $j$[{"id": "sfcvh-gmp-partnership-ended", "type": "partnership_ended", "level": "historical", "title": "Fin du partenariat avec la Grande Mosquée de Paris (1er juin 2022)", "summary": "La Grande Mosquée de Paris indique que son partenariat avec la SFCVH pour la certification halal a pris fin le 1er juin 2022 et que le logo commun est devenu caduc. Le communiqué ne formule aucun reproche envers la SFCVH. Information historique : elle concerne l’ancien logo commun, pas les certifications SFCVH actuelles.", "scope": "Ancien logo commun Grande Mosquée de Paris / SFCVH", "issuedBy": "Grande Mosquée de Paris", "publishedAt": "2022-06-15", "sources": [{"title": "Communiqué — rupture du partenariat avec la société SFCVH", "organisation": "Grande Mosquée de Paris", "publishedAt": "2022-06-15", "url": "https://www.grandemosqueedeparis.fr/post/communiqu%C3%A9-certification-de-lic%C3%A9it%C3%A9-halal-rupture-du-partenariat-avec-la-soci%C3%A9t%C3%A9-sfcvh"}]}]$j$::jsonb,
 $j$[{"title": "Certification halal", "organisation": "SFCVH", "url": "https://www.sfcvh.com/certification_halal/"}, {"title": "Communiqué — rupture du partenariat avec la société SFCVH", "organisation": "Grande Mosquée de Paris", "publishedAt": "2022-06-15", "url": "https://www.grandemosqueedeparis.fr/post/communiqu%C3%A9-certification-de-lic%C3%A9it%C3%A9-halal-rupture-du-partenariat-avec-la-soci%C3%A9t%C3%A9-sfcvh"}]$j$::jsonb,
 '2026-10-02'),
-- HQC France --------------------------------------------------------------------------------------
('hqc-france', 'HQC France', 'Halal Quality Control France', array['HQC', 'Halal Quality Control', 'Halal Quality Control France', 'Halal Office France'],
 array['en:halal-quality-control', 'en:hqc', 'fr:hqc-france', 'fr:halal-quality-control'],
 'France (bureau de HQC Europe)', 'https://www.halalofficefrance.fr', 'Organisme de certification privé', 'vigilance',
 'Vigilance recommandée sur la portée des accréditations : l’accréditation EIAC de HQC France est confirmée par la DG Trésor pour la viande et les produits carnés exportés vers les Émirats arabes unis. Les autres accréditations affichées (IAF, IHAF) ne sont pas accompagnées de leur périmètre. La certification d’un produit doit donc être vérifiée dans son contexte (pays, bureau, type de produit).',
 $j${
  "legalForm": {"value": "Organisme de certification halal se déclarant agréé et indépendant, fondé en 1983 ; bureau français à Paris.", "status": "declared_by_body", "sources": [{"title": "À propos de HQC France", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/apropos/"}]},
  "accreditation": {"value": "Accréditation EIAC (Emirates International Accreditation Center) pour la certification halal des viandes et produits à base de viande exportés vers les Émirats arabes unis.", "status": "verified", "sources": [{"title": "Organismes certificateurs halal accrédités en France et exportation vers les Émirats arabes unis", "organisation": "Direction générale du Trésor", "publishedAt": "2025-05-07", "url": "https://www.tresor.economie.gouv.fr/Articles/2025/05/07/organismes-certificateurs-halal-accredites-en-france-et-exportation-de-viande-cachere-vers-les-emirats-arabes-unis"}]},
  "scope": {"value": "Aliments, cosmétiques, produits pharmaceutiques et services.", "status": "declared_by_body", "sources": [{"title": "À propos de HQC France", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/apropos/"}]},
  "partners": {"value": "Membre du World Halal Food Council (WHFC) ; accréditations IAF et IHAF revendiquées sans précision de périmètre.", "status": "declared_by_body", "sources": [{"title": "À propos de HQC France", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/apropos/"}]}
 }$j$::jsonb,
 $j$[{"id": "hqc-accreditation-scope", "type": "accreditation_scope", "level": "vigilance", "title": "Portée exacte des accréditations à vérifier", "summary": "L’accréditation confirmée par une institution (DG Trésor, 07/05/2025) porte sur la viande et les produits carnés exportés vers les Émirats arabes unis. Les autres accréditations affichées par l’organisme ne précisent pas leur périmètre : elles ne doivent pas être lues comme une garantie générale.", "scope": "Accréditations et reconnaissances revendiquées", "issuedBy": "OUMMAH, d’après la DG Trésor et le site de l’organisme", "publishedAt": "2026-10-02", "sources": [{"title": "Organismes certificateurs halal accrédités en France", "organisation": "Direction générale du Trésor", "publishedAt": "2025-05-07", "url": "https://www.tresor.economie.gouv.fr/Articles/2025/05/07/organismes-certificateurs-halal-accredites-en-france-et-exportation-de-viande-cachere-vers-les-emirats-arabes-unis"}, {"title": "À propos de HQC France", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/apropos/"}]}]$j$::jsonb,
 $j$[{"title": "À propos de HQC France", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/apropos/"}, {"title": "HQC Europe — France", "organisation": "HQC Europe", "url": "https://www.hqceurope.com/hqc-france"}, {"title": "Organismes certificateurs halal accrédités en France", "organisation": "Direction générale du Trésor", "publishedAt": "2025-05-07", "url": "https://www.tresor.economie.gouv.fr/Articles/2025/05/07/organismes-certificateurs-halal-accredites-en-france-et-exportation-de-viande-cachere-vers-les-emirats-arabes-unis"}]$j$::jsonb,
 '2026-10-02'),
-- Halal Services ----------------------------------------------------------------------------------
('halal-services', 'Halal Services', null, array['Halal Service', 'Halal Services France'], array['fr:halal-services', 'en:halal-services'],
 'France', null, null, 'insufficient',
 'Informations insuffisantes : aucune source officielle de l’organisme n’a pu être consultée à ce jour. Aucune mise en garde n’est établie.',
 '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, '2026-10-02'),
-- Mosquée d'Évry ----------------------------------------------------------------------------------
('mosquee-evry', 'Mosquée d’Évry-Courcouronnes', 'Mosquée d’Évry-Courcouronnes (Association des musulmans d’Île-de-France)', array['Mosquée d''Évry', 'Mosquee d''Evry', 'Mosquée d''Évry-Courcouronnes', 'ACMIF'],
 array['fr:controle-de-la-mosquee-d-evry-courcouronnes', 'fr:halal-mosquee-courcouronnes', 'fr:mosquee-d-evry'],
 'France', null, 'Mosquée agréée (organisme religieux)', 'insufficient',
 'Informations insuffisantes : la mosquée d’Évry est agréée par l’État pour habiliter les sacrificateurs rituels (arrêté du 27 juin 1996), mais aucune source officielle consultée ne détaille publiquement sa méthode de contrôle des produits.',
 $j${
  "officialApproval": {"value": "La mosquée d’Évry (Association des musulmans d’Île-de-France) est agréée comme organisme religieux habilitant les sacrificateurs rituels.", "status": "verified", "sources": [{"title": "Arrêtés du 27 juin 1996 relatifs à l’agrément d’organismes religieux habilitant des sacrificateurs rituels", "organisation": "Légifrance", "publishedAt": "1996-06-27", "url": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000731048"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "Arrêtés du 27 juin 1996 (agrément de la mosquée d’Évry)", "organisation": "Légifrance", "publishedAt": "1996-06-27", "url": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000000731048"}]$j$::jsonb,
 '2026-10-02'),
-- Grande Mosquée de Paris -------------------------------------------------------------------------
('grande-mosquee-de-paris', 'Grande Mosquée de Paris', 'Certification halal de la Grande Mosquée de Paris', array['Mosquée de Paris', 'Grande Mosquee de Paris'],
 array['fr:controle-mosquee-de-paris-halal', 'fr:grande-mosquee-de-paris', 'en:grande-mosquee-de-paris'],
 'France', 'https://www.grandemosqueedeparis.fr/certificationhalal', 'Mosquée (certification propre)', 'insufficient',
 'Informations insuffisantes sur la méthode : la Grande Mosquée de Paris présente un cahier des charges et un code de certification, mais la page consultée ne détaille ni le contrôle, ni la politique d’étourdissement, ni la traçabilité. Depuis le 1er juin 2022, elle délivre sa propre certification avec un logo exclusif.',
 $j${
  "scope": {"value": "Cahier des charges et code de certification halal pour les produits de l’industrie agroalimentaire.", "status": "declared_by_body", "sources": [{"title": "Certification halal", "organisation": "Grande Mosquée de Paris", "url": "https://www.grandemosqueedeparis.fr/certificationhalal"}]},
  "partners": {"value": "Partenariat avec la SFCVH terminé le 1er juin 2022 ; certification propre avec logo exclusif depuis.", "status": "declared_by_body", "sources": [{"title": "Communiqué — rupture du partenariat avec la société SFCVH", "organisation": "Grande Mosquée de Paris", "publishedAt": "2022-06-15", "url": "https://www.grandemosqueedeparis.fr/post/communiqu%C3%A9-certification-de-lic%C3%A9it%C3%A9-halal-rupture-du-partenariat-avec-la-soci%C3%A9t%C3%A9-sfcvh"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "Certification halal", "organisation": "Grande Mosquée de Paris", "url": "https://www.grandemosqueedeparis.fr/certificationhalal"}, {"title": "Communiqué — rupture du partenariat avec la société SFCVH", "organisation": "Grande Mosquée de Paris", "publishedAt": "2022-06-15", "url": "https://www.grandemosqueedeparis.fr/post/communiqu%C3%A9-certification-de-lic%C3%A9it%C3%A9-halal-rupture-du-partenariat-avec-la-soci%C3%A9t%C3%A9-sfcvh"}]$j$::jsonb,
 '2026-10-02'),
-- HFCE --------------------------------------------------------------------------------------------
('hfce', 'HFCE', 'Halal Food Council of Europe', array['Halal Food Council of Europe'], array['en:halal-food-council-of-europe', 'fr:halal-food-council-of-europe'],
 'Belgique', 'https://hfce.eu', 'Organisme de certification', 'insufficient',
 'Informations insuffisantes : la page officielle consultée présente l’organisme (fondé en 2010, présent dans plusieurs pays d’Europe dont la France) sans détailler sa méthode de contrôle, sa politique d’étourdissement ni ses accréditations.',
 $j${
  "legalForm": {"value": "Organisme fondé en 2010, bureaux et affiliations en Europe dont la France.", "status": "declared_by_body", "sources": [{"title": "About", "organisation": "HFCE", "url": "https://hfce.eu/about/"}]}
 }$j$::jsonb, '[]'::jsonb,
 $j$[{"title": "About", "organisation": "HFCE", "url": "https://hfce.eu/about/"}]$j$::jsonb,
 '2026-10-02')
on conflict (id) do nothing;

-- Organismes étrangers repérés sur des produits : identification seulement, sans évaluation.
insert into public.halal_certification_bodies (id, name, full_name, aliases, off_label_tags, country, documentation_level, summary, last_verified_at)
values
 ('hfa-uk', 'HFA', 'Halal Food Authority', array['Halal Food Authority'], array['en:halal-food-authority'], 'Royaume-Uni', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('jakim', 'JAKIM', 'Department of Islamic Development Malaysia', array['Halal Malaysia'], array['en:halal-malaysia', 'en:jakim'], 'Malaisie', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('muis', 'MUIS', 'Majlis Ugama Islam Singapura', array['Halal Singapore'], array['en:halal-singapore'], 'Singapour', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('cicot', 'CICOT', 'The Central Islamic Committee of Thailand', array['Central Islamic Committee of Thailand'], array['en:the-central-islamic-committee-of-thailand'], 'Thaïlande', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('ifanca', 'IFANCA', 'Islamic Food and Nutrition Council of America / Canada', array['Islamic Food and Nutrition Council'], array['en:islamic-food-and-nutrition-council-of-canada', 'en:islamic-food-and-nutrition-council-of-america', 'en:ifanca'], 'Amérique du Nord', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('eurohalal', 'Eurohalal', null, array['Euro Halal'], array['en:eurohalal'], null, 'insufficient', 'Informations insuffisantes : organisme identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02'),
 ('ehz', 'EHZ', 'Europäisches Halal-Zertifizierungsinstitut', array['Europäisches Halal Zertifizierungsinstitut'], array['fr:europaisches-halal-zertifizierungsinstitut', 'en:europaisches-halal-zertifizierungsinstitut'], 'Allemagne', 'insufficient', 'Informations insuffisantes : organisme étranger identifié sur des produits, pas encore documenté par OUMMAH.', '2026-10-02')
on conflict (id) do nothing;
