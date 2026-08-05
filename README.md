# Wasil streaming réel v3 — correctif Expo Go

Périmètre strict :
- `src/features/wasil/WasilApiClient.ts`
- `src/app/(tabs)/dalil.tsx`
- `src/supabase/functions/wasil.zip`

Correction v3 :
- suppression de la lecture SSE avec `XMLHttpRequest`, qui tamponnait la réponse dans Expo Go ;
- lecture réelle du flux avec `expo/fetch` et `response.body.getReader()` ;
- décodage progressif des événements SSE `ready`, `delta`, `complete` et `error` ;
- conservation du backend Wasil actuel, des crédits, validations et références finales.

Déploiement :
```powershell
npx.cmd supabase functions deploy wasil
npx.cmd expo start --go
```
