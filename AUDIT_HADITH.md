# Audit de compatibilité Hadith

Périmètre vérifié : migrations Hadith `00100` à `00800`.

## Correctifs intégrés dans `00800`

- Compatibilité conservée avec `public.import_hadith_batch` : aucun changement de sa signature ou de son implémentation.
- `document_structure_type` garde `structured_collection` par défaut pour les imports existants.
- Les contraintes structurées restent obligatoires pour les corpus par recueils.
- Les documents HadeethEnc ne fabriquent ni collection, ni livre, ni chapitre, ni numérotation.
- Ajout des cohérences composites entre Hadith, version source, catégories et métadonnées.
- Activation du contexte lifecycle avant les insertions : les triggers historiques ne bloquent plus l'import HadeethEnc.
- Correction de la sélection UUID de la source, sans `min(uuid)`.
- Idempotence par `source_version_id + source_hadith_id` et conflit par hash documentaire.
- Publication documentaire séparée et protégée par les mêmes contrôles juridiques que les sources structurées.
- Ajout de la vue `public.hadith_published_documentary`.
- Les catégories source ne deviennent pas automatiquement des thèmes OUMMAH.
- Les associations automatiques restent `unvalidated` et invisibles publiquement.

## État

Aucune migration n'a été exécutée et aucune donnée Supabase n'a été modifiée.
