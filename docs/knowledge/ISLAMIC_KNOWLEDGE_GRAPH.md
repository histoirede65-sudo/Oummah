# Islamic Knowledge Graph — Architecture documentaire

## 1. Objectif

L’Islamic Knowledge Graph est le socle documentaire destiné à relier les connaissances islamiques utilisées dans l’écosystème OUMMAH.

Il doit permettre de relier les textes, personnes, lieux, événements, notions linguistiques, contenus pédagogiques et parcours utilisateurs sans dupliquer les sources ni confondre contenu officiel et analyse générée.

Cette architecture est documentaire et conceptuelle. Elle ne définit aucune implémentation technique particulière et doit pouvoir évoluer pendant de nombreuses années.

## 2. Principes fondateurs

- **Aucune duplication** : une entité canonique est référencée par son identifiant stable plutôt que recopiée dans plusieurs modules.
- **Identifiants stables** : chaque objet et chaque relation possède un identifiant durable lorsque la source en fournit un.
- **Relations documentées** : chaque lien possède un type, une direction, une provenance et, si nécessaire, un niveau de confiance.
- **Sources documentées** : tout contenu officiel est relié à sa source, son édition, sa version, sa licence et sa date d’import.
- **Conservation des textes** : les textes sources ne sont pas réécrits ni fusionnés silencieusement.
- **Séparation des couches** : source, traduction, explication, pédagogie et personnalisation restent distinguées.
- **Interrogation multilingue** : une même entité peut posséder plusieurs libellés et contenus dans différentes langues.
- **Évolution sans rupture** : l’ajout d’une source ou d’un type d’objet ne doit pas modifier l’identité des objets existants.

## 3. Types d’objets

### 3.1 Sources religieuses et textuelles

- **Verset** : unité textuelle d’une révélation, reliée à une sourate et à une numérotation.
- **Sourate** : unité canonique du Coran, avec ses noms, numéros et métadonnées.
- **Tafsir** : explication attribuée à un auteur, une école ou une édition identifiée.
- **Hadith** : unité de récit avec texte, références, statut, narrateur et provenance.
- **Collection** : recueil auquel appartient un hadith.
- **Livre de hadith** : subdivision structurée d’une collection.
- **Chapitre** : subdivision d’un livre, avec son titre et sa référence.
- **Invocation** : dou’a ou invocation attribuée à une source documentée.
- **Dhikr** : formule ou pratique de rappel, avec sa source et son contexte.
- **Nom d’Allah** : nom ou attribut documenté, avec ses occurrences et explications.
- **Règle de jurisprudence** : règle attribuée à une source juridique ou doctrinale précise.

### 3.2 Personnes et entités historiques

- **Compagnon** : personne ayant rencontré le Prophète ﷺ selon une source biographique documentée.
- **Prophète** : prophète mentionné par une source reconnue.
- **Personnage** : personne historique ou religieuse qui n’entre pas nécessairement dans les catégories précédentes.
- **Lieu** : lieu géographique, historique ou religieux.
- **Mosquée** : lieu de culte, relié à un lieu géographique et à ses données documentaires.
- **Évènement historique** : événement documenté dans une ou plusieurs sources.
- **Bataille** : événement militaire documenté comme type particulier d’événement.

### 3.3 Concepts et linguistique

- **Thème** : notion transversale comme la patience, la prière ou la repentance.
- **Mot arabe** : forme lexicale apparaissant dans un texte.
- **Racine arabe** : racine linguistique reliée à plusieurs formes et significations.

### 3.4 Objets pédagogiques et applicatifs

- **Question Wasil** : question utilisateur et contexte de recherche associé.
- **Objectif** : objectif individuel ou pédagogique.
- **Programme** : ensemble structuré d’objectifs et d’étapes.
- **Notification** : message déclenché par un objectif, un événement, un rappel ou une règle utilisateur.

