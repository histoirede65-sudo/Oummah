# Audit — correction générale de la couverture documentaire

## Cause de l'échec observé

Le vérificateur sémantique était déjà fail-open : il ne supprimait pas un corpus entier lorsqu'il hésitait. L'absence totale de références venait donc d'une étape antérieure : pour un thème jamais décrit dans les listes locales, les requêtes documentaires étaient parfois trop pauvres pour produire le moindre candidat Coran ou Hadith.

## Correction structurelle

1. `IslamicQueryExpansion` produit désormais, pour tout thème religieux :
   - des termes Coran ;
   - des termes Hadith ;
   - des références coraniques candidates uniquement lorsque le modèle en connaît avec forte confiance.
2. Les références proposées sont limitées au format strict `chapitre:verset` puis réinjectées comme termes de recherche. Elles ne sont jamais affichées sans récupération par le moteur documentaire.
3. `HadithRepository` accepte des expressions supplémentaires issues de cette expansion générale et les fusionne avec les mots-clés déterministes existants.
4. La clé de cache Hadith inclut les termes d'expansion afin qu'une ancienne recherche pauvre ne masque pas une recherche enrichie.
5. Le comportement reste fail-open : si l'expansion IA échoue ou dépasse son délai, les moteurs déterministes continuent de fonctionner.

## Fichiers modifiés

- `wasil/engine/IslamicQueryExpansion.ts`
- `wasil/engine/repositories/HadithRepository.ts`
- `wasil/index.ts`

Aucun fichier frontend ni aucun autre module OUMMAH n'a été modifié.
