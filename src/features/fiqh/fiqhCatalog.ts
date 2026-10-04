import type { FiqhCategory, FiqhChapter, FiqhTopic } from "./fiqhTypes";

// Catalogue of the Fiqh module: books, chapters and lessons with their references and the documented
// positions of the four schools. The reading text of each lesson lives in ./lessons.

export const CATALOG_CATEGORIES: FiqhCategory[] = [
  {
    "id": "purification",
    "title": "Purification",
    "arabicTitle": "الطهارة",
    "summary": "Éléments primaires établis sur la purification.",
    "topicIds": [
      "water-impurities",
      "wudu",
      "wudu-obligations",
      "wudu-sunnas",
      "wudu-invalidators",
      "ghusl",
      "ghusl-required",
      "tayammum",
      "khuff",
      "menstruation",
      "postpartum",
      "purification-doubt",
      "soiled-clothing",
      "najasat"
    ]
  },
  {
    "id": "prayer",
    "title": "Prière",
    "arabicTitle": "الصلاة",
    "summary": "Repères primaires sur la prière et ses principales situations.",
    "topicIds": [
      "prayer-status",
      "prayer-intention",
      "prayer-adhan-iqama",
      "prayer-times",
      "prayer-qibla",
      "prayer-purification",
      "prayer-structure",
      "prayer-takbir",
      "prayer-ruku",
      "prayer-rising",
      "prayer-sujud",
      "prayer-between-sujuds",
      "prayer-tumanina",
      "prayer-fatiha",
      "prayer-tashahhud",
      "prayer-taslim",
      "prayer-sick",
      "prayer-travel",
      "prayer-combining",
      "prayer-latecomer",
      "prayer-sahw",
      "prayer-friday",
      "prayer-eid",
      "prayer-funeral",
      "prayer-imam-following",
      "prayer-invalidators",
      "prayer-after-dhikr",
      "prayer-congregation",
      "prayer-missed",
      "prayer-forbidden-times",
      "prayer-witr",
      "prayer-rawatib",
      "prayer-night"
    ]
  },
  {
    "id": "fasting",
    "title": "Jeûne",
    "arabicTitle": "الصيام",
    "summary": "Repères primaires et limites documentaires sur le jeûne.",
    "topicIds": [
      "fasting-obligation",
      "fasting-taqwa",
      "fasting-month-start",
      "fasting-crescent",
      "fasting-thirty-days",
      "fasting-dawn",
      "fasting-iftar-time",
      "fasting-suhur",
      "fasting-iftar",
      "fasting-forgetfulness",
      "fasting-intercourse",
      "fasting-kaffara",
      "fasting-illness",
      "fasting-travel",
      "fasting-makeup",
      "fasting-menstruation",
      "fasting-shawwal",
      "fasting-ashura",
      "fasting-arafah",
      "fasting-tashriq",
      "fasting-eid-fitr",
      "fasting-eid-adha",
      "fasting-qadr",
      "fasting-intention",
      "fasting-breakers",
      "fasting-not-breaking",
      "fasting-elderly-pregnant",
      "fasting-voluntary-days",
      "fasting-itikaf"
    ]
  },
  {
    "id": "zakat",
    "title": "Zakât",
    "arabicTitle": "الزكاة",
    "summary": "Fondements textuels et limites documentaires de la Zakât.",
    "topicIds": [
      "zakat-obligation",
      "zakat-beneficiaries",
      "zakat-purification",
      "zakat-nisab",
      "zakat-money-gold",
      "zakat-hawl",
      "zakat-camels",
      "zakat-sheep",
      "zakat-crops",
      "zakat-rikaz",
      "zakat-fitr",
      "zakat-fitr-amount",
      "zakat-fitr-food",
      "zakat-fitr-persons",
      "zakat-fitr-timing",
      "zakat-cattle"
    ]
  },
  {
    "id": "hajj-umra",
    "title": "Hajj & ‘Umra",
    "arabicTitle": "الحج والعمرة",
    "summary": "Repères juridiques essentiels, preuves et limites documentaires.",
    "topicIds": [
      "hajj-obligation",
      "hajj-once",
      "hajj-ihram-miqat-talbiya",
      "hajj-tawaf-sai",
      "hajj-arafah-muzdalifah-mina",
      "hajj-jamarat-sacrifice-hair",
      "hajj-ifada-farewell",
      "hajj-types",
      "hajj-menstruation",
      "hajj-child-incapacity",
      "hajj-pillars",
      "hajj-prohibitions",
      "hajj-umrah"
    ]
  },
  {
    "id": "funerals",
    "title": "Funérailles",
    "arabicTitle": "الجنائز",
    "summary": "Toilette mortuaire, linceul, prière funéraire, enterrement et condoléances.",
    "topicIds": [
      "funerals-dying-person",
      "funerals-after-death",
      "funerals-washing",
      "funerals-washing-cases",
      "funerals-shroud",
      "funerals-shroud-cases",
      "funerals-prayer-basics",
      "funerals-prayer-absent",
      "funerals-burial",
      "funerals-grave",
      "funerals-condolences",
      "funerals-graves"
    ]
  },
  {
    "id": "family",
    "title": "Mariage & famille",
    "arabicTitle": "النكاح والأسرة",
    "summary": "Mariage, droits familiaux, séparation et situations liées à la famille.",
    "topicIds": [
      "family-marriage-purpose",
      "family-proposal",
      "family-contract",
      "family-wali",
      "family-witnesses",
      "family-mahr",
      "family-spousal-rights",
      "family-maintenance",
      "family-disagreements",
      "family-divorce",
      "family-khul",
      "family-iddah",
      "family-lineage",
      "family-breastfeeding",
      "family-custody",
      "family-mahram"
    ]
  },
  {
    "id": "transactions",
    "title": "Transactions",
    "arabicTitle": "المعاملات",
    "summary": "Vente, dette, location, garanties et autres transactions.",
    "topicIds": [
      "transactions-consent",
      "transactions-clarity",
      "transactions-sale",
      "transactions-defects",
      "transactions-options",
      "transactions-debt",
      "transactions-loan",
      "transactions-guarantee",
      "transactions-riba",
      "transactions-currency",
      "transactions-rental",
      "transactions-wages",
      "transactions-partnership",
      "transactions-agency"
    ]
  },
  {
    "id": "food-sacrifices",
    "title": "Alimentation & sacrifices",
    "arabicTitle": "الأطعمة والذبائح",
    "summary": "Aliments, abattage, chasse, sacrifice et ‘aqîqa.",
    "topicIds": [
      "food-principles",
      "food-prohibited",
      "food-slaughter",
      "food-slaughter-tools",
      "food-udhiyah",
      "food-udhiyah-time",
      "food-aqiqah",
      "food-aqiqah-time"
    ]
  },
  {
    "id": "oaths-vows",
    "title": "Serments & vœux",
    "arabicTitle": "الأيمان والنذور",
    "summary": "Serments, vœux et expiations associées.",
    "topicIds": [
      "oaths-types",
      "oaths-breaking",
      "oaths-expiation",
      "vows-basics",
      "vows-fulfilment",
      "expiations-overview"
    ]
  },
  {
    "id": "clothing-adornment",
    "title": "Vêtements & parure",
    "arabicTitle": "اللباس والزينة",
    "summary": "Vêtements, parure, apparence et usages associés.",
    "topicIds": [
      "clothing-principles",
      "clothing-awrah",
      "clothing-gold-silk",
      "clothing-perfume",
      "clothing-hair",
      "clothing-body-modification"
    ]
  },
  {
    "id": "daily-life",
    "title": "Vie quotidienne",
    "arabicTitle": "الآداب",
    "summary": "Adab, voisinage, salutations, voyage et usages du quotidien.",
    "topicIds": [
      "daily-toilet",
      "daily-sleep",
      "daily-greetings",
      "daily-permission",
      "daily-neighbours",
      "daily-travel-etiquette",
      "daily-return",
      "daily-roads",
      "daily-gatherings"
    ]
  },
  {
    "id": "justice-rights",
    "title": "Justice & droits",
    "arabicTitle": "القضاء والحقوق",
    "summary": "Témoignages, litiges, biens, dommages et droits.",
    "topicIds": [
      "justice-testimony",
      "justice-oaths",
      "justice-disputes",
      "justice-settlement",
      "justice-found-property",
      "justice-usurpation",
      "justice-damages"
    ]
  },
  {
    "id": "inheritance-wills",
    "title": "Héritage & testaments",
    "arabicTitle": "المواريث والوصايا",
    "summary": "Testaments, héritage, dettes du défunt et partage.",
    "topicIds": [
      "wills-basics",
      "wills-limits",
      "inheritance-estate",
      "inheritance-debts",
      "inheritance-heirs",
      "inheritance-shares",
      "inheritance-blocking",
      "inheritance-unresolved"
    ]
  },
  {
    "id": "hunting-animals",
    "title": "Chasse & animaux",
    "arabicTitle": "الصيد والحيوان",
    "summary": "Chasse, animaux et situations juridiques associées.",
    "topicIds": [
      "hunting-basics",
      "hunting-tools",
      "animals-domestic",
      "animals-welfare",
      "animals-products"
    ]
  },
  {
    "id": "siyar-relations",
    "title": "Siyar & relations",
    "arabicTitle": "السير والعلاقات",
    "summary": "Cadres juridiques historiques des relations, engagements et protections.",
    "topicIds": [
      "siyar-covenants",
      "siyar-protection",
      "siyar-noncombatants",
      "siyar-property",
      "siyar-historical-context"
    ]
  }
];

