# Audit Wasil — moteur documentaire universel

**Date :** 26 juillet 2026  
**Périmètre strict :** `supabase/functions/wasil` et son helper partagé Quran Foundation. Aucun écran, aucune navigation React Native et aucun autre module OUMMAH n’ont été modifiés.

## Objectif

Supprimer la succession de corrections thème par thème et faire fonctionner la même chaîne documentaire pour une question connue, une formulation nouvelle ou un sujet qui n’a jamais été ajouté à une liste manuelle.

La version auditée suit désormais ce chemin unique :

```text
Question utilisateur
→ expansion sémantique de l’intention
→ cible exacte + termes Coran + termes Hadith
→ recherches Coran et Hadith en parallèle
→ classement déterministe à haute couverture
→ vérificateur sémantique de pertinence et de caractère direct
→ déduplication et contrôle indépendant des deux corpus
→ rédaction limitée aux sources retenues
→ cartes Coran/Hadith validées
```

## Causes systémiques identifiées

1. L’expansion sémantique n’était pas toujours exécutée et n’était pas partagée de manière uniforme entre le Coran et les Hadiths.
2. Des listes thématiques pouvaient influencer directement la recherche et donner l’impression que Wasil n’était bon que sur les questions déjà corrigées.
3. Une proximité lexicale suffisait parfois à faire remonter un récit historique à la place d’une preuve normative directe.
4. La recherche HadeethEnc pouvait être sautée, perdre ses résultats lors d’un fallback ou réordonner les hadiths selon le prestige du recueil au lieu de la pertinence.
5. Une source d’un corpus pouvait empêcher la recherche de l’autre corpus.
6. Les plages coraniques larges pouvaient coexister avec le verset précis qu’elles contenaient.
7. Le fallback de couverture pouvait réinjecter une source moins directe si l’ordre du vérificateur n’était pas conservé.
8. Les fallbacks documentaires n’étaient pas suffisamment bornés en domaines, en nombre de candidats et en durée.

## Corrections architecturales

### 1. Intention réellement universelle

- L’expansion sémantique produit séparément :
  - le nom canonique du sujet ;
  - les termes de recherche coraniques ;
  - les termes de recherche Hadith ;
  - les termes qui expriment la preuve exacte attendue ;
  - les notions seulement voisines ;
  - une définition textuelle de ce qu’est une preuve directe pour cette question.
- L’expansion sémantique est prioritaire lorsqu’elle réussit.
- Le lexique thématique historique ne sert plus que de repli en cas d’indisponibilité du modèle.
- En mode repli, les propres mots de la question restent la cible exacte ; le lexique organisé n’apporte que de la couverture documentaire.
- `UniversalIntent.ts` ne contient plus de catalogue de thèmes de production. Il extrait génériquement les mots et expressions de la demande.

### 2. Recherche Coran et Hadith cohérente

- Les deux corpus reçoivent exactement la même intention normalisée.
- Les recherches sont lancées en parallèle après l’expansion sémantique.
- Les termes exacts servent au classement ; les synonymes et notions voisines servent seulement à améliorer la couverture.
- Le moteur Quran Foundation conserve plusieurs expressions de recherche et mesure le nombre de requêtes ayant retrouvé chaque passage.
- Le moteur Hadith recherche des expressions françaises courtes et précises dans HadeethEnc, sans identifiant de hadith codé pour une question particulière.

### 3. Classement en deux niveaux

**Niveau déterministe :**

- priorité aux termes de preuve exacte ;
- faible poids pour les notions voisines ;
- bonus pour les formulations normatives et directives ;
- pénalité pour les récits historiques, les longues narrations et les plages coraniques trop larges ;
- pénalité lorsqu’aucun terme substantiel de la cible n’est présent ;
- stemming français léger pour les variations telles que `moquerie/moquez` ou `remercier/remerciez`.

**Niveau sémantique :**

- évalue séparément `relevance` et `directness` ;
- ne peut retourner que les identifiants candidats fournis ;
- rejette les analogies éloignées, les thèmes opposés, les récits simplement illustratifs et les plages générales lorsqu’une preuve précise existe ;
- sélectionne au maximum quatre passages coraniques et quatre hadiths ;
- échoue proprement vers un sous-ensemble déterministe strict si le service sémantique est indisponible.

### 4. Hadiths

- HadeethEnc est le premier référentiel de production.
- Les résultats HadeethEnc ne sont plus perdus si le supplément documentaire échoue.
- Le supplément OpenAI est limité à HadeethEnc et Sunnah.com.
- Une URL produite par le supplément doit avoir été réellement consultée et appartenir à un domaine autorisé.
- Les doublons par identifiant ou contenu normalisé sont supprimés.
- L’ordre de pertinence est conservé : un récit moins direct ne peut plus passer devant un hadith direct uniquement parce que son recueil a une priorité plus élevée.
- Le nombre de détails HadeethEnc est borné à 18 candidats avant la sélection finale.

### 5. Coran

- Les références sont validées et normalisées.
- Un verset précis remplace une plage plus large qui le contient, par exemple `113:5` remplace le doublon `113:1-5` + `113:5`.
- Les doublons provenant de deux moteurs sont retirés.
- Une référence coranique n’est retenue que si sa source documentaire survit au classement et à la vérification.

### 6. Couverture Coran / Sunna

- Les corpus demandés sont vérifiés indépendamment.
- La présence d’un Hadith ne bloque jamais la recherche coranique manquante, et inversement.
- Si le rédacteur oublie un corpus explicitement demandé, Wasil ajoute au maximum la meilleure source déjà vérifiée de ce corpus, jamais toute la liste.
- L’ordre final du vérificateur sémantique est conservé pour ce fallback.

