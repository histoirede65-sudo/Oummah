# Activation de Supabase Auth pour OUMMAH

L’application utilise une connexion sans mot de passe : l’utilisateur reçoit un code par e-mail.

1. Dans Supabase, ouvrir **Authentication > Providers > Email** et laisser le fournisseur Email activé.
2. Ouvrir **Authentication > Email Templates > Magic Link**.
3. Dans le modèle, remplacer le lien de confirmation par le code `{{ .Token }}` puis enregistrer.
4. Vérifier que l’application contient bien :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` ou `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`OPENAI_API_KEY` reste un secret serveur Supabase. Elle ne doit jamais être ajoutée aux variables publiques de l’application.