export const CATALOG_CHAPTERS: FiqhChapter[] = [
  {
    "id": "purification-water",
    "categoryId": "purification",
    "title": "Les eaux",
    "topicIds": [
      "water-impurities",
      "najasat"
    ]
  },
  {
    "id": "purification-ablutions",
    "categoryId": "purification",
    "title": "Les ablutions",
    "topicIds": [
      "wudu",
      "wudu-obligations",
      "wudu-sunnas",
      "wudu-invalidators"
    ]
  },
  {
    "id": "purification-khuff",
    "categoryId": "purification",
    "title": "Les khuff",
    "topicIds": [
      "khuff"
    ]
  },
  {
    "id": "purification-ghusl",
    "categoryId": "purification",
    "title": "Le ghusl",
    "topicIds": [
      "ghusl",
      "ghusl-required"
    ]
  },
  {
    "id": "purification-tayammum",
    "categoryId": "purification",
    "title": "Le tayammum",
    "topicIds": [
      "tayammum"
    ]
  },
  {
    "id": "purification-menstruation",
    "categoryId": "purification",
    "title": "Menstrues et lochies",
    "topicIds": [
      "menstruation",
      "postpartum"
    ]
  },
  {
    "id": "purification-doubt",
    "categoryId": "purification",
    "title": "Le doute",
    "topicIds": [
      "purification-doubt"
    ]
  },
  {
    "id": "purification-soiled-clothing",
    "categoryId": "purification",
    "title": "Vêtements et lieux",
    "topicIds": [
      "soiled-clothing"
    ]
  },
  {
    "id": "prayer-foundations",
    "categoryId": "prayer",
    "title": "Fondements et préparation",
    "topicIds": [
      "prayer-status",
      "prayer-intention",
      "prayer-purification",
      "prayer-adhan-iqama"
    ]
  },
  {
    "id": "prayer-times-qibla",
    "categoryId": "prayer",
    "title": "Horaires et orientation",
    "topicIds": [
      "prayer-times",
      "prayer-qibla",
      "prayer-forbidden-times"
    ]
  },
  {
    "id": "prayer-entry-recitation",
    "categoryId": "prayer",
    "title": "Entrer dans la prière et réciter",
    "topicIds": [
      "prayer-structure",
      "prayer-takbir",
      "prayer-fatiha"
    ]
  },
  {
    "id": "prayer-bowing-prostration",
    "categoryId": "prayer",
    "title": "Inclinaison et prosternation",
    "topicIds": [
      "prayer-ruku",
      "prayer-rising",
      "prayer-sujud",
      "prayer-between-sujuds",
      "prayer-tumanina"
    ]
  },
  {
    "id": "prayer-seated-ending",
    "categoryId": "prayer",
    "title": "Assises et fin de la prière",
    "topicIds": [
      "prayer-tashahhud",
      "prayer-taslim",
      "prayer-after-dhikr"
    ]
  },
  {
    "id": "prayer-special-situations",
    "categoryId": "prayer",
    "title": "Situations particulières",
    "topicIds": [
      "prayer-sick",
      "prayer-travel",
      "prayer-combining"
    ]
  },
  {
    "id": "prayer-corrections",
    "categoryId": "prayer",
    "title": "Rejoindre, oublier et corriger",
    "topicIds": [
      "prayer-latecomer",
      "prayer-sahw",
      "prayer-missed"
    ]
  },
  {
    "id": "prayer-collective-friday",
    "categoryId": "prayer",
    "title": "Prière collective et vendredi",
    "topicIds": [
      "prayer-imam-following",
      "prayer-friday",
      "prayer-congregation"
    ]
  },
  {
    "id": "prayer-voluntary",
    "categoryId": "prayer",
    "title": "Prières recommandées",
    "topicIds": [
      "prayer-witr",
      "prayer-rawatib",
      "prayer-night"
    ]
  },
  {
    "id": "prayer-funeral",
    "categoryId": "prayer",
    "title": "Prière funéraire",
    "topicIds": [
      "prayer-funeral"
    ]
  },
  {
    "id": "prayer-invalidators",
    "categoryId": "prayer",
    "title": "Ce qui invalide la prière",
    "topicIds": [
      "prayer-invalidators"
    ]
  },
  {
    "id": "prayer-eid",
    "categoryId": "prayer",
    "title": "Les deux Aïd",
    "topicIds": [
      "prayer-eid"
    ]
  },
  {
    "id": "fasting-foundations",
    "categoryId": "fasting",
    "title": "Fondements du jeûne",
    "topicIds": [
      "fasting-obligation",
      "fasting-taqwa",
      "fasting-intention"
    ]
  },
  {
    "id": "fasting-month-start",
    "categoryId": "fasting",
    "title": "Entrée du mois",
    "topicIds": [
      "fasting-month-start",
      "fasting-crescent",
      "fasting-thirty-days"
    ]
  },
  {
    "id": "fasting-daily-rhythm",
    "categoryId": "fasting",
    "title": "Du suḥûr à l’iftâr",
    "topicIds": [
      "fasting-dawn",
      "fasting-iftar-time",
      "fasting-suhur",
      "fasting-iftar"
    ]
  },
  {
    "id": "fasting-invalidations",
    "categoryId": "fasting",
    "title": "Oubli, rupture et expiation",
    "topicIds": [
      "fasting-forgetfulness",
      "fasting-intercourse",
      "fasting-kaffara",
      "fasting-breakers",
      "fasting-not-breaking"
    ]
  },
  {
    "id": "fasting-excuses",
    "categoryId": "fasting",
    "title": "Dispenses et rattrapage",
    "topicIds": [
      "fasting-illness",
      "fasting-travel",
      "fasting-makeup",
      "fasting-menstruation",
      "fasting-elderly-pregnant"
    ]
  },
  {
    "id": "fasting-voluntary",
    "categoryId": "fasting",
    "title": "Jeûnes de dates particulières",
    "topicIds": [
      "fasting-shawwal",
      "fasting-ashura",
      "fasting-arafah",
      "fasting-voluntary-days"
    ]
  },
  {
    "id": "fasting-special-days",
    "categoryId": "fasting",
    "title": "Jours particuliers",
    "topicIds": [
      "fasting-tashriq",
      "fasting-eid-fitr",
      "fasting-eid-adha"
    ]
  },
  {
    "id": "fasting-qadr",
    "categoryId": "fasting",
    "title": "Laylat al-Qadr",
    "topicIds": [
      "fasting-qadr",
      "fasting-itikaf"
    ]
  },
  {
    "id": "zakat-foundations",
    "categoryId": "zakat",
    "title": "Fondements de la Zakât",
    "topicIds": [
      "zakat-obligation",
      "zakat-purification"
    ]
  },
  {
    "id": "zakat-beneficiaries",
    "categoryId": "zakat",
    "title": "Bénéficiaires",
    "topicIds": [
      "zakat-beneficiaries"
    ]
  },
  {
    "id": "zakat-thresholds",
    "categoryId": "zakat",
    "title": "Nisâb, biens et ḥawl",
    "topicIds": [
      "zakat-nisab",
      "zakat-money-gold",
      "zakat-hawl"
    ]
  },
  {
    "id": "zakat-livestock",
    "categoryId": "zakat",
    "title": "Bétail",
    "topicIds": [
      "zakat-camels",
      "zakat-sheep",
      "zakat-cattle"
    ]
  },
  {
    "id": "zakat-crops-rikaz",
    "categoryId": "zakat",
    "title": "Récoltes et rikâz",
    "topicIds": [
      "zakat-crops",
      "zakat-rikaz"
    ]
  },
  {
    "id": "zakat-fitr",
    "categoryId": "zakat",
    "title": "Zakât al-Fitr",
    "topicIds": [
      "zakat-fitr",
      "zakat-fitr-amount",
      "zakat-fitr-food",
      "zakat-fitr-persons",
      "zakat-fitr-timing"
    ]
  },
  {
    "id": "hajj-foundations",
    "categoryId": "hajj-umra",
    "title": "Obligation et fréquence",
    "topicIds": [
      "hajj-obligation",
      "hajj-once",
      "hajj-pillars"
    ]
  },
  {
    "id": "hajj-ihram",
    "categoryId": "hajj-umra",
    "title": "Ihrâm, mîqât et talbiya",
    "topicIds": [
      "hajj-ihram-miqat-talbiya",
      "hajj-prohibitions"
    ]
  },
  {
    "id": "hajj-tawaf-sai",
    "categoryId": "hajj-umra",
    "title": "Tawâf et sa‘y",
    "topicIds": [
      "hajj-tawaf-sai"
    ]
  },
  {
    "id": "hajj-arafah-mina",
    "categoryId": "hajj-umra",
    "title": "‘Arafah, Muzdalifah et Minâ",
    "topicIds": [
      "hajj-arafah-muzdalifah-mina"
    ]
  },
  {
    "id": "hajj-jamarat",
    "categoryId": "hajj-umra",
    "title": "Jamarât, sacrifice et cheveux",
    "topicIds": [
      "hajj-jamarat-sacrifice-hair"
    ]
  },
  {
    "id": "hajj-ifada-farewell",
    "categoryId": "hajj-umra",
    "title": "Ifâda et tawâf d’adieu",
    "topicIds": [
      "hajj-ifada-farewell"
    ]
  },
  {
    "id": "hajj-types",
    "categoryId": "hajj-umra",
    "title": "Les formes du Hajj",
    "topicIds": [
      "hajj-types",
      "hajj-umrah"
    ]
  },
  {
    "id": "hajj-special-cases",
    "categoryId": "hajj-umra",
    "title": "Situations particulières",
    "topicIds": [
      "hajj-menstruation",
      "hajj-child-incapacity"
    ]
  },
  {
    "id": "funerals-death",
    "categoryId": "funerals",
    "title": "Au moment du décès",
    "topicIds": [
      "funerals-dying-person",
      "funerals-after-death"
    ]
  },
  {
    "id": "funerals-washing",
    "categoryId": "funerals",
    "title": "Toilette mortuaire",
    "topicIds": [
      "funerals-washing",
      "funerals-washing-cases"
    ]
  },
  {
    "id": "funerals-shroud",
    "categoryId": "funerals",
    "title": "Linceul",
    "topicIds": [
      "funerals-shroud",
      "funerals-shroud-cases"
    ]
  },
  {
    "id": "funerals-prayer",
    "categoryId": "funerals",
    "title": "Prière funéraire",
    "topicIds": [
      "funerals-prayer-basics",
      "funerals-prayer-absent"
    ]
  },
  {
    "id": "funerals-burial",
    "categoryId": "funerals",
    "title": "Enterrement",
    "topicIds": [
      "funerals-burial",
      "funerals-grave"
    ]
  },
  {
    "id": "funerals-condolences",
    "categoryId": "funerals",
    "title": "Condoléances et visite",
    "topicIds": [
      "funerals-condolences",
      "funerals-graves"
    ]
  },
  {
    "id": "family-marriage",
    "categoryId": "family",
    "title": "Le mariage",
    "topicIds": [
      "family-marriage-purpose",
      "family-proposal",
      "family-contract",
      "family-mahram"
    ]
  },
  {
    "id": "family-wali-mahr",
    "categoryId": "family",
    "title": "Wali, témoins et mahr",
    "topicIds": [
      "family-wali",
      "family-witnesses",
      "family-mahr"
    ]
  },
  {
    "id": "family-spouses",
    "categoryId": "family",
    "title": "Vie conjugale",
    "topicIds": [
      "family-spousal-rights",
      "family-maintenance",
      "family-disagreements"
    ]
  },
  {
    "id": "family-separation",
    "categoryId": "family",
    "title": "Séparation",
    "topicIds": [
      "family-divorce",
      "family-khul",
      "family-iddah"
    ]
  },
  {
    "id": "family-children",
    "categoryId": "family",
    "title": "Enfants et filiation",
    "topicIds": [
      "family-lineage",
      "family-breastfeeding",
      "family-custody"
    ]
  },
  {
    "id": "transactions-foundations",
    "categoryId": "transactions",
    "title": "Principes des transactions",
    "topicIds": [
      "transactions-consent",
      "transactions-clarity"
    ]
  },
  {
    "id": "transactions-sales",
    "categoryId": "transactions",
    "title": "Vente et achat",
    "topicIds": [
      "transactions-sale",
      "transactions-defects",
      "transactions-options"
    ]
  },
  {
    "id": "transactions-debt",
    "categoryId": "transactions",
    "title": "Dette et prêt",
    "topicIds": [
      "transactions-debt",
      "transactions-loan",
      "transactions-guarantee"
    ]
  },
  {
    "id": "transactions-riba",
    "categoryId": "transactions",
    "title": "Ribâ et échanges",
    "topicIds": [
      "transactions-riba",
      "transactions-currency"
    ]
  },
  {
    "id": "transactions-rental",
    "categoryId": "transactions",
    "title": "Location et services",
    "topicIds": [
      "transactions-rental",
      "transactions-wages"
    ]
  },
  {
    "id": "transactions-partnerships",
    "categoryId": "transactions",
    "title": "Associations et mandats",
    "topicIds": [
      "transactions-partnership",
      "transactions-agency"
    ]
  },
  {
    "id": "food-basics",
    "categoryId": "food-sacrifices",
    "title": "Aliments et boissons",
    "topicIds": [
      "food-principles",
      "food-prohibited"
    ]
  },
  {
    "id": "food-slaughter",
    "categoryId": "food-sacrifices",
    "title": "Abattage",
    "topicIds": [
      "food-slaughter",
      "food-slaughter-tools"
    ]
  },
  {
    "id": "food-sacrifice",
    "categoryId": "food-sacrifices",
    "title": "Sacrifice",
    "topicIds": [
      "food-udhiyah",
      "food-udhiyah-time"
    ]
  },
  {
    "id": "food-aqiqah",
    "categoryId": "food-sacrifices",
    "title": "‘Aqîqa",
    "topicIds": [
      "food-aqiqah",
      "food-aqiqah-time"
    ]
  },
  {
    "id": "oaths",
    "categoryId": "oaths-vows",
    "title": "Serments",
    "topicIds": [
      "oaths-types",
      "oaths-breaking",
      "oaths-expiation"
    ]
  },
  {
    "id": "vows",
    "categoryId": "oaths-vows",
    "title": "Vœux",
    "topicIds": [
      "vows-basics",
      "vows-fulfilment"
    ]
  },
  {
    "id": "expiations",
    "categoryId": "oaths-vows",
    "title": "Expiations",
    "topicIds": [
      "expiations-overview"
    ]
  },
  {
    "id": "clothing-basics",
    "categoryId": "clothing-adornment",
    "title": "Vêtements",
    "topicIds": [
      "clothing-principles",
      "clothing-awrah"
    ]
  },
  {
    "id": "clothing-adornment",
    "categoryId": "clothing-adornment",
    "title": "Parure",
    "topicIds": [
      "clothing-gold-silk",
      "clothing-perfume"
    ]
  },
  {
    "id": "clothing-appearance",
    "categoryId": "clothing-adornment",
    "title": "Apparence",
    "topicIds": [
      "clothing-hair",
      "clothing-body-modification"
    ]
  },
  {
    "id": "daily-cleanliness",
    "categoryId": "daily-life",
    "title": "Usages personnels",
    "topicIds": [
      "daily-toilet",
      "daily-sleep"
    ]
  },
  {
    "id": "daily-social",
    "categoryId": "daily-life",
    "title": "Relations sociales",
    "topicIds": [
      "daily-greetings",
      "daily-permission",
      "daily-neighbours"
    ]
  },
  {
    "id": "daily-travel",
    "categoryId": "daily-life",
    "title": "Voyage",
    "topicIds": [
      "daily-travel-etiquette",
      "daily-return"
    ]
  },
  {
    "id": "daily-public",
    "categoryId": "daily-life",
    "title": "Vie collective",
    "topicIds": [
      "daily-roads",
      "daily-gatherings"
    ]
  },
  {
    "id": "justice-evidence",
    "categoryId": "justice-rights",
    "title": "Preuves et témoignages",
    "topicIds": [
      "justice-testimony",
      "justice-oaths"
    ]
  },
  {
    "id": "justice-disputes",
    "categoryId": "justice-rights",
    "title": "Litiges",
    "topicIds": [
      "justice-disputes",
      "justice-settlement"
    ]
  },
  {
    "id": "justice-property",
    "categoryId": "justice-rights",
    "title": "Biens et dommages",
    "topicIds": [
      "justice-found-property",
      "justice-usurpation",
      "justice-damages"
    ]
  },
  {
    "id": "wills",
    "categoryId": "inheritance-wills",
    "title": "Testaments",
    "topicIds": [
      "wills-basics",
      "wills-limits"
    ]
  },
  {
    "id": "inheritance-estate",
    "categoryId": "inheritance-wills",
    "title": "Succession",
    "topicIds": [
      "inheritance-estate",
      "inheritance-debts"
    ]
  },
  {
    "id": "inheritance-heirs",
    "categoryId": "inheritance-wills",
    "title": "Héritiers",
    "topicIds": [
      "inheritance-heirs",
      "inheritance-shares"
    ]
  },
  {
    "id": "inheritance-cases",
    "categoryId": "inheritance-wills",
    "title": "Situations particulières",
    "topicIds": [
      "inheritance-blocking",
      "inheritance-unresolved"
    ]
  },
  {
    "id": "hunting",
    "categoryId": "hunting-animals",
    "title": "Chasse",
    "topicIds": [
      "hunting-basics",
      "hunting-tools"
    ]
  },
  {
    "id": "animals",
    "categoryId": "hunting-animals",
    "title": "Animaux",
    "topicIds": [
      "animals-domestic",
      "animals-welfare"
    ]
  },
  {
    "id": "animals-products",
    "categoryId": "hunting-animals",
    "title": "Produits animaux",
    "topicIds": [
      "animals-products"
    ]
  },
  {
    "id": "siyar-principles",
    "categoryId": "siyar-relations",
    "title": "Cadre et engagements",
    "topicIds": [
      "siyar-covenants",
      "siyar-protection"
    ]
  },
  {
    "id": "siyar-relations",
    "categoryId": "siyar-relations",
    "title": "Relations et sécurité",
    "topicIds": [
      "siyar-noncombatants",
      "siyar-property"
    ]
  },
  {
    "id": "siyar-historical",
    "categoryId": "siyar-relations",
    "title": "Cadres historiques",
    "topicIds": [
      "siyar-historical-context"
    ]
  }
];

