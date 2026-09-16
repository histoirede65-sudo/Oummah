# Halal autour de moi

## Périmètre

Le module recherche des restaurants et commerces halal autour d’une position en fusionnant Google Places, OpenStreetMap et les contributions OUMMAH. Il fournit une vue liste, une carte native, des filtres, les favoris, une fiche détaillée, les signalements et l’ajout local d’une adresse.

## Sources et confiance

- Les résultats publics viennent d’OpenStreetMap via Overpass.
- Les commerces Google sont recherchés via une fonction Supabase protégée. Ils portent l’attribution « Google Maps » et ne sont jamais présentés comme certifiés par OUMMAH.
- `Déclaré halal` signifie qu’un tag public explicite (`diet:halal=yes`, `halal=yes` ou une certification déclarée) existe. OUMMAH ne prétend pas avoir vérifié le certificat.
- `Information à vérifier` couvre les résultats trouvés par leur nom sans preuve explicite.
- `Signalé par la communauté` couvre les contributions locales d’utilisateurs.
- `Certificat vérifié` est prévu par le modèle mais ne doit être produit que par un futur processus de modération réel.

## Données locales

AsyncStorage conserve :

- le cache OpenStreetMap pendant huit heures ;
- les derniers résultats pour ouvrir les fiches ;
- les favoris ;
- les contributions locales ;
- les signalements locaux.

Une panne du cache ne bloque pas une recherche réseau réussie. Une ancienne recherche reste utilisable si les services Overpass sont temporairement indisponibles.

Le contenu Google Places n’est pas persisté dans AsyncStorage : seuls les identifiants Google peuvent être conservés. Les résultats Google restent en mémoire pendant la session courante, conformément aux restrictions de stockage de Google Maps Platform.

## Google Places et coût

- `supabase/functions/nearby-halal` utilise Text Search avec un masque de champs Pro minimal et une seule requête par zone.
- `supabase/functions/halal-place-details` charge téléphone, site et horaires seulement lorsqu’une fiche est ouverte.
- Les changements de catégorie sont filtrés localement et ne déclenchent pas de nouvelle requête Google.
- Les changements rapides de rayon sont regroupés avant de lancer une nouvelle recherche.
- Le retour depuis une fiche ne relance pas automatiquement la recherche.
- La clé `GOOGLE_PLACES_API_KEY` reste exclusivement dans les secrets Supabase.

## Déploiement Supabase requis

La clé déjà utilisée par `nearby-mosques` est réutilisée. Déployer les deux nouvelles fonctions :

```bash
supabase functions deploy nearby-halal
supabase functions deploy halal-place-details
```

Avant la publication en production, vérifier également que la politique de confidentialité publique de l’application mentionne l’utilisation de Google Maps Platform et renvoie vers les conditions et la politique de confidentialité de Google, conformément aux règles Places API.

## Intégrations

- `components/HomeShortcuts.tsx` : carte Halal dans « Vos essentiels » ;
- `components/AppHeader.tsx` : entrée dans le menu principal ;
- `app/(tabs)/dalil.tsx` : réponse locale et gratuite de Wasil aux recherches halal de proximité.

## Vérifications manuelles recommandées

1. Autoriser puis refuser la géolocalisation.
2. Chercher une ville manuellement.
3. Tester les rayons, catégories, recherche texte et horaires.
4. Alterner liste et carte sur iOS/Android ; vérifier le repli web.
5. Ajouter et retirer un favori, puis rouvrir le module.
6. Ouvrir itinéraire, téléphone et site lorsqu’ils existent.
7. Ajouter une adresse, vérifier sa fiche puis son apparition dans son rayon.
8. Envoyer un signalement.
9. Demander à Wasil « Trouve-moi un restaurant halal près de moi ».
