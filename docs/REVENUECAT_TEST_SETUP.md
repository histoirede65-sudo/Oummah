# RevenueCat Test Store

## Packages

- `react-native-purchases` : SDK officiel RevenueCat, sans composant de paywall.
- `expo-dev-client` : exécution du module natif dans un development build Expo.

## Variables Expo publiques

```env
EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=test_store_public_sdk_key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=ios_public_sdk_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=android_public_sdk_key
```

En développement, la clé Test Store est prioritaire. En build de production,
seule la clé publique de la plateforme est utilisée. Ne jamais placer une clé
secrète RevenueCat dans l'application.

L'identifiant exact de l'entitlement est `premium`. L'App User ID RevenueCat
est toujours l'UUID de l'utilisateur Supabase, jamais son adresse email.

## Configuration du Test Store

1. Dans RevenueCat, créer ou ouvrir le projet OUMMAH.
2. Dans **Apps & providers**, créer un **Test Store** et copier sa clé SDK
   publique dans `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`.
3. Dans **Product catalog > Entitlements**, créer l'entitlement `premium`.
4. Dans **Products**, créer un produit Test Store mensuel, par exemple
   `oummah_premium_monthly_test`, avec une durée d'un mois.
5. Attacher ce produit à l'entitlement `premium`.
6. Dans **Offerings**, créer une Offering, y ajouter un package mensuel lié au
   produit de test et rendre cette Offering courante.
7. Limiter l'accès sandbox aux App User IDs de test dans RevenueCat si le projet
   utilise cette protection.

## Development build Expo

```sh
npx eas-cli login
npx eas-cli build --platform android --profile development
npx eas-cli build --platform ios --profile development
npx expo start --dev-client
```

Le SDK contient un mode d'aperçu dans Expo Go, mais aucun achat réel ni test
fiable du module natif n'y est effectué. L'intégration OUMMAH renvoie donc un
état indisponible dans Expo Go. Utiliser le development build.

## Achat et restauration

Le provider expose les Offerings et `purchasePackage` pour un futur écran, sans
créer de paywall à cette étape. `restorePremiumPurchases()` restaure les achats
RevenueCat du compte Supabase connecté, puis invalide le cache Premium quand la
synchronisation réussit. La source Premium existante conserve l'accès manuel
Supabase et ajoute uniquement un entitlement RevenueCat `premium` actif. Une
clé absente, Expo Go ou un CustomerInfo sans cet entitlement laisse le compte
gratuit.

Pour contrôler un compte gratuit, utiliser un nouvel UUID Supabase sans achat,
vérifier qu'aucun entitlement `premium` n'est actif dans RevenueCat, restaurer,
puis confirmer que le RPC Supabase renvoie toujours `is_premium = false`.