Les objets applicatifs ne doivent jamais devenir une source religieuse primaire. Ils référencent le graphe documentaire et ajoutent une couche de personnalisation ou de pédagogie.

## 4. Relations principales

Chaque relation doit indiquer au minimum : objet source, type de relation, objet cible, provenance, version et statut de vérification.

### 4.1 Relations textuelles

- Verset **appartient à** Sourate.
- Verset **est expliqué par** Tafsir.
- Verset **est lié à** Hadith.
- Verset **traite de** Thème.
- Verset **contient** Mot arabe.
- Verset **contient** Nom d’Allah.
- Hadith **appartient à** Collection.
- Hadith **appartient à** Livre de hadith.
- Hadith **est rattaché à** Chapitre.
- Hadith **est expliqué par** une explication attribuée.
- Hadith **enseigne** un thème ou un enseignement documenté.
- Hadith **est lié à** Verset.
- Hadith **est lié à** Invocation.
- Hadith **est rapporté par** Compagnon.
- Tafsir **explique** Verset.
- Tafsir **cite ou relie** Hadith.
- Invocation **est liée à** Verset, Hadith, Thème ou Situation.
- Dhikr **est lié à** Invocation, Hadith ou Situation.

### 4.2 Relations historiques et géographiques

- Compagnon **participe à** Évènement historique.
- Compagnon **participe à** Bataille.
- Prophète **est lié à** Évènement historique.
- Personnage **participe à** Évènement historique.
- Bataille **est un type de** Évènement historique.
- Bataille **se déroule à** Lieu.
- Évènement historique **se déroule à** Lieu.
- Lieu **contient** Mosquée.
- Lieu **est situé dans** Lieu.
- Personnage **est associé à** Lieu.
- Mosquée **est associée à** Évènement historique.

### 4.3 Relations linguistiques et conceptuelles

- Mot arabe **appartient à** Racine arabe.
- Mot arabe **apparaît dans** Verset, Hadith ou Tafsir.
- Mot arabe **est traduit par** un libellé multilingue.
- Racine arabe **est liée à** Thème.
- Thème **est lié à** Verset, Hadith, Invocation, Tafsir ou Objectif.
- Nom d’Allah **apparaît dans** Verset ou Hadith.
- Nom d’Allah **est expliqué par** Tafsir.
- Règle de jurisprudence **est fondée sur** Verset ou Hadith.
- Règle de jurisprudence **est liée à** Thème.

### 4.4 Relations pédagogiques et applicatives

- Question Wasil **utilise** Verset.
- Question Wasil **utilise** Hadith.
- Question Wasil **utilise** Tafsir.
- Question Wasil **est liée à** Thème.
- Question Wasil **suggère** Invocation, Dhikr, Objectif ou Programme.
- Programme **contient** Objectif.
- Objectif **est lié à** Thème, Verset, Hadith ou Invocation.
- Objectif **déclenche** Notification.
- Notification **rappelle** Objectif, Invocation ou Dhikr.
- Programme **est adapté à** un profil ou un public.
- Contenu **est adapté à** OUMMAH Kids ou OUMMAH Academy.

Les relations générées par Wasil doivent être distinguées des relations attestées par les sources. Une relation suggérée n’est pas une preuve documentaire.

## 5. Provenance des objets et des relations

Tout objet officiel doit pouvoir référencer :

- la source documentaire ;
- l’édition ;
- la version ;
- la licence ou l’autorisation ;
- l’identifiant original ;
- la référence précise ;
- la date d’import ;
- le statut de vérification.

Une relation peut provenir d’une source différente de celle des objets qu’elle relie. Par exemple, un hadith peut provenir d’une collection arabe, tandis qu’un lien vers un thème peut provenir d’un index éditorial.

Les liens inférés, rapprochés automatiquement ou proposés par Wasil doivent porter un statut distinct : `source`, `vérifié`, `à vérifier` ou `inféré`.