### 7. Navigation

- Une question documentaire mentionnant le Coran ou la Sunna reste une question Wasil.
- La navigation n’est possible que pour une commande explicite vers une destination de l’application.
- La phrase ayant provoqué l’ouverture accidentelle du Coran fait partie des tests de régression.

### 8. Latence

- Expansion sémantique : budget maximal de 2,5 secondes.
- Vérificateur documentaire : budget maximal de 4,5 secondes.
- Supplément Hadith documentaire : budget maximal de 6,5 secondes.
- Coran et Hadith sont récupérés en parallèle.
- Les métriques suivantes sont journalisées :
  - `semanticExpansionMs` ;
  - `repositoryRetrievalMs` ;
  - `semanticVerifierMs` ;
  - `openAiMs` ;
  - `totalMs`.
- Le modèle rapide de récupération peut être configuré avec `WASIL_MODEL_RETRIEVAL`, indépendamment du modèle de réponse finale.

## Rustines supprimées

Les sélecteurs de production propres aux promesses, à la colère, à la jalousie et au mensonge ont été supprimés. Aucun verset ni identifiant HadeethEnc n’est forcé par le scorer universel ou le repository Hadith.

Les sources locales OUMMAH et les thèmes coraniques narratifs existants restent un corpus organisé, mais ils passent désormais par le même classement et le même vérificateur que les résultats dynamiques.

## Validation exécutée

### Compilation

```text
TypeScript strict : OK
Imports locaux : OK
Arborescence dupliquée wasil/wasil : absente
Clés du catalogue local : aucun doublon
```

### Tests automatiques

1. `universal_relevance_regression_test.ts`  
   **40 thèmes différents : OK**  
   Vérifie qu’une preuve directe devance un récit indirect avec une marge significative et qu’une source hors sujet reste sous le seuil.

2. `generic_lexical_intent_test.ts`  
   **10 formulations inédites : OK**  
   Vérifie l’extraction générique sans catalogue thématique.

3. `query_expansion_unseen_topic_test.ts`  
   **Sujet inédit “secret / confidence” : OK**  
   Vérifie la séparation Coran/Hadith et la définition de la preuve directe.

4. `query_expansion_fallback_and_authority_test.ts`  
   **OK**  
   Vérifie le fallback générique, l’absence de faux profil pour une question météo, la conservation de la cible exacte en panne modèle et la priorité de l’expansion sémantique.

5. `documentary_verifier_contract_test.ts`  
   **OK**  
   Vérifie le rejet des identifiants inventés et des sources insuffisamment directes.

6. `hadith_repository_resilience_test.ts`  
   **OK**  
   Vérifie qu’un résultat HadeethEnc reste disponible malgré l’échec du supplément OpenAI.

7. `quran_reference_dedup_test.ts`  
   **OK**  
   Vérifie les doublons exacts, les plages contenant un verset précis et les références invalides.

8. `navigation_regression_test.ts`  
   **OK**  
   Vérifie qu’une question documentaire ne déclenche pas l’ouverture du Coran et qu’une vraie commande d’ouverture continue de fonctionner.

9. `architecture_invariants_test.mjs`  
   **OK**  
   Vérifie l’absence des anciennes rustines thématiques et la présence de toutes les étapes universelles.

10. `latency_budget_contract_test.mjs`  
    **OK**  
    Vérifie les budgets de délai, la récupération parallèle et les métriques de performance.

## Vérification des intégrations

- L’utilisation de Quran Foundation repose sur le SDK serveur officiel et son moteur de recherche de versets.
- Le fallback OpenAI utilise des sorties structurées strictes et des filtres de domaines.
- HadeethEnc reste le corpus Hadith prioritaire et expose les pages sources correspondant aux identifiants retournés.

Les tests d’intégration automatisés utilisent des réponses simulées afin d’être reproductibles sans secrets de production. Le comportement réel des services externes doit encore être confirmé après déploiement avec `QF_CLIENT_ID`, `QF_CLIENT_SECRET` et `OPENAI_API_KEY` configurés.

## Limites honnêtes

Aucun moteur documentaire ne peut garantir mathématiquement une réponse parfaite pour toutes les formulations et tous les sujets religieux. Cette version garantit en revanche que les nouvelles questions passent par une architecture commune, et non par une nouvelle rustine ajoutée après chaque test.

Les limites restantes sont :

1. une API externe ou le réseau peut être indisponible ;
2. un corpus peut ne pas indexer une traduction française avec les mots employés par l’utilisateur ;
3. le vérificateur sémantique reste un modèle probabiliste, encadré par des identifiants fermés et un fallback déterministe ;
4. la télémétrie de coût existante mesure précisément la réponse OpenAI principale, mais n’agrège pas encore les petits appels auxiliaires d’expansion, de vérification et de supplément Hadith dans une mesure tarifaire multi-modèle unique.

En cas d’absence de preuve suffisamment directe, le comportement attendu est de le signaler plutôt que d’afficher une référence approximative.

## Fichiers principaux concernés

```text
wasil/index.ts
wasil/engine/IslamicQueryExpansion.ts
wasil/engine/UniversalIntent.ts
wasil/engine/RelevanceScorer.ts
wasil/engine/DocumentaryRelevanceVerifier.ts
wasil/engine/QuranKnowledgeEngine.ts
wasil/engine/QuranReferenceUtils.ts
wasil/engine/repositories/HadithRepository.ts
wasil/tests/*
```
