OUMMAH — WASIL V4 — SPRINT 10
PromptBuilder en mode fantôme

Fichier ajouté :
- supabase/functions/wasil/engine/PromptBuilder.ts

Fichiers modifiés :
- supabase/functions/wasil/engine/FeatureFlags.ts
- supabase/functions/wasil/engine/WasilV4ShadowPipeline.ts

Fichier de production volontairement inchangé :
- supabase/functions/wasil/index.ts

Nouveau flag, désactivé par défaut :
- WASIL_V4_PROMPT_BUILDER

Le PromptBuilder :
- transforme Brain + Executor en paquet de messages structuré ;
- sépare système, plan, dossier documentaire, conversation, mémoire et question ;
- ne lance aucun appel OpenAI ;
- ne modifie aucune réponse de production ;
- produit seulement des métadonnées et journaux en mode fantôme.

Vérification PowerShell :
Test-Path .\supabase\functions\wasil\engine\PromptBuilder.ts

Déploiement :
supabase functions deploy wasil
