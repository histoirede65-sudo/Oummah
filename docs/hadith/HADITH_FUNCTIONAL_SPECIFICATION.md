# Spécification fonctionnelle définitive du module Hadith

## 1. Objet du document

Cette spécification décrit le comportement attendu du module Hadith du point de vue de l’utilisateur.

Elle définit :

- ce que l’utilisateur voit ;
- ce qu’il peut faire ;
- les règles d’affichage ;
- les différents états du contenu ;
- les différences entre contenu officiel et contenu généré par Wasil.

Elle ne décrit aucune solution technique d’implémentation.

## 2. Principes fonctionnels

- Aucun hadith n’est affiché dans une langue si aucune traduction validée n’est disponible dans cette langue.
- Le texte arabe reste la référence documentaire principale, mais ne remplace jamais une traduction dans l’expérience utilisateur.
- Une traduction, une explication et une analyse de Wasil sont toujours présentées comme trois contenus différents.
- Toute information officielle affiche sa source et son attribution lorsque cela est requis.
- Un contenu retiré, suspendu ou juridiquement indisponible n’est plus affiché aux utilisateurs.
- Le changement de traduction ne modifie jamais le hadith arabe ni ses références.
- Les préférences, favoris, notes et historiques de l’utilisateur ne modifient jamais le contenu officiel.

## 3. Accueil Hadith

### 3.1 Organisation

L’accueil Hadith présente une entrée simple vers les principales activités :

- continuer la lecture ;
- découvrir le hadith du jour ;
- parcourir les collections ;
- rechercher un hadith ;
- consulter les favoris ;
- accéder aux téléchargements hors ligne ;
- demander l’aide de Wasil.

L’ordre des blocs peut s’adapter aux habitudes de l’utilisateur, mais les accès à la recherche et aux collections doivent rester immédiatement visibles.

### 3.2 Cartes principales

Les cartes peuvent présenter :

- le hadith du jour ;
- la dernière lecture ;
- une collection récemment consultée ;
- un thème recommandé ;
- un objectif de révision ;
- un téléchargement disponible hors ligne.

Chaque carte indique au minimum :

- le titre ou la référence ;
- la langue affichée ;
- la collection ;
- l’état de disponibilité de la traduction.

Une carte ne doit jamais afficher un hadith dont la traduction active n’est plus disponible.

### 3.3 Statistiques

L’utilisateur peut voir, selon ses préférences :

- le nombre de hadiths lus ;
- le nombre de jours de lecture ;
- le nombre de favoris ;
- le nombre de collections commencées ;
- la progression dans une collection ;
- le nombre de révisions effectuées.

Ces statistiques décrivent l’activité de l’utilisateur. Elles ne constituent pas une évaluation de sa connaissance religieuse.

### 3.4 Reprise de lecture

La section « Reprendre » permet de revenir au dernier hadith consulté ou à la dernière position de lecture.

Si la traduction précédemment utilisée n’est plus disponible, l’utilisateur est informé et une autre traduction validée peut être proposée. Si aucune traduction n’est disponible, le contenu est retiré de la reprise.

### 3.5 Hadith du jour

Le hadith du jour doit toujours afficher :

- la traduction dans la langue de l’utilisateur ;
- la collection ;
- la référence ;
- le grade lorsqu’il est disponible ;
- la source ;
- l’accès à la fiche complète.

Le hadith du jour ne doit pas être présenté comme une recommandation religieuse personnalisée de Wasil.

### 3.6 Recommandations

Les recommandations peuvent se baser sur :

- les thèmes consultés ;
- les collections suivies ;
- les favoris ;
- la progression de lecture ;
- les objectifs définis par l’utilisateur.

Une recommandation doit être identifiable comme telle. Elle ne doit pas masquer la source du contenu ni présenter une analyse de Wasil comme une parole prophétique.

## 4. Collections

### 4.1 Liste des collections

L’utilisateur peut parcourir les grands recueils disponibles dans sa langue.

Pour chaque collection, l’application affiche :

- le nom officiel ;
- l’auteur ou le compilateur ;
- la description ;
- la langue disponible ;
- la progression de l’utilisateur ;
- le nombre de hadiths accessibles dans cette langue ;
- les traductions disponibles ;
- le statut d’authenticité ou de classification présenté par la source.

Une collection peut être visible dans le catalogue mais indisponible dans la langue de l’utilisateur. Dans ce cas, elle doit être signalée comme non disponible, sans afficher ses hadiths arabes seuls.

### 4.2 Catégories et thèmes

Les collections peuvent être explorées par :

- foi ;
- prière ;
- comportement ;
- famille ;
- patience ;
- invocations ;
- éthique ;
- commerce ;
- histoire ;
- apprentissage ;
- autres thèmes documentés.

