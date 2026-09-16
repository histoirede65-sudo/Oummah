# Audit — preuves directes et thème du mensonge

## Cause observée

Le moteur reconnaissait bien le concept « vérité et mensonge », mais il ne possédait pas de profil documentaire assez précis pour distinguer une preuve normative directe d’un récit historique illustratif. Une plage comme At-Tawba 9:117-119 et le récit de Ka'b ibn Malik pouvaient donc dépasser des preuves plus directes.

## Corrections

- enrichissement du concept universel `truth` et de ses formulations de recherche ;
- ajout d’un profil de pertinence pour la vérité et le mensonge ;
- priorité aux références coraniques directes 16:105, 22:30, 9:119 et 33:70 ;
- pénalisation de la plage narrative 9:117-119 lorsqu’une preuve directe est disponible ;
- pénalisation générale des résultats fortement narratifs sans règle normative ;
- bonus général aux formulations normatives (ordre, interdiction, mise en garde) ;
- ajout de trois graines HadeethEnc officielles, dont le hadith direct « Soyez véridiques… prenez garde au mensonge » (ID 5504).

## Fichiers modifiés

- `wasil/engine/UniversalIntent.ts`
- `wasil/engine/RelevanceScorer.ts`
- `wasil/engine/repositories/HadithRepository.ts`

## Validation

La vérification TypeScript passe avec une déclaration Deno minimale. Les seules dépendances runtime restent celles déjà présentes.
