# Smart Quran Synchronization

## Objectif

Le moteur de synchronisation transforme une position audio, exprimée en secondes, en un état de lecture coranique stable. Il ne connaît ni React, ni Expo Audio, ni Quran.Foundation.

Aujourd’hui, les timelines sont Mock. Plus tard, une DataSource pourra convertir les timings de Quran.Foundation vers les mêmes modèles sans modifier le moteur, les services, le lecteur ou les animations.

## Flux des données

```text
Player Adapter
    │ positionSeconds
    ▼
PlaybackClock
    │
    ▼
VerseSyncService
    │
    ▼
VerseSyncEngine ─── VerseTimeline
    │                    │
    │                    └── WordTimeline (optionnelle)
    ▼
VerseState
    │
    ├── Lecteur
    ├── Surlignage
    ├── Scroll vers le verset actif
    └── Animations
```

Le lecteur reçoit uniquement `VerseState`. Il ne calcule jamais un intervalle temporel et ne lit jamais directement un statut Expo Audio pour animer le texte.

## Responsabilités

### PlaybackClock

`PlaybackClock` est l’unique entrée temporelle. Un adaptateur lui transmet la position courante avec `update(positionSeconds)`. Il ne possède aucun `setInterval`, ne sonde aucun lecteur et peut donc être alimenté par Expo Audio, un test ou un autre moteur multimédia.

### PlaybackTimeline

`PlaybackTimeline<T>` stocke des segments triés possédant :

- un identifiant ;
- un temps de début ;
- un temps de fin.

Elle valide les valeurs, trie les segments et localise la position par recherche binaire. Elle retourne le segment courant, le suivant, sa progression et son temps restant.

La recherche est en `O(log n)`. Une longue sourate n’entraîne donc pas un parcours complet à chaque mise à jour audio.

### VerseTimeline

`VerseTimeline` spécialise la timeline générique avec `verseId`, `verseKey` et une future liste de mots. Les intervalles utilisent des secondes et suivent la convention :

```text
startSeconds <= positionSeconds < endSeconds
```

Les espaces entre deux versets sont acceptés. Pendant un espace, `currentVerse` vaut `null` et `nextVerse` désigne le prochain verset.

### WordTimeline

`WordTimeline` utilise exactement le même contrat. Chaque entrée contient un `verseId`, un `wordIndex`, un identifiant stable et éventuellement son texte.

La timeline de mots est facultative. Son absence n’empêche jamais la synchronisation par verset.

### VerseSyncEngine

`VerseSyncEngine.synchronize(positionSeconds)` produit le `VerseState` complet :

- `currentVerse` ;
- `nextVerse` ;
- `progress` entre 0 et 100 ;
- `remainingTime` en secondes ;
- `currentWord` lorsque les données existent ;
- `wordState` pour les consommateurs avancés.

Le moteur est une calculatrice pure du point de vue du lecteur. Il ne déclenche ni animation, ni navigation, ni lecture audio.

### WordSyncEngine

`WordSyncEngine` calcule le mot courant avec le même algorithme. Il est déjà intégré à `VerseSyncEngine`, mais reste inactif lorsque les versets ne contiennent aucun timing de mot.

### VerseSyncService

`VerseSyncService` relie le `PlaybackClock` au `VerseSyncEngine`. Il conserve le dernier `VerseState` et notifie ses abonnés. Une interface React pourra plus tard s’abonner au service sans connaître la timeline.

### WordSyncService

`WordSyncService` expose le calcul par mot de façon indépendante pour les écrans qui n’ont besoin que de ce niveau de détail. Il peut partager le même `PlaybackClock` que `VerseSyncService`.

## Données Mock

`createMockSyncVerseTimeline` construit des intervalles réguliers pour une liste de versets. `MOCK_AL_FATIHA_TIMELINE` fournit actuellement sept versets de huit secondes.

`createMockWordTimeline` construit de la même manière des mots réguliers. Ces fonctions sont uniquement des fournisseurs de données : elles ne modifient pas le comportement du moteur.

Exemple :

```ts
const clock = new PlaybackClock();
const engine = new VerseSyncEngine(MOCK_AL_FATIHA_TIMELINE);
const sync = new VerseSyncService(engine, clock);

sync.subscribe((state) => {
  // Le lecteur et les animations consomment uniquement cet état.
});

clock.update(12.5);
```

Chaque propriétaire doit appeler `destroy()` sur les services lors de son démontage afin de supprimer les abonnements au clock.

## Animations

Une animation de verset reçoit `VerseState.progress`, `currentVerse` ou `currentWord`. Elle ne doit jamais :

- importer Expo Audio ;
- calculer elle-même le verset actif ;
- comparer des timestamps ;
- créer sa propre boucle de progression.

Le moteur de synchronisation détermine **quoi** est actif. Le système `PremiumAnimations` détermine **comment** la transition est rendue.

## Intégration future de Quran.Foundation

L’intégration future devra être réalisée dans une DataSource ou un mapper :

```text
Réponse Quran.Foundation
        │
        ▼
QuranTimingMapper
        │
        ├── VerseTimelineEntry[]
        └── WordTimelineEntry[]
        │
        ▼
VerseTimeline / WordTimeline
```

Le mapper devra convertir les unités reçues vers des secondes, conserver les identifiants stables et rejeter les intervalles invalides. Il sera ensuite possible d’appeler `VerseSyncService.setTimeline()`.

Aucune modification ne sera nécessaire dans :

- `PlaybackClock` ;
- `VerseSyncEngine` ;
- `WordSyncEngine` ;
- le lecteur ;
- les composants de texte ;
- les animations.

## Évolution vers le mot par mot

Le passage du verset au mot suit quatre étapes :

1. Le fournisseur ajoute `words` aux entrées de verset.
2. `VerseSyncEngine` transmet automatiquement la timeline du verset actif à `WordSyncEngine`.
3. `VerseState.currentWord` commence à contenir une valeur.
4. Les composants capables d’afficher les mots utilisent cette valeur ; les autres continuent à utiliser `currentVerse`.

La synchronisation par verset reste donc intacte. Aucun écran existant n’a besoin d’être réécrit.
