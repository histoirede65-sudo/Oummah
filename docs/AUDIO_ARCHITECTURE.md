# Architecture du moteur audio OUMMAH

## Objectif

Le moteur audio est un domaine TypeScript autonome. Il ne connaît ni React, ni React Native, ni Expo Router, ni Quran.Foundation. Il manipule des pistes, une file de lecture, un état et des événements par l’intermédiaire de ports abstraits.

```text
Interface React Native
        ↓ commandes / état
AudioPlayerProvider
        ↓ API publique
AudioEngine
   ├── AudioQueue
   ├── AudioEvents
   ├── AudioSession
   └── AudioPlayer (port)
                 ↓
      ExpoAudioPlayerAdapter
                 ↓
             expo-audio
```

## Fichiers du moteur

### `AudioEngine.ts`

Orchestre la lecture, la pause, la reprise, le stop, le seek, la vitesse, la répétition, la navigation, le changement de piste, de sourate et de récitateur. Il reçoit un `AudioPlayer` abstrait dans son constructeur.

L’API principale comprend :

- `setPlaylist()` et `loadTrack()` ;
- `play()`, `pause()`, `resume()` et `stop()` ;
- `seek()` et `skipBy()` ;
- `next()`, `previous()` et `changeTrack()` ;
- `changeSurah()` et `changeReciter()` ;
- `setPlaybackRate()` et `setRepeatMode()` ;
- `restoreSession()` ;
- `getState()` et `on()`.

### `AudioPlayer.ts`

Définit le port minimal attendu d’un lecteur natif. Une implémentation doit charger une piste, contrôler la lecture, publier son statut et libérer ses ressources. Aucun type Expo n’apparaît dans ce contrat.

L’adaptateur actuel se trouve dans `src/features/audio/adapters/ExpoAudioPlayerAdapter.ts`. Remplacer Expo Audio ne demande donc aucune modification du moteur.

### `AudioQueue.ts`

Possède la playlist et l’index courant. Elle sélectionne une piste, avance ou recule sans connaître la source des données. Une `Playlist` est composée de `QueueItem`, ce qui permettra ensuite de définir des segments temporels pour les versets.

### `AudioEvents.ts`

Bus d’événements typé. Les événements disponibles sont :

- `stateChanged` ;
- `trackChanged` ;
- `queueChanged` ;
- `playbackEnded` ;
- `sessionRestored` ;
- `error`.

Les consommateurs s’abonnent avec `engine.on(event, listener)` et reçoivent une fonction de désabonnement.

### `AudioState.ts`

Représente la vérité courante du moteur : statut, piste, playlist, position, durée, vitesse, répétition, buffering et erreur. Le provider React reflète cet état sans reconstruire de logique métier.

### `AudioSession.ts`

Gère la sauvegarde temporisée et la restauration d’un `AudioSessionState`. La persistance dépend du port `AudioSessionRepository`. L’implémentation locale actuelle utilise `StorageService` dans `StorageAudioSessionRepository`.

## Modèles

### `AudioTrack`

Une piste possède un type de contenu, un identifiant métier, un créateur et une source audio. Les types prévus sont :

- `quran` ;
- `invocation` ;
- `podcast` ;
- `conference` ;
- `dalilVoice`.

Les informations propres au Coran sont isolées dans `track.quran`. Les autres contenus utilisent le même moteur, la même queue, les mêmes événements et le même provider.

### `Reciter`

Décrit un récitant ou créateur audio : identité, style, langue, pays, photo et source de catalogue. Le repository actuel fournit uniquement des données Mock.

### `Playlist` et `QueueItem`

Une playlist regroupe des éléments ordonnés. `QueueItem` accepte à terme `startAt` et `endAt`, nécessaires à la répétition précise d’un verset ou d’un extrait sans changer l’architecture.

### `AudioSessionState`

Contient la playlist sérialisable, l’élément courant, la position, la vitesse, la répétition, l’état Play/Pause et la date de mise à jour.

## Flux de lecture

1. Un repository Mock produit des `AudioTrack` génériques.
2. Le provider construit une `Playlist` et appelle `AudioEngine.setPlaylist()`.
3. Le moteur sélectionne le `QueueItem` et appelle le port `AudioPlayer`.
4. L’adaptateur Expo traduit cette commande vers `expo-audio`.
5. Les statuts natifs reviennent par `AudioPlayer.subscribe()`.
6. Le moteur calcule un nouvel `AudioState`, émet `stateChanged` et planifie la sauvegarde de session.
7. Le provider transmet uniquement cet état aux composants.

## Règles de dépendance

