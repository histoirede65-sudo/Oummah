RESTAURATION URGENTE WASIL

Ce ZIP annule le streaming défectueux et restaure :
- src/features/wasil/WasilApiClient.ts (version d'origine)
- src/app/(tabs)/dalil.tsx (version d'origine)
- supabase/functions/wasil/ (backend actuel issu de wasil(21).zip)

Aucun autre module n'est inclus ni modifié.

Après remplacement :
1. npx.cmd supabase functions deploy wasil
2. npx.cmd expo start --go
