# Déployer le moteur Wasil dans Supabase

La clé `OPENAI_API_KEY` reste exclusivement dans les secrets Supabase. Elle ne doit jamais être copiée dans l’application Expo.

## 1. Créer les tables de crédits

Dans **Supabase > SQL Editor**, exécuter le fichier :

`src/supabase/migrations/202607210001_wasil_credits.sql`

Puis exécuter :

`src/supabase/migrations/202607210002_wasil_intent_memory.sql`

La migration crée les portefeuilles, l’historique des transactions, la protection RLS et les opérations atomiques de débit/remboursement.

## 2. Choisir les réglages de départ

Dans **Edge Functions > Secrets**, conserver `OPENAI_API_KEY` et ajouter les valeurs voulues :

- `WASIL_INITIAL_CREDITS` : crédits offerts lors de la création du premier portefeuille. Sans valeur, le solde initial reste à `0`.
- `WASIL_STANDARD_CREDITS` : coût d’une réponse standard. Valeur par défaut : `1`.
- `WASIL_DEEP_CREDITS` : coût d’une future réponse approfondie Premium. Valeur par défaut : `3`.
- `WASIL_MODEL_STANDARD` : valeur par défaut `gpt-5.6-luna`.
- `WASIL_MODEL_DEEP` : valeur par défaut `gpt-5.6-terra`.

Aucune recharge automatique OpenAI n’est activée par ce code.

## 3. Déployer la fonction

Déployer `src/supabase/functions/wasil/index.ts` comme fonction nommée `wasil` avec la vérification JWT activée. Le fichier `src/supabase/config.toml` contient déjà :

```toml
[functions.wasil]
verify_jwt = true
```

Avec le CLI Supabase, depuis le dossier contenant `src/supabase` :

```bash
supabase functions deploy wasil --project-ref VOTRE_PROJECT_REF
```

## 4. Règles appliquées

- Ouvrir un écran OUMMAH ne consomme aucun crédit.
- Toute réponse à une question religieuse sourcée consomme les crédits définis.
- Une absence de source vérifiée ne consomme rien.
- Une erreur OpenAI, réseau ou validation rembourse automatiquement la réservation.
- Le client ne peut ni créditer son compte ni fabriquer une source reconnue par le serveur.
- La qualification religieuse est sémantique et effectuée côté serveur : elle ne dépend pas d’une simple liste de mots-clés.
- Une demande réellement ambiguë entraîne une clarification et un remboursement, pas une réponse inventée.
- Lorsqu’un utilisateur précise une question mal comprise, Wasil mémorise personnellement l’association entre la formulation et les sources serveur validées.
- Cette mémoire apprend une intention, jamais une nouvelle affirmation religieuse fournie par l’utilisateur.
- Les boutons contextuels transmettent la référence du contenu à Wasil. Pour un verset, le serveur recharge lui-même le tafsir vérifié avant de répondre.
- Une réponse normale de réconfort reste religieuse et consomme les crédits prévus.
- Une situation évoquant un danger immédiat est remboursée et affiche gratuitement les ressources d’urgence ; en France, le 3114 est indiqué.