Les thèmes affichés doivent provenir d’une classification validée ou être présentés comme des catégories éditoriales, jamais comme des conclusions religieuses inventées.

### 4.3 Auteurs et recueils authentiques

L’utilisateur peut filtrer par auteur, compilateur ou collection.

Les recueils qualifiés d’authentiques doivent conserver la formulation et la portée de la source. L’application ne doit pas transformer automatiquement cette qualification en affirmation indépendante concernant chaque hadith.

### 4.4 Favoris dans les collections

L’utilisateur peut afficher les favoris :

- par collection ;
- par thème ;
- par langue ;
- par date d’ajout ;
- par état de lecture.

## 5. Recherche

### 5.1 Recherche intelligente

La recherche comprend les mots saisis par l’utilisateur, les variantes usuelles et les références connues.

Elle peut rechercher dans :

- la traduction active ;
- les titres ;
- les livres ;
- les chapitres ;
- les collections ;
- les narrateurs documentés ;
- les références ;
- les explications officiellement disponibles.

La recherche ne doit pas présenter de résultat dépourvu de traduction dans la langue active.

### 5.2 Filtres

Les filtres peuvent inclure :

- collection ;
- livre ;
- chapitre ;
- thème ;
- narrateur ;
- grade ;
- auteur ou compilateur ;
- langue ;
- présence d’une explication ;
- présence d’un audio ;
- disponibilité hors ligne ;
- favoris ;
- contenus récemment lus.

### 5.3 Recherche par mot

Les résultats indiquent le passage de la traduction correspondant à la recherche lorsque cela est possible.

Le mot recherché ne doit pas être interprété comme une preuve de thème ou de règle religieuse.

### 5.4 Recherche par narrateur

La recherche par narrateur n’est disponible que lorsque le narrateur est fourni par une source validée.

Si le narrateur n’est pas documenté, aucun nom ne doit être déduit automatiquement du texte.

### 5.5 Recherche par référence

L’utilisateur peut rechercher par :

- nom de collection ;
- numéro global ;
- numéro dans le livre ;
- livre ;
- chapitre ;
- identifiant reconnu par la source.

Les différences de numérotation doivent être signalées lorsque plusieurs éditions existent.

### 5.6 Aucun résultat

Si aucun hadith traduit n’est trouvé :

- l’application explique que la recherche n’a pas donné de résultat dans la langue active ;
- elle peut proposer d’élargir les filtres ;
- elle ne présente pas automatiquement le texte arabe seul ;
- elle peut proposer une question à Wasil, clairement identifiée comme une réponse générée.

## 6. Lecture d’un hadith

### 6.1 En-tête

L’en-tête affiche :

- le nom de la collection ;
- le livre ;
- le chapitre ;
- la référence ;
- l’état du contenu ;
- l’action de retour.

### 6.2 Texte arabe

Le texte arabe peut être consulté comme référence documentaire.

Il doit être clairement séparé de la traduction et accompagné de sa provenance lorsque cette information est disponible.

L’utilisateur peut modifier la taille d’affichage et le mode de lecture, mais l’application ne modifie pas le texte source.

### 6.3 Traduction

La traduction est affichée dans la langue active de l’utilisateur.

Elle affiche ou rend accessible :

- le traducteur ;
- l’éditeur ou l’organisme ;
- la source ;
- la version ;
- l’attribution requise ;
- les restrictions utiles à l’utilisateur.

Si plusieurs traductions existent, l’utilisateur peut les consulter séparément. Elles ne doivent jamais être fusionnées dans un texte unique.

### 6.4 Source et références

La fiche présente :

- la collection ;
- le livre ;
- le chapitre ;
- la numérotation ;
- la source d’origine ;
- la version ;
- le lien source lorsque disponible.

### 6.5 Grade

Le grade affiche :

- la qualification ;
- l’évaluateur ;
- la source de l’évaluation ;
- une note explicative si nécessaire.

Lorsqu’aucun grade documenté n’est disponible, l’application affiche cette absence au lieu de déduire un grade.

### 6.6 Attribution

L’attribution obligatoire est visible sur la fiche ou accessible depuis celle-ci. Elle doit être conservée lors du partage et des téléchargements autorisés.

### 6.7 Explication officielle

Lorsqu’une explication validée est disponible, elle apparaît dans une section distincte intitulée par exemple « Explication de la source ».

Elle indique :

- son auteur ;
- son organisme ;
- son édition ;
- sa source ;
- sa version.

### 6.8 Enseignements

Les enseignements sont affichés séparément de l’explication et de la traduction.

Ils sont numérotés lorsqu’ils sont fournis dans un ordre par la source.