export const CATALOG_TOPICS: FiqhTopic[] = [
  {
    "id": "water-impurities",
    "categoryId": "purification",
    "title": "Eau et impuretés",
    "summary": "Les textes donnent plusieurs repères sur l’eau utilisée dans le contexte de la purification.",
    "aliases": [
      "eau",
      "impureté",
      "najasa",
      "eau de mer",
      "puits de Budâ’a",
      "deux qullas",
      "eau et impuretés",
      "eau et impuretes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-25-48",
      "quran-8-11",
      "abudawud-83",
      "abudawud-66",
      "abudawud-63",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "wudu",
    "categoryId": "purification",
    "title": "Ablutions",
    "summary": "La description coranique et prophétique des ablutions.",
    "aliases": [
      "ablutions",
      "wudu",
      "wudû"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-6",
      "bukhari-159",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "wudu-obligations",
    "categoryId": "purification",
    "title": "Obligations des ablutions",
    "summary": "Le socle textuel des membres mentionnés dans le wudû.",
    "aliases": [
      "obligations wudu",
      "faraid ablutions",
      "obligations des ablutions"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-6",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "wudu-sunnas",
    "categoryId": "purification",
    "title": "Sunnas des ablutions",
    "summary": "La pratique rapportée, sans transformer chaque geste en obligation.",
    "aliases": [
      "sunnas ablutions",
      "sunnas des ablutions"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-159",
      "muslim-226",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "wudu-invalidators",
    "categoryId": "purification",
    "title": "Ce qui annule les ablutions",
    "arabicTerm": "نواقض الوضوء",
    "summary": "Les annulatifs du wudû doivent être établis par une preuve ; le doute seul ne fait pas disparaître une purification certaine.",
    "aliases": [
      "invalidants ablutions",
      "annulation wudu",
      "nawaqid wudu",
      "nawâqid al-wudû",
      "ce qui annule les ablutions"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-135",
      "muslim-361",
      "muslim-376c",
      "abudawud-181",
      "abudawud-182",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "ghusl",
    "categoryId": "purification",
    "title": "Ghusl",
    "summary": "Description du ghusl après janâba.",
    "aliases": [
      "ghusl",
      "grande ablution"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-6",
      "quran-4-43",
      "bukhari-248",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "ghusl-required",
    "categoryId": "purification",
    "title": "Ce qui rend le ghusl obligatoire",
    "summary": "Une mini-leçon sur les situations que les textes retenus relient à la purification majeure.",
    "aliases": [
      "janaba",
      "ghusl obligatoire",
      "rapport sexuel",
      "fin des menstrues",
      "ce qui rend le ghusl obligatoire"
    ],
    "badge": "CAS PERSONNEL",
    "sensitive": true,
    "sourceIds": [
      "quran-5-6",
      "quran-4-43",
      "muslim-349",
      "bukhari-320",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "tayammum",
    "categoryId": "purification",
    "title": "Tayammum",
    "summary": "Purification de remplacement mentionnée par le Coran et décrite dans plusieurs récits.",
    "aliases": [
      "tayammum",
      "ablution sèche",
      "absence eau",
      "terre propre"
    ],
    "badge": "CAS PERSONNEL",
    "sensitive": true,
    "sourceIds": [
      "quran-4-43",
      "quran-5-6",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "khuff",
    "categoryId": "purification",
    "title": "Essuyage sur les khuff",
    "summary": "Permission et durée rapportées par la Sunnah ; aucune extension aux chaussettes modernes n’est publiée.",
    "aliases": [
      "khuff",
      "chaussettes ablutions",
      "essuyage sur les khuff"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-206",
      "muslim-276a",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "menstruation",
    "categoryId": "purification",
    "title": "Menstrues",
    "summary": "Repères directement établis, sans durée ni verdict individuel.",
    "aliases": [
      "règles",
      "menstruations",
      "hayd",
      "menstrues"
    ],
    "badge": "CAS PERSONNEL",
    "sensitive": true,
    "sourceIds": [
      "quran-2-222",
      "muslim-293",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "postpartum",
    "categoryId": "purification",
    "title": "Lochies (nifâs)",
    "arabicTerm": "النفاس",
    "summary": "Le nifâs désigne le saignement lié à l’accouchement. La fiche suit ici la synthèse d’Al-Wajîz et distingue clairement ce qui relève du fiqh de ce qui est directement cité comme hadith Sahîh.",
    "aliases": [
      "lochies",
      "nifas",
      "nifâs",
      "post-partum",
      "postpartum",
      "lochies (nifâs)",
      "lochies (nifas)"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "purification-doubt",
    "categoryId": "purification",
    "title": "Doutes liés à la purification",
    "summary": "Le principe de certitude face au doute.",
    "aliases": [
      "doute ablutions",
      "waswas",
      "doutes liés à la purification",
      "doutes lies a la purification"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-361",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "soiled-clothing",
    "categoryId": "purification",
    "title": "Vêtements et lieux souillés",
    "summary": "Quelques cas précis de souillure et de nettoyage rapportés dans les textes.",
    "aliases": [
      "vêtement impur",
      "lieu souillé",
      "sang menstruel",
      "urine mosquée",
      "chaussure souillée",
      "récipient chien",
      "vêtements et lieux souillés",
      "vetements et lieux souilles"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-74-4",
      "quran-5-6",
      "bukhari-227",
      "muslim-291a",
      "bukhari-220",
      "muslim-284a",
      "abudawud-385",
      "abudawud-386",
      "muslim-279a",
      "muslim-279c",
      "muslim-279d",
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "prayer-status",
    "categoryId": "prayer",
    "title": "La prière, deuxième pilier",
    "summary": "Les prières sont prescrites à des temps déterminés.",
    "aliases": [
      "salat",
      "salât",
      "salah",
      "prière",
      "statut et temps prescrits"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-4-103",
      "bukhari-8",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-times",
    "categoryId": "prayer",
    "title": "Les heures de la prière",
    "summary": "Les temps sont décrits par le Coran et la Sunnah.",
    "aliases": [
      "fajr",
      "dhuhr",
      "dohr",
      "asr",
      "maghrib",
      "isha",
      "horaires prière",
      "horaires"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-4-103",
      "muslim-613b",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-qibla",
    "categoryId": "prayer",
    "title": "La qibla",
    "summary": "L’orientation vers la Mosquée sacrée.",
    "aliases": [
      "qibla",
      "orientation prière"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-144",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-purification",
    "categoryId": "prayer",
    "title": "Les conditions de la prière",
    "summary": "La purification avant la prière est traitée dans Purification.",
    "aliases": [
      "wudu prière",
      "ablutions prière",
      "purification préalable",
      "purification prealable"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-4-43",
      "quran-5-6",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-structure",
    "categoryId": "prayer",
    "title": "Comment prier, pas à pas",
    "summary": "La séquence générale rapportée de la prière.",
    "aliases": [
      "salat",
      "salah",
      "structure prière",
      "structure générale",
      "structure generale"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-takbir",
    "categoryId": "prayer",
    "title": "Le takbîr d’ouverture",
    "summary": "Le début de la prière dans le récit enseigné.",
    "aliases": [
      "takbir",
      "takbîrat ihram",
      "takbîr initial",
      "takbir initial"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-ruku",
    "categoryId": "prayer",
    "title": "L’inclinaison (rukû‘)",
    "summary": "L’inclinaison dans la séquence rapportée.",
    "aliases": [
      "ruku",
      "rukû",
      "rukû‘",
      "ruku‘"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "muslim-479a",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-rising",
    "categoryId": "prayer",
    "title": "Le redressement",
    "summary": "Revenir debout avant la prosternation.",
    "aliases": [
      "redressement prière",
      "qawma",
      "redressement après le rukû‘",
      "redressement apres le ruku‘"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-sujud",
    "categoryId": "prayer",
    "title": "La prosternation (sujûd)",
    "summary": "La prosternation dans la séquence rapportée.",
    "aliases": [
      "sujud",
      "sujûd"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "muslim-479a",
      "muslim-482",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-between-sujuds",
    "categoryId": "prayer",
    "title": "L’assise entre les deux prosternations",
    "summary": "L’assise calme entre les deux sujûd.",
    "aliases": [
      "assise prière",
      "entre deux prosternations",
      "assise entre les prosternations"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-tumanina",
    "categoryId": "prayer",
    "title": "Le calme dans chaque position",
    "summary": "Ne pas précipiter les positions de la prière.",
    "aliases": [
      "tumanina",
      "quiétude prière",
      "tumânîna"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-757",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-fatiha",
    "categoryId": "prayer",
    "title": "La récitation d’al-Fâtiha",
    "summary": "Une récitation rapportée, sans trancher les cas juridiques divergents.",
    "aliases": [
      "fatiha",
      "al-fatiha",
      "récitation imam",
      "récitation d’al-fâtiha",
      "recitation d’al-fatiha"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-756",
      "fiqh-badai-fatiha-imam",
      "fiqh-zurqani-fatiha-imam",
      "fiqh-majmu-fatiha-imam",
      "fiqh-mughni-fatiha-imam",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-fatiha-behind-imam",
        "question": "La récitation d’al-Fâtiha par le fidèle derrière l’imam",
        "established": "Les passages étudiés présentent des qualifications différentes selon les écoles, notamment entre prière à voix haute et prière silencieuse. Aucun avis n’est sélectionné ici.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Dans la formulation principale étudiée, la récitation du fidèle derrière l’imam n’est pas exigée, à voix haute comme à voix basse. Une nuance interne est rapportée pour certaines prières silencieuses.",
            "sourceIds": [
              "fiqh-badai-fatiha-imam"
            ],
            "verificationStatus": "partial"
          },
          {
            "label": "Malikite",
            "position": "Le passage étudié indique que le fidèle récite lorsque l’imam ne récite pas à voix haute et délaisse la récitation lorsque l’imam récite à voix haute. La qualification précise n’est pas développée ici.",
            "sourceIds": [
              "fiqh-zurqani-fatiha-imam"
            ],
            "verificationStatus": "partial"
          },
          {
            "label": "Shafi‘ite",
            "position": "Dans la position exposée, al-Fâtiha est requise pour le fidèle derrière l’imam dans les prières silencieuses comme dans les prières à voix haute.",
            "sourceIds": [
              "fiqh-majmu-fatiha-imam"
            ],
            "verificationStatus": "partial"
          },
          {
            "label": "Hanbalite",
            "position": "La récitation du fidèle derrière l’imam est décrite comme non obligatoire dans les prières à voix haute et silencieuses. Le passage ne l’établit pas comme interdite.",
            "sourceIds": [
              "fiqh-mughni-fatiha-imam"
            ],
            "verificationStatus": "partial"
          }
        ],
        "practicalNote": "Cette présentation ne traite pas du retardataire, du fidèle qui n’entend pas l’imam, ni des exceptions détaillées. Aucun consensus ni avis préféré n’est affirmé.",
        "limits": [
          "Les statuts documentaires internes ne sont pas affichés à l’utilisateur."
        ]
      }
    ]
  },
  {
    "id": "prayer-tashahhud",
    "categoryId": "prayer",
    "title": "Le tashahhud",
    "summary": "Texte rapporté du tashahhud.",
    "aliases": [
      "tashahhud",
      "tahiyyat"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-831",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-taslim",
    "categoryId": "prayer",
    "title": "Le salut final",
    "summary": "Pratique rapportée à droite et à gauche.",
    "aliases": [
      "taslim",
      "taslîm",
      "salam prière"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-582",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-sick",
    "categoryId": "prayer",
    "title": "La prière du malade",
    "summary": "Adapter la position à la capacité réelle.",
    "aliases": [
      "prière malade",
      "assis prière",
      "prière allongé",
      "prière du malade",
      "priere du malade"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-1117",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-travel",
    "categoryId": "prayer",
    "title": "La prière en voyage",
    "summary": "Règle rapportée du nombre en voyage.",
    "aliases": [
      "voyage prière",
      "raccourcir prière",
      "qasr",
      "voyage et raccourcissement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "muslim-687a",
      "quran-4-101",
      "fiqh-badai-qasr-hanafi",
      "fiqh-istidhkar-qasr-maliki",
      "fiqh-mudawwana-qasr-maliki",
      "fiqh-mawahib-qasr-maliki",
      "fiqh-majmu-qasr-shafii",
      "fiqh-mughni-qasr-hanbali",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-travel-qasr-status",
        "question": "Quel est le statut du qasr selon les écoles ?",
        "established": "Les textes établissent le raccourcissement en voyage, mais les écoles ne lui donnent pas toutes la même qualification juridique.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Dans Badâ’i‘ as-Sanâ’i‘, le qasr est présenté comme une ‘azîma et l’argumentation le rattache au caractère obligatoire de l’ordre. Pour les prières concernées, les deux raka‘ât constituent le farḍ du voyageur dans l’exposé étudié.",
            "sourceIds": [
              "fiqh-badai-qasr-hanafi"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Al-Istidhkâr rapporte d’Abû Mus‘ab, de Mâlik, que le qasr est une sunna mu’akkada pour les hommes et les femmes ; le même développement le présente comme non obligatoire. Cette fiche conserve cette qualification sans la transformer en obligation.",
            "sourceIds": [
              "fiqh-istidhkar-qasr-maliki"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "Al-Majmû‘ expose que le voyageur concerné peut raccourcir ou accomplir la prière complète ; le qasr est présenté comme préférable dans le cas principal étudié, avec des nuances selon les situations.",
            "sourceIds": [
              "fiqh-majmu-qasr-shafii"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Al-Mughnî expose que le voyageur peut raccourcir ou accomplir la prière complète et rapporte une préférence d’Ahmad pour le qasr.",
            "sourceIds": [
              "fiqh-mughni-qasr-hanbali"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Cette comparaison décrit les qualifications documentées sans sélectionner un avis pour l’utilisateur.",
        "limits": [
          "Les conditions permettant d’être juridiquement voyageur sont présentées séparément."
        ]
      },
      {
        "id": "prayer-travel-qasr-distance",
        "question": "Quelle distance les écoles retiennent-elles ?",
        "established": "Les ouvrages classiques expriment la distance avec leurs propres unités. Cette fiche conserve ces unités et ne publie pas de conversion unique en kilomètres.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "La formulation principale étudiée retient trois jours de marche habituelle. Le même passage rapporte des variantes internes, notamment deux jours et le début du troisième, quinze farsakh ou trois étapes.",
            "sourceIds": [
              "fiqh-badai-qasr-hanafi"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Al-Mudawwana retient quatre burud, également exprimés comme quarante-huit milles dans le passage étudié.",
            "sourceIds": [
              "fiqh-mudawwana-qasr-maliki"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "Al-Majmû‘ retient deux marhala, expliquées dans le passage étudié comme quarante-huit milles hachémites.",
            "sourceIds": [
              "fiqh-majmu-qasr-shafii"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Al-Mughnî rapporte seize farsakh, quarante-huit milles ou quatre burud pour la distance étudiée.",
            "sourceIds": [
              "fiqh-mughni-qasr-hanbali"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Les unités classiques ne sont pas converties automatiquement en kilomètres, car leurs équivalences modernes nécessitent une méthode documentaire distincte."
      },
      {
        "id": "prayer-travel-qasr-stay",
        "question": "Combien de temps un voyageur peut-il prévoir de rester tout en conservant le qasr ?",
        "established": "L’intention de résidence met fin aux dispenses du voyage selon des seuils différents dans les ouvrages étudiés.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Badâ’i‘ as-Sanâ’i‘ indique qu’une intention de résidence de quinze jours dans un même lieu fait devenir résident. Le cas d’un séjour sans durée déterminée est traité séparément dans le passage classique.",
            "sourceIds": [
              "fiqh-badai-qasr-hanafi"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Al-Mudawwana rattache l’itmâm à l’intention d’une résidence de quatre jours. Mawâhib al-Jalîl détaille le rapport avec vingt prières et distingue le traitement des jours d’arrivée et de départ ; cette fiche ne réduit pas ce calcul à 96 heures.",
            "sourceIds": [
              "fiqh-mudawwana-qasr-maliki",
              "fiqh-mawahib-qasr-maliki"
            ],
            "verificationStatus": "partial"
          },
          {
            "label": "Shafi‘ite",
            "position": "Al-Majmû‘ indique que l’intention de séjourner quatre jours, en dehors du jour d’arrivée et du jour de départ, fait cesser les dispenses du voyage dans la position exposée.",
            "sourceIds": [
              "fiqh-majmu-qasr-shafii"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Dans la transmission exposée par Al-Mughnî, l’intention d’une résidence dépassant le nombre de prières indiqué dans le passage entraîne l’itmâm ; le texte rapporte aussi des variantes internes.",
            "sourceIds": [
              "fiqh-mughni-qasr-hanbali"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "La durée réellement passée sur place ne doit pas être confondue avec la durée que la personne a décidé de séjourner.",
        "limits": [
          "Les séjours indéterminés et les changements d’intention comportent des développements propres à chaque école et ne sont pas résumés ici de manière exhaustive."
        ]
      },
      {
        "id": "prayer-travel-qasr-start",
        "question": "Quand le qasr commence-t-il ?",
        "established": "Dans les passages étudiés, la simple intention de voyager ne suffit pas : le départ effectif de la zone habitée est pris en compte.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Badâ’i‘ as-Sanâ’i‘ rattache le statut du voyageur à l’intention du voyage et à la sortie de la zone bâtie de la ville.",
            "sourceIds": [
              "fiqh-badai-qasr-hanafi"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Al-Mudawwana rapporte que le voyageur raccourcit après avoir dépassé les habitations de la localité dans le cas étudié.",
            "sourceIds": [
              "fiqh-mudawwana-qasr-maliki"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "Al-Majmû‘ exige la séparation du lieu de résidence et traite la sortie de la zone bâtie selon la configuration de la localité.",
            "sourceIds": [
              "fiqh-majmu-qasr-shafii"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Al-Mughnî indique que celui qui a l’intention de voyager ne raccourcit pas avant d’avoir quitté les habitations de sa localité.",
            "sourceIds": [
              "fiqh-mughni-qasr-hanbali"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Cette section décrit le début du statut de voyage dans les passages étudiés ; elle ne traite pas les frontières urbaines modernes complexes."
      }
    ]
  },
  {
    "id": "prayer-combining",
    "categoryId": "prayer",
    "title": "Regrouper deux prières",
    "summary": "Un regroupement rapporté durant un voyage.",
    "aliases": [
      "jam",
      "regroupement prières",
      "combiner prières",
      "regroupement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "muslim-705c",
      "fiqh-badai-combining-travel",
      "fiqh-dhakhira-combining-travel",
      "fiqh-majmu-combining-travel",
      "fiqh-mughni-combining-travel",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-combining-travel-four-schools",
        "question": "Le voyage permet-il de regrouper réellement deux prières dans le temps de l’une d’elles ?",
        "introduction": "Les ouvrages classiques étudiés ne traitent pas tous le regroupement du voyage de la même manière. Cette comparaison reste limitée au voyage et ne choisit aucun avis.",
        "established": "Muslim 705c rapporte un regroupement pendant un voyage. Les juristes ont ensuite précisé différemment la portée et les conditions de cette pratique.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Dans le passage étudié, le jam‘ réel de deux prières obligatoires dans le temps de l’une d’elles n’est pas admis pour le simple voyage ; ‘Arafah et Muzdalifah sont traitées comme exceptions textuelles. Les autres récits de voyage sont interprétés dans ce cadre comme un rapprochement des prières sans sortir chacune de son temps.",
            "sourceIds": [
              "fiqh-badai-combining-travel"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Le passage étudié d’ad-Dhakhira admet le regroupement en voyage dans des situations liées au déplacement et rapporte des nuances internes sur l’étendue de cette permission. La fiche n’en fait donc pas une règle sans condition pour tout voyage.",
            "sourceIds": [
              "fiqh-dhakhira-combining-travel"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "Le passage étudié d’Al-Majmu permet au voyageur concerné de regrouper dans le temps de la première ou de la seconde prière. Le jam‘ taqdim et le jam‘ ta’khir y ont des conditions distinctes.",
            "sourceIds": [
              "fiqh-majmu-combining-travel"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Le passage étudié d’Al-Mughni présente le regroupement en voyage dans le temps de l’une des deux prières comme permis, avec des conditions et modalités qui dépendent notamment du moment choisi.",
            "sourceIds": [
              "fiqh-mughni-combining-travel"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Cette comparaison explique une divergence de fiqh ; elle ne donne pas une règle universelle applicable à tout déplacement ni à toute situation personnelle.",
        "limits": [
          "Cette fiche traite du voyage, pas de toutes les autres excuses possibles comme la pluie ou la maladie.",
          "Elle ne fixe pas ici la distance du voyage : cette question appartient à la fiche Voyage et raccourcissement.",
          "Elle ne présente ni consensus global ni avis préféré.",
          "Les conditions détaillées du jam‘ taqdim et du jam‘ ta’khir ne sont pas généralisées d’une école à l’autre."
        ]
      }
    ]
  },
  {
    "id": "prayer-latecomer",
    "categoryId": "prayer",
    "title": "Le retardataire",
    "summary": "Rejoindre la prière avec calme et compléter ce qui est manqué.",
    "aliases": [
      "retardataire prière",
      "prière commencée",
      "retardataire"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-908",
      "fiqh-badai-latecomer",
      "fiqh-maliki-latecomer",
      "fiqh-majmu-latecomer",
      "fiqh-mughni-latecomer",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-latecomer-four-schools",
        "question": "Les écoles considèrent-elles de la même manière les raka‘ât rejointes avec l’imam ?",
        "introduction": "Le hadith retenu ordonne de rejoindre la prière avec calme, de prier ce qui est rejoint et de compléter ce qui a été manqué. Les juristes ont toutefois organisé différemment les raka‘ât du retardataire lorsqu’il complète sa prière.",
        "established": "Bukhârî 908 fournit le principe de rejoindre la prière sans précipitation puis de compléter ce qui a été manqué. Les ouvrages classiques étudiés montrent une divergence sur la manière de qualifier ce qui a été rejoint et ce qui est complété ensuite.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Dans le passage étudié d’al-Kâsânî, Abû Hanîfa et Abû Yûsuf considèrent juridiquement ce qui est rejoint avec l’imam comme la fin de la prière du retardataire, tandis que ce qu’il rattrape après le taslîm de l’imam est traité comme son début. Le même passage signale des nuances internes et une transmission différente de Muhammad.",
            "sourceIds": [
              "fiqh-badai-latecomer"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "La formulation malikite étudiée combine deux logiques : le retardataire rattrape la récitation en tenant compte de ce qu’il a manqué, tandis qu’il construit les autres actes à partir de ce qu’il a déjà accompli avec l’imam. Cette distinction est souvent résumée par qada dans la récitation et bina dans les actes.",
            "sourceIds": [
              "fiqh-maliki-latecomer"
            ],
            "verificationStatus": "partial"
          },
          {
            "label": "Shafi‘ite",
            "position": "Dans le passage étudié d’an-Nawawî, ce que le retardataire rejoint avec l’imam constitue le début de sa propre prière ; après le taslîm de l’imam, il complète ce qui reste comme la suite de sa prière.",
            "sourceIds": [
              "fiqh-majmu-latecomer"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Dans le passage étudié d’Ibn Qudâma, la position attribuée à Ahmad traite ce qui est rejoint avec l’imam comme la fin de la prière du retardataire et ce qu’il rattrape ensuite comme son début. La fiche ne prétend pas couvrir toutes les transmissions internes.",
            "sourceIds": [
              "fiqh-mughni-latecomer"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Ces différences influencent notamment l’organisation de la récitation et de certaines assises lorsque plusieurs raka‘ât ont été manquées. La fiche expose la divergence sans choisir une école.",
        "limits": [
          "Cette fiche ne traite pas le cas où l’on rejoint seulement le rukû‘, le sujûd ou le tashahhud.",
          "Elle ne donne pas un tableau exhaustif pour chaque combinaison de raka‘ât manquées dans Fajr, Maghrib et les prières de quatre raka‘ât.",
          "Les nuances internes rapportées dans certaines écoles ne sont pas effacées au profit d’une formule unique.",
          "Aucun consensus ni avis préféré n’est affirmé."
        ]
      }
    ]
  },
  {
    "id": "prayer-sahw",
    "categoryId": "prayer",
    "title": "La prosternation de l’oubli",
    "summary": "Cas rapportés d’oubli ou de doute.",
    "aliases": [
      "sahw",
      "oubli prière",
      "doute rakaa",
      "sujûd as-sahw",
      "sujud as-sahw"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1224",
      "muslim-570b",
      "muslim-571a",
      "muslim-572a",
      "fiqh-badai-sahw",
      "fiqh-mawahib-sahw",
      "fiqh-majmu-sahw",
      "fiqh-mughni-sahw",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-sahw-schools",
        "question": "Comment les écoles organisent-elles les récits du sujûd as-sahw ?",
        "established": "Les récits authentiques rapportent des prosternations de l’oubli avant et après le taslîm selon les situations. Les juristes ont développé différentes méthodes pour les articuler.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Le passage étudié documente une exécution après le taslîm dans l’approche hanafite retenue.",
            "sourceIds": [
              "fiqh-badai-sahw"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Dans la position mashhûr, la diminution appelle le sujûd avant le taslîm et l’ajout après le taslîm. Dans le cas combiné, le mashhûr donne priorité à la diminution ; des variantes internes sont rapportées.",
            "sourceIds": [
              "fiqh-mawahib-sahw"
            ],
            "verificationStatus": "externally_verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "Le passage étudié identifie l’ajout et la diminution comme causes traitées dans le chapitre du sujûd as-sahw, sans établir ici une règle générale avant/après le taslîm.",
            "sourceIds": [
              "fiqh-majmu-sahw"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Le passage étudié expose plusieurs cas avant le taslîm et des exceptions rapportées après le taslîm ; le traitement dépend donc du cas et des récits retenus.",
            "sourceIds": [
              "fiqh-mughni-sahw"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Cette comparaison ne tranche pas tous les cas pratiques et ne recommande aucune école.",
        "limits": [
          "Le doute, le premier tashahhud et les exceptions détaillées restent hors de cette présentation."
        ]
      }
    ]
  },
  {
    "id": "prayer-friday",
    "categoryId": "prayer",
    "title": "La prière du vendredi",
    "summary": "Repères primaires limités sur Jumu‘a.",
    "aliases": [
      "jumuah",
      "jumua",
      "vendredi",
      "khutba"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-62-9",
      "muslim-875g",
      "muslim-857a",
      "muslim-857b",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-eid",
    "categoryId": "prayer",
    "title": "La prière de l’Aïd",
    "summary": "Repères authentiques sur la prière des deux Aïd : deux raka‘ât, prière avant la khutba, sans adhân ni iqâma dans les récits retenus.",
    "aliases": [
      "aid",
      "aïd",
      "salat eid",
      "prière de l’aïd",
      "priere de l’aid"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-957",
      "bukhari-958-961",
      "bukhari-989",
      "muslim-886a",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-funeral",
    "categoryId": "prayer",
    "title": "La prière funéraire",
    "summary": "Résumé limité pour éviter le doublon avec Funérailles.",
    "aliases": [
      "janaza",
      "janâza",
      "prière mort",
      "prière funéraire",
      "priere funeraire"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1334",
      "bukhari-1335",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-imam-following",
    "categoryId": "prayer",
    "title": "Prier derrière l’imam",
    "summary": "Contexte rapporté d’enseignement et de direction de la prière.",
    "aliases": [
      "imam",
      "fidèle",
      "prière groupe",
      "jamaaa",
      "imam et fidèle",
      "imam et fidele"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-631",
      "bukhari-722",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-invalidators",
    "categoryId": "prayer",
    "title": "Ce qui invalide la prière",
    "summary": "Repères documentés sur certains actes qui interrompent la validité de la prière, avec leurs principales nuances juridiques.",
    "aliases": [
      "invalidants prière",
      "annule prière",
      "mubtilat salat",
      "parler prière",
      "manger prière",
      "rire prière",
      "ce qui invalide la prière",
      "ce qui invalide la priere"
    ],
    "badge": "DIVERGENCE JURIDIQUE",
    "sourceIds": [
      "muslim-537a",
      "fiqh-badai-prayer-invalidators",
      "fiqh-dusuqi-prayer-invalidators",
      "fiqh-majmu-prayer-invalidators",
      "fiqh-mughni-prayer-invalidators",
      "fiqh-badai-prayer-movements",
      "fiqh-dusuqi-prayer-movements",
      "fiqh-mughni-prayer-movements",
      "fiqh-majmu-prayer-movements",
      "wajiz-salah"
    ],
    "differences": [
      {
        "id": "prayer-invalidators-forgetful-speech",
        "question": "Les écoles traitent-elles de la même manière une parole prononcée par oubli ?",
        "introduction": "Les textes classiques distinguent nettement la parole volontaire de certaines paroles involontaires ou excusées.",
        "established": "Muslim 537a établit le cadre de la parole humaine dans la prière ; les détails de validité en cas d'oubli sont ensuite organisés différemment par les juristes.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Le passage hanafite étudié adopte une approche stricte de la parole étrangère à la prière et traite la parole comme une cause d'invalidation dans son cadre juridique, avec des subdivisions détaillées dans le chapitre.",
            "sourceIds": [
              "fiqh-badai-prayer-invalidators"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Le passage malikite étudié distingue notamment la parole légère prononcée par oubli du rire à voix haute ; certaines paroles involontaires peuvent être traitées par le sujûd as-sahw plutôt que comme une invalidation automatique.",
            "sourceIds": [
              "fiqh-dusuqi-prayer-invalidators"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "An-Nawawî expose qu'une parole brève survenue sans intention, par oubli ou par ignorance excusable peut ne pas invalider la prière, tandis que la parole volontaire est traitée différemment.",
            "sourceIds": [
              "fiqh-majmu-prayer-invalidators"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Ibn Qudâma traite la parole comme un invalidant et développe séparément les cas de parole volontaire, d'oubli et de parole liée à l'intérêt de la prière ; la fiche ne réduit pas ces subdivisions à une formule unique.",
            "sourceIds": [
              "fiqh-mughni-prayer-invalidators"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Une parole prononcée volontairement et une parole échappée par oubli ne doivent donc pas être assimilées sans tenir compte de la méthode juridique suivie.",
        "limits": [
          "La fiche ne donne pas un nombre de mots ou de lettres valable pour toutes les écoles.",
          "Elle ne traite pas ici tous les cas de correction de l'imam, de salut, de réponse nécessaire ou de parole sous contrainte.",
          "Aucun avis n'est présenté comme supérieur."
        ]
      },
      {
        "id": "prayer-invalidators-many-movements",
        "question": "Des mouvements nombreux annulent-ils la prière ?",
        "introduction": "Les ouvrages étudiés distinguent le mouvement léger du mouvement important, mais ils ne permettent pas d'afficher un compteur universel de gestes.",
        "established": "Un acte léger ou accompli pour un besoin n'est pas traité comme un acte important étranger à la prière. L'appréciation du mouvement important dépend de critères juridiques et de l'usage dans les passages contrôlés.",
        "positions": [
          {
            "label": "Hanafite",
            "position": "Al-Kasani rapporte plusieurs critères pour distinguer le peu du beaucoup et retient comme plus juste le critère de l'observateur : est important l'acte qui ferait qu'un observateur ne douterait pas que la personne n'est plus en prière. La nécessité est traitée séparément.",
            "sourceIds": [
              "fiqh-badai-prayer-movements"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Malikite",
            "position": "Ad-Dusuqi traite le geste léger comme distinct du geste devenu nombreux ; dans l'exemple du fait de se gratter, la quantité est appréciée par l'usage et l'acte nombreux peut invalider la prière dans le cas décrit.",
            "sourceIds": [
              "fiqh-dusuqi-prayer-movements"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Shafi‘ite",
            "position": "An-Nawawî distingue les actions légères des actions importantes étrangères à la prière. Le passage étudié traite notamment trois actions consécutives importantes comme invalidantes, tout en précisant que les mouvements très légers ne sont pas soumis mécaniquement à ce même compteur.",
            "sourceIds": [
              "fiqh-majmu-prayer-movements"
            ],
            "verificationStatus": "verified_primary"
          },
          {
            "label": "Hanbalite",
            "position": "Ibn Qudama autorise le mouvement léger et précise qu'il n'est limité ni à trois gestes ni à un autre nombre fixe. Il renvoie la distinction entre beaucoup et peu à l'usage et aux actes comparables à ceux rapportés dans les textes.",
            "sourceIds": [
              "fiqh-mughni-prayer-movements"
            ],
            "verificationStatus": "verified_primary"
          }
        ],
        "practicalNote": "Il ne faut donc pas compter mécaniquement les gestes. Un petit ajustement, un mouvement lié à un besoin et une succession d'actions importantes ne relèvent pas automatiquement du même jugement.",
        "limits": [
          "Aucune règle universelle « trois mouvements = prière annulée » n'est affichée.",
          "La nécessité et les actes accomplis dans l'intérêt de la prière doivent être distingués des mouvements inutiles.",
          "La position shafi‘ite détaillée reste volontairement incomplète dans cette comparaison tant que son passage primaire ciblé n'est pas isolé.",
          "Les situations personnelles où l'on hésite sur la quantité ou la nécessité ne sont pas tranchées automatiquement par cette fiche."
        ]
      }
    ]
  },
  {
    "id": "prayer-intention",
    "categoryId": "prayer",
    "title": "L’intention (niyya)",
    "arabicTerm": "النية",
    "summary": "L’intention précède l’acte ; sa place est dans le cœur et elle n’a pas besoin d’être prononcée.",
    "aliases": [
      "intention prière",
      "niyya",
      "niyyah",
      "prononcer intention",
      "intention (niyya)"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1",
      "scholar-ibn-baz-niyyah-prayer",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-adhan-iqama",
    "categoryId": "prayer",
    "title": "Adhân et iqâma",
    "arabicTerm": "الأذان والإقامة",
    "summary": "L’appel à la prière et l’annonce de son commencement dans les récits authentiques.",
    "aliases": [
      "adhan",
      "adhân",
      "azan",
      "iqama",
      "iqâma",
      "appel prière",
      "adhân et iqâma",
      "adhan et iqama"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-628",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "fasting-obligation",
    "categoryId": "fasting",
    "title": "L’obligation du jeûne de Ramadan",
    "summary": "Le jeûne de Ramadan est prescrit aux croyants.",
    "aliases": [
      "ramadan",
      "jeune ramadan",
      "sawm",
      "obligation du jeûne de ramadan",
      "obligation du jeune de ramadan"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-183",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-taqwa",
    "categoryId": "fasting",
    "title": "Le sens du jeûne",
    "summary": "Le jeûne est associé à la taqwâ.",
    "aliases": [
      "taqwa",
      "finalite jeune",
      "finalité spirituelle",
      "finalite spirituelle"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-183",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-month-start",
    "categoryId": "fasting",
    "title": "Le début du mois",
    "summary": "Le début de Ramadan est lié à l’observation du croissant.",
    "aliases": [
      "debut ramadan",
      "hilal",
      "croissant",
      "début du mois",
      "debut du mois"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1900",
      "bukhari-1906",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-crescent",
    "categoryId": "fasting",
    "title": "L’observation du croissant",
    "summary": "La vision du croissant intervient dans le commencement et la fin du mois.",
    "aliases": [
      "observation croissant",
      "vision hilal",
      "observation du croissant"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1900",
      "bukhari-1906",
      "bukhari-1907",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-thirty-days",
    "categoryId": "fasting",
    "title": "Mois de 29 ou 30 jours",
    "summary": "Le mois est complété à trente jours lorsque l’observation est impossible selon les récits retenus.",
    "aliases": [
      "trente jours",
      "mois 30 jours",
      "compléter trente jours",
      "completer trente jours"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1906",
      "bukhari-1907",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-dawn",
    "categoryId": "fasting",
    "title": "L’aube : début du jeûne",
    "summary": "Le jeûne quotidien commence à l’aube mentionnée par le verset.",
    "aliases": [
      "aube",
      "fajr",
      "debut quotidien",
      "début quotidien du jeûne",
      "debut quotidien du jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-187",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-iftar-time",
    "categoryId": "fasting",
    "title": "Le coucher du soleil : fin du jeûne",
    "summary": "La rupture intervient lorsque la nuit arrive.",
    "aliases": [
      "fin jeune",
      "coucher soleil",
      "iftar temps",
      "fin quotidienne du jeûne",
      "fin quotidienne du jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1958",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-suhur",
    "categoryId": "fasting",
    "title": "Le suhûr",
    "summary": "Le suhur comporte une bénédiction rapportée.",
    "aliases": [
      "suhur",
      "sahur",
      "repas avant aube"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1923",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-iftar",
    "categoryId": "fasting",
    "title": "La rupture du jeûne",
    "summary": "La Sunnah rapportée encourage à ne pas retarder inutilement l’iftar.",
    "aliases": [
      "iftar",
      "rupture jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1957",
      "bukhari-1958",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-forgetfulness",
    "categoryId": "fasting",
    "title": "Manger ou boire par oubli",
    "summary": "Le jeûne est poursuivi dans le cas explicite de l’oubli.",
    "aliases": [
      "oubli jeune",
      "manger oubli",
      "boire oubli",
      "manger ou boire par oubli"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1155",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-intercourse",
    "categoryId": "fasting",
    "title": "Le rapport conjugal en journée",
    "summary": "Un cas explicite de rapport pendant le jeûne de Ramadan est rapporté.",
    "aliases": [
      "rapport ramadan",
      "rapport sexuel jeune",
      "rapport sexuel diurne"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-1935",
      "bukhari-1937",
      "muslim-1112a",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-kaffara",
    "categoryId": "fasting",
    "title": "L’expiation (kaffâra)",
    "summary": "La kaffâra est présentée uniquement dans le cas explicite du rapport sexuel.",
    "aliases": [
      "kaffara",
      "expiation ramadan",
      "kaffâra dans le cas rapporté",
      "kaffara dans le cas rapporte"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1935",
      "bukhari-1937",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-illness",
    "categoryId": "fasting",
    "title": "Le malade",
    "summary": "Le malade est explicitement mentionné dans les versets ; les jours concernés peuvent être rattrapés ultérieurement selon le texte.",
    "aliases": [
      "maladie jeune",
      "jeune malade",
      "maladie"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-184",
      "quran-2-185",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-travel",
    "categoryId": "fasting",
    "title": "Le voyageur",
    "summary": "Le voyageur est mentionné par le Coran et un récit rapporte jeûne puis rupture durant un voyage.",
    "aliases": [
      "voyage jeune",
      "jeune voyageur",
      "voyage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-184",
      "quran-2-185",
      "muslim-1113e",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-makeup",
    "categoryId": "fasting",
    "title": "Rattraper les jours manqués",
    "summary": "Le rattrapage est séparé selon les situations directement documentées.",
    "aliases": [
      "rattrapage jeune",
      "qada ramadan",
      "rattrapage des jours"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-184",
      "quran-2-185",
      "muslim-335c",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-menstruation",
    "categoryId": "fasting",
    "title": "Règles et lochies pendant Ramadan",
    "summary": "Le rattrapage des jours de jeûne manqués est rapporté.",
    "aliases": [
      "menstrues jeune",
      "regles jeune",
      "hayd",
      "menstrues"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "muslim-335c",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-shawwal",
    "categoryId": "fasting",
    "title": "Les six jours de Shawwâl",
    "summary": "Le jeûne de six jours de Shawwâl est associé à un mérite rapporté.",
    "aliases": [
      "shawwal",
      "six jours shawwal",
      "six jours de shawwâl",
      "six jours de shawwal"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1164c",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-ashura",
    "categoryId": "fasting",
    "title": "‘Âshûrâ’",
    "summary": "Le jeûne de ‘Âshûrâ’ est rapporté comme facultatif avec un mérite associé.",
    "aliases": [
      "ashura",
      "achoura",
      "‘âshûrâ’",
      "‘ashura’"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2002",
      "muslim-1162a",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-arafah",
    "categoryId": "fasting",
    "title": "Le jour de ‘Arafa",
    "summary": "Le jeûne de ‘Arafah est associé à un mérite rapporté.",
    "aliases": [
      "arafah",
      "arafa",
      "‘arafah"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1162a",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-tashriq",
    "categoryId": "fasting",
    "title": "Les jours de Tashrîq",
    "summary": "Les jours de Tashrîq sont décrits comme des jours de nourriture et de boisson.",
    "aliases": [
      "tashriq",
      "jours tashriq",
      "jours de tashrîq",
      "jours de tashriq"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1141a",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-eid-fitr",
    "categoryId": "fasting",
    "title": "Le jour de l’Aïd al-Fitr",
    "summary": "Le jeûne du jour de ‘Îd al-Fitr est interdit dans le récit retenu.",
    "aliases": [
      "aid fitr",
      "eid fitr",
      "‘îd al-fitr",
      "‘id al-fitr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1990",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-eid-adha",
    "categoryId": "fasting",
    "title": "Le jour de l’Aïd al-Adhâ",
    "summary": "Le jeûne du jour de ‘Îd al-Adhâ est interdit dans le récit retenu.",
    "aliases": [
      "aid adha",
      "eid adha",
      "‘îd al-adhâ",
      "‘id al-adha"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1990",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-qadr",
    "categoryId": "fasting",
    "title": "La Nuit du Destin",
    "summary": "Laylat al-Qadr est recherchée dans les dernières nuits de Ramadan.",
    "aliases": [
      "laylat qadr",
      "nuit du destin",
      "laylat al-qadr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2017",
      "bukhari-2020",
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "zakat-obligation",
    "categoryId": "zakat",
    "title": "L’obligation de la zakât",
    "summary": "La Zakât est mentionnée avec la prière dans le Coran.",
    "aliases": [
      "zakat",
      "zakât",
      "aumône obligatoire",
      "obligation générale de la zakât",
      "obligation generale de la zakat"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-43",
      "quran-9-103",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-beneficiaries",
    "categoryId": "zakat",
    "title": "À qui donner la zakât",
    "summary": "Le Coran énumère huit catégories de bénéficiaires.",
    "aliases": [
      "beneficiaires zakat",
      "bénéficiaires",
      "destinataires zakat",
      "pauvres",
      "necessiteux",
      "collecteurs",
      "endettés",
      "voyageur",
      "les huit bénéficiaires de la zakât",
      "les huit beneficiaires de la zakat"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-9-60",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-purification",
    "categoryId": "zakat",
    "title": "Le sens de la zakât",
    "summary": "Le Coran associe la Zakât à une dimension de purification dans son contexte.",
    "aliases": [
      "purification biens",
      "purifier richesse",
      "purification des biens"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-9-103",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-nisab",
    "categoryId": "zakat",
    "title": "Le seuil (nisâb)",
    "summary": "Certains seuils sont rapportés sous des unités historiques.",
    "aliases": [
      "nisab",
      "nisâb",
      "seuil zakat",
      "200 dirhams",
      "5 awq",
      "5 awsuq",
      "5 chameaux",
      "nisâb : seuils mentionnés dans les textes",
      "nisab : seuils mentionnes dans les textes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "abudawud-1573",
      "bukhari-1405",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-money-gold",
    "categoryId": "zakat",
    "title": "La zakât de l’argent et de l’or",
    "summary": "Les textes rapportent des unités historiques et un taux dans certains cas.",
    "aliases": [
      "argent zakat",
      "or zakat",
      "dirham",
      "dinar",
      "1/40",
      "argent et or dans les textes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "abudawud-1573",
      "bukhari-1454",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-hawl",
    "categoryId": "zakat",
    "title": "L’année de possession (hawl)",
    "summary": "Une année est mentionnée pour l’argent et l’or dans la narration retenue.",
    "aliases": [
      "hawl",
      "année zakat",
      "hawl : passage d’une année",
      "hawl : passage d’une annee"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "abudawud-1573",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-camels",
    "categoryId": "zakat",
    "title": "La zakât des chameaux",
    "summary": "Bukhârî 1454 rapporte des seuils et paliers pour les chameaux.",
    "aliases": [
      "chameaux zakat",
      "zakat betail",
      "chameaux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1454",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-sheep",
    "categoryId": "zakat",
    "title": "La zakât des moutons et chèvres",
    "summary": "Bukhârî 1454 rapporte des seuils et paliers pour les moutons.",
    "aliases": [
      "moutons zakat",
      "zakat ovins",
      "moutons"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1454",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-crops",
    "categoryId": "zakat",
    "title": "La zakât des récoltes",
    "summary": "Les textes distinguent les taux selon le mode d’irrigation.",
    "aliases": [
      "recoltes zakat",
      "récoltes",
      "irrigation zakat",
      "agriculture zakat",
      "récoltes et irrigation",
      "recoltes et irrigation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1483",
      "muslim-981",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-rikaz",
    "categoryId": "zakat",
    "title": "Le trésor trouvé (rikâz)",
    "summary": "Le texte rapporte un cinquième sur le rikâz.",
    "aliases": [
      "rikaz",
      "rikâz",
      "trésor enfoui"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1499",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-fitr",
    "categoryId": "zakat",
    "title": "La zakât al-fitr",
    "summary": "La Zakât al-Fitr est prescrite dans les narrations retenues.",
    "aliases": [
      "zakat fitr",
      "zakât al-fitr",
      "fitra",
      "zakat al-fitr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1503",
      "bukhari-1504",
      "muslim-984e",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-fitr-amount",
    "categoryId": "zakat",
    "title": "La quantité",
    "summary": "Les textes mentionnent un sâ‘.",
    "aliases": [
      "saa",
      "sâ‘",
      "quantite fitr",
      "quantité fitr",
      "quantité textuelle d’un sâ‘",
      "quantite textuelle d’un sa‘"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1503",
      "bukhari-1504",
      "muslim-984e",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-fitr-food",
    "categoryId": "zakat",
    "title": "Nourriture ou argent ?",
    "summary": "Les textes mentionnent notamment les dattes et l’orge.",
    "aliases": [
      "dattes fitr",
      "orge fitr",
      "nourriture fitr",
      "aliments mentionnés",
      "aliments mentionnes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1504",
      "muslim-984e",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-fitr-persons",
    "categoryId": "zakat",
    "title": "Pour qui la donner",
    "summary": "Les narrations mentionnent les musulmans concernés dans leur formulation rapportée, sans constituer une règle moderne exhaustive.",
    "aliases": [
      "qui paie fitr",
      "personnes zakat fitr",
      "personnes concernées par zakât al-fitr",
      "personnes concernees par zakat al-fitr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1504",
      "muslim-984e",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "zakat-fitr-timing",
    "categoryId": "zakat",
    "title": "Quand la donner",
    "summary": "Un paiement avant la sortie pour la prière de l’Aïd est rapporté.",
    "aliases": [
      "moment zakat fitr",
      "avant priere aid",
      "paiement fitr",
      "moment avant la prière de l’aïd",
      "moment avant la priere de l’aid"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1503",
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "hajj-obligation",
    "categoryId": "hajj-umra",
    "title": "L’obligation du Hajj",
    "summary": "Le Hajj est obligatoire pour celui qui en a la capacité.",
    "aliases": [
      "hajj",
      "hadj",
      "pèlerinage",
      "pelerinage",
      "obligation hajj",
      "capacité hajj",
      "obligation et capacité",
      "obligation et capacite"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-3-97",
      "wajiz-hajj"
    ],
    "differences": [],
    "link": {
      "label": "Voir le guide complet Hajj & ‘Umra",
      "route": "/pilgrimage"
    }
  },
  {
    "id": "hajj-once",
    "categoryId": "hajj-umra",
    "title": "Une fois dans la vie",
    "summary": "Le Hajj est imposé, dans le récit retenu, sans être rendu obligatoire chaque année.",
    "aliases": [
      "hajj une fois",
      "hajj obligatoire",
      "hajj une fois dans la vie"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1337",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-ihram-miqat-talbiya",
    "categoryId": "hajj-umra",
    "title": "Ihrâm, mîqât et talbiya",
    "summary": "L’entrée en ihrâm, les mîqâts rapportés et une formule de talbiya.",
    "aliases": [
      "ihram",
      "ihrâm",
      "miqat",
      "mîqât",
      "talbiya",
      "ihrâm, mîqât et talbiya",
      "ihram, miqat et talbiya"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1218",
      "bukhari-1528",
      "bukhari-1549",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-tawaf-sai",
    "categoryId": "hajj-umra",
    "title": "Tawâf et sa‘y",
    "summary": "Le récit rapporte le tawâf, le passage au Maqâm Ibrâhîm et le sa‘y entre Safâ et Marwa.",
    "aliases": [
      "tawaf",
      "tawâf",
      "maqam ibrahim",
      "safa",
      "marwa",
      "sai",
      "sa‘y",
      "tawâf, maqâm ibrâhîm et sa‘y",
      "tawaf, maqam ibrahim et sa‘y"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1218a",
      "quran-2-158",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-arafah-muzdalifah-mina",
    "categoryId": "hajj-umra",
    "title": "‘Arafa, Muzdalifa et Minâ",
    "summary": "Les récits identifient ces lieux dans le déroulement et les rites rapportés.",
    "aliases": [
      "arafah",
      "arafat",
      "‘arafah",
      "muzdalifa",
      "muzdalifah",
      "mina",
      "minâ",
      "‘arafah, muzdalifah et minâ",
      "‘arafah, muzdalifah et mina"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "abudawud-1949",
      "muslim-1218c",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-jamarat-sacrifice-hair",
    "categoryId": "hajj-umra",
    "title": "Lapidation, sacrifice et cheveux",
    "summary": "Le lancer, le sacrifice, le rasage et le raccourcissement sont rapportés avec une portée limitée.",
    "aliases": [
      "jamarat",
      "jamarât",
      "hady",
      "sacrifice hajj",
      "rasage hajj",
      "raccourcissement hajj",
      "jamarât, hady et cheveux",
      "jamarat, hady et cheveux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1748",
      "bukhari-1727",
      "bukhari-1728",
      "bukhari-1730",
      "bukhari-1731",
      "muslim-1218",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-ifada-farewell",
    "categoryId": "hajj-umra",
    "title": "Tawâf al-ifâda et tawâf d’adieu",
    "summary": "Existence du tawâf al-ifâda et cas rapporté du tawâf final.",
    "aliases": [
      "tawaf ifada",
      "tawâf al-ifâda",
      "tawaf adieu",
      "tawâf d’adieu",
      "tawâf al-ifâda et tawâf final",
      "tawaf al-ifada et tawaf final"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1218",
      "muslim-1211ab",
      "muslim-1211ae",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-types",
    "categoryId": "hajj-umra",
    "title": "Les trois formes du Hajj",
    "summary": "Les récits mentionnent l’ifrâd, le tamattu‘ et le qirân.",
    "aliases": [
      "tamattu",
      "tamattu‘",
      "qiran",
      "qirân",
      "ifrad",
      "ifrâd",
      "les formes du hajj"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1213c",
      "muslim-1216a",
      "muslim-1226g",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-menstruation",
    "categoryId": "hajj-umra",
    "title": "Les règles pendant le Hajj",
    "summary": "Repères limités aux cas rapportés dans les textes.",
    "aliases": [
      "menstruations hajj",
      "femme règles hajj",
      "hayd hajj",
      "menstruations pendant le hajj"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-1652",
      "muslim-1211ab",
      "muslim-1211ae",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-child-incapacity",
    "categoryId": "hajj-umra",
    "title": "L’enfant et la personne incapable",
    "summary": "Deux cas précis sont rapportés : Hajj de l’enfant et Hajj pour un père âgé incapable.",
    "aliases": [
      "hajj enfant",
      "hajj personne âgée",
      "hajj incapable",
      "hajj de l’enfant et incapacité",
      "hajj de l’enfant et incapacite"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1336c",
      "muslim-1334",
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "funerals-dying-person",
    "categoryId": "funerals",
    "title": "Accompagner le mourant",
    "summary": "Accompagner la personne en fin de vie : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "mourant",
      "fin de vie",
      "talqin",
      "shahada",
      "accompagner la personne en fin de vie"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-916a",
      "bukhari-1284",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-after-death",
    "categoryId": "funerals",
    "title": "Juste après le décès",
    "summary": "Après le décès : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "après décès",
      "fermer les yeux",
      "dua défunt",
      "après le décès",
      "apres le deces"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-920a",
      "bukhari-1315",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-washing",
    "categoryId": "funerals",
    "title": "La toilette mortuaire",
    "summary": "Toilette mortuaire : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "ghusl mortuaire",
      "toilette mortuaire",
      "sidr",
      "camphre"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1253",
      "bukhari-1254",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-washing-cases",
    "categoryId": "funerals",
    "title": "Cas particuliers de la toilette",
    "summary": "Situations particulières de la toilette : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "ihram décès",
      "pèlerin mort",
      "muhrim défunt",
      "situations particulières de la toilette",
      "situations particulieres de la toilette"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1265",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-shroud",
    "categoryId": "funerals",
    "title": "Le linceul",
    "summary": "Le linceul : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "kafan",
      "linceul",
      "étoffes blanches",
      "le linceul"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1264",
      "muslim-941a",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-shroud-cases",
    "categoryId": "funerals",
    "title": "Le linceul du pèlerin",
    "summary": "Situations particulières du linceul : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "linceul ihram",
      "muhrim",
      "pèlerin défunt",
      "situations particulières du linceul",
      "situations particulieres du linceul"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1265",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-prayer-basics",
    "categoryId": "funerals",
    "title": "La prière funéraire",
    "summary": "Principes de la prière funéraire : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "janaza",
      "salat janaza",
      "takbir",
      "fatiha",
      "dua défunt",
      "principes de la prière funéraire",
      "principes de la priere funeraire"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1334",
      "bukhari-1335",
      "muslim-963a",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-prayer-absent",
    "categoryId": "funerals",
    "title": "La prière sur le défunt absent",
    "summary": "Prière en l’absence du défunt : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "salat al ghaib",
      "prière de l’absent",
      "Najashi",
      "prière en l’absence du défunt",
      "priere en l’absence du defunt"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1334",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-burial",
    "categoryId": "funerals",
    "title": "L’enterrement",
    "summary": "L’enterrement : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "enterrement",
      "inhumation",
      "dafn",
      "tombe",
      "l’enterrement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1315",
      "abudawud-3215",
      "muslim-966",
      "abudawud-3221",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-grave",
    "categoryId": "funerals",
    "title": "La tombe",
    "summary": "La tombe : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "tombe",
      "qabr",
      "construction tombe",
      "lahd",
      "la tombe"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-966",
      "muslim-970a",
      "abudawud-3215",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-condolences",
    "categoryId": "funerals",
    "title": "Les condoléances et le deuil",
    "summary": "Les condoléances : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "ta'ziya",
      "condoléances",
      "deuil",
      "patience",
      "les condoléances",
      "les condoleances"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1284",
      "muslim-920a",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "funerals-graves",
    "categoryId": "funerals",
    "title": "La visite des tombes",
    "summary": "Visite des tombes : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "ziyarat qubur",
      "visite cimetière",
      "salut morts",
      "rappel mort",
      "visite des tombes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-976b",
      "muslim-975",
      "binbaz-grave-visit",
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "family-marriage-purpose",
    "categoryId": "family",
    "title": "Le sens du mariage",
    "summary": "Cadre du mariage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "cadre du mariage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-30-21",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-proposal",
    "categoryId": "family",
    "title": "La demande en mariage",
    "summary": "La demande en mariage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la demande en mariage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-5142",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-contract",
    "categoryId": "family",
    "title": "Le contrat de mariage",
    "summary": "Le contrat de mariage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le contrat de mariage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-5136",
      "abudawud-2085",
      "binbaz-nikah-witnesses",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-wali",
    "categoryId": "family",
    "title": "Le tuteur (wali)",
    "summary": "Le wali : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le wali"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "abudawud-2085",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-witnesses",
    "categoryId": "family",
    "title": "Les témoins",
    "summary": "Les témoins : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "les témoins",
      "les temoins"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "binbaz-nikah-witnesses",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-mahr",
    "categoryId": "family",
    "title": "Le mahr (la dot)",
    "summary": "Le mahr : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le mahr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-4",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-spousal-rights",
    "categoryId": "family",
    "title": "Les droits des époux",
    "summary": "Droits et responsabilités des époux : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "droits et responsabilités des époux",
      "droits et responsabilites des epoux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-19",
      "quran-2-228",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-maintenance",
    "categoryId": "family",
    "title": "L’entretien (nafaqa)",
    "summary": "Entretien du foyer : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "entretien du foyer"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-2-233",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-disagreements",
    "categoryId": "family",
    "title": "Les désaccords dans le couple",
    "summary": "Désaccords conjugaux : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "désaccords conjugaux",
      "desaccords conjugaux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-35",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-divorce",
    "categoryId": "family",
    "title": "Le divorce (talâq)",
    "summary": "Le divorce : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le divorce"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-65-1",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-khul",
    "categoryId": "family",
    "title": "Le khul‘",
    "summary": "Le khul‘ : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le khul‘"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-2-229",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-iddah",
    "categoryId": "family",
    "title": "Le délai de viduité (‘idda)",
    "summary": "La ‘idda : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la ‘idda"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-65-1",
      "quran-2-228",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-lineage",
    "categoryId": "family",
    "title": "La filiation",
    "summary": "Filiation : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "filiation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-33-5",
      "bukhari-6749",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-breastfeeding",
    "categoryId": "family",
    "title": "L’allaitement",
    "summary": "Allaitement : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "allaitement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-2-233",
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "family-custody",
    "categoryId": "family",
    "title": "La garde des enfants",
    "summary": "Garde des enfants : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "garde des enfants"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "wajiz-nikah"
    ],
    "differences": []
  },
  {
    "id": "transactions-consent",
    "categoryId": "transactions",
    "title": "Le consentement",
    "summary": "Consentement et capacité : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "consentement et capacité",
      "consentement et capacite"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-4-29",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-clarity",
    "categoryId": "transactions",
    "title": "La clarté et l’absence de tromperie",
    "summary": "Clarté du contrat : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "clarté du contrat",
      "clarte du contrat"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1513",
      "bukhari-2079",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-sale",
    "categoryId": "transactions",
    "title": "La vente",
    "summary": "La vente : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la vente"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2079",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-defects",
    "categoryId": "transactions",
    "title": "Les défauts cachés",
    "summary": "Défauts et litiges de vente : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "défauts et litiges de vente",
      "defauts et litiges de vente"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2079",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-options",
    "categoryId": "transactions",
    "title": "Le droit de se rétracter",
    "summary": "Options et annulation : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "options et annulation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2079",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-debt",
    "categoryId": "transactions",
    "title": "La dette",
    "summary": "La dette : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la dette"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-282",
      "quran-2-280",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-loan",
    "categoryId": "transactions",
    "title": "Le prêt (qard)",
    "summary": "Le prêt : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le prêt",
      "le pret"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-2-280",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-guarantee",
    "categoryId": "transactions",
    "title": "Garantie et gage",
    "summary": "Garantie et caution : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "garantie et caution"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2291",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-riba",
    "categoryId": "transactions",
    "title": "L’intérêt (ribâ)",
    "summary": "Le ribâ : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le ribâ",
      "le riba"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-2-275",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-currency",
    "categoryId": "transactions",
    "title": "Le change de monnaies",
    "summary": "Échange de monnaies : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "échange de monnaies",
      "echange de monnaies"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1587c",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-rental",
    "categoryId": "transactions",
    "title": "La location",
    "summary": "La location : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la location"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2262",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-wages",
    "categoryId": "transactions",
    "title": "Le salaire",
    "summary": "Travail et rémunération : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "travail et rémunération",
      "travail et remuneration"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2262",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-partnership",
    "categoryId": "transactions",
    "title": "L’association",
    "summary": "Partenariats : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "partenariats"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-29",
      "muslim-1513",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "transactions-agency",
    "categoryId": "transactions",
    "title": "Le mandat",
    "summary": "Mandat et représentation : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "mandat et représentation",
      "mandat et representation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-4-29",
      "muslim-1513",
      "wajiz-buyu"
    ],
    "differences": []
  },
  {
    "id": "food-principles",
    "categoryId": "food-sacrifices",
    "title": "Le principe : tout est permis",
    "summary": "Principes généraux de l’alimentation : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "principes généraux de l’alimentation",
      "principes generaux de l’alimentation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-3",
      "quran-5-4",
      "quran-6-121",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-prohibited",
    "categoryId": "food-sacrifices",
    "title": "Ce qui est interdit",
    "summary": "Aliments interdits : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "aliments interdits"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-3",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-slaughter",
    "categoryId": "food-sacrifices",
    "title": "L’abattage",
    "summary": "Abattage rituel : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "abattage rituel"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-6-121",
      "muslim-1955a",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-slaughter-tools",
    "categoryId": "food-sacrifices",
    "title": "L’instrument d’abattage",
    "summary": "Moyens d’abattage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "moyens d’abattage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1955a",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-udhiyah",
    "categoryId": "food-sacrifices",
    "title": "Le sacrifice de l’Aïd",
    "summary": "Le sacrifice de l’Aïd : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le sacrifice de l’aïd",
      "le sacrifice de l’aid"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-108-2",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-udhiyah-time",
    "categoryId": "food-sacrifices",
    "title": "Le moment du sacrifice",
    "summary": "Moment du sacrifice : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "moment du sacrifice"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-108-2",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-aqiqah",
    "categoryId": "food-sacrifices",
    "title": "La ‘aqîqa",
    "summary": "La ‘aqîqa : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "la ‘aqîqa",
      "la ‘aqiqa"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "binbaz-aqiqah",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "food-aqiqah-time",
    "categoryId": "food-sacrifices",
    "title": "Le moment de la ‘aqîqa",
    "summary": "Moment de la ‘aqîqa : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "moment de la ‘aqîqa",
      "moment de la ‘aqiqa"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "binbaz-aqiqah",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "oaths-types",
    "categoryId": "oaths-vows",
    "title": "Les sortes de serments",
    "summary": "Types de serments : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "types de serments"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-5-89",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "oaths-breaking",
    "categoryId": "oaths-vows",
    "title": "Rompre un serment",
    "summary": "Rompre un serment : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "rompre un serment"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-5-89",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "oaths-expiation",
    "categoryId": "oaths-vows",
    "title": "L’expiation du serment",
    "summary": "Expiation du serment : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "expiation du serment"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-5-89",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "vows-basics",
    "categoryId": "oaths-vows",
    "title": "Le vœu (nadhr)",
    "summary": "Le vœu : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le vœu"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-6696",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "vows-fulfilment",
    "categoryId": "oaths-vows",
    "title": "Accomplir un vœu",
    "summary": "Accomplir un vœu : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "accomplir un vœu"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-6696",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "expiations-overview",
    "categoryId": "oaths-vows",
    "title": "Les expiations en un coup d’œil",
    "summary": "Repères sur les expiations : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "repères sur les expiations",
      "reperes sur les expiations"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-5-89",
      "wajiz-ayman"
    ],
    "differences": []
  },
  {
    "id": "clothing-principles",
    "categoryId": "clothing-adornment",
    "title": "Le vêtement : principes",
    "summary": "Principes du vêtement : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "principes du vêtement",
      "principes du vetement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-7-26"
    ],
    "differences": []
  },
  {
    "id": "clothing-awrah",
    "categoryId": "clothing-adornment",
    "title": "La ‘awra",
    "summary": "‘Awra et couverture : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "‘awra et couverture"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-24-31",
      "quran-33-59"
    ],
    "differences": []
  },
  {
    "id": "clothing-gold-silk",
    "categoryId": "clothing-adornment",
    "title": "L’or et la soie",
    "summary": "Or et soie : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "or et soie"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-2069i"
    ],
    "differences": []
  },
  {
    "id": "clothing-perfume",
    "categoryId": "clothing-adornment",
    "title": "Le parfum",
    "summary": "Parfum : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "parfum"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-443b"
    ],
    "differences": []
  },
  {
    "id": "clothing-hair",
    "categoryId": "clothing-adornment",
    "title": "Cheveux, barbe et fitra",
    "summary": "Cheveux et coiffure : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "cheveux et coiffure"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-5931"
    ],
    "differences": []
  },
  {
    "id": "clothing-body-modification",
    "categoryId": "clothing-adornment",
    "title": "Tatouages et modifications du corps",
    "summary": "Modifications corporelles : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "modifications corporelles"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-5931"
    ],
    "differences": []
  },
  {
    "id": "daily-toilet",
    "categoryId": "daily-life",
    "title": "Aller aux toilettes",
    "summary": "Usages liés aux toilettes : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "usages liés aux toilettes",
      "usages lies aux toilettes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-144"
    ],
    "differences": []
  },
  {
    "id": "daily-sleep",
    "categoryId": "daily-life",
    "title": "Avant de dormir",
    "summary": "Sommeil et réveil : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "sommeil et réveil",
      "sommeil et reveil"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-247"
    ],
    "differences": []
  },
  {
    "id": "daily-greetings",
    "categoryId": "daily-life",
    "title": "Le salut",
    "summary": "Salutations : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "salutations"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-1240"
    ],
    "differences": []
  },
  {
    "id": "daily-permission",
    "categoryId": "daily-life",
    "title": "Demander la permission d’entrer",
    "summary": "Demander la permission : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "demander la permission"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-24-27"
    ],
    "differences": []
  },
  {
    "id": "daily-neighbours",
    "categoryId": "daily-life",
    "title": "Le voisin",
    "summary": "Voisinage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "voisinage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-6014"
    ],
    "differences": []
  },
  {
    "id": "daily-travel-etiquette",
    "categoryId": "daily-life",
    "title": "Le voyage",
    "summary": "Usages du voyage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "usages du voyage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-247"
    ],
    "differences": []
  },
  {
    "id": "daily-return",
    "categoryId": "daily-life",
    "title": "Le retour de voyage",
    "summary": "Retour de voyage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "retour de voyage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-247"
    ],
    "differences": []
  },
  {
    "id": "daily-roads",
    "categoryId": "daily-life",
    "title": "Le droit de la route",
    "summary": "Droits de la voie publique : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "droits de la voie publique"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2465"
    ],
    "differences": []
  },
  {
    "id": "daily-gatherings",
    "categoryId": "daily-life",
    "title": "Les assemblées",
    "summary": "Réunions et assemblées : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "réunions et assemblées",
      "reunions et assemblees"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2465"
    ],
    "differences": []
  },
  {
    "id": "justice-testimony",
    "categoryId": "justice-rights",
    "title": "Le témoignage",
    "summary": "Le témoignage : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le témoignage",
      "le temoignage"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-135",
      "quran-2-282",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-oaths",
    "categoryId": "justice-rights",
    "title": "La preuve et le serment",
    "summary": "Serments dans les litiges : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "serments dans les litiges"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-135",
      "quran-2-282",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-disputes",
    "categoryId": "justice-rights",
    "title": "Juger un litige",
    "summary": "Règlement des litiges : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "règlement des litiges",
      "reglement des litiges"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-135",
      "quran-49-9",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-settlement",
    "categoryId": "justice-rights",
    "title": "La conciliation",
    "summary": "Conciliation : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "conciliation"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-49-9",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-found-property",
    "categoryId": "justice-rights",
    "title": "Le bien trouvé",
    "summary": "Biens trouvés : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "biens trouvés",
      "biens trouves"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-2426",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-usurpation",
    "categoryId": "justice-rights",
    "title": "S’emparer du bien d’autrui",
    "summary": "Usurpation de biens : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "usurpation de biens"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-2453",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "justice-damages",
    "categoryId": "justice-rights",
    "title": "Réparer un dommage",
    "summary": "Dommages et responsabilité : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "dommages et responsabilité",
      "dommages et responsabilite"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-135",
      "bukhari-2453",
      "wajiz-qada"
    ],
    "differences": []
  },
  {
    "id": "wills-basics",
    "categoryId": "inheritance-wills",
    "title": "Le testament",
    "summary": "Le testament : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "le testament"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-2742",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "wills-limits",
    "categoryId": "inheritance-wills",
    "title": "Les limites du testament",
    "summary": "Limites du testament : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "limites du testament"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-2742",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-estate",
    "categoryId": "inheritance-wills",
    "title": "L’ordre de la succession",
    "summary": "Ouverture de la succession : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "ouverture de la succession"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-11",
      "quran-4-12",
      "bukhari-6732",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-debts",
    "categoryId": "inheritance-wills",
    "title": "Les dettes du défunt",
    "summary": "Dettes du défunt : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "dettes du défunt",
      "dettes du defunt"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-11",
      "quran-4-12",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-heirs",
    "categoryId": "inheritance-wills",
    "title": "Les héritiers",
    "summary": "Les héritiers : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "les héritiers",
      "les heritiers"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-11",
      "quran-4-12",
      "quran-4-176",
      "bukhari-6732",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-shares",
    "categoryId": "inheritance-wills",
    "title": "Les parts",
    "summary": "Parts successorales : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "parts successorales"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-11",
      "quran-4-12",
      "quran-4-176",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-blocking",
    "categoryId": "inheritance-wills",
    "title": "L’exclusion entre héritiers",
    "summary": "Empêchements et exclusions : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "empêchements et exclusions",
      "empechements et exclusions"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-6764",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "inheritance-unresolved",
    "categoryId": "inheritance-wills",
    "title": "Les cas complexes",
    "summary": "Cas complexes : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "cas complexes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-4-11",
      "quran-4-12",
      "quran-4-176",
      "bukhari-6732",
      "wajiz-faraid"
    ],
    "differences": []
  },
  {
    "id": "hunting-basics",
    "categoryId": "hunting-animals",
    "title": "La chasse",
    "summary": "Principes de la chasse : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "principes de la chasse"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "quran-5-4",
      "bukhari-5486",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "hunting-tools",
    "categoryId": "hunting-animals",
    "title": "Les moyens de chasse",
    "summary": "Moyens de chasse : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "moyens de chasse"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-5486",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "animals-domestic",
    "categoryId": "hunting-animals",
    "title": "Les animaux domestiques",
    "summary": "Animaux domestiques : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "animaux domestiques"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2363",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "animals-welfare",
    "categoryId": "hunting-animals",
    "title": "La bienfaisance envers les animaux",
    "summary": "Bien-être et traitement des animaux : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "bien-être et traitement des animaux",
      "bien-etre et traitement des animaux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "bukhari-2363",
      "muslim-1955a",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "animals-products",
    "categoryId": "hunting-animals",
    "title": "Les produits animaux",
    "summary": "Produits issus des animaux : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "produits issus des animaux"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "muslim-1955a",
      "wajiz-atimah"
    ],
    "differences": []
  },
  {
    "id": "siyar-covenants",
    "categoryId": "siyar-relations",
    "title": "Respecter les engagements",
    "summary": "Engagements et pactes : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "engagements et pactes"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-9-4",
      "wajiz-siyar"
    ],
    "differences": []
  },
  {
    "id": "siyar-protection",
    "categoryId": "siyar-relations",
    "title": "La protection accordée",
    "summary": "Protection et garanties : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "protection et garanties"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-9-6",
      "wajiz-siyar"
    ],
    "differences": []
  },
  {
    "id": "siyar-noncombatants",
    "categoryId": "siyar-relations",
    "title": "Les non-combattants",
    "summary": "Protection des non-combattants : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "protection des non-combattants"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "bukhari-3015",
      "wajiz-siyar"
    ],
    "differences": []
  },
  {
    "id": "siyar-property",
    "categoryId": "siyar-relations",
    "title": "Justice envers tous",
    "summary": "Biens et droits : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "biens et droits"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-5-8",
      "quran-2-190",
      "bukhari-3166",
      "wajiz-siyar"
    ],
    "differences": []
  },
  {
    "id": "siyar-historical-context",
    "categoryId": "siyar-relations",
    "title": "Lire ces textes dans leur cadre",
    "summary": "Contexte juridique historique : règles essentielles, mise en pratique et limites, à partir des preuves affichées.",
    "aliases": [
      "contexte juridique historique"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "quran-8-61",
      "quran-9-4",
      "quran-9-6",
      "quran-2-190",
      "bukhari-3166",
      "wajiz-siyar"
    ],
    "differences": []
  },
  {
    "id": "najasat",
    "categoryId": "purification",
    "title": "Les impuretés à connaître",
    "arabicTerm": "النجاسات",
    "summary": "Les impuretés (najâsât) sont des matières qu’il faut retirer du corps, des vêtements et du lieu de prière : principalement l’urine, les selles, le madhy, le sang des règles, la salive du chien, la viande de porc et la bête morte.",
    "aliases": [
      "najasa",
      "najassa",
      "impur",
      "urine",
      "sang",
      "chien",
      "porc",
      "madhy",
      "les impuretés à connaître",
      "les impuretes a connaitre"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-taharah"
    ],
    "differences": []
  },
  {
    "id": "prayer-after-dhikr",
    "categoryId": "prayer",
    "title": "Les invocations après la prière",
    "summary": "Après le salut, on demande pardon trois fois, puis on glorifie Allah 33 fois, on Le loue 33 fois et on dit Allâhu akbar 33 fois.",
    "aliases": [
      "dhikr après la prière",
      "tasbih",
      "33",
      "astaghfirullah",
      "les invocations après la prière",
      "les invocations apres la priere"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-congregation",
    "categoryId": "prayer",
    "title": "La prière en groupe",
    "summary": "Prier en groupe vaut vingt-sept fois plus que prier seul. Pour les hommes, c’est un devoir très appuyé ; les femmes peuvent venir à la mosquée.",
    "aliases": [
      "jamaa",
      "groupe",
      "mosquée",
      "en commun",
      "la prière en groupe",
      "la priere en groupe"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-missed",
    "categoryId": "prayer",
    "title": "Rattraper une prière manquée",
    "summary": "Celui qui a oublié une prière ou s’est endormi la prie dès qu’il s’en souvient. Plusieurs prières manquées se rattrapent dans l’ordre.",
    "aliases": [
      "qada",
      "prière manquée",
      "rattrapage",
      "oubli",
      "endormi",
      "rattraper une prière manquée",
      "rattraper une priere manquee"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-forbidden-times",
    "categoryId": "prayer",
    "title": "Les moments où l’on ne prie pas",
    "summary": "On ne fait pas de prière surérogatoire après Fajr jusqu’à ce que le soleil soit levé, au zénith, et après ‘Asr jusqu’au coucher du soleil.",
    "aliases": [
      "heures interdites",
      "moments interdits",
      "lever du soleil",
      "zénith",
      "les moments où l’on ne prie pas",
      "les moments ou l’on ne prie pas"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-witr",
    "categoryId": "prayer",
    "title": "Le witr",
    "summary": "Le witr est une prière en nombre impair qui clôt la nuit, au minimum une rak‘a, après ‘Ishâ’ et avant l’aube.",
    "aliases": [
      "witr",
      "prière impaire",
      "qunut",
      "le witr"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-rawatib",
    "categoryId": "prayer",
    "title": "Les sunnas de la journée",
    "summary": "Douze rak‘ât surérogatoires par jour bâtissent une maison au Paradis : deux avant Fajr, quatre avant Dhuhr et deux après, deux après Maghrib, deux après ‘Ishâ’.",
    "aliases": [
      "rawatib",
      "sunna",
      "nafila",
      "duha",
      "tahiyyat al-masjid",
      "les sunnas de la journée",
      "les sunnas de la journee"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "prayer-night",
    "categoryId": "prayer",
    "title": "La prière de la nuit et le tarâwîh",
    "summary": "La prière de la nuit est la meilleure après l’obligatoire. Elle se prie deux rak‘ât par deux. En Ramadan, c’est le tarâwîh.",
    "aliases": [
      "qiyam",
      "tahajjud",
      "tarawih",
      "prière de nuit",
      "la prière de la nuit et le tarâwîh",
      "la priere de la nuit et le tarawih"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-salah"
    ],
    "differences": []
  },
  {
    "id": "fasting-intention",
    "categoryId": "fasting",
    "title": "L’intention du jeûne",
    "summary": "Pour le jeûne obligatoire, on doit avoir décidé de jeûner avant l’aube. Pour un jeûne surérogatoire, on peut le décider dans la journée si l’on n’a encore rien mangé.",
    "aliases": [
      "niyya jeûne",
      "intention ramadan",
      "l’intention du jeûne",
      "l’intention du jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-breakers",
    "categoryId": "fasting",
    "title": "Ce qui rompt le jeûne",
    "summary": "Le jeûne est rompu volontairement en mangeant, en buvant, par le rapport conjugal, en se faisant vomir et par l’éjaculation provoquée. L’apparition des règles le rompt aussi.",
    "aliases": [
      "rompre le jeûne",
      "annule le jeûne",
      "vomir",
      "injection",
      "ce qui rompt le jeûne",
      "ce qui rompt le jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-not-breaking",
    "categoryId": "fasting",
    "title": "Ce qui ne rompt pas le jeûne",
    "summary": "Ne rompent pas le jeûne : manger par oubli, le vomissement involontaire, se réveiller en état de janâba, un rêve érotique, avaler sa salive, se rincer la bouche, le siwâk, une prise de sang.",
    "aliases": [
      "ne rompt pas",
      "brosse à dents",
      "siwak",
      "prise de sang",
      "baiser",
      "ce qui ne rompt pas le jeûne",
      "ce qui ne rompt pas le jeune"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-elderly-pregnant",
    "categoryId": "fasting",
    "title": "Personne âgée, grossesse, allaitement",
    "summary": "La personne âgée qui ne peut plus jeûner nourrit un pauvre pour chaque jour. La femme enceinte ou qui allaite peut rompre si elle craint pour elle ou pour l’enfant.",
    "aliases": [
      "enceinte",
      "allaitement",
      "vieillard",
      "fidya",
      "personne âgée",
      "personne âgée, grossesse, allaitement",
      "personne agee, grossesse, allaitement"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-voluntary-days",
    "categoryId": "fasting",
    "title": "Lundi, jeudi et trois jours par mois",
    "summary": "Il est recommandé de jeûner le lundi et le jeudi, et trois jours chaque mois. Le meilleur jeûne surérogatoire est celui de Dâwûd : un jour sur deux.",
    "aliases": [
      "lundi",
      "jeudi",
      "jours blancs",
      "jeûne surérogatoire",
      "dawud",
      "lundi, jeudi et trois jours par mois"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "fasting-itikaf",
    "categoryId": "fasting",
    "title": "La retraite à la mosquée (i‘tikâf)",
    "summary": "L’i‘tikâf consiste à rester à la mosquée pour l’adoration. Le Prophète ﷺ le faisait les dix dernières nuits de Ramadan.",
    "aliases": [
      "itikaf",
      "retraite",
      "dix dernières nuits",
      "la retraite à la mosquée (i‘tikâf)",
      "la retraite a la mosquee (i‘tikaf)"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-siyam"
    ],
    "differences": []
  },
  {
    "id": "zakat-cattle",
    "categoryId": "zakat",
    "title": "La zakât des bovins",
    "summary": "À partir de 30 bovins, un veau d’un an ; à partir de 40, une vache de deux ans ; ensuite, un veau par trente et une vache par quarante.",
    "aliases": [
      "vaches",
      "bovins",
      "boeufs",
      "la zakât des bovins",
      "la zakat des bovins"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-zakat"
    ],
    "differences": []
  },
  {
    "id": "hajj-pillars",
    "categoryId": "hajj-umra",
    "title": "Piliers et obligations du Hajj",
    "summary": "Les piliers du Hajj sont l’ihrâm, la station à ‘Arafa, le tawâf al-ifâda et le sa‘y. Sans eux, le Hajj n’est pas valable. Les obligations (mîqât, Muzdalifa, nuits à Minâ, lapidation, rasage, tawâf d’adieu) se compensent par un sacrifice si on les manque.",
    "aliases": [
      "arkan hajj",
      "piliers hajj",
      "wajibat hajj",
      "obligations hajj",
      "dam",
      "piliers et obligations du hajj"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-prohibitions",
    "categoryId": "hajj-umra",
    "title": "Les interdits de l’ihrâm",
    "summary": "En ihrâm, on ne se rase pas, on ne coupe ni ongles ni cheveux, on ne se parfume pas, on ne chasse pas, on ne se marie pas et on n’a pas de rapport. L’homme ne porte pas de vêtement cousu ni ne se couvre la tête ; la femme ne porte ni niqâb ni gants.",
    "aliases": [
      "interdits ihram",
      "parfum ihram",
      "fidya",
      "chasse ihram",
      "mariage ihram",
      "les interdits de l’ihrâm",
      "les interdits de l’ihram"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "hajj-umrah",
    "categoryId": "hajj-umra",
    "title": "La ‘Umra",
    "summary": "La ‘Umra comprend l’ihrâm, le tawâf, le sa‘y, puis le rasage ou le raccourcissement. Elle se fait à tout moment de l’année.",
    "aliases": [
      "umra",
      "omra",
      "oumra",
      "la ‘umra"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sourceIds": [
      "wajiz-hajj"
    ],
    "differences": []
  },
  {
    "id": "family-mahram",
    "categoryId": "family",
    "title": "Les femmes qu’on ne peut pas épouser",
    "summary": "Il est interdit d’épouser sa mère, sa fille, sa sœur, sa tante, sa nièce, sa belle-mère, la fille de son épouse, la belle-fille, deux sœurs en même temps, et celles qui le sont devenues par l’allaitement.",
    "aliases": [
      "mahram",
      "interdits mariage",
      "inceste",
      "les femmes qu’on ne peut pas épouser",
      "les femmes qu’on ne peut pas epouser"
    ],
    "badge": "REPÈRES ESSENTIELS",
    "sensitive": true,
    "sourceIds": [
      "wajiz-nikah"
    ],
    "differences": []
  }
];
