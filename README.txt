CORRECTION CIBLÉE — OUMMAH / WASIL

Fichier à remplacer uniquement :
src/features/wasil/WasilActionRouter.ts

Ne pas modifier :
- supabase/functions/wasil
- le module Coran
- dalil.tsx

Cause corrigée :
La détection locale des commandes utilisait des sous-chaînes. Une question pouvait donc être prise à tort pour une commande de navigation avant l'appel Supabase.

Protections ajoutées :
- verbes d'action reconnus uniquement comme mots complets ;
- questions documentaires (« Que dit… », « Comment… », « Pourquoi… », etc.) toujours envoyées à Wasil ;
- commandes explicites « Lis le Coran » et « Ouvre le Coran » conservées.

Tests exécutés :
PASS — question avec l'Islam -> aucune navigation
PASS — question avec lIslam -> aucune navigation
PASS — « Comment lire le Coran ? » -> aucune navigation
PASS — « Lis le Coran » -> /quran
PASS — « Ouvre le Coran » -> /quran
PASS — « Ouvre la Qibla » -> /qibla
PASS — « Lis la sourate 2 » -> /surah/2
