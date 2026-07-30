OUMMAH — Wasil V4 Sprint 11
Migration réelle et réversible du prompt de production

Ajout :
- buildProductionWasilInstructions() dans engine/PromptBuilder.ts
- flag WASIL_V4_PRODUCTION_PROMPT_BUILDER, désactivé par défaut

Modification réelle :
- index.ts appelle PromptBuilder quand le nouveau flag est activé
- sinon le bloc historique reste utilisé comme fallback strict

Sécurité :
- aucun changement de crédits, mémoire, sources, OpenAI, validation ou réponse
- le texte retourné par le builder est volontairement identique au bloc historique
- rollback instantané : désactiver WASIL_V4_PRODUCTION_PROMPT_BUILDER

Activation après déploiement :
WASIL_V4_PRODUCTION_PROMPT_BUILDER=true

Vérification recommandée :
1. Déployer avec le flag absent/faux et tester Wasil.
2. Activer le flag et redéployer.
3. Tester les mêmes questions et comparer les réponses/logs.
4. En cas de souci, remettre le flag à false.
