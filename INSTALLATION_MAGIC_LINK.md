# Installation sans modification manuelle

1. Extraire l’archive à la racine du projet OUMMAH en acceptant le remplacement des fichiers.
2. Depuis cette même racine, exécuter :

```powershell
node install-magic-link.mjs
```

3. Reconstruire l’application native afin que le nouveau scheme Expo soit enregistré :

```powershell
npx expo start --clear
```

Pour un development build natif, reconstruire ensuite le build habituel. Expo Go ne garantit pas le fonctionnement d’un scheme personnalisé ; utiliser un development build ou l’application compilée.

Dans Supabase, `oummah://**` doit être présent dans **Authentication > URL Configuration > Redirect URLs**.
Pour tester avec Expo Go et son QR code, ajouter également `exp://**` dans cette même liste. L’application choisit automatiquement la bonne adresse de retour.
