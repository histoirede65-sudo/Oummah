# Correction Hadith en production

Cause identifiée : la récupération Hadith était effectuée uniquement via le pipeline V4. Or ce pipeline ne s'exécute en production que si plusieurs feature flags expérimentaux sont activés. Quand ces flags étaient absents ou incomplets, aucun appel réel à HadeethEnc n'était effectué, même lorsque la question demandait explicitement la Sunna.

Correction : `index.ts` appelle désormais directement `searchHadithRepository(..., { force: true })` lorsqu'une question mentionne explicitement la Sunna ou les hadiths, indépendamment des flags V4. Les données restent récupérées depuis HadeethEnc et passent par les mêmes contrôles de déduplication et de pertinence.

Le frontend, la navigation, le Coran et les autres modules ne sont pas modifiés.