- Les composants n’importent jamais `expo-audio`.
- `AudioEngine`, `AudioPlayer`, `AudioQueue`, `AudioEvents`, `AudioSession` et `AudioState` n’importent aucun framework.
- Le provider appelle uniquement `AudioEngine`.
- L’adaptateur natif est le seul endroit autorisé à connaître Expo Audio.
- Les catalogues et APIs produisent des modèles du Core derrière des repositories.
- Une nouvelle famille de contenu ajoute des données et éventuellement des métadonnées, pas un nouveau lecteur.

## Ajouter une plateforme audio

1. Implémenter le contrat `AudioPlayer`.
2. Traduire les statuts natifs en `AudioPlayerStatus`.
3. Injecter l’adaptateur dans `AudioPlayerProvider`.
4. Vérifier les événements, la session et les commandes avec les mêmes tests de moteur.

## Ajouter un type de contenu

1. Ajouter son littéral dans `AudioContentType` si nécessaire.
2. Mapper le DTO du repository vers `AudioTrack`.
3. Construire une playlist de `QueueItem`.
4. Utiliser l’API existante du moteur.

Aucune modification d’`AudioEngine`, d’`AudioQueue` ou du provider n’est requise.

## Module Écouter

Le module applicatif respecte le flux suivant :

```text
Routes et composants de présentation
        ↓
View-models (`presentation/viewmodels`)
        ↓
Services (`features/audio/services`)
        ↓
Ports de repositories (`features/audio/ports` et `core/repositories`)
        ↓
DataSources Mock et stockage local
```

Les écrans ne filtrent pas les données métier et n’accèdent jamais au stockage. `ListeningHomeService` compose l’accueil, `SurahCatalogService` gère recherche/tri/filtres et `AudioPlaylistService` construit les collections. Les hooks de présentation ne font que gérer le cycle de chargement des services.

Les routes du module sont :

- `recitations.tsx` : accueil Écouter ;
- `listen/reciters.tsx` : catalogue des récitateurs ;
- `listen/reciter/[reciterId].tsx` : 114 sourates d’un récitateur ;
- `listen/surahs.tsx` : recherche, tri, favoris et téléchargements ;
- `listen/playlists.tsx` : favoris, playlist personnelle, historique et téléchargements ;
- `listen/[surahId].tsx` : lecteur complet.

## Ajouter un récitateur

1. Ajouter le DTO à la DataSource concernée. Pour les données locales de développement, utiliser `MockReciterDataSource`.
2. Fournir `id`, `name`, `country`, `style`, `language`, `photoUri`, `audioSource`, `availableSurahs` et `popularity`.
3. S’assurer que l’`AudioCatalogRepository` sait produire les `AudioTrack` du récitateur.
4. Ne modifier ni les écrans ni le moteur : le catalogue et la navigation sont générés depuis les services.

Une photo distante ne doit pas être résolue par un composant métier. La future DataSource fournira une URI normalisée ou une référence locale exploitable par l’adaptateur de présentation.

## Ajouter une playlist

1. Créer un `StoredAudioPlaylist` avec un identifiant stable et des `trackIds`.
2. L’enregistrer avec `AudioPlaylistService.save()` ; seul `StorageAudioPlaylistRepository` connaît la persistance.
3. Pour lancer la playlist, mapper ses pistes vers le modèle Core `Playlist`, puis utiliser `AudioPlayerProvider.setPlaylist()`.

Les collections « Mes favoris », « Ma playlist », « Dernières écoutes » et « Téléchargées » sont construites par `AudioPlaylistService`. Une nouvelle collection se crée dans ce service sans introduire de logique dans l’UI.

## Ajouter une nouvelle source audio

1. Créer une DataSource qui encapsule le fournisseur (fichier local, Edge Function ou autre backend).
2. Créer ou adapter un repository implémentant `AudioCatalogRepository` et mapper les réponses vers `AudioTrack`.
3. Injecter ce repository dans `audioDependencies`.
4. Conserver les URLs, jetons et détails du fournisseur hors des composants et hors du moteur.

Pour Quran.Foundation, la DataSource de production devra appeler uniquement les Edge Functions Supabase. React Native ne devra jamais importer le SDK ni connaître les secrets. Le remplacement du repository Mock ne modifiera donc ni les services, ni les view-models, ni les écrans.

## Reprise, arrière-plan et offline

`AudioSessionState` conserve la playlist, le récitateur contenu dans la piste, la sourate, la position, la vitesse, la répétition et l’état Play/Pause. `StorageAudioSessionRepository` permet une restauration exacte au redémarrage.

L’adaptateur Expo prépare le mode arrière-plan et les métadonnées de l’écran verrouillé. La validation définitive de ces capacités doit être faite dans un development build natif signé.

`PreparedDownloadRepository` enregistre uniquement l’intention et l’état d’un téléchargement. Le transfert de fichier sera ajouté dans une DataSource de téléchargement, puis l’URI locale sera retournée par `AudioSourceRepository`. Aucun écran ne changera lors de cette implémentation.
