# Motion Guidelines — OUMMAH

## Intention

Le mouvement dans OUMMAH doit aider à comprendre une action, préserver le contexte et donner une sensation de continuité. Il ne doit jamais devenir un spectacle. Une animation réussie est douce, brève et souvent perçue sans être consciemment remarquée.

Le système commun se trouve dans `src/core/animations/` :

- `AnimationTokens.ts` centralise les durées, la courbe et les amplitudes.
- `AnimationPresets.ts` décrit les états initiaux et les étapes.
- `PremiumAnimations.ts` crée et démarre les animations React Native.

Les écrans Accueil, Lire, Écouter, Dalîl, Profil, Prières et Communauté doivent utiliser exclusivement ce système. Aucun écran ou composant ne doit appeler directement `Animated.timing`, définir une durée brute ou inventer une courbe locale.

## Durées

| Token | Durée | Usage |
| --- | ---: | --- |
| `fast` | 150 ms | Réponse directe à une pression. |
| `normal` | 250 ms | Apparition, disparition et petit changement d’état. |
| `slow` | 450 ms | Mouvement ambiant ou surface plus importante. |
| `hero` | 650 ms | Transition rare d’un contenu principal. |

Toutes les animations utilisent la courbe `premium`. Ne pas ajouter une autre courbe pour différencier un module.

## Presets

### Fade In

À utiliser pour révéler un contenu déjà attendu : libellé, information secondaire ou résultat chargé. Ne pas l’utiliser sur toute une longue liste ni retarder un contenu immédiatement nécessaire.

### Fade Out

À utiliser pour retirer une couche temporaire tout en évitant une disparition brutale. Ne doit pas ralentir une navigation ou masquer tardivement une confirmation importante.

### Scale In

À utiliser pour une petite surface qui apparaît au-dessus de son contexte. Ne pas appliquer à un écran entier ou à un bloc de texte long.

### Scale Out

À utiliser comme sortie correspondante de `Scale In`. Éviter sur les éléments dont la disparition change fortement le layout.

### Soft Bounce

À réserver à une confirmation légère ou à l’arrivée ponctuelle d’un élément. Ne pas boucler et ne pas utiliser sur plusieurs éléments simultanément.

### Soft Pulse

À utiliser pour un état vivant et calme, par exemple une lecture active. Une seule pulsation est préférable. Une boucle doit être rare, justifiée et arrêtée lorsque l’écran n’est plus visible.

### Gentle Glow

À utiliser pour renforcer doucement un état actif ou une profondeur. Ne jamais l’utiliser comme alerte, sur plusieurs zones concurrentes ou avec une opacité supérieure aux tokens.

### Premium Card Press

À utiliser sur les cartes entièrement pressables. Ne pas le cumuler avec `Premium Button Press` sur la même interaction.

### Premium Button Press

À utiliser sur les boutons principaux et contrôles circulaires. Le retour doit commencer au toucher, sans attendre la fin de l’action métier.

### Hero Transition

À utiliser uniquement lors du remplacement d’un contenu principal : portrait, couverture ou en-tête éditorial. Ne pas l’utiliser pour une navigation ordinaire ou une liste.

### Modal Transition

À utiliser pour les dialogues centrés et menus contextuels. Le fond et le contenu doivent rester synchronisés. Ne pas ajouter une seconde animation interne concurrente.

### Bottom Sheet Transition

À utiliser pour une surface entrant depuis le bas. Le déplacement reste court afin de conserver le lien avec l’écran courant. Ne pas l’utiliser pour simuler une page complète.

## Utilisation

```ts
import { useEffect, useRef } from 'react';
import { premiumAnimations } from '../core/animations';

const values = useRef(premiumAnimations.createValues('fadeIn')).current;

useEffect(() => {
  const animation = premiumAnimations.start('fadeIn', values);
  return () => animation.stop();
}, [values]);
```

`createValues` fournit uniquement les valeurs nécessaires au preset. `start` initialise les valeurs, construit l’animation avec les tokens communs et la lance. L’option `loop` est disponible pour les rares animations ambiantes ; elle ne doit jamais être utilisée pour une pression, une modale ou une transition de navigation.

## Règles de cohérence

1. Une interaction produit au maximum une animation principale.
2. Les animations ne doivent jamais bloquer la logique métier ou la navigation.
3. Toujours utiliser `useNativeDriver: true`, déjà imposé par le moteur.
4. Arrêter les animations et les boucles au démontage du composant.
5. Respecter les préférences d’accessibilité lorsque la gestion globale de réduction des mouvements sera activée.
6. Ne pas animer de grandes listes élément par élément.
7. Ne jamais utiliser le mouvement pour remplacer un libellé, un état accessible ou un retour d’erreur.
8. Tester les transitions sur appareil réel, notamment sur Android d’entrée de gamme.

## Ajouter une animation

Avant d’ajouter un preset, vérifier qu’aucun preset existant ne couvre l’intention. Si un ajout est réellement nécessaire :

1. Réutiliser exclusivement les valeurs de `AnimationTokens.ts`.
2. Déclarer le preset dans `AnimationPresets.ts`.
3. Documenter son intention et ses contre-indications ici.
4. Vérifier TypeScript, ESLint, le démontage et la fluidité sur appareil.

Une variation propre à un écran n’est pas un nouveau preset. Elle indique généralement que l’écran doit adopter un mouvement déjà présent ailleurs.
