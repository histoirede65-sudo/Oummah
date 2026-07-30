OUMMAH — Wasil V4 Sprint 8 — Brain Shadow

Ajout réel :
- supabase/functions/wasil/engine/Brain.ts

Modifications réelles :
- supabase/functions/wasil/engine/FeatureFlags.ts
- supabase/functions/wasil/engine/WasilV4ShadowPipeline.ts

Nouveau flag désactivé par défaut :
- WASIL_V4_BRAIN

Sécurité :
- Le Brain fonctionne uniquement dans le pipeline fantôme.
- Il n'appelle pas OpenAI.
- Il ne déclenche aucune action dans l'application.
- Il ne modifie pas la réponse de production.
- Toute erreur du pipeline fantôme reste absorbée par WasilV4ShadowPipeline.

Activation de test recommandée uniquement après déploiement :
WASIL_V4_SHADOW_PIPELINE=true
WASIL_V4_ENTITY_RESOLVER=true
WASIL_V4_QURAN_REPOSITORY=true
WASIL_V4_COMPANION_REPOSITORY=true
WASIL_V4_HADITH_REPOSITORY=true
WASIL_V4_KNOWLEDGE_AGGREGATOR=true
WASIL_V4_SKILL_PLANNER=true
WASIL_V4_BRAIN=true

Vérification dans les logs :
WASIL_V4_SHADOW_RESULT
- brainStatus
- brainResponseStyle
- brainEvidencePolicy
- brainExecutionSteps
- brainConfidence
