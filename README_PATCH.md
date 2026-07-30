# Installation

Extraire le ZIP à la racine du projet.

Fichiers ajoutés :

```text
supabase/migrations/20260730000100_hadith_legal_validation.sql
scripts/hadith/legal-validation.ts
scripts/hadith/legal-validation.test.ts
AUDIT_VALIDATION_JURIDIQUE.md
```

Test local :

```powershell
npx.cmd tsx scripts/hadith/legal-validation.test.ts
```

Avant déploiement distant, appliquer la migration sur une base locale ou de validation dédiée et tester :

1. une version sans licence ;
2. une version sans attribution ;
3. une revue approuvée avec redistribution autorisée ;
4. une tentative de passage en production ;
5. une modification de l’attribution après approbation ;
6. le refus attendu `HADITH_LEGAL_VALIDATION_REQUIRED`.

Aucune commande de migration ou d’import n’est exécutée automatiquement.
