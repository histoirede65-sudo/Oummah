# Patch Wasil — réponses coraniques simples plus rapides

Ce patch cible uniquement le moteur Wasil côté Supabase.

## Ce qui change

- Ajout d'un chemin rapide local et vérifié pour les demandes courtes de type « quel verset sur… ? ».
- La question « Quel est le verset sur la miséricorde ? » renvoie désormais immédiatement des références coraniques structurées (39:53 et 7:156) au lieu de tomber sur « Sources religieuses insuffisantes ».
- Ajout de quelques thèmes coraniques fréquents déjà vérifiés : miséricorde, patience, repentir/pardon, gratitude, parents, apaisement/confiance, mariage, aumône/générosité.
- Le chemin rapide évite les appels V4, mémoire/contexte, expansion IA et recherche Quran.Foundation lorsqu'une réponse locale vérifiée suffit.
- Les questions d'explication, tafsir, fiqh, halal/haram ou cas personnels restent volontairement sur le pipeline complet et strict.
- Le style du pipeline normal est resserré : réponse directe dès la première phrase pour les demandes simples, sans préambule inutile.

## Fichiers modifiés

- `src/supabase/functions/wasil/index.ts`
- `src/supabase/functions/wasil/engine/QuranKnowledgeEngine.ts`
- `src/supabase/functions/wasil/engine/IslamicQueryExpansion.ts`
- `src/supabase/functions/wasil/knowledge/quranTopics.ts`

## Fichiers ajoutés

- `src/supabase/functions/wasil/engine/QuranDirectLookup.ts`
- `src/supabase/functions/wasil/tests/quran_direct_lookup_test.mjs`

## Vérifications effectuées

- Test ciblé `quran_direct_lookup_test.mjs` : OK.
- Type-check des nouveaux composants / moteurs modifiés : OK.
- Le type-check complet de `index.ts` conserve deux erreurs préexistantes dans la structure `HadithRepositoryItem` (`repositoryScore` et `repositoryMatchedTerms`) ; les mêmes erreurs sont présentes dans la source originale non modifiée et ne proviennent donc pas de ce patch.

## Important

Le patch ne modifie ni l'interface Wasil, ni la navigation, ni les crédits, ni les règles de sécurité des questions complexes. Les réponses rapides utilisent encore le système existant de `quranReferences`, donc les cartes Coran natives OUMMAH continuent à fonctionner.
