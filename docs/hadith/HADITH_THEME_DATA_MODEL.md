# Modèle documentaire des thèmes Hadith

## Objectif

Ce modèle ajoute une navigation thématique indépendante des recueils. Un hadith peut appartenir à plusieurs thèmes et un thème peut regrouper des hadiths provenant de plusieurs collections.

La migration ne contient aucune donnée religieuse et n’insère aucun thème ni aucune association.

## Tables

### `hadith_themes`

Contient l’identité documentaire d’un thème : clé stable, slug, hiérarchie facultative, statut, version, ordre et métadonnée visuelle facultative.

Le nom affiché n’est pas stocké dans cette table afin de permettre plusieurs langues.

### `hadith_theme_translations`

Contient le nom et la description d’un thème par langue. La clé primaire est composée du thème et de la langue. Chaque traduction possède son propre statut de publication.

### `hadith_theme_assignments`

Relie les hadiths aux thèmes. L’association conserve :

- son origine (`source`, `oummah_editorial` ou `automatic_unvalidated`) ;
- l’identifiant et le libellé de catégorie source lorsqu’ils existent ;
- la version de source lorsqu’elle est connue ;
- son statut de validation ;
- sa version documentaire et sa date d’association.

Une catégorie HadeethEnc reste donc une donnée de provenance et ne devient pas automatiquement une classification éditoriale OUMMAH.

## Unicité et intégrité

Une association exacte ne peut pas être insérée deux fois. L’unicité tient compte de l’origine, de la version de source et de la catégorie source. Les valeurs `NULL` sont normalisées uniquement dans l’index d’unicité afin que deux associations éditoriales identiques restent impossibles.

Les clés étrangères empêchent les associations vers un hadith, un thème ou une version de source inexistants.

Aucun champ ne dépend de Bukhari : le même modèle sert à Muslim, Tirmidhi, Abu Dawud et aux futurs recueils.

## Publication et sécurité

Les tables sont protégées par RLS. Les rôles publics peuvent uniquement lire les thèmes, traductions et associations qui satisfont les règles de publication. Les écritures sont réservées à `service_role`.

Une association `automatic_unvalidated` n’est pas publiable par défaut. Une association `validated` peut être comptée si le thème, le hadith et la traduction sont eux-mêmes publiables. Une association provenant directement d’une source doit également être rattachée à une version de source disponible en production.

## Compteurs

La vue `public.hadith_published_theme_counts` calcule les compteurs sans colonne manuelle. Elle tient compte de :

- l’état de publication du thème ;
- l’état de publication de sa traduction ;
- la langue demandée via `language_code` ;
- l’état publiable du hadith et de sa traduction ;
- la validation ou l’autorisation documentaire de l’association.

Exemple de lecture documentée :

```sql
select theme_id, slug, name, hadith_count
from public.hadith_published_theme_counts
where language_code = 'fr'
order by hadith_count desc, name;
```

Aucune vue matérialisée ni aucun compteur stocké n’est créé à ce stade.

## Indexation

Les index couvrent :

- les thèmes parents ;
- les traductions par langue et statut ;
- les associations par hadith ;
- les associations par thème ;
- la provenance ;
- le statut de validation ;
- les filtres combinant thème et statut.

Ils permettent une pagination rapide et des filtres multi-recueils sans modifier les tables de collections.

## Évolutivité

Ajouter un recueil ne nécessite aucun changement au modèle thématique. Ajouter une langue consiste à ajouter une traduction de thème et une traduction de hadith selon les règles documentaires correspondantes. Ajouter une nouvelle source de classification conserve la même association avec une origine et une provenance explicites.