S’ils n’existent pas dans une source validée, la section n’est pas inventée.

### 6.9 Actions utilisateur

Depuis la fiche, l’utilisateur peut :

- ajouter ou retirer le favori ;
- ajouter une note personnelle ;
- créer un signet ;
- copier selon les droits de la ressource ;
- partager selon les droits de la ressource ;
- télécharger pour consultation hors ligne si autorisé ;
- écouter l’audio si disponible ;
- demander une explication à Wasil ;
- consulter les hadiths liés ;
- consulter le narrateur ;
- consulter les thèmes ;
- consulter les références.

### 6.10 Copie et partage

La copie et le partage doivent respecter la licence de la ressource.

Lorsque la copie intégrale n’est pas autorisée, l’application peut désactiver l’action ou proposer uniquement un partage de référence, sous réserve des conditions applicables.

Le partage doit conserver autant que nécessaire :

- le texte affiché ;
- la source ;
- la référence ;
- le traducteur ;
- l’attribution ;
- la version.

## 7. Différences entre les contenus

### Traduction

Transposition linguistique du texte source. Elle est attribuée à un traducteur ou à un organisme.

### Explication officielle

Commentaire provenant d’une source identifiée. Elle ne doit pas être confondue avec le texte du hadith.

### Enseignements

Points pédagogiques provenant d’une source validée. Ils ne sont pas automatiquement déduits par l’application.

### Réponse de Wasil

Explication, résumé ou analyse générée pour l’utilisateur. Elle doit être clairement étiquetée comme produite par Wasil et ne doit jamais être présentée comme une citation officielle.

## 8. Audio

### 8.1 Lecture

L’utilisateur peut lancer, mettre en pause, reprendre et arrêter la lecture lorsque l’audio est disponible.

### 8.2 Choix du récit

Lorsque plusieurs récitations ou narrations audio sont disponibles, l’utilisateur peut choisir celle qu’il préfère. L’identité du récit ou de l’enregistrement doit être affichée.

### 8.3 Vitesse

L’utilisateur peut choisir une vitesse de lecture parmi les vitesses proposées.

### 8.4 Synchronisation

Si la synchronisation est disponible, l’élément actuellement lu est mis en évidence. Une absence de synchronisation ne doit pas empêcher l’écoute.

### 8.5 Téléchargement audio

Le téléchargement audio est proposé uniquement si la licence l’autorise. L’utilisateur doit pouvoir supprimer les fichiers hors ligne depuis ses réglages.

## 9. Interaction avec Wasil

Depuis un hadith, l’utilisateur peut demander à Wasil de :

- expliquer le vocabulaire ;
- résumer le contenu ;
- reformuler dans un langage simple ;
- répondre à une question ;
- comparer plusieurs traductions ;
- proposer des hadiths liés ;
- proposer des versets ou thèmes liés ;
- créer une fiche de révision ;
- créer un objectif d’apprentissage ;
- proposer un programme de révision.

Wasil doit toujours distinguer :

- le texte arabe officiel ;
- la traduction officielle ;
- l’explication officielle ;
- sa propre réponse.

Wasil ne peut jamais :

- modifier le texte arabe ;
- modifier une traduction officielle ;
- créer une traduction présentée comme officielle ;
- inventer un grade ;
- inventer une source ;
- inventer un enseignement présenté comme provenant d’un savant ;
- citer une ressource retirée ou suspendue.

Si Wasil ne dispose pas d’une source suffisante, il doit le dire clairement.

## 10. Favoris

L’utilisateur peut :

- ajouter un hadith à ses favoris ;
- retirer un favori ;
- créer des collections personnelles ;
- déplacer un hadith entre ses collections ;
- trier ses favoris ;
- filtrer par langue, collection ou thème.

Un favori pointe vers le hadith, et non uniquement vers une traduction. Si la traduction favorite devient indisponible, le favori reste conservé et l’utilisateur est informé.

## 11. Historique

L’historique permet de consulter :

- les hadiths récemment lus ;
- la dernière langue utilisée ;
- la traduction consultée ;
- la date de consultation ;
- la progression dans une collection ;
- la dernière position de lecture.

L’utilisateur peut effacer son historique. L’effacement de l’historique ne supprime ni les favoris ni les notes.

## 12. Mode hors ligne

### 12.1 Téléchargements

L’utilisateur peut télécharger les contenus explicitement autorisés pour une consultation hors ligne.

Avant le téléchargement, l’application indique :

- les langues incluses ;
- les collections incluses ;
- la version ;
- la date du téléchargement ;
- les conditions particulières ;
- l’espace nécessaire lorsque cette information est disponible.

### 12.2 Gestion des licences

Les mentions d’attribution doivent rester accessibles hors ligne.

