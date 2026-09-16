# Audit — moteur documentaire universel Wasil

## Portée
Cette version ne se limite plus aux correctifs « promesses », « colère » ou « jalousie ».
Elle introduit une couche commune d'analyse d'intention utilisée par la recherche Coran,
la recherche Hadith et le classement documentaire.

## Changements structurels
- Nouveau `engine/UniversalIntent.ts` : concepts, synonymes, expansions et termes de recherche partagés.
- `QuranKnowledgeEngine.ts` utilise désormais des termes courts et conceptuels au lieu de la phrase entière.
- `HadithRepository.ts` utilise le même moteur de concepts pour HadeethEnc.
- `RelevanceScorer.ts` applique un contrôle générique de couverture thématique et pénalise les passages trop larges.
- `index.ts` ne contient plus de consigne spéciale limitée au thème des promesses ; elle est remplacée par une règle universelle de préférence pour les preuves directes.

## Concepts couverts par le socle
Colère, jalousie/envie, promesses, vérité/mensonge, orgueil/humilité, patience,
repentir, voisin, parents, mariage, pudeur, amana, dettes, médisance,
fréquentations, prière, aumône, peur/angoisse.

## Garanties
- Coran et Hadith sont recherchés indépendamment lorsque les deux sont demandés.
- Les résultats doivent contenir des termes du concept principal, pas seulement des mots religieux génériques.
- Les longues plages sont pénalisées si elles n'ont pas une forte couverture thématique.
- Les listes spécifiques existantes restent des filets de sécurité, mais ne sont plus le moteur principal.

## Limite honnête
Aucun moteur documentaire ne peut être garanti parfait sur toutes les formulations sans campagne de tests réelle.
Cette version corrige l'architecture générale et réduit fortement la dépendance aux rustines par question.
