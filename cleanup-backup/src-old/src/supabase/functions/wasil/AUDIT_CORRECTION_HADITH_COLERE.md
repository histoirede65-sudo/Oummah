# Correction Wasil — récupération Hadith pour la colère

Fichiers modifiés :

- `wasil/engine/repositories/HadithRepository.ts`
- `wasil/index.ts`

Corrections :

1. Ajout de deux identifiants HadeethEnc officiels et vérifiés pour l’intention `colère` :
   - `4709` — « Ne te mets pas en colère » (Sahih al-Bukhari 6116)
   - `5351` — « Le fort est celui qui maîtrise sa personne au moment de la colère » (Al-Bukhari et Muslim ; Sahih al-Bukhari 6114)
2. Les entrées déterministes restent récupérées en direct depuis HadeethEnc : aucun texte de hadith n’est codé en dur.
3. Un hadith déterministe correctement récupéré ne peut plus être supprimé par le seuil lexical générique.
4. Dans la sélection finale, les deux preuves directes sur la colère remplacent les hadiths seulement indirectement liés.
5. Les références coraniques et les autres modules ne sont pas modifiés.

Validation statique :

- Analyse TypeScript lancée avec `tsc`.
- Aucune erreur de syntaxe dans les fichiers modifiés.
- Les erreurs restantes proviennent uniquement des globals/imports Deno non disponibles dans l’environnement local de validation.
