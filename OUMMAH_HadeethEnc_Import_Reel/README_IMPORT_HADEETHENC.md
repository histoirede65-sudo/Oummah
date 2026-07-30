# OUMMAH — Import réel HadeethEnc FR

Cette livraison ne modifie aucun écran et ne touche à aucun module hors Hadith.

## 1. Copier le contenu

Décompresser ce ZIP à la racine du projet OUMMAH. Le dossier `scripts/hadith` existant peut être fusionné.

## 2. Vérifier la migration

Dans Supabase SQL Editor, exécuter d'abord `supabase/checks/01_pre_import_hadeethenc.sql`.

La colonne `import_rpc` doit afficher :

`import_hadeethenc_batch(jsonb,text,text,text,text)`

Si elle vaut `null`, ne pas lancer l'import: la migration `20260729000800_hadith_unstructured_sources.sql` n'est pas encore appliquée.

## 3. Validation locale sans écriture

```powershell
npx.cmd tsx scripts/hadith/import-hadeethenc.ts --file=scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json
```

Résultat attendu : 1790 enregistrements, 0 erreur, mode `validation-only`.

## 4. Import réel

Dans le même terminal PowerShell, définir temporairement les variables :

```powershell
$env:SUPABASE_URL="https://VOTRE_PROJECT_ID.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="VOTRE_SERVICE_ROLE_KEY"
```

Puis lancer :

```powershell
npx.cmd tsx scripts/hadith/import-hadeethenc.ts --import --resume --file=scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json --lifecycle-author="Bahri" --lifecycle-justification="Import initial du corpus officiel HadeethEnc français pour le module Hadith OUMMAH" --lifecycle-evidence="Export officiel HadeethEnc FR v1.17.0 validé localement: 1790 enregistrements, SHA-256 27ee20d49b0cdb91be8f9121e89e45f42bef9696b64e9b0ca751d561375f154b"
```

Le script importe au maximum 50 hadiths par transaction, écrit un rapport NDJSON et conserve un checkpoint. En cas d'arrêt, relancer exactement la même commande avec `--resume`.

## 5. Vérification après import

Exécuter `supabase/checks/02_post_import_hadeethenc.sql`.

Résultat attendu :

- total_hadiths: 1790
- arabic: 1790
- french: 1790
- explanations: 1790
- benefits: 304
- tous les compteurs d'erreur: 0

## Sécurité

- Ne jamais commiter la clé `SUPABASE_SERVICE_ROLE_KEY`.
- Fermer le terminal après l'import ou supprimer la variable avec :

```powershell
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
```
