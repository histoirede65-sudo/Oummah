-- OUMMAH Scan — grille des organismes jusque-là « informations insuffisantes » (recherches du 03/10/2026).
-- Règle validée : un critère que l'organisme ne publie pas, et qu'aucune source identifiable ne documente,
-- s'affiche « Non garanti » (l'app ne l'invente pas). « no » = l'organisme (ou un document cité) indique
-- accepter la pratique. sourceStatus « reported » = source tierce identifiée et datée.

-- EHZ / Eurohalal (eurohalal.eu est le site de l'EHZ) : directives officielles -----------------------
update public.halal_certification_bodies set documentation_level = 'documented',
 summary = 'Organisme documenté : l’EHZ (Hambourg) publie ses directives halal. Il exige un sacrificateur musulman et l’invocation, mais accepte l’étourdissement lorsque l’abattage sans étourdissement n’est pas autorisé, l’abattage mécanique des volailles et les sites traitant aussi des produits non halal (après nettoyage).',
 official_website = 'https://eurohalal.eu',
 criteria = $j${
  "slaughterer": {"status": "yes", "value": "Les abattages doivent être faits par des sacrificateurs musulmans (5.1.2).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "tasmiya": {"status": "yes", "value": "Le nom d’Allah doit être prononcé sur chaque bête (5.1.6) ; en abattage mécanique des volailles, au démarrage de la machine par un musulman, à chaque redémarrage (5.1.7).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "noStunning": {"status": "no", "value": "L’abattage sans étourdissement est privilégié « si possible et autorisé » ; sinon, l’étourdissement (électrique, ou au gaz pour les volailles) est appliqué, la bête ne devant pas mourir avant la saignée (5.1.4-5.1.5 et annexe).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "manualSlaughter": {"status": "no", "value": "L’abattage mécanique des volailles est accepté ; les bêtes manquées par la machine sont égorgées à la main par des musulmans (5.1.7).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "traceability": {"status": "yes", "value": "Surveillance « sans interruption de la matière première au produit fini » ; contrôle des numéros vétérinaires de la viande par rapport au certificat (5 et 5.4.1).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "ingredients": {"status": "yes", "value": "Ingrédients, additifs et colorants doivent être conformes ; analyses en laboratoire indépendant si nécessaire (5 et 5.4.7).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]},
  "noPork": {"status": "no", "value": "Les machines ayant servi à des animaux non halal peuvent être utilisées après nettoyage ; séparation des lignes exigée, ou arrangements au cas par cas (5.1.12 et 5.4.2).", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}]}
 }$j$::jsonb,
 sources = $j$[{"title": "Halal-Richtlinien für die Halal-Zertifizierung", "organisation": "EHZ", "url": "https://eurohalal.eu/wp-content/uploads/2021/03/EHZ-Halal-Richtlinien_D.pdf"}, {"title": "Site officiel", "organisation": "EHZ", "url": "https://eurohalal.eu"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id in ('ehz', 'eurohalal');
update public.halal_certification_bodies set full_name = 'Eurohalal — EHZ (Europäisches Halal Zertifizierungsinstitut)' where id = 'eurohalal';

-- IFANCA : système « cinq étoiles » publié par l'organisme ---------------------------------------------
update public.halal_certification_bodies set documentation_level = 'documented', official_website = 'https://ifanca.org',
 summary = 'Organisme documenté : IFANCA publie un système à cinq étoiles. Sacrificateur musulman et invocation sur chaque bête sont exigés ; l’absence d’étourdissement et l’abattage entièrement manuel ne sont garantis que pour les produits qui portent l’étoile correspondante.',
 criteria = $j${
  "slaughterer": {"status": "yes", "value": "Uniquement des sacrificateurs musulmans ; IFANCA ne certifie ni n’accepte la viande abattue par des non-musulmans.", "sourceStatus": "declared_by_body", "sources": [{"title": "Five Star Halal Identification System", "organisation": "IFANCA", "url": "https://ifanca.org/unique-five-star-halal-identification-system/"}]},
  "tasmiya": {"status": "yes", "value": "Tasmiya et takbîr sur chaque bête au moment de l’égorgement ; en abattage mécanique des volailles, à la mise en marche par un musulman, avec un musulman sur la ligne.", "sourceStatus": "declared_by_body", "sources": [{"title": "Five Star Halal Identification System", "organisation": "IFANCA", "url": "https://ifanca.org/unique-five-star-halal-identification-system/"}]},
  "noStunning": {"status": "partial", "value": "Garanti seulement pour les produits « cinq étoiles » ; IFANCA certifie aussi des abattoirs de viande rouge qui étourdissent.", "sourceStatus": "declared_by_body", "sources": [{"title": "Five Star Halal Identification System", "organisation": "IFANCA", "url": "https://ifanca.org/unique-five-star-halal-identification-system/"}]},
  "manualSlaughter": {"status": "partial", "value": "Abattage manuel traditionnel pour la deuxième étoile ; abattage mécanique accepté pour les volailles.", "sourceStatus": "declared_by_body", "sources": [{"title": "Five Star Halal Identification System", "organisation": "IFANCA", "url": "https://ifanca.org/unique-five-star-halal-identification-system/"}]}
 }$j$::jsonb,
 sources = $j$[{"title": "Five Star Halal Identification System", "organisation": "IFANCA", "url": "https://ifanca.org/unique-five-star-halal-identification-system/"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'ifanca';

-- JAKIM : protocole officiel malaisien (2011) -------------------------------------------------------------
update public.halal_certification_bodies set documentation_level = 'documented', official_website = 'https://www.halal.gov.my',
 summary = 'Organisme documenté (autorité publique malaisienne) : le protocole officiel autorise l’étourdissement réversible ; il exige un sacrificateur musulman, l’invocation, un contrôleur halal musulman en salle d’abattage et interdit tout produit porcin dans l’établissement.',
 criteria = $j${
  "slaughterer": {"status": "yes", "value": "Sacrificateur musulman enregistré, formé et supervisé par l’organisme de certification (5.3).", "sourceStatus": "verified", "sources": [{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM / Département des normes de Malaisie", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]},
  "tasmiya": {"status": "yes", "value": "La tasmiya est prononcée par le sacrificateur musulman juste avant l’égorgement (4.5.2 f).", "sourceStatus": "verified", "sources": [{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]},
  "noStunning": {"status": "no", "value": "Étourdissement autorisé « si utilisé », à condition d’être réversible et de ne pas tuer ; les bêtes mortes de l’étourdissement sont retirées (4.5.1).", "sourceStatus": "verified", "sources": [{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]},
  "permanentControl": {"status": "yes", "value": "Un contrôleur halal musulman doit être présent en salle d’abattage (étourdissement, égorgement, saignée), plus un superviseur halal musulman (4.5.4).", "sourceStatus": "verified", "sources": [{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]},
  "noPork": {"status": "yes", "value": "Aucun produit de porc ou de chien n’est admis dans un établissement agréé ; les produits non halal y sont interdits (4.2.2-4.2.3).", "sourceStatus": "verified", "sources": [{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]}
 }$j$::jsonb,
 sources = $j$[{"title": "Malaysian Protocol for the Halal Meat and Poultry Productions (2011)", "organisation": "JAKIM", "publishedAt": "2011-01-01", "url": "https://law.resource.org/pub/my/ibr/ms.halal.protocol.2011.pdf"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'jakim';

-- MUIS : norme MUIS-HC-S001 (version projet consultée) ----------------------------------------------------
update public.halal_certification_bodies set documentation_level = 'to_verify', official_website = 'https://www.muis.gov.sg/halal/',
 summary = 'Organisme à vérifier : la seule version consultable de la norme MUIS-HC-S001 est un projet (2005). Elle exige un musulman et la basmala, et accepte l’abattage automatique ; elle ne précise pas la règle sur l’étourdissement.',
 criteria = $j${
  "slaughterer": {"status": "yes", "value": "Abattage manuel par un musulman ; en abattage automatique, la personne qui lance la machine doit être musulmane (B.3.2).", "sourceStatus": "declared_by_body", "sources": [{"title": "MUIS-HC-S001 (projet, 2005)", "organisation": "MUIS", "publishedAt": "2005-01-01", "url": "https://halalrc.org/images/Research%20Material/Report/Processing%20of%20Halal%20Food.pdf"}]},
  "tasmiya": {"status": "yes", "value": "Le sacrificateur, ou la personne qui lance la machine, récite la basmala (B.4.2).", "sourceStatus": "declared_by_body", "sources": [{"title": "MUIS-HC-S001 (projet, 2005)", "organisation": "MUIS", "publishedAt": "2005-01-01", "url": "https://halalrc.org/images/Research%20Material/Report/Processing%20of%20Halal%20Food.pdf"}]},
  "manualSlaughter": {"status": "no", "value": "L’abattage automatique est accepté, avec vérification que les bêtes sont vivantes avant la coupe (B.4.2 d).", "sourceStatus": "declared_by_body", "sources": [{"title": "MUIS-HC-S001 (projet, 2005)", "organisation": "MUIS", "publishedAt": "2005-01-01", "url": "https://halalrc.org/images/Research%20Material/Report/Processing%20of%20Halal%20Food.pdf"}]}
 }$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'muis';

-- CICOT : règlement officiel R-CICOT-01 ---------------------------------------------------------------------
update public.halal_certification_bodies set documentation_level = 'to_verify', official_website = 'https://www.cicot.or.th',
 summary = 'Organisme à vérifier : le règlement officiel consulté (R-CICOT-01) impose un système de traçabilité, mais ne détaille pas les règles d’abattage (sacrificateur, étourdissement, contrôle).',
 criteria = $j${
  "traceability": {"status": "yes", "value": "Les entreprises certifiées doivent avoir un système de traçabilité (date et lieu de production, lot, certificat…) (9.6).", "sourceStatus": "declared_by_body", "sources": [{"title": "Regulations and Conditions R-CICOT-01", "organisation": "CICOT", "url": "https://www.cicot.or.th/storages/contents/attachments/R_CICOT_01_Eng.pdf"}]}
 }$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'cicot';

-- HFA (Royaume-Uni) : déclaration de 2014 -------------------------------------------------------------------
update public.halal_certification_bodies set documentation_level = 'to_verify', official_website = 'https://halalfoodauthority.com',
 summary = 'Organisme à vérifier : selon sa déclaration de 2014, HFA accepte l’étourdissement des volailles par bain électrique (paramètres non mortels), sous la supervision de ses représentants.',
 criteria = $j${
  "noStunning": {"status": "no", "value": "Étourdissement des volailles par bain électrique accepté (1000 Hz minimum, 205 mA maximum par oiseau).", "sourceStatus": "reported", "sources": [{"title": "UK: HFA stance on Stunning under EU Regulation EC1099/2009", "organisation": "HalalFocus (reprise de la déclaration HFA)", "publishedAt": "2014-02-14", "url": "https://halalfocus.com/uk-hfa-stance-on-stunning-under-eu-regulation-ec10992009/"}]},
  "permanentControl": {"status": "yes", "value": "L’étourdissement et l’abattage halal des volailles se font uniquement en présence et sous la supervision de représentants HFA.", "sourceStatus": "reported", "sources": [{"title": "UK: HFA stance on Stunning under EU Regulation EC1099/2009", "organisation": "HalalFocus (reprise de la déclaration HFA)", "publishedAt": "2014-02-14", "url": "https://halalfocus.com/uk-hfa-stance-on-stunning-under-eu-regulation-ec10992009/"}]}
 }$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'hfa-uk';

-- HQC France : contrôle par audits, selon sa propre description ---------------------------------------------
update public.halal_certification_bodies set criteria = $j${
  "permanentControl": {"status": "no", "value": "L’organisme décrit un contrôle par audit : un auditeur visite l’entreprise et évalue ses procédures, puis des « audits réguliers ». Aucune présence permanente n’est annoncée.", "sourceStatus": "declared_by_body", "sources": [{"title": "Halal certification", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/en/certification/"}, {"title": "Accueil", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/"}]},
  "traceability": {"status": "partial", "value": "Approche annoncée comme « couvrant tous les aspects, y compris la traçabilité », sans précision sur le dispositif.", "sourceStatus": "declared_by_body", "sources": [{"title": "Accueil", "organisation": "HQC France (Halal Office)", "url": "https://www.halalofficefrance.fr/"}]}
 }$j$::jsonb where id = 'hqc-france';

-- SFCVH et mosquée d'Évry : enquête ASIDCOM (2009) -----------------------------------------------------------
update public.halal_certification_bodies set documentation_level = 'to_verify',
 summary = 'Organisme à vérifier : le site officiel ne publie pas sa méthode. Selon l’enquête de l’association de consommateurs ASIDCOM (décembre 2009), qui cite la charte publiée alors par l’organisme, l’étourdissement avant la saignée était susceptible d’être pratiqué et les contrôleurs étaient salariés des abattoirs. Information ancienne, que l’organisme n’a pas actualisée publiquement. Le partenariat avec la Grande Mosquée de Paris a pris fin le 1er juin 2022.',
 criteria = $j${
  "ingredients": {"status": "yes", "value": "Le contrôle porte sur les produits agroalimentaires afin d’identifier toute substance ou additif non conforme.", "sourceStatus": "declared_by_body", "sources": [{"title": "Certification halal", "organisation": "SFCVH", "url": "https://www.sfcvh.com/certification_halal/"}]},
  "noStunning": {"status": "no", "value": "Étourdissement avant la saignée « susceptible d’être pratiqué » d’après la charte alors publiée par l’organisme, et utilisé pour les volailles selon les indicateurs de certification cités par l’enquête. Information de 2009.", "sourceStatus": "reported", "sources": [{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]},
  "permanentControl": {"status": "no", "value": "Contrôleurs employés par les abattoirs ; pas de contrôles indépendants. Information de 2009.", "sourceStatus": "reported", "sources": [{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]}
 }$j$::jsonb,
 sources = sources || $j$[{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'sfcvh';

update public.halal_certification_bodies set documentation_level = 'to_verify',
 summary = 'Organisme à vérifier : la mosquée d’Évry est agréée par l’État pour habiliter les sacrificateurs, mais ne publie pas sa méthode de contrôle. Selon l’enquête ASIDCOM (décembre 2009), l’étourdissement avant la saignée était susceptible d’être pratiqué et les contrôleurs étaient salariés des abattoirs. Information ancienne, que l’organisme n’a pas actualisée publiquement.',
 criteria = $j${
  "noStunning": {"status": "no", "value": "Étourdissement avant la saignée « susceptible d’être pratiqué » d’après la charte alors publiée par l’organisme. Information de 2009.", "sourceStatus": "reported", "sources": [{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]},
  "permanentControl": {"status": "no", "value": "Contrôleurs employés par les abattoirs ; pas de contrôles indépendants et permanents. Information de 2009.", "sourceStatus": "reported", "sources": [{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]}
 }$j$::jsonb,
 sources = sources || $j$[{"title": "Enquête sur les organismes de contrôle de viande halal", "organisation": "ASIDCOM", "publishedAt": "2009-12-01", "url": "https://www.asidcom.org/files/img/pdf/enquete_certificateurs_halal_asidcom_2009.pdf"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'mosquee-evry';

-- Grande Mosquée de Paris : site officiel de sa certification (depuis 2022) -------------------------------
update public.halal_certification_bodies set documentation_level = 'to_verify', official_website = 'https://www.certificationhalal-grandemosqueedeparis.fr',
 summary = 'Organisme à vérifier : depuis 2022, la Grande Mosquée de Paris délivre sa propre certification et indique que ses contrôleurs veillent à toutes les étapes de production. Elle ne publie pas sa règle sur l’étourdissement ni le détail de son cahier des charges.',
 criteria = $j${
  "permanentControl": {"status": "partial", "value": "« À toutes les étapes de production, les contrôleurs de la GMP veillent au respect des procédures » ; la présence continue n’est pas précisée.", "sourceStatus": "declared_by_body", "sources": [{"title": "Certification halal", "organisation": "Grande Mosquée de Paris", "url": "https://www.certificationhalal-grandemosqueedeparis.fr/"}]}
 }$j$::jsonb,
 sources = sources || $j$[{"title": "Certification halal (site dédié)", "organisation": "Grande Mosquée de Paris", "url": "https://www.certificationhalal-grandemosqueedeparis.fr/"}]$j$::jsonb,
 last_verified_at = '2026-10-03'
where id = 'grande-mosquee-de-paris';

-- HFCE et Halal Services : aucune source exploitable ; la grille affiche « Non garanti » partout ------------
update public.halal_certification_bodies set summary = 'Informations insuffisantes : l’organisme ne publie ni sa règle sur l’étourdissement, ni son mode de contrôle, et aucune source identifiable ne les documente. Aucun critère n’est donc garanti publiquement.', last_verified_at = '2026-10-03' where id in ('hfce', 'halal-services');
