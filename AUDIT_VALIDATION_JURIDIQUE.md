# OUMMAH — Validation documentaire et juridique Hadith

## Périmètre strict

Ce patch touche uniquement la fondation Hadith :

- une nouvelle migration additive ;
- un validateur TypeScript juridique ;
- ses tests.

Aucune migration existante, RPC d’import, interface, fonction Wasil ou autre module n’est modifié.

## Règles ajoutées

Une version source ne peut passer à `Disponible en production` que si :

- la source est `Validée` ;
- la version, la licence, l’attribution et l’URL source sont renseignées ;
- une revue juridique immuable est approuvée ;
- la redistribution est explicitement autorisée ;
- la revue correspond exactement aux métadonnées actuellement enregistrées.

Toute modification ultérieure de la licence, de l’attribution, des conditions, de l’URL, de la version ou de la langue invalide automatiquement l’ancienne approbation grâce à une empreinte documentaire.

## Publication publique

La policy publique de `hadith_source_versions` est resserrée : seules les versions en production et juridiquement publiables sont visibles.

La vue `hadith_published_translations` exige également une validation juridique valable pour la version du hadith et celle de la traduction.

## Sécurité

- Les revues juridiques sont immuables.
- Elles ne sont accessibles qu’au rôle `service_role`.
- Les fonctions de contrôle ne sont pas exposées à `anon` ou `authenticated`.
- Aucun corpus n’est importé par ce patch.
