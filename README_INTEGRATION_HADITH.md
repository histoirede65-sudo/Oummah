# OUMMAH — Intégration navigation des recueils HadeethEnc

Copier le contenu du ZIP à la racine du projet OUMMAH et accepter le remplacement des fichiers indiqués.

## Fichiers remplacés

- `src/app/hadith/collections.tsx`
- `src/app/hadith/search.tsx`
- `src/features/hadith-explorer/data/hadithRepository.ts`
- `src/features/hadith-explorer/domain/HadithCollection.ts`

## Fichier ajouté

- `src/app/hadith/collection/[collectionId].tsx`

## Résultat

- Un clic sur un recueil ouvre désormais sa propre page.
- La page affiche le nombre de références disponibles.
- Le bloc **Dernier hadith consulté** apparaît lorsqu’un hadith de ce recueil a déjà été ouvert.
- Les hadiths sont organisés par types thématiques.
- La liste complète est chargée progressivement par groupes de 20.
- Les recherches par type et par recueil utilisent une intersection des résultats HadeethEnc.

Aucun autre module n’est modifié.

## Test

```powershell
npx.cmd expo start --go
```
