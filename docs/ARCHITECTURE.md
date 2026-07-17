# Architecture OUMMAH

## Vue d’ensemble

OUMMAH suit une architecture en couches. Les dépendances pointent vers le cœur du projet, jamais vers une API concrète.

```text
React Native (app, components)
            ↓
Services métier (ReadingService, ListeningService, …)
            ↓
Contrats du Core (repositories)
            ↓
Adaptateurs techniques (Quran.Foundation, Supabase, SQLite, fichiers)
```

Une page peut appeler un service ou un repository injecté. Elle ne doit jamais appeler `fetch`, Supabase, SQLite ou Quran.Foundation.

## Organisation du projet

### `src/core`

Le Core contient les contrats et primitives durables de l’application :

- `audio/` : modèle `AudioTrack` et lecteur global indépendant des fournisseurs de contenu ;
- `cache/` : cache persistant stale-while-revalidate, expiration et repli hors ligne ;
- `network/` : abstraction de l’état réseau ;
- `repositories/` : interfaces des sources Coran, audio, prières, Dalîl et utilisateur ;
- `storage/` : point d’entrée unique vers le stockage local ;
- `settings/` : modèle des préférences de l’application ;
- `theme/` : façade du thème partagé ;
- `utils/` : utilitaires sans effet de bord ;
- `offline/` : données importantes conservées sur l’appareil ;
- `i18n/` : façade de l’internationalisation et de la direction RTL/LTR ;
- `notifications/` : contrat de planification des notifications.

Le Core ne connaît ni Quran.Foundation, ni Supabase, ni le format d’une réponse HTTP.

### `src/services`

Les services portent les cas d’usage métier : lecture, écoute, téléchargement, favoris, marque-pages et historique. Ils dépendent uniquement d’interfaces de repositories reçues par leur constructeur. Ils ne contiennent aucun code React.

### `src/services/quran`

Ce dossier contient les adaptateurs actuels de Quran.Foundation :

- `QuranFoundationClient` est la frontière réseau et ne contacte que les Edge Functions Supabase ;
- `QuranFoundationRepository` traduit le contrat générique du Core vers le client ;
- `QuranFoundationAudioRepository` transforme les réponses distantes en `AudioTrack` génériques.

Cette couche peut être remplacée sans modifier les écrans ou les services métier.

### `src/app` et `src/components`

Cette couche présente l’état et transmet les intentions de l’utilisateur. Elle ne contient ni transport réseau, ni persistance, ni règle métier. Les textes visibles proviennent de `src/i18n`.

### `src/supabase/functions`

Les Edge Functions constituent la frontière backend sécurisée. Le SDK Quran.Foundation et les secrets restent côté serveur. React Native ne contacte jamais Quran.Foundation directement.

## Flux des données

### Lecture avec cache

```text
Écran → ReadingService → QuranRepository → CacheRepository
                                           ├─ valeur locale → retour immédiat
                                           └─ expirée → mise à jour silencieuse
                                                        ↓
                                           adaptateur distant → Edge Function
```

Sans donnée locale, le repository charge la source distante puis persiste le résultat avant de le retourner. En mode avion, une donnée locale, même ancienne, reste utilisable. Une absence locale produit une erreur `OfflineCacheMissError` explicite.

### Audio global

Le provider global reçoit uniquement un `AudioTrack`. Il choisit `localUri` avant `remoteUri`, configure la lecture en arrière-plan et le Lock Screen, puis sauvegarde la position d’écoute via `OfflineRepository`. La résolution d’une sourate vers une piste appartient à `ListeningService` ou à un adaptateur de compatibilité, pas au lecteur.

### Stockage hors ligne

`StorageService` est l’unique accès à SQLite. `CacheRepository`, `OfflineRepository` et les repositories de persistance l’utilisent. Un composant ne doit jamais importer `expo-sqlite` ou AsyncStorage.

## Ajouter une nouvelle API

1. Conserver ou étendre un contrat dans `src/core/repositories` avec des types métier génériques.
2. Créer un client de transport dans une couche d’adaptation, hors du Core.
3. Créer un repository qui transforme les DTO de l’API en modèles du Core.
4. Injecter ce repository dans les services concernés au point de composition de l’application.
5. Ajouter une politique de cache si la donnée peut être réutilisée.
6. Tester le service avec un faux repository, sans réseau.

Changer de fournisseur ne doit nécessiter aucune modification des écrans.

## Ajouter un nouveau module

1. Définir ses modèles et contrats stables dans le sous-dossier adapté de `src/core`.
2. Implémenter les cas d’usage dans un service métier.
3. Ajouter les adaptateurs techniques nécessaires derrière les interfaces.
4. Composer les dépendances dans un fichier dédié, puis exposer uniquement le service à la présentation.
5. Centraliser les nouvelles chaînes dans le catalogue français et ajouter progressivement les traductions.
6. Prévoir le comportement hors ligne et l’expiration avant de raccorder l’interface.

## Règles de dépendance

- Les composants ne font aucun `fetch` et n’importent aucune API ou base de données.
- Les services dépendent uniquement de repositories.
- Les repositories du Core sont des interfaces sans fournisseur concret.
- Les adaptateurs peuvent dépendre du Core ; le Core ne dépend jamais des adaptateurs.
- Toute persistance passe par `StorageService`.
- Toute piste donnée au lecteur respecte le modèle `AudioTrack` du Core.
- Toute chaîne utilisateur passe par l’internationalisation.

Ces règles doivent être vérifiées lors de chaque revue de code.