Les contenus soumis à une mise à jour obligatoire doivent pouvoir être signalés comme obsolètes.

### 12.3 Retrait d’une traduction

Si une traduction téléchargée est retirée ou suspendue :

- elle est immédiatement masquée dans l’application ;
- elle n’apparaît plus dans la recherche ;
- elle n’est plus recommandée ;
- elle n’est plus proposée dans les futurs téléchargements ;
- Wasil ne l’utilise plus dans ses réponses ou citations.

L’application peut conserver une information interne de retrait pour assurer la traçabilité, sans afficher le contenu retiré.

## 13. Cas particuliers

### 13.1 Traduction retirée

L’utilisateur voit un message indiquant que la traduction n’est plus disponible. Une autre traduction validée peut être proposée si elle existe.

### 13.2 Licence expirée ou devenue incompatible

Le contenu est immédiatement retiré de l’affichage public. L’utilisateur est informé de l’indisponibilité sans que l’application présente le texte sous une autre licence.

### 13.3 Plusieurs traductions

Une traduction principale est affichée selon les règles éditoriales. Les autres restent accessibles par une action « Voir une autre traduction », si leurs licences le permettent.

### 13.4 Aucune traduction

Le hadith n’apparaît pas dans les listes, recherches, recommandations ou collections visibles par l’utilisateur de cette langue.

Il peut éventuellement être signalé dans un catalogue documentaire comme « traduction non disponible », sans afficher le texte arabe seul.

### 13.5 Explication officielle absente

La section d’explication officielle est masquée ou affiche « Aucune explication officielle disponible ». Wasil peut proposer son aide, mais sa réponse est clairement identifiée comme générée.

### 13.6 Seul Wasil peut répondre

Wasil peut répondre uniquement avec les limites et avertissements nécessaires. Il doit signaler lorsqu’il s’agit d’une explication pédagogique et non d’une source officielle.

## 14. Accessibilité

Le module doit proposer :

- plusieurs tailles de texte ;
- une taille indépendante pour l’arabe et la traduction ;
- un mode sombre ;
- un contraste suffisant ;
- une interface compatible avec VoiceOver ;
- une interface compatible avec TalkBack ;
- des libellés accessibles pour les boutons ;
- une navigation utilisable sans gestes complexes ;
- une lecture audio contrôlable ;
- une indication claire du contenu actuellement sélectionné.

Les informations importantes ne doivent jamais être transmises uniquement par la couleur.

Les citations, sources, grades et avertissements doivent être lisibles par les lecteurs d’écran.

## 15. Expérience Premium

Les fonctionnalités Premium prévues pour Hadith peuvent inclure :

- téléchargements hors ligne étendus ;
- playlists personnalisées ;
- programmes de révision avancés ;
- objectifs personnalisés ;
- statistiques détaillées de lecture ;
- comparaison de plusieurs traductions autorisées ;
- historique étendu ;
- notes et collections personnelles avancées ;
- interactions approfondies avec Wasil ;
- révisions planifiées ;
- lecture audio avancée.

Les fonctionnalités Premium ne doivent jamais donner accès à un contenu dont la licence ne permet pas l’affichage ou le téléchargement.

Le paiement ne modifie pas les droits documentaires d’une ressource. Un contenu gratuit juridiquement indisponible ne devient pas réutilisable parce qu’il est placé derrière une offre Premium.

## 16. Critères d’acceptation fonctionnels

Le module est conforme lorsque :

- aucun hadith sans traduction n’apparaît à l’utilisateur dans sa langue ;
- chaque traduction est distinguée du texte arabe ;
- chaque explication officielle est distinguée de Wasil ;
- les sources et attributions sont accessibles ;
- les traductions multiples restent séparées ;
- les favoris et notes survivent au changement de traduction ;
- les contenus retirés ne sont plus affichés ni recommandés ;
- le mode hors ligne respecte les droits de chaque ressource ;
- les recherches respectent la langue active ;
- Wasil ne modifie ni ne remplace les contenus officiels ;
- l’expérience reste utilisable avec les outils d’accessibilité ;
- les fonctionnalités Premium ne contournent aucune restriction documentaire.

## 17. Vision utilisateur

Le module Hadith doit offrir une bibliothèque francophone fiable, lisible et transparente.

L’utilisateur doit toujours savoir :

- ce qu’il lit ;
- dans quelle langue il le lit ;
- d’où vient le texte ;
- qui l’a traduit ;
- quelle est sa référence ;
- ce qui relève d’une explication officielle ;
- ce qui relève de Wasil ;
- pourquoi un contenu est éventuellement indisponible.

La simplicité de l’expérience ne doit jamais se faire au détriment de la provenance, de l’intégrité ou des droits documentaires.
