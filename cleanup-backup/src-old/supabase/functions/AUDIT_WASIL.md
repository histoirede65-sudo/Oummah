# Audit Wasil 15

Corrections appliquées :

1. Suppression de la seconde copie imbriquée `wasil/wasil/`, qui contenait une version différente et pouvait provoquer le déploiement d'un ancien comportement.
2. Navigation rendue indépendante des sources documentaires : une carte Coran/Hadith ne peut plus créer une action. Une action n'est conservée que pour une commande explicite de l'utilisateur.
3. Ajout d'un test de non-régression couvrant la question exacte sur les promesses.
4. Pour les formulations demandant explicitement « Coran et Sunna », le complément documentaire Coran + Hadith est désormais forcé même si le planificateur oublie l'une des deux compétences.
5. Conservation des protections existantes contre les doublons de références coraniques et de hadiths.

Limite importante : cette archive contient le backend Supabase Wasil uniquement. Si l'application ouvre encore l'onglet Coran au toucher avant réception de la réponse HTTP, la cause se trouve dans le frontend React Native et ne peut pas être corrigée dans cette archive.
