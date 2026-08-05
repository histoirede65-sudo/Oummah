OUMMAH — Streaming Wasil

Périmètre strictement modifié :
- src/features/wasil/WasilApiClient.ts
- src/app/(tabs)/dalil.tsx
- src/supabase/functions/wasil.zip (backend Wasil uniquement)

Fonctionnement :
- Le backend Wasil accepte désormais text/event-stream.
- La sortie structurée OpenAI reste identique et continue d'être validée intégralement.
- Seul le champ body est envoyé progressivement pendant la génération.
- La réponse finale complète remplace ensuite la réponse provisoire et conserve les références Coran/Hadith, les sources, le solde et la classification.
- Les opérations balance, mémoire et conversations restent en JSON normal.

Aucun autre module OUMMAH n'a été modifié.

Déploiement :
1. Remplacer les trois éléments aux chemins indiqués.
2. Depuis la racine du projet :
   npx.cmd supabase functions deploy wasil
   npx.cmd expo start --go
