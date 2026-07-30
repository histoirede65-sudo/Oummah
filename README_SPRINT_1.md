# OUMMAH — Hadith / Sprint 1

Ce lot prépare le corpus officiel HadeethEnc français **sans modifier l'interface** et **sans lancer d'écriture distante**.

## Résultat validé

- 1 790 fiches uniques
- 1 790 textes arabes
- 1 790 traductions françaises
- 1 790 explications françaises
- 304 fiches avec bénéfices/enseignements fournis par la source
- 0 identifiant dupliqué
- 0 champ obligatoire manquant

Le fichier Excel officiel a été converti en payload JSON stable :

`script/hadith/data/hadeethenc-fr-v1.17.0.payload.json`

Aucun texte religieux n'a été inventé, traduit ou complété. Les catégories et thèmes sont volontairement vides car l'Excel ne les fournit pas.

## Fichiers

- `scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json`
- `scripts/hadith/data/hadeethenc-fr-v1.17.0.audit.json`
- `scripts/hadith/data/hadeethenc-fr-source-mentions.csv`
- `scripts/hadith/import-hadeethenc-payload.ts`
- `supabase/migrations/20260729000800_hadith_unstructured_sources.sql`

## Validation locale uniquement

```powershell
npx.cmd tsx scripts/hadith/import-hadeethenc-payload.ts --file=scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json
```

Cette commande ne touche pas à Supabase.

## Import réel — ne pas lancer maintenant

La migration doit d'abord être revue puis appliquée. L'import réel exige ensuite un accord explicite, les variables Supabase et un contexte lifecycle complet.

```powershell
npx.cmd tsx scripts/hadith/import-hadeethenc-payload.ts --file=scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json --import --lifecycle-author="..." --lifecycle-justification="..." --lifecycle-evidence="..."
```

## Décision UI verrouillée

Dans un recueil, la carte de reprise s'appellera :

**Dernier hadith consulté**

et non « Continuer la lecture ».

## Prochaine étape

Avant l'import réel : préserver explicitement le titre arabe et créer les relations normalisées entre un hadith et les recueils cités dans le `takhrij`, afin que l'écran puisse rester organisé :

Recueil → type/thème → hadiths → fiche détaillée.
