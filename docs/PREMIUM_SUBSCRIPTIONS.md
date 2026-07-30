# Abonnements Premium

## Fichiers

- `PremiumSubscription.ts` définit le statut, la plateforme d'achat et les dates.
- `PremiumPaymentProvider.ts` est le contrat pour RevenueCat ou un fournisseur natif.
- `PremiumAccessService.ts` reste l'unique source de vérité utilisée par Wasil et Objectifs.
- `202607220001_premium_entitlements.sql` stocke l'état vérifié côté serveur et l'expose en lecture au seul utilisateur concerné.

## Brancher un fournisseur réel

Implémenter `PremiumPaymentProvider`, puis transmettre cette implémentation à
`synchronizePremiumSubscription` et `restorePremiumPurchases`. Une opération du
fournisseur doit envoyer la preuve d'achat à une fonction serveur authentifiée.
Le mobile ne doit jamais décider qu'un achat est valide : après validation, le
serveur met à jour `premium_entitlements` et l'application relit cette source.

## Configuration

Le mobile utilise uniquement `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY` (ou `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) et,
si nécessaire, une clé SDK **publique** du fournisseur. Les secrets App Store,
Google Play, RevenueCat et la clé Supabase `service_role` restent exclusivement
dans les secrets de la fonction serveur.

Côté serveur, prévoir les identifiants API Apple/Google ou RevenueCat, la
validation des reçus, des webhooks signés et idempotents, puis la mise à jour de
`premium_entitlements` avec la plateforme, le statut, les dates et le
renouvellement automatique.

## Tester sans paiement

Sans fournisseur configuré, synchronisation et restauration renvoient
`not-configured` et n'accordent jamais Premium. Pour les tests, utiliser un
utilisateur Supabase dédié et attribuer/révoquer son entitlement manuellement
depuis un environnement serveur autorisé, puis vérifier les états gratuit,
actif, expiré, annulé, essai et attente. Ne jamais exposer `service_role` au
client pour ces tests.
