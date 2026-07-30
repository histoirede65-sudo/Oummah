WASIL V4 - Sprint 3 : CompanionRepository en mode fantôme

Fichiers ajoutés :
- supabase/functions/wasil/engine/repositories/CompanionRepository.ts

Fichiers modifiés :
- supabase/functions/wasil/engine/FeatureFlags.ts
- supabase/functions/wasil/engine/WasilV4ShadowPipeline.ts
- supabase/functions/wasil/index.ts

Sécurité :
- WASIL_V4_COMPANION_REPOSITORY est désactivé par défaut.
- Le repository n'influence jamais la réponse de production.
- Toute erreur est absorbée par le pipeline fantôme.
- Aucun autre module OUMMAH n'a été modifié.

Déploiement :
1. Copier le dossier supabase à la racine du projet.
2. Lancer : supabase functions deploy wasil

Par défaut, aucun secret ni flag supplémentaire n'est nécessaire.