## 6. Navigation utilisateur

La navigation doit permettre de partir d’un contenu et d’explorer son contexte sans perdre la provenance.

Exemple :

```text
Lecture d’un hadith
        ↓
Voir le compagnon
        ↓
Voir sa biographie
        ↓
Voir les autres hadiths rapportés
        ↓
Voir les versets liés
        ↓
Voir les invocations liées
        ↓
Voir les thèmes liés
        ↓
Demander une explication à Wasil
```

Chaque écran doit distinguer :

- le contenu source ;
- la traduction ;
- l’explication attribuée ;
- les liens documentaires ;
- l’analyse pédagogique générée.

Une navigation vers un objet absent ou non vérifié doit être signalée comme telle et ne doit pas être présentée comme une certitude.

## 7. Recherche universelle

La recherche universelle indexe les objets et leurs relations, sans limiter la recherche à un seul module.

Une recherche sur `patience` peut retourner :

- des versets ;
- des hadiths ;
- des invocations ;
- des compagnons ;
- des tafsirs ;
- des thèmes ;
- des objectifs ;
- des programmes.

La recherche doit prendre en compte :

- les titres et libellés multilingues ;
- les traductions ;
- les références ;
- les racines et formes arabes ;
- les synonymes documentés ;
- les relations vérifiées ;
- la pertinence et le niveau de confiance.

Les résultats générés par Wasil doivent être présentés comme suggestions ou analyses, jamais comme nouvelles sources documentaires.

## 8. Évolutivité

### Nouvelles langues

Les libellés, traductions et explications sont des variantes linguistiques d’un même objet. Ajouter une langue ne crée pas un nouvel objet religieux et ne modifie pas les identifiants existants.

### Nouveaux tafsirs

Un tafsir supplémentaire est ajouté comme nouvelle source éditoriale reliée aux mêmes versets. Les tafsirs ne sont pas fusionnés dans un texte unique.

### Nouveaux recueils

Un nouveau recueil devient une nouvelle Collection avec ses propres livres, chapitres, identifiants et règles de numérotation.

### Nouveaux ouvrages

Tout ouvrage est enregistré comme source distincte. Ses références restent séparées des textes qu’il commente.

### Nouveaux liens

Une nouvelle relation peut être ajoutée sans changer les objets existants. Son type, sa provenance, sa version et son statut doivent être documentés.

### Versions

Une mise à jour de contenu crée une nouvelle version documentaire. L’ancienne version reste consultable dans l’historique lorsque les droits et la politique de conservation le permettent.

## 9. Compatibilité avec l’écosystème OUMMAH

### Wasil

Wasil utilise le graphe pour rechercher, contextualiser, comparer et expliquer. Il ne remplace pas les sources et doit distinguer les faits documentés des inférences pédagogiques.

### OUMMAH Kids

OUMMAH Kids peut utiliser des sous-graphes adaptés à l’âge : thèmes, histoires, invocations, objectifs et contenus validés. Les simplifications pédagogiques ne doivent pas être présentées comme des citations originales.

### OUMMATI

OUMMATI peut exploiter les relations communautaires, les profils, les lieux, les mosquées, les événements et les recommandations, tout en conservant la séparation entre données personnelles et sources religieuses.

### OUMMAH Academy

OUMMAH Academy peut organiser le graphe en cours, programmes, objectifs, séquences et évaluations. Les supports pédagogiques doivent conserver les références aux objets sources.

## 10. Gouvernance documentaire

Chaque nouveau type d’objet ou de relation doit être accompagné de :

- sa définition ;
- ses identifiants ;
- ses relations autorisées ;
- ses règles de provenance ;
- ses langues ;
- ses statuts de vérification ;
- ses règles d’archivage ;
- sa compatibilité avec les applications existantes.

Une entité ne doit pas être créée uniquement parce qu’elle est utile à un écran. Elle doit avoir une définition documentaire stable et réutilisable.

