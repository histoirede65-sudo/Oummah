# Audit Wasil — raisonnement documentaire universel

## Cause structurelle

Le moteur lexical et les listes thématiques amélioraient la recherche, mais ne garantissaient pas qu'une source seulement voisine du sujet soit rejetée avant le prompt final. Le vérificateur sémantique existait déjà, mais n'était pas branché au chemin de production.

## Correction

- vérification sémantique séparée du corpus Coran et du corpus Hadith ;
- rejet des documents indirects avant la génération finale ;
- conservation d'un comportement fail-open si le vérificateur est indisponible ;
- alignement des métadonnées Hadith avec les sources réellement conservées ;
- tests de non-régression sur 12 intentions distinctes avec une preuve directe et un distracteur.

## Limite honnête

Aucun moteur documentaire ne peut être garanti parfait sur toutes les formulations possibles. Cette version remplace toutefois les rustines de sortie par un contrôle sémantique général appliqué à toutes les questions documentaires.
