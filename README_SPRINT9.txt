OUMMAH — Wasil V4 Sprint 9 — Executor Shadow

Ajout :
- supabase/functions/wasil/engine/Executor.ts

Modifications :
- supabase/functions/wasil/engine/FeatureFlags.ts
- supabase/functions/wasil/engine/WasilV4ShadowPipeline.ts

Nouveau flag (désactivé par défaut) :
- WASIL_V4_EXECUTOR

Fonctionnement :
- transforme le plan du Brain en étapes d'exécution explicites ;
- mesure quelles compétences disposent déjà de preuves locales ;
- marque les recherches web et actions applicatives comme différées ;
- prépare un contexte documentaire normalisé ;
- calcule les groupes pouvant être exécutés en parallèle ;
- ne modifie jamais la réponse de production et n'effectue aucun appel externe.

Déploiement :
1. Remplacer le dossier supabase à la racine du projet.
2. Vérifier :
   Test-Path .\supabase\functions\wasil\engine\Executor.ts
3. Déployer :
   supabase functions deploy wasil

Le fichier supabase/functions/wasil/index.ts n'a pas été modifié.