## 11. Cycle de vie officiel des ressources Hadith

Toutes les ressources documentaires Hadith suivent le cycle de vie officiel suivant :

```text
Importée
    ↓
Validée
    ↓
Juridiquement validée
    ↓
Disponible en développement
    ↓
Disponible en bêta
    ↓
Disponible en production
```

### 11.1 Signification des étapes

- **Importée** : la ressource a été reçue et conservée, sans validation technique ou juridique définitive.
- **Validée** : les contrôles de structure, d’intégrité, de cohérence et de provenance sont satisfaisants.
- **Juridiquement validée** : la licence, l’attribution, les restrictions et les conditions de stockage et de redistribution sont documentées et acceptées.
- **Disponible en développement** : la ressource peut être utilisée dans l’environnement interne de développement.
- **Disponible en bêta** : la ressource peut être présentée à un groupe de test contrôlé.
- **Disponible en production** : la ressource peut être affichée aux utilisateurs finaux dans les limites de sa licence.

Une ressource ne peut pas passer directement de l’étape **Importée** à l’étape **Disponible en production**. Chaque étape précédente doit être franchie et documentée.

### 11.2 Événements de transition immuables

Chaque changement d’étape produit un événement historique immuable. Cet événement ne doit jamais être supprimé ni réécrit, même si la ressource est ultérieurement suspendue, retirée, archivée ou rejetée.

Chaque événement contient obligatoirement :

- l’identifiant de la ressource ;
- l’ancienne étape ;
- la nouvelle étape ;
- la date et l’heure de la transition ;
- l’auteur de la décision ;
- la justification ;
- le document ou la preuve associé lorsque nécessaire ;
- la version concernée.

Une transition sans justification suffisante ne doit pas être considérée comme valide. Les décisions successives doivent permettre de reconstituer l’intégralité de l’historique de la ressource.

### 11.3 États de contrôle complémentaires

Les états suivants peuvent être appliqués à une ressource déjà enregistrée dans le cycle de vie :

- **Suspendue** : la ressource est temporairement indisponible pendant une vérification ou dans l’attente d’une décision.
- **Retirée** : la ressource ne doit plus être affichée ou utilisée dans les nouvelles opérations.
- **Archivée** : la ressource est conservée pour la traçabilité historique, mais n’est plus active.
- **Rejetée** : la ressource ne satisfait pas les exigences documentaires, techniques ou juridiques.

Ces états ne suppriment jamais physiquement la ressource. Le contenu, ses métadonnées, sa provenance, sa licence, sa version et ses événements historiques restent conservés conformément à la politique documentaire et aux obligations légales applicables.

### 11.4 Exclusion immédiate

Une ressource **Suspendue** ou **Retirée** doit être immédiatement exclue :

- de l’affichage dans l’application ;
- des recherches ;
- des recommandations ;
- des futurs téléchargements hors ligne ;
- des réponses de Wasil ;
- des citations de Wasil.

Une ressource **Archivée** ou **Rejetée** n’est pas une ressource active et ne doit pas être proposée aux utilisateurs. Elle peut uniquement rester accessible aux fonctions d’audit autorisées.

Le retrait d’une ressource ne supprime ni le hadith auquel elle était rattachée, ni les autres traductions, explications ou versions juridiquement indépendantes.

## 12. Vision

L’Islamic Knowledge Graph constitue le socle documentaire de tout l’écosystème OUMMAH pour les années à venir.

Il doit permettre de relier fidèlement les textes, les sources, les personnes, les lieux, les événements, les notions et les parcours d’apprentissage, tout en protégeant la provenance et l’intégrité de chaque contenu.

Grâce à cette architecture, OUMMAH peut évoluer vers de nouvelles langues, de nouveaux recueils, de nouveaux ouvrages et de nouveaux produits sans casser l’existant ni confondre patrimoine documentaire et pédagogie moderne.
