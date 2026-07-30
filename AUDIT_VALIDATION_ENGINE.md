# Audit Validation Engine V2

Périmètre strict : `scripts/hadith/` uniquement.

## Corrigé

- moteur commun pour corpus structurés et sources documentaires ;
- calcul correct des fiches valides par index de fiche ;
- doublons d'identifiants, numéros globaux et numéros dans le livre ;
- chapitre facultatif lorsqu'il est entièrement absent ;
- trous et inversions de numérotation par collection ;
- validation SHA-256 et conflits d'un même identifiant documentaire ;
- catégories HadeethEnc dupliquées ou incomplètes ;
- mappings thématiques invalides et thèmes OUMMAH inconnus ;
- rapport JSON HadeethEnc persistant ;
- script HadeethEnc importable dans les tests sans exécuter `main()` ;
- tests dédiés Bukhari, moteur commun et HadeethEnc.

## Validation effectuée

Compilation TypeScript stricte réalisée avec des déclarations Node temporaires, sans modifier le projet.

Tests exécutés avec succès :

- `Validation Engine V2 : tests réussis`
- `Validation pipeline V1: tests réussis`
- `Validation HadeethEnc V2 : tests réussis`

Aucune migration, RPC, écriture Supabase ou requête d'import réelle n'a été exécutée.
