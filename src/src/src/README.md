# Wasil — streaming SSE réel

Fichiers modifiés uniquement :

- `src/features/wasil/WasilApiClient.ts`
- `src/app/(tabs)/dalil.tsx`
- `src/supabase/functions/wasil.zip`

Le backend est basé sur `wasil(21).zip` et non sur une ancienne version.

Fonctionnement :

- le client appelle `ask_stream` avec `Accept: text/event-stream` ;
- la fonction Supabase relaie les événements de streaming de l’API Responses OpenAI ;
- seul le champ `body` du JSON structuré est affiché progressivement ;
- la réponse finale validée remplace le brouillon et conserve les sources, références, crédits et classifications existants ;
- les autres opérations Wasil restent en JSON classique ;
- aucun autre module OUMMAH n’est modifié.

Déploiement :

```powershell
npx.cmd supabase functions deploy wasil
npx.cmd expo start --go
```

Important : conserver le ZIP de restauration précédent à proximité pour revenir immédiatement à la version stable en cas d’incompatibilité du streaming XHR sur l’appareil de test.
