# Correction Wasil — plusieurs hadiths directs

## Fichier modifié

- `wasil/index.ts`

## Cause identifiée

Lorsque le pipeline V4 trouvait déjà un seul hadith, le backend utilisait ce résultat partiel et ne lançait plus la recherche de production HadeethEnc. Les graines déterministes et la recherche lexicale de production pouvaient donc connaître plusieurs hadiths directs, mais elles n'étaient jamais exécutées.

## Correction

- La recherche HadeethEnc de production est maintenant toujours exécutée lorsqu'une question demande explicitement la Sunna ou des hadiths.
- Le résultat de production est fusionné avec le résultat éventuel du pipeline V4.
- La fusion déduplique par identifiant officiel HadeethEnc.
- La variante la plus complète est conservée.
- Jusqu'à six hadiths distincts et pertinents peuvent être transmis à la sélection finale.
- Les protections existantes de pertinence et de déduplication restent actives.

## Cas de régression visé

Question :

`Que dit l’Islam sur la colère et comment la maîtriser selon le Coran et la Sunna ?`

Les deux hadiths directs disponibles doivent pouvoir atteindre la réponse :

- HadeethEnc 4709 — « Ne te mets pas en colère »
- HadeethEnc 5351 — « Le fort est celui qui se maîtrise au moment de la colère »

## Validation

- Vérification syntaxique TypeScript réussie avec `tsc`.
- Aucun fichier frontend, Coran, navigation ou autre module n'a été modifié.
