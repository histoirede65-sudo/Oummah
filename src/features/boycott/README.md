# Module Boycott OUMMAH

Périmètre isolé : `app/boycott/*`, `components/boycott/*`, `features/boycott/*` + une carte ajoutée en première position dans `components/AllahNamesHomeSection.tsx`.

## Scanner
Le scanner utilise `expo-camera` (`CameraView`) pour une détection continue EAN/UPC/Code128. Si la dépendance n'est pas encore présente dans le projet complet :

```powershell
npx expo install expo-camera
```

Le flux est : code local connu -> Open Food Facts pour identifier le produit/la marque -> rapprochement avec le catalogue OUMMAH -> fiche rouge si un lien validé existe. Aucun préfixe EAN national n'est utilisé comme preuve d'appartenance à une entreprise.

## Validation
Les propositions utilisateur sont insérées dans `boycott_submissions` avec `validation_status = pending`. Elles ne sont jamais publiées automatiquement. La table `boycott_entities` ne contient que les fiches validées/actives.

La migration à appliquer est :
`supabase/migrations/20260904143000_boycott_catalog.sql`

Le corpus embarqué est un amorçage hors-ligne. Il doit continuer à être enrichi et vérifié par l'administration avec sources et date de vérification.
