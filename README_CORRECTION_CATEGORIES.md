# Correction — catégories des recueils

Décompresser ce ZIP à la racine du projet OUMMAH et accepter le remplacement.

## Modification exacte

- `src/app/hadith/collection/[collectionId].tsx`
  - les catégories n'ouvrent plus la page de recherche ;
  - elles ouvrent une page dédiée contenant directement les hadiths classés dans la catégorie ;
  - le titre devient « Explorer par catégorie ».

- `src/app/hadith/collection/[collectionId]/[themeId].tsx`
  - nouvelle page de catégorie ;
  - vraie liste de hadiths limitée au recueil et à la catégorie ;
  - chargement progressif par groupes de 20 ;
  - aucune barre de recherche.

- `src/features/hadith-explorer/domain/HadithCollection.ts`
  - ajout du résolveur de catégorie.

Aucun autre module n'est modifié.

## Lancement

```powershell
npx.cmd expo start --go
```
