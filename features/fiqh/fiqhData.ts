import type { FiqhCategory, FiqhChapter, FiqhDifference, FiqhQuestion, FiqhTopic } from "./fiqhTypes";

export const PURIFICATION_CHAPTERS: FiqhChapter[] = [
  { id: "purification-water", categoryId: "purification", title: "Les eaux", topicIds: ["water-impurities"] },
  { id: "purification-ablutions", categoryId: "purification", title: "Les ablutions", topicIds: ["wudu", "wudu-obligations", "wudu-sunnas", "wudu-invalidators"] },
  { id: "purification-khuff", categoryId: "purification", title: "Les khuff", topicIds: ["khuff"] },
  { id: "purification-ghusl", categoryId: "purification", title: "Le ghusl", topicIds: ["ghusl", "ghusl-required"] },
  { id: "purification-tayammum", categoryId: "purification", title: "Le tayammum", topicIds: ["tayammum"] },
  { id: "purification-menstruation", categoryId: "purification", title: "Menstrues et lochies", topicIds: ["menstruation", "postpartum"] },
  { id: "purification-doubt", categoryId: "purification", title: "Le doute", topicIds: ["purification-doubt"] },
  { id: "purification-soiled-clothing", categoryId: "purification", title: "Vêtements et lieux", topicIds: ["soiled-clothing"] },
];

export const FIQH_CATEGORIES: FiqhCategory[] = [
  { id: "purification", title: "Purification", arabicTitle: "الطهارة", summary: "Éléments primaires établis sur la purification.", topicIds: ["water-impurities", "wudu", "wudu-obligations", "wudu-sunnas", "wudu-invalidators", "ghusl", "ghusl-required", "tayammum", "khuff", "menstruation", "postpartum", "purification-doubt", "soiled-clothing"] },
  { id: "prayer", title: "Prière", arabicTitle: "الصلاة", summary: "Repères primaires sur la prière et ses principales situations.", topicIds: ["prayer-status", "prayer-times", "prayer-qibla", "prayer-purification", "prayer-structure", "prayer-takbir", "prayer-ruku", "prayer-rising", "prayer-sujud", "prayer-between-sujuds", "prayer-tumanina", "prayer-fatiha", "prayer-tashahhud", "prayer-taslim", "prayer-sick", "prayer-travel", "prayer-combining", "prayer-latecomer", "prayer-sahw", "prayer-friday", "prayer-eid", "prayer-funeral", "prayer-imam-following"] },
  { id: "fasting", title: "Jeûne", arabicTitle: "الصيام", summary: "Repères primaires et limites documentaires sur le jeûne.", topicIds: ["fasting-obligation", "fasting-taqwa", "fasting-month-start", "fasting-crescent", "fasting-thirty-days", "fasting-dawn", "fasting-iftar-time", "fasting-suhur", "fasting-iftar", "fasting-forgetfulness", "fasting-intercourse", "fasting-kaffara", "fasting-illness", "fasting-travel", "fasting-makeup", "fasting-menstruation", "fasting-shawwal", "fasting-ashura", "fasting-arafah", "fasting-tashriq", "fasting-eid-fitr", "fasting-eid-adha", "fasting-qadr"] },
  { id: "zakat", title: "Zakât", arabicTitle: "الزكاة", summary: "Fondements textuels et limites documentaires de la Zakât.", topicIds: ["zakat-obligation", "zakat-beneficiaries", "zakat-purification", "zakat-nisab", "zakat-money-gold", "zakat-hawl", "zakat-camels", "zakat-sheep", "zakat-crops", "zakat-rikaz", "zakat-fitr", "zakat-fitr-amount", "zakat-fitr-food", "zakat-fitr-persons", "zakat-fitr-timing"] },
  { id: "hajj-umra", title: "Hajj & ‘Umra", arabicTitle: "الحج والعمرة", summary: "Repères juridiques essentiels, preuves et limites documentaires.", topicIds: ["hajj-obligation", "hajj-once", "hajj-ihram-miqat-talbiya", "hajj-tawaf-sai", "hajj-arafah-muzdalifah-mina", "hajj-jamarat-sacrifice-hair", "hajj-ifada-farewell", "hajj-types", "hajj-menstruation", "hajj-child-incapacity"] },
];
export const PRAYER_CHAPTERS: FiqhChapter[] = [
  { id: "prayer-foundations", categoryId: "prayer", title: "Fondements et préparation", topicIds: ["prayer-status", "prayer-purification"] },
  { id: "prayer-times-qibla", categoryId: "prayer", title: "Horaires et orientation", topicIds: ["prayer-times", "prayer-qibla"] },
  { id: "prayer-entry-recitation", categoryId: "prayer", title: "Entrer dans la prière et réciter", topicIds: ["prayer-structure", "prayer-takbir", "prayer-fatiha"] },
  { id: "prayer-bowing-prostration", categoryId: "prayer", title: "Inclinaison et prosternation", topicIds: ["prayer-ruku", "prayer-rising", "prayer-sujud", "prayer-between-sujuds", "prayer-tumanina"] },
  { id: "prayer-seated-ending", categoryId: "prayer", title: "Assises et fin de la prière", topicIds: ["prayer-tashahhud", "prayer-taslim"] },
  { id: "prayer-special-situations", categoryId: "prayer", title: "Situations particulières", topicIds: ["prayer-sick", "prayer-travel", "prayer-combining"] },
  { id: "prayer-corrections", categoryId: "prayer", title: "Rejoindre, oublier et corriger", topicIds: ["prayer-latecomer", "prayer-sahw"] },
  { id: "prayer-collective-friday", categoryId: "prayer", title: "Prière collective et vendredi", topicIds: ["prayer-imam-following", "prayer-friday"] },
  { id: "prayer-funeral", categoryId: "prayer", title: "Prière funéraire", topicIds: ["prayer-funeral"] },
];
const FIQH_CATEGORIES_WITH_CHAPTERS = FIQH_CATEGORIES.map((category) => category.id === "purification" ? { ...category, chapters: PURIFICATION_CHAPTERS } : category.id === "prayer" ? { ...category, chapters: PRAYER_CHAPTERS } : category);

const e = (text: string, ...evidenceIds: string[]) => ({ text, evidenceIds });
const topic = (id: string, title: string, summary: string, aliases: string[], established: string[], proofs: string[], evidence: { text: string; evidenceIds: string[] }[], sourceIds: string[], sensitive = false): FiqhTopic => ({ id, categoryId: "purification", title, summary, aliases, badge: sensitive ? "CAS PERSONNEL" : "LARGEMENT ÉTABLI", publicationStatus: "published", established, proofs, evidence, howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: [], sourceIds, ...(sensitive ? { sensitive: true } : {}) });

const PURIFICATION_TOPICS: FiqhTopic[] = [
  topic("water-impurities", "Eau et impuretés", "Les textes donnent plusieurs repères sur l’eau utilisée dans le contexte de la purification.", ["eau", "impureté", "najasa", "eau de mer", "puits de Budâ’a", "deux qullas"], ["L’eau est abordée ici à travers des textes qui évoquent la purification, l’eau descendue du ciel, l’eau de mer, un puits et le repère des deux qullas."], ["Coran 25:48 ; Coran 8:11 ; Sunan Abû Dâwûd, 83, 66 et 63."], [e("L’eau descendue du ciel est mentionnée dans un contexte de purification.", "quran-25-48", "quran-8-11"), e("Un récit répond à une question sur l’utilisation de l’eau de mer pour les ablutions.", "abudawud-83"), e("Le récit du puits de Budâ’a rapporte un cas concret soumis au Prophète ﷺ.", "abudawud-66"), e("Le hadith mentionne le repère des deux qullas dans les discussions sur la quantité d’eau.", "abudawud-63")], ["quran-25-48", "quran-8-11", "abudawud-83", "abudawud-66", "abudawud-63"]),
  topic("wudu", "Ablutions", "La description coranique et prophétique des ablutions.", ["ablutions", "wudu", "wudû"], ["Le Coran mentionne le lavage du visage et des bras, l’essuyage de la tête et le lavage des pieds."], ["Coran 5:6.", "Sahîh al-Bukhârî, 159."], [e("Membres mentionnés dans le verset.", "quran-5-6"), e("Description prophétique des ablutions.", "bukhari-159")], ["quran-5-6", "bukhari-159"]),
  topic("wudu-obligations", "Obligations des ablutions", "Le socle textuel des membres mentionnés dans le wudû.", ["obligations wudu", "faraid ablutions"], ["Les membres mentionnés dans Coran 5:6 constituent le socle textuel de la purification."], ["Coran 5:6."], [e("Membres concernés par le verset.", "quran-5-6")], ["quran-5-6"]),
  topic("wudu-sunnas", "Sunnas des ablutions", "La pratique rapportée, sans transformer chaque geste en obligation.", ["sunnas ablutions"], ["Bukhârî 159 et Muslim 226 décrivent la pratique des ablutions ; la fiche ne déduit pas de ces descriptions une qualification juridique unique pour chaque détail."], ["Sahîh al-Bukhârî, 159 ; Sahîh Muslim, 226."], [e("Descriptions prophétiques des ablutions.", "bukhari-159", "muslim-226")], ["bukhari-159", "muslim-226"]),
  topic("wudu-invalidators", "Ce qui annule les ablutions", "Le simple doute n’annule pas une certitude établie.", ["invalidants ablutions", "annulation wudu"], ["La fiche ne publie pas de liste complète d’invalidants sans références primaires précises pour chaque cause."], ["Sahîh Muslim, 361."], [e("Certitude face au doute.", "muslim-361")], ["muslim-361"]),
  topic("ghusl", "Ghusl", "Description du ghusl après janâba.", ["ghusl", "grande ablution"], ["La janâba est associée à la purification majeure dans les versets cités ; Bukhârî 248 décrit une manière prophétique d’accomplir le ghusl."], ["Coran 5:6 ; Coran 4:43 ; Sahîh al-Bukhârî, 248."], [e("Cadre coranique de la purification majeure.", "quran-5-6", "quran-4-43"), e("Description du ghusl après janâba.", "bukhari-248")], ["quran-5-6", "quran-4-43", "bukhari-248"]),
  { ...topic("ghusl-required", "Ce qui rend le ghusl obligatoire", "Une mini-leçon sur les situations que les textes retenus relient à la purification majeure.", ["janaba", "ghusl obligatoire", "rapport sexuel", "fin des menstrues"], ["Les versets 5:6 et 4:43 mentionnent la janâba et la purification correspondante. Une narration de Sahîh Muslim relie également le rapport sexuel à l’obligation du ghusl dans la formulation finale rapportée."], ["Coran 5:6 ; Coran 4:43 ; Sahîh Muslim, 349 ; Sahîh al-Bukhârî, 320."], [e("Les versets mentionnent la janâba et la purification majeure dans le cadre qu’ils exposent.", "quran-5-6", "quran-4-43"), e("Le récit rapporté relie le rapport sexuel à l’obligation du ghusl dans la formulation retenue.", "muslim-349"), e("Le récit de Bukhârî relie la fin des menstrues au ghusl et à la reprise de la prière.", "bukhari-320")], ["quran-5-6", "quran-4-43", "muslim-349", "bukhari-320"], true), content: {
    introduction: "Le ghusl est une purification majeure. Cette fiche présente uniquement les situations suffisamment documentées par les sources retenues, sans prétendre dresser une liste exhaustive.",
    definition: [e("Les versets 5:6 et 4:43 mentionnent la janâba et la purification correspondante dans le cadre exposé.", "quran-5-6", "quran-4-43")],
    ceQuiEstEtabli: [
      e("Les versets mentionnent l’état de janâba et ordonnent une purification complète dans le contexte qu’ils exposent.", "quran-5-6", "quran-4-43"),
      e("La formulation finale rapportée dans Sahîh Muslim relie le rapport sexuel à l’obligation du ghusl.", "muslim-349"),
      e("Le récit de Bukhârî 320 relie la fin des menstrues au ghusl et à la reprise de la prière.", "bukhari-320"),
    ],
    enseignements: [e("Les causes présentées ici sont limitées à la janâba dans le cadre coranique, au rapport sexuel dans le récit retenu et à la fin des menstrues dans le récit de Bukhârî.", "quran-5-6", "quran-4-43", "muslim-349", "bukhari-320")],
    limites: ["Cette mini-leçon ne constitue pas une liste exhaustive de toutes les causes du ghusl.", "Les situations liées à l’émission et au rêve nécessitent des preuves plus précises selon les cas ; elles seront détaillées séparément.", "Le nifâs, la conversion et les cas personnels ne sont pas tranchés ici.", "Le lavage du défunt relève d’un autre chapitre de fiqh et ne doit pas être confondu avec le ghusl personnel."],
    questions: [
      { id: "ghusl-required-janaba", question: "Le Coran mentionne-t-il la janâba ?", answer: [e("Oui. Les versets 5:6 et 4:43 mentionnent la janâba et la purification correspondante dans le cadre qu’ils exposent.", "quran-5-6", "quran-4-43")] },
      { id: "ghusl-required-intercourse", question: "Le rapport sexuel est-il lié au ghusl dans les récits authentiques ?", answer: [e("Oui. La formulation finale rapportée dans Sahîh Muslim relie le rapport sexuel à l’obligation du ghusl.", "muslim-349")] },
      { id: "ghusl-required-menstruation", question: "Que rapporte Bukhârî 320 après la fin des menstrues ?", answer: [e("Le récit rapporte le ghusl après la fin des menstrues, puis la reprise de la prière.", "bukhari-320")] },
    ],
  } },
  topic("tayammum", "Tayammum", "Purification de remplacement mentionnée par le Coran et décrite dans plusieurs récits.", ["tayammum", "ablution sèche", "absence eau", "terre propre"], ["Le Coran établit le tayammum dans certaines situations liées à l’absence d’eau ou à l’impossibilité de l’utiliser."], ["Coran 4:43 ; Coran 5:6."], [e("Principe et contexte général énoncés par le Coran.", "quran-4-43", "quran-5-6")], ["quran-4-43", "quran-5-6"], true),
  topic("khuff", "Essuyage sur les khuff", "Permission et durée rapportées par la Sunnah ; aucune extension aux chaussettes modernes n’est publiée.", ["khuff", "chaussettes ablutions"], ["L’essuyage sur les khuff est rapporté dans des hadiths authentiques."], ["Sahîh al-Bukhârî, 206 ; Sahîh Muslim, 276a : un jour et une nuit pour le résident, trois jours et trois nuits pour le voyageur."], [e("Permission d’essuyage sur les khuff.", "bukhari-206"), e("Durée rapportée pour résident et voyageur.", "muslim-276a")], ["bukhari-206", "muslim-276a"]),
  topic("menstruation", "Menstrues", "Repères directement établis, sans durée ni verdict individuel.", ["règles", "menstruations", "hayd"], ["Le Coran traite directement des menstrues et Muslim 293a rapporte une conduite prophétique avec une femme menstruée."], ["Coran 2:222 ; Sahîh Muslim, 293a."], [e("Le verset traite des menstrues.", "quran-2-222"), e("Conduite rapportée pendant les menstrues.", "muslim-293")], ["quran-2-222", "muslim-293"], true),
  topic("postpartum", "Lochies", "Fiche non publiée en l’absence d’une preuve Sahîh conforme au standard documentaire actuel.", ["lochies", "nifas", "post-partum"], [], [], [], [], true),
  topic("purification-doubt", "Doutes liés à la purification", "Le principe de certitude face au doute.", ["doute ablutions", "waswas"], ["Une certitude n’est pas levée par un simple doute."], ["Sahîh Muslim, 361."], [e("Principe de certitude face au doute.", "muslim-361")], ["muslim-361"]),
  topic("soiled-clothing", "Vêtements et lieux souillés", "Quelques cas précis de souillure et de nettoyage rapportés dans les textes.", ["vêtement impur", "lieu souillé", "sang menstruel", "urine mosquée", "chaussure souillée", "récipient chien"], ["Les textes retenus documentent des situations précises : sang menstruel sur un vêtement, urine sur le sol d’une mosquée, souillure touchant une sandale et récipient léché par un chien."], ["Coran 74:4 ; Coran 5:6 ; Sahîh al-Bukhârî, 227 et 220 ; Sahîh Muslim, 291a, 284a, 279a, 279c et 279d ; Sunan Abû Dâwûd, 385 et 386."], [e("Le Coran offre un appui général concernant la purification des vêtements et un cadre général de purification rituelle.", "quran-74-4", "quran-5-6"), e("Le récit rapporte le grattage, le lavage à l’eau et le rinçage du sang menstruel sur un vêtement.", "bukhari-227", "muslim-291a"), e("Les récits rapportent le versement d’eau sur l’endroit où un homme avait uriné dans la mosquée.", "bukhari-220", "muslim-284a"), e("Un récit rapporte la purification d’une sandale touchée par une souillure au moyen de la terre.", "abudawud-385", "abudawud-386"), e("Les récits rapportent sept lavages du récipient léché par un chien ; une variante mentionne la terre au premier lavage.", "muslim-279a", "muslim-279c", "muslim-279d")], ["quran-74-4", "quran-5-6", "bukhari-227", "muslim-291a", "bukhari-220", "muslim-284a", "abudawud-385", "abudawud-386", "muslim-279a", "muslim-279c", "muslim-279d"]),
];

const PRAYER_TOPICS: FiqhTopic[] = [
  topic("prayer-status", "Statut et temps prescrits", "Les prières sont prescrites à des temps déterminés.", ["salat", "salât", "salah", "prière"], ["Le Coran indique que la prière est prescrite aux croyants à des temps déterminés."], ["Coran 4:103."], [e("Temps déterminés de la prière.", "quran-4-103")], ["quran-4-103"]),
  topic("prayer-times", "Horaires", "Les temps sont décrits par le Coran et la Sunnah.", ["fajr", "dhuhr", "dohr", "asr", "maghrib", "isha", "horaires prière"], ["Le récit de Jibrîl décrit les limites des temps de plusieurs prières."], ["Sahîh Muslim, 613b."], [e("Description des plages horaires.", "muslim-613b")], ["quran-4-103", "muslim-613b"]),
  topic("prayer-qibla", "Qibla", "L’orientation vers la Mosquée sacrée.", ["qibla", "orientation prière"], ["Le Coran ordonne de tourner son visage vers la Mosquée sacrée dans le contexte indiqué."], ["Coran 2:144."], [e("Orientation vers la Mosquée sacrée.", "quran-2-144")], ["quran-2-144"]),
  topic("prayer-purification", "Purification préalable", "La purification avant la prière est traitée dans Purification.", ["wudu prière", "ablutions prière"], ["Les versets de purification encadrent la préparation à la prière."], ["Coran 4:43 ; Coran 5:6."], [e("Purification avant la prière.", "quran-4-43", "quran-5-6")], ["quran-4-43", "quran-5-6"]),
  topic("prayer-structure", "Structure générale", "La séquence générale rapportée de la prière.", ["salat", "salah", "structure prière"], ["La description rapportée enchaîne takbîr, récitation, rukû‘, redressement, sujûd et assise avec calme."], ["Sahîh al-Bukhârî, 757."], [e("Séquence et positions principales.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-takbir", "Takbîr initial", "Le début de la prière dans le récit enseigné.", ["takbir", "takbîrat ihram"], ["Le récit d’enseignement commence par le takbîr."], ["Sahîh al-Bukhârî, 757."], [e("Takbîr au début de la prière.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-ruku", "Rukû‘", "L’inclinaison dans la séquence rapportée.", ["ruku", "rukû"], ["Le fidèle s’incline et demeure en rukû‘ avec quiétude dans le récit."], ["Sahîh al-Bukhârî, 757."], [e("Rukû‘ et calme.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-rising", "Redressement après le rukû‘", "Revenir debout avant la prosternation.", ["redressement prière", "qawma"], ["Le récit distingue le redressement après le rukû‘ avant le sujûd."], ["Sahîh al-Bukhârî, 757."], [e("Redressement après le rukû‘.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-sujud", "Sujûd", "La prosternation dans la séquence rapportée.", ["sujud", "sujûd"], ["Le récit ordonne de se prosterner et de rester en sujûd avec calme."], ["Sahîh al-Bukhârî, 757."], [e("Sujûd et tumânîna.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-between-sujuds", "Assise entre les prosternations", "L’assise calme entre les deux sujûd.", ["assise prière", "entre deux prosternations"], ["Le récit mentionne une assise avec quiétude entre les prosternations."], ["Sahîh al-Bukhârî, 757."], [e("Assise entre les deux prosternations.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-tumanina", "Tumânîna", "Ne pas précipiter les positions de la prière.", ["tumanina", "quiétude prière"], ["Le récit répète l’exigence de demeurer en calme dans les positions principales."], ["Sahîh al-Bukhârî, 757."], [e("Quiétude dans les positions.", "bukhari-757")], ["bukhari-757"]),
  topic("prayer-fatiha", "Récitation d’al-Fâtiha", "Une récitation rapportée, sans trancher les cas juridiques divergents.", ["fatiha", "al-fatiha", "récitation imam"], ["Bukhârî 756 rapporte une formulation concernant la récitation ; la portée selon l’imam et le fidèle reste à documenter."], ["Sahîh al-Bukhârî, 756."], [e("Récitation d’al-Fâtiha dans le hadith cité.", "bukhari-756")], ["bukhari-756"]),
  topic("prayer-tashahhud", "Tashahhud", "Texte rapporté du tashahhud.", ["tashahhud", "tahiyyat"], ["Un texte du tashahhud est enseigné dans le récit de Bukhârî 831."], ["Sahîh al-Bukhârî, 831."], [e("Texte rapporté du tashahhud.", "bukhari-831")], ["bukhari-831"]),
  topic("prayer-taslim", "Taslîm", "Pratique rapportée à droite et à gauche.", ["taslim", "taslîm", "salam prière"], ["Muslim 582 rapporte un taslîm à droite et à gauche."], ["Sahîh Muslim, 582."], [e("Taslîm dans les deux directions.", "muslim-582")], ["muslim-582"]),
  topic("prayer-sick", "Prière du malade", "Adapter la position à la capacité réelle.", ["prière malade", "assis prière", "prière allongé"], ["Le malade prie debout s’il le peut, puis assis, puis sur le côté s’il ne peut pas s’asseoir."], ["Sahîh al-Bukhârî, 1117."], [e("Positions selon la capacité.", "bukhari-1117")], ["bukhari-1117"], true),
  topic("prayer-travel", "Voyage et raccourcissement", "Règle rapportée du nombre en voyage.", ["voyage prière", "raccourcir prière", "qasr"], ["Muslim 687a rapporte deux rak‘ât pour le voyageur et quatre pour le résident dans le texte cité."], ["Sahîh Muslim, 687a."], [e("Nombre rapporté en voyage et résidence.", "muslim-687a")], ["muslim-687a"], true),
  topic("prayer-combining", "Regroupement", "Un regroupement rapporté durant un voyage.", ["jam", "regroupement prières", "combiner prières"], ["Muslim 705c rapporte le regroupement de Dhuhr/‘Asr et Maghrib/‘Ishâ’ durant un voyage."], ["Sahîh Muslim, 705c."], [e("Regroupement rapporté en voyage.", "muslim-705c")], ["muslim-705c"], true),
  topic("prayer-latecomer", "Retardataire", "Rejoindre la prière avec calme et compléter ce qui est manqué.", ["retardataire prière", "prière commencée"], ["Bukhârî 908 rapporte de prier ce qui est rejoint puis de compléter ce qui a été manqué."], ["Sahîh al-Bukhârî, 908."], [e("Comportement du retardataire.", "bukhari-908")], ["bukhari-908"]),
  topic("prayer-sahw", "Sujûd as-sahw", "Cas rapportés d’oubli ou de doute.", ["sahw", "oubli prière", "doute rakaa"], ["Les récits rapportent deux prosternations dans plusieurs situations précises d’oubli ou de doute."], ["Bukhârî 1224 ; Muslim 570b, 571a et 572a."], [e("Cas rapportés de sujûd as-sahw.", "bukhari-1224", "muslim-570b", "muslim-571a", "muslim-572a")], ["bukhari-1224", "muslim-570b", "muslim-571a", "muslim-572a"]),
  topic("prayer-friday", "Vendredi", "Repères primaires limités sur Jumu‘a.", ["jumuah", "jumua", "vendredi", "khutba"], ["Le Coran appelle à se rendre à la prière du vendredi ; des hadiths rapportent deux rak‘ât dans les situations citées."], ["Coran 62:9 ; Sahîh Muslim 875g."], [e("Appel à la prière du vendredi.", "quran-62-9"), e("Deux rak‘ât pour celui qui entre pendant la khutba.", "muslim-875g")], ["quran-62-9", "muslim-875g"]),
  topic("prayer-eid", "Prière de l’Aïd", "Fiche limitée : aucun détail n’est publié tant qu’une preuve Sahîh conforme n’est pas enregistrée.", ["aid", "aïd", "salat eid"], [], [], [], []),
  topic("prayer-funeral", "Prière funéraire", "Résumé limité pour éviter le doublon avec Funérailles.", ["janaza", "janâza", "prière mort"], ["Bukhârî 1334 rapporte quatre takbîr dans la prière funéraire du Najâshî."], ["Sahîh al-Bukhârî, 1334."], [e("Quatre takbîr dans le cas rapporté.", "bukhari-1334")], ["bukhari-1334"]),
  topic("prayer-imam-following", "Imam et fidèle", "Contexte rapporté d’enseignement et de direction de la prière.", ["imam", "fidèle", "prière groupe", "jamaaa"], ["Le récit rapporte un enseignement de la prière et un contexte où l’un dirige les autres ; il ne détaille pas ici les règles générales du suivi de l’imam."], ["Sahîh al-Bukhârî, 631."], [e("Contexte d’enseignement et d’imamat du récit.", "bukhari-631")], ["bukhari-631"]),
];

const LIMITED_PRAYER_TOPIC_IDS = new Set([
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
]);

const PRAYER_PHASE_1_CONTENT: Record<string, FiqhTopic["content"]> = {
  "prayer-status": { introduction: "La prière est présentée dans le Coran comme une obligation rattachée à des temps déterminés.", ceQuiEstEtabli: [e("La prière est prescrite aux croyants à des temps déterminés.", "quran-4-103")], limites: ["Ce verset ne détaille pas seul toutes les règles des cinq prières."] },
  "prayer-times": { introduction: "Les textes retenus donnent un cadre rapporté pour les temps de la prière.", ceQuiEstEtabli: [e("Le récit de Jibrîl décrit les limites de plusieurs temps de prière.", "muslim-613b")], enseignements: [e("Le récit de Jibrîl rapporte l’existence des cinq prières dans son déroulement.", "muslim-610a")], limites: ["Les méthodes de calcul et situations particulières ne sont pas détaillées ici."] },
  "prayer-qibla": { introduction: "La qibla désigne la direction vers laquelle le fidèle se tourne pour prier.", definition: [e("Le verset ordonne de tourner le visage vers al-Masjid al-Harâm dans le contexte indiqué.", "quran-2-144")], ceQuiEstEtabli: [e("La Mosquée sacrée est la direction mentionnée par le verset.", "quran-2-144")], limites: ["Les situations particulières ne sont pas traitées dans cette V1."] },
  "prayer-structure": { introduction: "Le récit d’enseignement offre une description structurante de plusieurs étapes de la prière.", ceQuiEstEtabli: [e("Le récit enchaîne takbîr, récitation, rukû‘, redressement, sujûd et assise avec quiétude.", "bukhari-757")], enseignements: [e("La séquence rapportée invite à accomplir les positions sans précipitation.", "bukhari-757")], limites: ["Cette description ne tranche pas les qualifications juridiques détaillées."] },
  "prayer-ruku": { introduction: "Le rukû‘ est l’inclinaison rapportée dans la séquence de la prière.", ceQuiEstEtabli: [e("Le récit décrit l’inclinaison puis le maintien dans la position avant le redressement.", "bukhari-757")], pratique: [e("Dans la séquence rapportée, le rukû‘ est suivi d’un redressement avant la prosternation.", "bukhari-757")], limites: ["La qualification juridique détaillée n’est pas développée ici."] },
  "prayer-rising": { introduction: "Le redressement est l’étape qui suit le rukû‘ dans la séquence rapportée.", ceQuiEstEtabli: [e("Le récit distingue le retour après l’inclinaison avant le sujûd.", "bukhari-757")], pratique: [e("La séquence rapportée ne passe pas directement du rukû‘ à la prosternation.", "bukhari-757")], limites: ["Cette description ne tranche pas seule toutes les qualifications juridiques."] },
  "prayer-sujud": { introduction: "Le sujûd est la prosternation qui intervient après le redressement dans le récit d’enseignement.", ceQuiEstEtabli: [e("Le récit mentionne la prosternation et le maintien avec quiétude dans cette position.", "bukhari-757")], pratique: [e("Dans la séquence rapportée, le sujûd est précédé du redressement.", "bukhari-757")], limites: ["Les détails complets de la position ne sont pas traités dans cette V1."] },
  "prayer-tumanina": { introduction: "La tumânîna renvoie ici au calme observable dans les positions rapportées.", ceQuiEstEtabli: [e("Le récit refuse une prière précipitée et mentionne le maintien dans les positions principales.", "bukhari-757")], pratique: [e("La séquence rapportée comporte un temps de stabilité dans les positions décrites.", "bukhari-757")], limites: ["Les conséquences juridiques détaillées ne sont pas établies ici."] },
  "prayer-sick": { introduction: "Le texte retenu présente l’adaptation de la position selon la capacité de la personne malade.", ceQuiEstEtabli: [e("Le récit indique de prier debout, puis assis, puis sur le côté lorsque la capacité ne permet pas la position précédente.", "bukhari-1117")], pratique: [e("La gradation rapportée suit la capacité réelle : debout, assis, puis sur le côté.", "bukhari-1117")], limites: ["Les situations médicales complexes ne sont pas traitées ici."] },
  "prayer-purification": { introduction: "La purification est présentée dans les versets comme une préparation liée à la prière.", ceQuiEstEtabli: [e("Les versets associent la purification à la prière et mentionnent le wudû ou le tayammum selon la situation.", "quran-4-43", "quran-5-6")], limites: ["Cette fiche sert de passerelle et ne reproduit pas le livre Purification."] },
  "prayer-takbir": { introduction: "Le takbîr apparaît au début de la séquence de prière rapportée.", ceQuiEstEtabli: [e("Le récit d’enseignement commence la séquence par le takbîr.", "bukhari-757")], limites: ["Le statut juridique détaillé du takbîr n’est pas tranché ici."] },
  "prayer-fatiha": { introduction: "Le texte retenu rapporte une formulation concernant la récitation d’al-Fâtiha.", ceQuiEstEtabli: [e("Bukhârî 756 rapporte le texte concernant la récitation d’al-Fâtiha.", "bukhari-756")], limites: ["La question de la récitation derrière l’imam n’est pas tranchée dans cette fiche."] },
  "prayer-between-sujuds": { introduction: "L’assise entre les deux prosternations apparaît dans la séquence rapportée.", ceQuiEstEtabli: [e("Le récit mentionne une assise entre les prosternations.", "bukhari-757")], limites: ["Les qualifications juridiques détaillées ne sont pas traitées ici."] },
  "prayer-tashahhud": { introduction: "Un texte de tashahhud est rapporté dans la source retenue.", ceQuiEstEtabli: [e("Bukhârî 831 rapporte une formulation du tashahhud.", "bukhari-831")], limites: ["Cette formulation n’est pas présentée comme l’unique forme juridiquement valable."] },
  "prayer-taslim": { introduction: "Le taslîm est rapporté dans les deux directions dans le texte retenu.", ceQuiEstEtabli: [e("Muslim 582 rapporte un taslîm à droite et à gauche.", "muslim-582")], limites: ["La fiche ne tranche pas le nombre universellement obligatoire de taslîms."] },
  "prayer-imam-following": { introduction: "Le récit retenu présente un contexte d’enseignement et d’imamat.", ceQuiEstEtabli: [e("Bukhârî 631 rapporte un enseignement de la prière dans un contexte où l’un dirige les autres.", "bukhari-631")], limites: ["La récitation derrière l’imam et les règles complètes du suivi ne sont pas traitées."] },
  "prayer-travel": { introduction: "Le récit retenu rapporte une différence entre résidence et voyage.", ceQuiEstEtabli: [e("Muslim 687a rapporte quatre raka‘ât en résidence et deux en voyage dans le récit cité.", "muslim-687a")], limites: ["Aucune distance, durée ou condition exhaustive du qasr n’est publiée."] },
  "prayer-combining": { introduction: "Le regroupement est rapporté dans un contexte de voyage.", ceQuiEstEtabli: [e("Muslim 705c rapporte le regroupement de prières durant un voyage.", "muslim-705c")], limites: ["Les causes et conditions générales du regroupement ne sont pas établies ici."] },
  "prayer-latecomer": { introduction: "Le texte retenu décrit le comportement de celui qui rejoint une prière déjà commencée.", ceQuiEstEtabli: [e("Bukhârî 908 rapporte de prier ce qui est rejoint puis de compléter ce qui a été manqué.", "bukhari-908")], limites: ["Les règles détaillées du retardataire ne sont pas développées."] },
  "prayer-sahw": { introduction: "Plusieurs récits rapportent des situations précises d’oubli ou de doute dans la prière.", ceQuiEstEtabli: [e("Les textes retenus rapportent des cas d’oubli, de doute et d’ajout ou modification dans la prière.", "bukhari-1224", "muslim-570b", "muslim-571a", "muslim-572a")], limites: ["Ces récits ne forment pas une théorie exhaustive et la question avant/après le taslîm n’est pas généralisée."] },
  "prayer-friday": { introduction: "Les sources retenues donnent deux repères limités concernant le vendredi.", ceQuiEstEtabli: [e("Le Coran appelle à se rendre à la prière du vendredi.", "quran-62-9"), e("Muslim 875g rapporte le cas de celui qui entre pendant la khutba.", "muslim-875g")], limites: ["Les conditions complètes de Jumu‘a et de la khutba ne sont pas traitées."] },
  "prayer-funeral": { introduction: "Cette fiche conserve un seul élément du récit funéraire du Najâshî.", ceQuiEstEtabli: [e("Bukhârî 1334 rapporte quatre takbîr dans le cas de la prière funéraire du Najâshî.", "bukhari-1334")], limites: ["Le récit ne constitue pas une description complète de la prière funéraire."] },
};

const PRAYER_PHASE_2_QUESTIONS: Record<string, FiqhQuestion[]> = {
  "prayer-structure": [{ id: "prayer-structure-report", question: "Que décrit le récit concernant la structure générale de la prière ?", answer: [e("Il décrit une séquence comprenant takbîr, récitation, rukû‘, redressement, sujûd et assise.", "bukhari-757")] }],
  "prayer-fatiha": [{ id: "prayer-fatiha-report", question: "Que rapporte le hadith concernant al-Fâtiha ?", answer: [e("La source retenue rapporte un texte concernant la récitation d’al-Fâtiha.", "bukhari-756")] }],
  "prayer-between-sujuds": [{ id: "prayer-between-sujuds-report", question: "Comment l’assise apparaît-elle dans la séquence rapportée ?", answer: [e("Le récit mentionne une assise entre les deux prosternations.", "bukhari-757")] }],
  "prayer-taslim": [{ id: "prayer-taslim-report", question: "Comment le taslîm est-il rapporté ?", answer: [e("Il est rapporté à droite et à gauche dans la source retenue.", "muslim-582")] }],
  "prayer-travel": [{ id: "prayer-travel-report", question: "Que rapporte le texte sur le raccourcissement en voyage ?", answer: [e("Le récit rapporte deux raka‘ât en voyage et quatre en résidence.", "muslim-687a")] }],
  "prayer-combining": [{ id: "prayer-combining-report", question: "Que rapporte le récit sur le regroupement ?", answer: [e("Le récit rapporte un regroupement de prières durant un voyage.", "muslim-705c")] }],
  "prayer-latecomer": [{ id: "prayer-latecomer-report", question: "Que rapporte le hadith concernant celui qui rejoint une prière commencée ?", answer: [e("Il rapporte de prier ce qui est rejoint puis de compléter ce qui a été manqué.", "bukhari-908")] }],
  "prayer-sahw": [{ id: "prayer-sahw-reports", question: "Quelles situations de sujûd as-sahw apparaissent dans les récits utilisés ?", answer: [e("Les récits mentionnent des situations d’oubli, de doute et d’ajout ou modification.", "bukhari-1224", "muslim-570b", "muslim-571a", "muslim-572a")] }],
  "prayer-friday": [{ id: "prayer-friday-khutba", question: "Que rapporte Muslim 875g concernant celui qui entre pendant la khutba ?", answer: [e("Le récit rapporte deux raka‘ât dans le cas de celui qui entre pendant la khutba.", "muslim-875g")] }],
  "prayer-funeral": [{ id: "prayer-funeral-najashi", question: "Que rapporte Bukhârî 1334 concernant la prière funéraire du Najâshî ?", answer: [e("Le récit rapporte quatre takbîr dans ce cas précis.", "bukhari-1334")] }],
};

const PRAYER_SAHW_COMPARATIVE: FiqhDifference = {
  id: "prayer-sahw-schools",
  question: "Comment les écoles organisent-elles les récits du sujûd as-sahw ?",
  established: "Les récits authentiques rapportent des prosternations de l’oubli avant et après le taslîm selon les situations. Les juristes ont développé différentes méthodes pour les articuler.",
  positions: [
    { label: "Hanafite", position: "Le passage étudié documente une exécution après le taslîm dans l’approche hanafite retenue.", sourceIds: ["fiqh-badai-sahw"], verificationStatus: "verified_primary" as const },
    { label: "Malikite", position: "Dans la position mashhûr, la diminution appelle le sujûd avant le taslîm et l’ajout après le taslîm. Dans le cas combiné, le mashhûr donne priorité à la diminution ; des variantes internes sont rapportées.", sourceIds: ["fiqh-mawahib-sahw"], verificationStatus: "externally_verified_primary" as const },
    { label: "Shafi‘ite", position: "Le passage étudié identifie l’ajout et la diminution comme causes traitées dans le chapitre du sujûd as-sahw, sans établir ici une règle générale avant/après le taslîm.", sourceIds: ["fiqh-majmu-sahw"], verificationStatus: "verified_primary" as const },
    { label: "Hanbalite", position: "Le passage étudié expose plusieurs cas avant le taslîm et des exceptions rapportées après le taslîm ; le traitement dépend donc du cas et des récits retenus.", sourceIds: ["fiqh-mughni-sahw"], verificationStatus: "verified_primary" as const },
  ],
  practicalNote: "Cette comparaison ne tranche pas tous les cas pratiques et ne recommande aucune école.",
  limits: ["Le doute, le premier tashahhud et les exceptions détaillées restent hors de cette présentation."],
};

const PUBLISHED_PRAYER_TOPICS = PRAYER_TOPICS.map((topic) => ({
  ...topic,
  categoryId: "prayer",
  ...(topic.id === "prayer-eid" ? { publicationStatus: "coming_soon" as const } : {}),
  ...(LIMITED_PRAYER_TOPIC_IDS.has(topic.id) ? { badge: "V1 LIMITÉ" as const } : {}),
  ...(PRAYER_PHASE_1_CONTENT[topic.id] ? { content: { ...PRAYER_PHASE_1_CONTENT[topic.id], ...(PRAYER_PHASE_2_QUESTIONS[topic.id] ? { questions: PRAYER_PHASE_2_QUESTIONS[topic.id] } : {}) } } : {}),
}));

const fastingTopic = (id: string, title: string, summary: string, aliases: string[], established: string[], proofs: string[], evidence: { text: string; evidenceIds: string[] }[], sourceIds: string[], limited = false): FiqhTopic => ({ id, categoryId: "fasting", title, summary, aliases, badge: limited ? "V1 LIMITÉ" : "LARGEMENT ÉTABLI", established, proofs, evidence, howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: [], sourceIds });
const zakatTopic = (id: string, title: string, summary: string, aliases: string[], established: string[], proofs: string[], evidence: { text: string; evidenceIds: string[] }[], sourceIds: string[], limited = false): FiqhTopic => ({ id, categoryId: "zakat", title, summary, aliases, badge: limited ? "V1 LIMITÉ" : "LARGEMENT ÉTABLI", established, proofs, evidence, howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: [], sourceIds });
const hajjTopic = (id: string, title: string, summary: string, aliases: string[], established: string[], proofs: string[], evidence: { text: string; evidenceIds: string[] }[], sourceIds: string[], limited = true, sensitive = false, link?: { label: string; route: string }): FiqhTopic => ({ id, categoryId: "hajj-umra", title, summary, aliases, badge: limited ? "V1 LIMITÉ" : "LARGEMENT ÉTABLI", established, proofs, evidence, howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: [], sourceIds, ...(sensitive ? { sensitive: true } : {}), ...(link ? { link } : {}) });

const HAJJ_TOPICS: FiqhTopic[] = [
  hajjTopic("hajj-obligation", "Obligation et capacité", "Le Hajj est obligatoire pour celui qui en a la capacité.", ["hajj", "hadj", "pèlerinage", "pelerinage", "obligation hajj", "capacité hajj"], ["Le Coran lie l’obligation du pèlerinage à la capacité de la personne."], ["Coran 3:97."], [e("Obligation du Hajj pour celui qui en a la capacité.", "quran-3-97")], ["quran-3-97"], false, false, { label: "Voir le guide complet Hajj & ‘Umra", route: "/pilgrimage" }),
  hajjTopic("hajj-once", "Hajj une fois dans la vie", "Le Hajj est imposé, dans le récit retenu, sans être rendu obligatoire chaque année.", ["hajj une fois", "hajj obligatoire"], ["Le récit rapporte l’obligation du Hajj et indique qu’il n’est pas imposé chaque année."], ["Sahîh Muslim, 1337."], [e("Obligation du Hajj et absence d’obligation annuelle dans le récit.", "muslim-1337")], ["muslim-1337"]),
  hajjTopic("hajj-ihram-miqat-talbiya", "Ihrâm, mîqât et talbiya", "L’entrée en ihrâm, les mîqâts rapportés et une formule de talbiya.", ["ihram", "ihrâm", "miqat", "mîqât", "talbiya"], ["Les récits rapportent l’entrée en ihrâm, certains mîqâts géographiques et la formule de talbiya."], ["Sahîh Muslim, 1218 ; Sahîh al-Bukhârî, 1528 et 1549."], [e("Entrée en ihrâm dans le déroulement rapporté.", "muslim-1218"), e("Mîqâts géographiques explicitement rapportés.", "bukhari-1528"), e("Formule de talbiya rapportée.", "bukhari-1549")], ["muslim-1218", "bukhari-1528", "bukhari-1549"]),
  hajjTopic("hajj-tawaf-sai", "Tawâf, Maqâm Ibrâhîm et sa‘y", "Le récit rapporte le tawâf, le passage au Maqâm Ibrâhîm et le sa‘y entre Safâ et Marwa.", ["tawaf", "tawâf", "maqam ibrahim", "safa", "marwa", "sai", "sa‘y"], ["Le récit de Jâbir décrit le tawâf et le sa‘y ; le Coran mentionne Safâ et Marwa parmi les rites d’Allah."], ["Sahîh Muslim, 1218a ; Coran 2:158."], [e("Tawâf, Maqâm Ibrâhîm et sa‘y dans le récit.", "muslim-1218a"), e("Safâ et Marwa parmi les rites d’Allah.", "quran-2-158")], ["muslim-1218a", "quran-2-158"]),
  hajjTopic("hajj-arafah-muzdalifah-mina", "‘Arafah, Muzdalifah et Minâ", "Les récits identifient ces lieux dans le déroulement et les rites rapportés.", ["arafah", "arafat", "‘arafah", "muzdalifa", "muzdalifah", "mina", "minâ"], ["‘Arafah est présentée comme centrale ; Muzdalifah est un lieu de station et Minâ un lieu de sacrifice dans les textes retenus."], ["Sahîh Muslim, 1218c ; Sunan Abî Dâwûd, 1949."], [e("Importance centrale de ‘Arafah dans la formulation rapportée.", "abudawud-1949"), e("Présence de ces étapes dans le récit de Jâbir.", "muslim-1218c")], ["abudawud-1949", "muslim-1218c"]),
  hajjTopic("hajj-jamarat-sacrifice-hair", "Jamarât, hady et cheveux", "Le lancer, le sacrifice, le rasage et le raccourcissement sont rapportés avec une portée limitée.", ["jamarat", "jamarât", "hady", "sacrifice hajj", "rasage hajj", "raccourcissement hajj"], ["Un lancer de sept cailloux à la grande Jamarah est rapporté dans un cas précis ; le sacrifice, le rasage et le raccourcissement apparaissent dans les récits retenus."], ["Sahîh al-Bukhârî, 1748, 1727, 1728, 1730 et 1731 ; Sahîh Muslim, 1218."], [e("Sept cailloux à la grande Jamarah dans le cas rapporté.", "bukhari-1748"), e("Rasage et raccourcissement rapportés.", "bukhari-1727", "bukhari-1728", "bukhari-1730", "bukhari-1731"), e("Sacrifice dans le déroulement rapporté.", "muslim-1218")], ["bukhari-1748", "bukhari-1727", "bukhari-1728", "bukhari-1730", "bukhari-1731", "muslim-1218"]),
  hajjTopic("hajj-ifada-farewell", "Tawâf al-ifâda et tawâf final", "Existence du tawâf al-ifâda et cas rapporté du tawâf final.", ["tawaf ifada", "tawâf al-ifâda", "tawaf adieu", "tawâf d’adieu"], ["Le tawâf al-ifâda apparaît dans le déroulement rapporté ; le départ d’une femme menstruée après l’avoir accompli est rapporté dans un cas précis."], ["Sahîh Muslim, 1218, 1211ab et 1211ae."], [e("Tawâf al-ifâda dans le récit.", "muslim-1218"), e("Cas rapporté après le tawâf al-ifâda.", "muslim-1211ab", "muslim-1211ae")], ["muslim-1218", "muslim-1211ab", "muslim-1211ae"]),
  hajjTopic("hajj-types", "Les formes du Hajj", "Les récits mentionnent l’ifrâd, le tamattu‘ et le qirân.", ["tamattu", "tamattu‘", "qiran", "qirân", "ifrad", "ifrâd"], ["Les trois formes apparaissent dans les récits contrôlés, sans hiérarchie ni recommandation personnalisée."], ["Sahîh Muslim, 1213c, 1216a et 1226g."], [e("Existence des formes rapportées du Hajj.", "muslim-1213c", "muslim-1216a", "muslim-1226g")], ["muslim-1213c", "muslim-1216a", "muslim-1226g"]),
  hajjTopic("hajj-menstruation", "Menstruations pendant le Hajj", "Repères limités aux cas rapportés dans les textes.", ["menstruations hajj", "femme règles hajj", "hayd hajj"], ["Les récits rapportent des rites accomplis par une femme menstruée et le départ après un tawâf al-ifâda déjà effectué."], ["Sahîh al-Bukhârî, 1652 ; Sahîh Muslim, 1211ab et 1211ae."], [e("Rites et exception du tawâf dans le récit.", "bukhari-1652"), e("Départ après le tawâf al-ifâda déjà accompli.", "muslim-1211ab", "muslim-1211ae")], ["bukhari-1652", "muslim-1211ab", "muslim-1211ae"], true),
  hajjTopic("hajj-child-incapacity", "Hajj de l’enfant et incapacité", "Deux cas précis sont rapportés : Hajj de l’enfant et Hajj pour un père âgé incapable.", ["hajj enfant", "hajj enfant", "hajj personne âgée", "hajj incapable"], ["Le Hajj de l’enfant est reconnu dans le récit ; un Hajj pour un père âgé incapable est également rapporté, sans généralisation à toutes les situations."], ["Sahîh Muslim, 1336c et 1334."], [e("Hajj de l’enfant et récompense de l’accompagnant dans le récit.", "muslim-1336c"), e("Hajj accompli pour un père âgé incapable dans le cas rapporté.", "muslim-1334")], ["muslim-1336c", "muslim-1334"], true),
];

const FASTING_TOPICS: FiqhTopic[] = [
  fastingTopic("fasting-obligation", "Obligation du jeûne de Ramadan", "Le jeûne de Ramadan est prescrit aux croyants.", ["ramadan", "jeune ramadan", "sawm"], ["Le Coran prescrit le jeûne aux croyants."], ["Coran 2:183."], [e("Prescription du jeûne.", "quran-2-183")], ["quran-2-183"]),
  fastingTopic("fasting-taqwa", "Finalité spirituelle", "Le jeûne est associé à la taqwâ.", ["taqwa", "finalite jeune"], ["Le verset associe la prescription du jeûne à la taqwâ."], ["Coran 2:183."], [e("Finalité de taqwâ mentionnée dans le verset.", "quran-2-183")], ["quran-2-183"]),
  fastingTopic("fasting-month-start", "Début du mois", "Le début de Ramadan est lié à l’observation du croissant.", ["debut ramadan", "hilal", "croissant"], ["Bukhârî 1900 rapporte de commencer et terminer selon la vision du croissant ; Bukhârî 1906 rapporte de ne pas commencer avant la vision et le traitement du ciel couvert."], ["Sahîh al-Bukhârî, 1900 ; 1906."], [e("Commencer et terminer selon la vision du croissant.", "bukhari-1900"), e("Ne pas commencer avant la vision et cas où l’observation est empêchée.", "bukhari-1906")], ["bukhari-1900", "bukhari-1906"]),
  fastingTopic("fasting-crescent", "Observation du croissant", "La vision du croissant intervient dans le commencement et la fin du mois.", ["observation croissant", "vision hilal"], ["Les formulations rapportées lient le jeûne à la vision du croissant et prévoient un compte en cas de ciel couvert."], ["Sahîh al-Bukhârî, 1900 ; 1906 ; 1907."], [e("Vision du croissant.", "bukhari-1900"), e("Compte en cas de ciel couvert.", "bukhari-1906", "bukhari-1907")], ["bukhari-1900", "bukhari-1906", "bukhari-1907"]),
  fastingTopic("fasting-thirty-days", "Compléter trente jours", "Le mois est complété à trente jours lorsque l’observation est impossible selon les récits retenus.", ["trente jours", "mois 30 jours"], ["Les récits mentionnent le complément à trente jours lorsque le ciel est couvert."], ["Sahîh al-Bukhârî, 1906 ; 1907."], [e("Complément du compte à trente jours.", "bukhari-1906", "bukhari-1907")], ["bukhari-1906", "bukhari-1907"]),
  fastingTopic("fasting-dawn", "Début quotidien du jeûne", "Le jeûne quotidien commence à l’aube mentionnée par le verset.", ["aube", "fajr", "debut quotidien"], ["Le verset distingue l’aube du temps nocturne et fixe la limite de la consommation."], ["Coran 2:187."], [e("Limite de l’aube dans le verset.", "quran-2-187")], ["quran-2-187"]),
  fastingTopic("fasting-iftar-time", "Fin quotidienne du jeûne", "La rupture intervient lorsque la nuit arrive.", ["fin jeune", "coucher soleil", "iftar temps"], ["Le récit de voyage indique que le jeûneur rompt lorsque la nuit arrive."], ["Sahîh al-Bukhârî, 1958."], [e("Entrée de la nuit dans le récit.", "bukhari-1958")], ["bukhari-1958"]),
  fastingTopic("fasting-suhur", "Suhur", "Le suhur comporte une bénédiction rapportée.", ["suhur", "sahur", "repas avant aube"], ["Le Prophète ﷺ a indiqué qu’il y a une bénédiction dans le suhur."], ["Sahîh al-Bukhârî, 1923."], [e("Bénédiction du suhur.", "bukhari-1923")], ["bukhari-1923"], true),
  fastingTopic("fasting-iftar", "Iftar", "La Sunnah rapportée encourage à ne pas retarder inutilement l’iftar.", ["iftar", "rupture jeune"], ["Les textes distinguent l’entrée du moment de rupture et l’encouragement à la hâter."], ["Sahîh al-Bukhârî, 1957 ; 1958."], [e("Recommandation de hâter la rupture.", "bukhari-1957"), e("Entrée du moment de rupture dans un voyage.", "bukhari-1958")], ["bukhari-1957", "bukhari-1958"], true),
  fastingTopic("fasting-forgetfulness", "Manger ou boire par oubli", "Le jeûne est poursuivi dans le cas explicite de l’oubli.", ["oubli jeune", "manger oubli", "boire oubli"], ["Celui qui mange ou boit par oubli poursuit son jeûne selon le hadith."], ["Sahîh Muslim, 1155."], [e("Manger ou boire par oubli.", "muslim-1155")], ["muslim-1155"]),
  fastingTopic("fasting-intercourse", "Rapport sexuel diurne", "Un cas explicite de rapport pendant le jeûne de Ramadan est rapporté.", ["rapport ramadan", "rapport sexuel jeune"], ["Le récit rapporte un rapport sexuel avec son épouse pendant le jeûne de Ramadan."], ["Sahîh al-Bukhârî, 1935 ; 1937 ; Sahîh Muslim, 1112a."], [e("Cas explicite rapporté.", "bukhari-1935", "bukhari-1937", "muslim-1112a")], ["bukhari-1935", "bukhari-1937", "muslim-1112a"], true),
  fastingTopic("fasting-kaffara", "Kaffâra dans le cas rapporté", "La kaffâra est présentée uniquement dans le cas explicite du rapport sexuel.", ["kaffara", "expiation ramadan"], ["Le récit expose une expiation pour le cas rapporté."], ["Sahîh al-Bukhârî, 1935 ; 1937."], [e("Kaffâra du cas rapporté.", "bukhari-1935", "bukhari-1937")], ["bukhari-1935", "bukhari-1937"], true),
  fastingTopic("fasting-illness", "Maladie", "Le malade est explicitement mentionné dans les versets ; les jours concernés peuvent être rattrapés ultérieurement selon le texte.", ["maladie jeune", "jeune malade"], ["Les versets mentionnent le malade et le rattrapage de jours ultérieurs."], ["Coran 2:184–185."], [e("Malade mentionné et jours à rattraper ultérieurement.", "quran-2-184", "quran-2-185")], ["quran-2-184", "quran-2-185"], true),
  fastingTopic("fasting-travel", "Voyage", "Le voyageur est mentionné par le Coran et un récit rapporte jeûne puis rupture durant un voyage.", ["voyage jeune", "jeune voyageur"], ["Le Coran mentionne le voyageur et le rattrapage ultérieur ; Muslim 1113e rapporte le comportement du Prophète ﷺ dans un voyage précis."], ["Coran 2:184–185 ; Sahîh Muslim, 1113e."], [e("Voyageur mentionné et rattrapage ultérieur.", "quran-2-184", "quran-2-185"), e("Jeûner puis rompre dans le récit de voyage.", "muslim-1113e")], ["quran-2-184", "quran-2-185", "muslim-1113e"], true),
  fastingTopic("fasting-makeup", "Rattrapage des jours", "Le rattrapage est séparé selon les situations directement documentées.", ["rattrapage jeune", "qada ramadan"], ["Le Coran mentionne le rattrapage pour maladie et voyage ; Muslim 335c rapporte séparément le rattrapage des jeûnes manqués pendant les menstrues."], ["Coran 2:184–185 ; Sahîh Muslim, 335c."], [e("Rattrapage pour maladie et voyage.", "quran-2-184", "quran-2-185"), e("Rattrapage pendant les menstrues.", "muslim-335c")], ["quran-2-184", "quran-2-185", "muslim-335c"], true),
  fastingTopic("fasting-menstruation", "Menstrues", "Le rattrapage des jours de jeûne manqués est rapporté.", ["menstrues jeune", "regles jeune", "hayd"], ["‘Â’isha rapporte que les jours de jeûne étaient rattrapés, contrairement aux prières."], ["Sahîh Muslim, 335c."], [e("Rattrapage des jeûnes manqués.", "muslim-335c")], ["muslim-335c"], true),
  fastingTopic("fasting-shawwal", "Six jours de Shawwâl", "Le jeûne de six jours de Shawwâl est associé à un mérite rapporté.", ["shawwal", "six jours shawwal"], ["Le hadith rapporte le mérite de jeûner six jours après Ramadan."], ["Sahîh Muslim, 1164c."], [e("Mérite des six jours de Shawwâl.", "muslim-1164c")], ["muslim-1164c"], true),
  fastingTopic("fasting-ashura", "‘Âshûrâ’", "Le jeûne de ‘Âshûrâ’ est rapporté comme facultatif avec un mérite associé.", ["ashura", "achoura"], ["Le récit indique que le jeûne de ‘Âshûrâ’ est devenu facultatif après la prescription de Ramadan."], ["Sahîh al-Bukhârî, 2002 ; Sahîh Muslim, 1162a."], [e("Caractère facultatif rapporté.", "bukhari-2002"), e("Mérite de ‘Âshûrâ’.", "muslim-1162a")], ["bukhari-2002", "muslim-1162a"], true),
  fastingTopic("fasting-arafah", "‘Arafah", "Le jeûne de ‘Arafah est associé à un mérite rapporté.", ["arafah", "arafa"], ["Un hadith rapporte le mérite du jeûne du jour de ‘Arafah."], ["Sahîh Muslim, 1162a."], [e("Mérite du jeûne de ‘Arafah.", "muslim-1162a")], ["muslim-1162a"], true),
  fastingTopic("fasting-tashriq", "Jours de Tashrîq", "Les jours de Tashrîq sont décrits comme des jours de nourriture et de boisson.", ["tashriq", "jours tashriq"], ["Le hadith décrit les jours de Tashrîq comme des jours de nourriture et de boisson."], ["Sahîh Muslim, 1141a."], [e("Description des jours de Tashrîq.", "muslim-1141a")], ["muslim-1141a"], true),
  fastingTopic("fasting-eid-fitr", "‘Îd al-Fitr", "Le jeûne du jour de ‘Îd al-Fitr est interdit dans le récit retenu.", ["aid fitr", "eid fitr"], ["La référence retenue concerne l’interdiction de jeûner le jour de ‘Îd al-Fitr."], ["Sahîh al-Bukhârî, 1990."], [e("Interdiction rapportée pour ‘Îd al-Fitr.", "bukhari-1990")], ["bukhari-1990"], true),
  fastingTopic("fasting-eid-adha", "‘Îd al-Adhâ", "Le jeûne du jour de ‘Îd al-Adhâ est interdit dans le récit retenu.", ["aid adha", "eid adha"], ["La référence retenue concerne l’interdiction de jeûner le jour de ‘Îd al-Adhâ."], ["Sahîh al-Bukhârî, 1990."], [e("Interdiction rapportée pour ‘Îd al-Adhâ.", "bukhari-1990")], ["bukhari-1990"], true),
  fastingTopic("fasting-qadr", "Laylat al-Qadr", "Laylat al-Qadr est recherchée dans les dernières nuits de Ramadan.", ["laylat qadr", "nuit du destin"], ["Les hadiths recommandent de rechercher Laylat al-Qadr dans les dix dernières nuits, notamment les nuits impaires."], ["Sahîh al-Bukhârî, 2017 ; 2020."], [e("Recherche de Laylat al-Qadr dans les dernières nuits.", "bukhari-2017", "bukhari-2020")], ["bukhari-2017", "bukhari-2020"], true),
];

const ZAKAT_TOPICS: FiqhTopic[] = [
  zakatTopic("zakat-obligation", "Obligation générale de la Zakât", "La Zakât est mentionnée avec la prière dans le Coran.", ["zakat", "zakât", "aumône obligatoire"], ["Le Coran mentionne la Zakât dans l’ordre adressé aux croyants."], ["Coran 2:43 ; Coran 9:103."], [e("Fondement général de la Zakât.", "quran-2-43", "quran-9-103")], ["quran-2-43", "quran-9-103"]),
  zakatTopic("zakat-beneficiaries", "Les huit bénéficiaires de la Zakât", "Le Coran énumère huit catégories de bénéficiaires.", ["beneficiaires zakat", "bénéficiaires", "destinataires zakat", "pauvres", "necessiteux", "collecteurs", "endettés", "voyageur"], ["Coran 9:60 énumère les catégories textuelles auxquelles les aumônes prescrites sont destinées."], ["Coran 9:60."], [e("Huit catégories coraniques de bénéficiaires.", "quran-9-60")], ["quran-9-60"]),
  zakatTopic("zakat-purification", "Purification des biens", "Le Coran associe la Zakât à une dimension de purification dans son contexte.", ["purification biens", "purifier richesse"], ["Le verset 9:103 associe le prélèvement à une purification et à une bénédiction."], ["Coran 9:103."], [e("Dimension de purification dans le contexte du verset.", "quran-9-103")], ["quran-9-103"], true),
  zakatTopic("zakat-nisab", "Nisâb : seuils mentionnés dans les textes", "Certains seuils sont rapportés sous des unités historiques.", ["nisab", "nisâb", "seuil zakat", "200 dirhams", "5 awq", "5 awsuq", "5 chameaux"], ["Les textes mentionnent 200 dirhams, cinq awq, cinq awsuq et cinq chameaux dans leurs contextes respectifs."], ["Sahîh Abî Dâwûd, 1573 ; Sahîh al-Bukhârî, 1405."], [e("Seuils historiques de l’argent, des récoltes et des chameaux.", "abudawud-1573", "bukhari-1405")], ["abudawud-1573", "bukhari-1405"], true),
  zakatTopic("zakat-money-gold", "Argent et or dans les textes", "Les textes rapportent des unités historiques et un taux dans certains cas.", ["argent zakat", "or zakat", "dirham", "dinar", "1/40"], ["Abû Dâwûd 1573 rapporte 200 dirhams, cinq dirhams, 20 dinars et un demi-dinar dans la narration contrôlée ; Bukhârî 1454 mentionne un quarantième de l’argent."], ["Sunan Abî Dâwûd, 1573 ; Sahîh al-Bukhârî, 1454."], [e("Unités historiques de l’argent et de l’or.", "abudawud-1573"), e("Un quarantième de l’argent dans la lettre rapportée.", "bukhari-1454")], ["abudawud-1573", "bukhari-1454"], true),
  zakatTopic("zakat-hawl", "Hawl : passage d’une année", "Une année est mentionnée pour l’argent et l’or dans la narration retenue.", ["hawl", "année zakat"], ["Abû Dâwûd 1573 mentionne le passage d’une année dans le contexte de l’argent et de l’or."], ["Sunan Abî Dâwûd, 1573."], [e("Passage d’une année dans la narration.", "abudawud-1573")], ["abudawud-1573"], true),
  zakatTopic("zakat-camels", "Chameaux", "Bukhârî 1454 rapporte des seuils et paliers pour les chameaux.", ["chameaux zakat", "zakat betail"], ["La lettre rapportée énumère des seuils et paliers pour les chameaux."], ["Sahîh al-Bukhârî, 1454."], [e("Seuils et paliers textuels des chameaux.", "bukhari-1454")], ["bukhari-1454"], true),
  zakatTopic("zakat-sheep", "Moutons", "Bukhârî 1454 rapporte des seuils et paliers pour les moutons.", ["moutons zakat", "zakat ovins"], ["La lettre rapporte un seuil de quarante moutons et des paliers dans le texte."], ["Sahîh al-Bukhârî, 1454."], [e("Seuils et paliers textuels des moutons.", "bukhari-1454")], ["bukhari-1454"], true),
  zakatTopic("zakat-crops", "Récoltes et irrigation", "Les textes distinguent les taux selon le mode d’irrigation.", ["recoltes zakat", "récoltes", "irrigation zakat", "agriculture zakat"], ["Les récoltes irriguées naturellement sont associées à un dixième ; celles nécessitant le moyen décrit à un vingtième."], ["Sahîh al-Bukhârî, 1483 ; Sahîh Muslim, 981."], [e("Un dixième et un vingtième selon l’irrigation.", "bukhari-1483", "muslim-981")], ["bukhari-1483", "muslim-981"], true),
  zakatTopic("zakat-rikaz", "Rikâz", "Le texte rapporte un cinquième sur le rikâz.", ["rikaz", "rikâz", "trésor enfoui"], ["Bukhârî 1499 mentionne un cinquième sur le rikâz."], ["Sahîh al-Bukhârî, 1499."], [e("Un cinquième sur le rikâz dans le texte.", "bukhari-1499")], ["bukhari-1499"], true),
  zakatTopic("zakat-fitr", "Zakât al-Fitr", "La Zakât al-Fitr est prescrite dans les narrations retenues.", ["zakat fitr", "zakât al-fitr", "fitra"], ["Les hadiths rapportent la prescription de la Zakât al-Fitr pour les personnes mentionnées."], ["Sahîh al-Bukhârî, 1503 ; 1504 ; Sahîh Muslim, 984e."], [e("Prescription de la Zakât al-Fitr.", "bukhari-1503", "bukhari-1504", "muslim-984e")], ["bukhari-1503", "bukhari-1504", "muslim-984e"], true),
  zakatTopic("zakat-fitr-amount", "Quantité textuelle d’un sâ‘", "Les textes mentionnent un sâ‘.", ["saa", "sâ‘", "quantite fitr", "quantité fitr"], ["Les narrations retenues mentionnent un sâ‘ de nourriture."], ["Sahîh al-Bukhârî, 1503 ; 1504 ; Sahîh Muslim, 984e."], [e("Un sâ‘ dans les narrations.", "bukhari-1503", "bukhari-1504", "muslim-984e")], ["bukhari-1503", "bukhari-1504", "muslim-984e"], true),
  zakatTopic("zakat-fitr-food", "Aliments mentionnés", "Les textes mentionnent notamment les dattes et l’orge.", ["dattes fitr", "orge fitr", "nourriture fitr"], ["Les narrations retenues citent les dattes et l’orge dans la Zakât al-Fitr."], ["Sahîh al-Bukhârî, 1504 ; Sahîh Muslim, 984e."], [e("Dattes et orge mentionnées.", "bukhari-1504", "muslim-984e")], ["bukhari-1504", "muslim-984e"], true),
  zakatTopic("zakat-fitr-persons", "Personnes concernées par Zakât al-Fitr", "Les narrations mentionnent les musulmans concernés dans leur formulation rapportée, sans constituer une règle moderne exhaustive.", ["qui paie fitr", "personnes zakat fitr"], ["Les narrations mentionnent les musulmans concernés dans la formulation rapportée : hommes et femmes, jeunes et âgés, libres et esclaves dans le contexte historique du hadith. Cette fiche rapporte uniquement les catégories de personnes mentionnées dans les narrations retenues. Les règles détaillées de prise en charge et de responsabilité relèvent du fiqh et ne sont pas traitées dans cette V1."], ["Sahîh al-Bukhârî, 1504 ; Sahîh Muslim, 984e."], [e("Hommes et femmes, jeunes et âgés, libres et esclaves dans la formulation rapportée, sans en déduire les règles modernes de responsabilité.", "bukhari-1504", "muslim-984e")], ["bukhari-1504", "muslim-984e"], true),
  zakatTopic("zakat-fitr-timing", "Moment avant la prière de l’Aïd", "Un paiement avant la sortie pour la prière de l’Aïd est rapporté.", ["moment zakat fitr", "avant priere aid", "paiement fitr"], ["Bukhârî 1503 rapporte le paiement avant la sortie des gens pour la prière de l’Aïd."], ["Sahîh al-Bukhârî, 1503."], [e("Moment rapporté avant la prière de l’Aïd.", "bukhari-1503")], ["bukhari-1503"], true),
];

const ZAKAT_EDUCATIONAL_DETAILS: Record<string, Pick<FiqhTopic, "howTo" | "conditions" | "commonMistakes" | "takeaway">> = {
  "zakat-obligation": { howTo: ["La Zakât est présentée ici comme une aumône prescrite mentionnée avec la prière."], conditions: ["Cette fiche n’ajoute pas de seuil, de taux ou de patrimoine non documenté par les sources associées."], commonMistakes: ["Confondre le fondement général de la Zakât avec les règles détaillées de calcul."], takeaway: ["La Zakât est une obligation mentionnée explicitement dans le Coran ; ses modalités détaillées doivent être documentées séparément."] },
  "zakat-beneficiaries": { howTo: ["Le verset 9:60 énumère les catégories dans son propre ordre : pauvres, nécessiteux, collecteurs, cœurs à rapprocher, affranchissement, endettés, chemin d’Allah et voyageur démuni."], conditions: ["La fiche rapporte l’énumération coranique sans fixer les critères détaillés d’appartenance à chaque catégorie."], commonMistakes: ["Transformer l’énumération en règles contemporaines exhaustives sans analyse juridique."], takeaway: ["Les huit catégories sont directement rattachées à Coran 9:60 ; les cas individuels ne sont pas tranchés ici."] },
  "zakat-purification": { howTo: ["Le verset 9:103 associe le prélèvement à une purification et à une bénédiction dans son contexte."], conditions: ["La portée est limitée au sens indiqué par le verset."], commonMistakes: ["Présenter la purification comme une méthode technique de calcul."], takeaway: ["La dimension de purification est explicitement mentionnée, sans remplacer les règles détaillées de la Zakât."] },
  "zakat-nisab": { howTo: ["Lire séparément les unités rapportées : dirhams, dinars, awq, awsuq et têtes de bétail."], conditions: ["Les seuils restent exprimés dans les unités historiques des textes."], commonMistakes: ["Convertir automatiquement ces unités en euros ou en grammes sans méthode documentaire validée."], takeaway: ["Les textes cités rapportent des seuils historiques précis ; leur conversion moderne n’est pas fournie dans cette fiche."] },
  "zakat-money-gold": { howTo: ["Distinguer les unités historiques et le taux rapporté dans les textes associés."], conditions: ["La fiche ne déduit pas une méthode complète pour tous les patrimoines modernes."], commonMistakes: ["Appliquer directement les unités historiques à une monnaie contemporaine."], takeaway: ["Les montants et le quarantième sont présentés dans la portée exacte des narrations liées."] },
  "zakat-hawl": { howTo: ["Identifier le passage d’une année dans le contexte précis de la narration."], conditions: ["Aucune règle supplémentaire sur les dettes, les variations de patrimoine ou les biens modernes n’est ajoutée."], commonMistakes: ["Présenter cette mention comme une méthode complète pour tous les types de biens."], takeaway: ["Le passage d’une année est rapporté dans un contexte déterminé ; les extensions juridiques restent hors de cette fiche."] },
  "zakat-camels": { howTo: ["Consulter les seuils et paliers de chameaux tels qu’ils sont énumérés dans le texte."], conditions: ["La fiche reste limitée aux chameaux mentionnés."], commonMistakes: ["Transposer ces paliers aux autres animaux ou aux élevages modernes."], takeaway: ["Les seuils affichés sont ceux du texte rapporté, sans extrapolation."] },
  "zakat-sheep": { howTo: ["Consulter le seuil et les paliers de moutons rapportés dans la lettre citée."], conditions: ["La fiche ne traite pas des autres espèces ni des conditions non présentes dans la source."], commonMistakes: ["Généraliser le seuil à tout le bétail."], takeaway: ["Seuls les moutons et les paliers documentés sont présentés."] },
  "zakat-crops": { howTo: ["Distinguer l’irrigation naturelle du mode d’irrigation nécessitant le moyen décrit."], conditions: ["Les taux sont rapportés dans les contextes précis des textes."], commonMistakes: ["Appliquer automatiquement ces taux à toute agriculture moderne."], takeaway: ["Les textes distinguent un dixième et un vingtième selon le mode d’irrigation rapporté."] },
  "zakat-rikaz": { howTo: ["Retenir la mention d’un cinquième sur le rikâz dans la source citée."], conditions: ["La définition juridique de biens modernes n’est pas ajoutée."], commonMistakes: ["Assimiler automatiquement tout objet trouvé ou toute ressource minérale au rikâz."], takeaway: ["Le cinquième est rapporté pour le rikâz dans le texte, sans classification moderne."] },
  "zakat-fitr": { howTo: ["Lire ensemble la prescription, la quantité et le moment rapportés dans les narrations."], conditions: ["Les règles détaillées de substitution, de responsabilité et de paiement ne sont pas développées."], commonMistakes: ["Confondre Zakât al-Fitr et Zakât al-Mâl."], takeaway: ["Les narrations retenues établissent une prescription distincte liée à la fin du Ramadan."] },
  "zakat-fitr-amount": { howTo: ["Retenir l’unité textuelle : un sâ‘ de nourriture."], conditions: ["Aucune conversion moderne n’est proposée."], commonMistakes: ["Présenter une conversion en kilogrammes comme si elle était directement donnée par le hadith."], takeaway: ["La quantité publiée reste l’unité textuelle du sâ‘."] },
  "zakat-fitr-food": { howTo: ["Les aliments cités dans les narrations sont présentés tels quels : notamment dattes et orge."], conditions: ["La fiche ne tranche pas la substitution par d’autres aliments ou par de l’argent."], commonMistakes: ["Étendre la liste à des aliments non mentionnés comme s’ils étaient établis par ces textes."], takeaway: ["Dattes et orge sont les aliments explicitement cités dans les preuves retenues."] },
  "zakat-fitr-persons": { howTo: ["Lire l’énumération dans son contexte historique : hommes et femmes, jeunes et âgés, libres et esclaves."], conditions: ["Les règles modernes de prise en charge et de responsabilité ne sont pas traitées."], commonMistakes: ["Déduire automatiquement les obligations du chef de famille ou les règles concernant les personnes à charge."], takeaway: ["Cette fiche rapporte uniquement les catégories mentionnées dans les narrations."] },
  "zakat-fitr-timing": { howTo: ["Retenir le moment rapporté : avant la sortie des gens pour la prière de l’Aïd."], conditions: ["La fiche ne fixe pas toutes les règles des paiements anticipés ou tardifs."], commonMistakes: ["Présenter ce récit comme une étude complète de tous les délais juridiques."], takeaway: ["Le moment affiché correspond au cas rapporté dans Bukhârî 1503."] },
};

const ENRICHED_ZAKAT_TOPICS = ZAKAT_TOPICS.map((topic) => ({ ...topic, ...(ZAKAT_EDUCATIONAL_DETAILS[topic.id] ?? {}) }));

const ENRICHED_PURIFICATION_TOPICS = PURIFICATION_TOPICS.map((topic) => topic.id === "wudu" ? {
  ...topic,
  content: {
    introduction: "Le Coran 5:6 présente les membres concernés par la purification avant la prière. La description détaillée du récit de Bukhârî 159 reste à intégrer au contenu Hadith de l’application.",
    ceQuiEstEtabli: [
      { text: "Le verset mentionne le lavage du visage et des bras jusqu’aux coudes, l’essuyage de la tête et le lavage des pieds jusqu’aux chevilles.", evidenceIds: ["quran-5-6"] },
    ],
    limites: ["Bukhârî 159 est enregistré comme référence, mais son contenu détaillé n’est pas encore relié dans le corpus Hadith : Source enregistrée — contenu détaillé à intégrer."],
  },
} : topic);

const ENRICHED_WUDU_SUNNAS = ENRICHED_PURIFICATION_TOPICS.map((topic) => topic.id === "wudu-sunnas" ? {
  ...topic,
  content: {
    introduction: "Cette fiche distingue les gestes décrits dans le récit de leur qualification juridique.",
    ceQuiEstEtabli: [
      { text: "Le récit rapporte le lavage des mains, le rinçage de la bouche, le nettoyage du nez, le lavage du visage, des bras jusqu’aux coudes et des pieds jusqu’aux chevilles, ainsi que l’essuyage de la tête.", evidenceIds: ["muslim-226"] },
      { text: "Le récit mentionne trois lavages pour les mains, le visage, les bras et les pieds.", evidenceIds: ["muslim-226"] },
      { text: "Le récit mentionne ensuite deux raka‘ât accomplies sans distraction et la récompense qui leur est associée dans le texte.", evidenceIds: ["muslim-226"] },
    ],
    limites: ["Cette description ne suffit pas, à elle seule, à qualifier chaque geste d’obligatoire ou de sunna juridique.", "Les nombres sont rapportés ici comme éléments du récit et ne constituent pas une qualification juridique générale dans cette fiche."],
  },
} : topic);

const EDITORIALLY_ENRICHED_PURIFICATION = ENRICHED_WUDU_SUNNAS.map((topic) => {
  if (topic.id === "water-impurities") return { ...topic, content: {
    introduction: "L’eau occupe une place centrale dans la purification rituelle. Les textes retenus donnent plusieurs repères précis sans constituer ici une classification complète de toutes les eaux.",
    definition: [e("Cette fiche présente des repères textuels sur l’eau dans le contexte de la purification et de la souillure, sans trancher les développements juridiques non documentés ici.", "quran-25-48", "quran-8-11")],
    ceQuiEstEtabli: [
      e("Le Coran décrit une eau descendue du ciel dans un contexte où la purification est mentionnée.", "quran-25-48", "quran-8-11"),
      e("Un récit répond à une question concernant l’utilisation de l’eau de mer pour les ablutions.", "abudawud-83"),
      e("Le récit du puits de Budâ’a rapporte un cas concret concernant une eau de puits soumis au Prophète ﷺ.", "abudawud-66"),
      e("Le hadith des deux qullas mentionne un repère de quantité d’eau dans le texte.", "abudawud-63"),
    ],
    enseignements: [e("Ces textes fournissent des repères distincts : eau descendue du ciel, eau de mer, cas d’un puits et quantité évoquée par les deux qullas.", "quran-25-48", "quran-8-11", "abudawud-83", "abudawud-66", "abudawud-63")],
    limites: ["Cette leçon ne fixe pas une classification exhaustive des eaux.", "Elle ne tranche pas les règles relatives à la couleur, l’odeur, le goût, aux mélanges, aux seuils modernes, à la conversion des qullas ou aux divergences entre écoles.", "Les références Abû Dâwûd affichées sont documentaires et ne disposent pas encore d’une destination Hadith interne vérifiée."],
    questions: [
      { id: "water-rain", question: "Le Coran parle-t-il d’une eau descendue du ciel dans un contexte de purification ?", answer: [e("Oui. Les versets cités mentionnent l’eau descendue du ciel dans un contexte lié à la purification, sans détailler à eux seuls toutes les catégories juridiques de l’eau.", "quran-25-48", "quran-8-11")] },
      { id: "water-sea", question: "Que rapporte le texte sur l’eau de mer ?", answer: [e("Un récit rapporte une question concernant l’utilisation de l’eau de mer pour les ablutions. Cette fiche en rapporte la portée sans développer d’autres règles.", "abudawud-83")] },
      { id: "water-buda", question: "Que rapporte le récit du puits de Budâ’a ?", answer: [e("Il rapporte qu’un cas concret concernant l’eau d’un puits a été soumis ; il constitue un repère dans la discussion de l’eau et de la souillure, sans être transformé ici en règle exhaustive.", "abudawud-66")] },
      { id: "water-qullas", question: "Que sont les deux qullas mentionnées dans le hadith ?", answer: [e("Les deux qullas sont un repère de quantité mentionné dans le texte. Aucune conversion moderne ni conclusion détaillée sur les seuils n’est donnée ici.", "abudawud-63")] },
    ],
  } };
  if (topic.id === "wudu-obligations") return { ...topic, content: {
    introduction: "Coran 5:6 donne le socle textuel des membres concernés par les ablutions. Cette fiche présente ce que le verset énonce directement, sans transformer les qualifications juridiques discutées par les écoles en règle unique.",
    definition: [e("Dans le verset, les ablutions comprennent des lavages et un essuyage appliqués aux membres explicitement mentionnés.", "quran-5-6")],
    ceQuiEstEtabli: [
      e("Le verset mentionne le visage.", "quran-5-6"),
      e("Le verset mentionne les bras jusqu’aux coudes.", "quran-5-6"),
      e("Le verset mentionne l’essuyage de la tête.", "quran-5-6"),
      e("Le verset mentionne les pieds jusqu’aux chevilles.", "quran-5-6"),
    ],
    pratique: [e("Le texte distingue le lavage du visage, des bras et des pieds, et l’essuyage de la tête.", "quran-5-6")],
    enseignements: [e("Le verset relie cette purification au contexte de la prière et indique les membres concernés.", "quran-5-6")],
    limites: ["L’intention, l’ordre des gestes, leur continuité et les conséquences de l’omission d’un membre demandent une qualification juridique distincte.", "Cette fiche ne compare pas les quatre écoles et ne présente pas de consensus, de majorité ou d’obligation générale sur ces points.", "L’intention est évoquée ici uniquement comme résolution intérieure d’accomplir l’acte ; aucune formulation verbale n’est demandée."],
    questions: [
      { id: "wudu-obligations-members", question: "Quels membres sont mentionnés dans Coran 5:6 ?", answer: [e("Le verset mentionne le visage, les bras jusqu’aux coudes, la tête à essuyer et les pieds jusqu’aux chevilles.", "quran-5-6")] },
      { id: "wudu-wash-wipe", question: "Le verset distingue-t-il lavage et essuyage ?", answer: [e("Oui. Dans sa formulation, le verset distingue le lavage du visage, des bras et des pieds, et l’essuyage de la tête.", "quran-5-6")] },
    ],
  } };
  if (topic.id === "tayammum") return { ...topic, content: {
    introduction: "Le tayammum est une purification de remplacement mentionnée par les textes dans certaines situations où l’eau n’est pas disponible ou ne peut pas être utilisée dans le cadre décrit.",
    definition: [e("Le Coran présente le tayammum comme le recours à une terre propre, avec essuyage du visage et des mains, dans le contexte indiqué par les versets.", "quran-4-43", "quran-5-6")],
    ceQuiEstEtabli: [
      e("Les versets mentionnent l’absence d’eau ainsi que le contexte de maladie ou d’impossibilité lié à la purification.", "quran-4-43", "quran-5-6"),
      e("Les versets mentionnent une terre propre et l’essuyage du visage et des mains.", "quran-4-43", "quran-5-6"),
      e("Le récit de ‘Ammâr rapporte que le Prophète ﷺ a frappé la terre avec ses mains puis a essuyé son visage et ses mains.", "bukhari-338", "bukhari-341", "bukhari-343"),
      e("Un récit rapporte le contexte d’une absence d’eau associé à la révélation du tayammum.", "bukhari-336"),
      e("Un autre récit rapporte un essuyage du visage et des mains avec la poussière d’un mur.", "bukhari-337"),
      e("Une narration rapporte une seule frappe pour le visage et les mains.", "abudawud-327"),
      e("Un récit mentionne que lorsque l’eau est retrouvée, elle est utilisée sur la peau.", "abudawud-332"),
    ],
    pratique: [e("Les récits décrivent un contact des mains avec la terre ou une surface poussiéreuse, puis un essuyage du visage et des mains. Cette description est rapportée comme telle et ne tranche pas toutes les qualifications juridiques.", "bukhari-338", "bukhari-341", "bukhari-343", "bukhari-337")],
    enseignements: [e("Les textes associent le tayammum à une situation où l’eau ne peut pas être trouvée ou utilisée dans le contexte mentionné.", "quran-4-43", "quran-5-6")],
    limites: ["La fiche ne fixe pas le nombre universel de frappes, la limite exacte des mains, la classification complète des matières, les invalidants ou l’utilisation pour plusieurs prières.", "Les conditions détaillées de maladie, le retour à l’eau et les divergences entre écoles nécessitent une étude juridique distincte.", "Les références Hadith affichées ne disposent pas d’une destination Hadith interne vérifiée et restent non cliquables."],
    questions: [
      { id: "tayammum-quran-context", question: "Quand le Coran mentionne-t-il le tayammum ?", answer: [e("Les versets le mentionnent dans le contexte de l’absence d’eau et de situations liées à la maladie ou à l’impossibilité de l’utiliser, avec recours à une terre propre.", "quran-4-43", "quran-5-6")] },
      { id: "tayammum-members", question: "Quels membres sont mentionnés dans les versets ?", answer: [e("Les versets mentionnent l’essuyage du visage et des mains.", "quran-4-43", "quran-5-6")] },
      { id: "tayammum-ammar", question: "Que rapporte le récit de ‘Ammâr sur la pratique du tayammum ?", answer: [e("Les récits rapportent un contact des mains avec la terre, puis l’essuyage du visage et des mains. Ils décrivent ces gestes sans régler ici toutes les divergences juridiques.", "bukhari-338", "bukhari-341", "bukhari-343")] },
      { id: "tayammum-water-found", question: "Que rapporte le récit lorsqu’on retrouve l’eau ?", answer: [e("Le récit mentionne que lorsque l’eau est retrouvée, elle est utilisée sur la peau. Les autres conséquences juridiques ne sont pas détaillées dans cette fiche.", "abudawud-332")] },
    ],
  } };
  if (topic.id === "wudu") return { ...topic, content: { introduction: "Les ablutions sont présentées ici à partir des membres mentionnés dans le Coran et de la description prophétique retenue.", definition: [e("Le wudû est la purification rituelle comprenant le lavage de membres déterminés et l’essuyage de la tête dans le cadre décrit par les sources.", "quran-5-6", "bukhari-159")], ceQuiEstEtabli: [e("Le Coran mentionne le visage, les bras jusqu’aux coudes, la tête et les pieds jusqu’aux chevilles.", "quran-5-6"), e("Le récit retenu décrit une réalisation concrète des ablutions.", "bukhari-159")], pratique: [e("La pratique doit être lue en revenant aux gestes effectivement décrits par le récit, sans transformer ici chaque détail en qualification juridique distincte.", "bukhari-159")], enseignements: [e("La purification rituelle prépare le croyant à la prière dans le cadre indiqué par le verset.", "quran-5-6")], limites: ["Cette fiche expose le socle textuel et une description rapportée ; elle ne tranche pas les divergences de qualification des détails."], questions: [{ id: "wudu-members", question: "Quels membres sont mentionnés dans le verset ?", answer: [e("Le verset mentionne le visage, les bras jusqu’aux coudes, l’essuyage de la tête et les pieds jusqu’aux chevilles.", "quran-5-6")] }] } };
  if (topic.id === "khuff") return { ...topic, content: { introduction: "L’essuyage sur les khuff est présenté selon les deux éléments documentés dans les sources retenues : la permission rapportée et la durée mentionnée.", definition: [e("Les khuff sont les chaussures sur lesquelles l’essuyage est rapporté dans le hadith retenu.", "bukhari-206")], ceQuiEstEtabli: [e("L’essuyage sur les khuff est rapporté dans la Sunnah.", "bukhari-206"), e("La durée rapportée est d’un jour et une nuit pour le résident, et de trois jours et trois nuits pour le voyageur.", "muslim-276a")], enseignements: [e("La durée est rapportée comme une distinction entre résident et voyageur dans le texte retenu.", "muslim-276a")], limites: ["Cette fiche ne traite pas de l’extension aux chaussettes modernes ni des conditions détaillées qui nécessitent une documentation juridique supplémentaire."] } };
  if (topic.id === "purification-doubt") return { ...topic, content: { introduction: "Lorsqu’une certitude de purification est confrontée à un doute, la source retenue établit un principe de prudence.", definition: [e("Le doute est une incertitude qui ne suffit pas, à elle seule, à renverser une certitude antérieure.", "muslim-361")], ceQuiEstEtabli: [e("Une personne ne quitte pas la prière sur la base d’un doute tant qu’elle n’a pas constaté un élément certain selon le récit.", "muslim-361")], pratique: [e("Il faut distinguer ce qui est certain de ce qui n’est qu’une impression ou une hésitation.", "muslim-361")], enseignements: [e("Le texte enseigne de ne pas traiter le simple doute comme une certitude contraire.", "muslim-361")], limites: ["La source ne constitue pas une liste détaillée de toutes les formes de doute ou de waswas."] } };
  if (topic.id === "ghusl") return { ...topic, content: { introduction: "Le ghusl est abordé ici à partir du cadre coranique de la purification majeure et de la description rapportée après janâba.", definition: [e("Le ghusl désigne la purification majeure mentionnée dans le contexte de la janâba.", "quran-5-6", "quran-4-43")], ceQuiEstEtabli: [e("Les versets distinguent la situation de janâba et ordonnent la purification correspondante dans le contexte exposé.", "quran-5-6", "quran-4-43"), e("Bukhârî 248 rapporte une description du ghusl après janâba.", "bukhari-248")], pratique: [e("La manière pratique doit être comprise à partir des gestes effectivement présents dans le récit de Bukhârî 248.", "bukhari-248")], limites: ["Cette fiche ne présente pas une liste exhaustive de toutes les causes du ghusl ni toutes les divergences juridiques."] } };
  if (topic.id === "menstruation") return { ...topic, content: {
    introduction: "Cette fiche présente des repères directement rapportés sur les menstrues, la prière, le jeûne et certains saignements. Elle ne remplace pas l’examen d’un cas personnel.",
    definition: [e("Le Coran mentionne la situation des menstrues et en encadre directement un aspect conjugal.", "quran-2-222")],
    ceQuiEstEtabli: [
      e("Le verset mentionne les menstrues et encadre les rapports conjugaux pendant cette période dans le cadre qu’il expose.", "quran-2-222"),
      e("Dans le récit rapporté par ‘Â’isha, les prières abandonnées pendant les menstrues n’étaient pas rattrapées.", "muslim-335a", "muslim-335c"),
      e("Le même récit rapporte le rattrapage des jours de jeûne manqués.", "muslim-335c"),
      e("Bukhârî 320 distingue un saignement provenant d’un vaisseau des menstrues et rapporte la reprise de la prière après la fin de la période et le ghusl.", "bukhari-320"),
      e("Une narration rapporte que les pertes jaunâtres ou brunâtres après purification n’étaient pas prises en considération dans le cas rapporté.", "abudawud-307", "abudawud-308"),
    ],
    pratique: [e("Les textes cités permettent de distinguer les repères rapportés pour la prière, le jeûne et la fin de la période, sans fournir une procédure complète pour tous les cas.", "muslim-335c", "bukhari-320")],
    enseignements: [e("Les règles exposées doivent rester attachées au contenu précis de chaque récit : rattrapage du jeûne, non-rattrapage des prières dans le récit de ‘Â’isha, et distinction rapportée avec l’istihâda.", "muslim-335a", "muslim-335c", "bukhari-320")],
    limites: ["Aucune durée minimale, maximale ou habituelle n’est donnée ici.", "Les saignements irréguliers complexes, les signes détaillés de fin, le nifâs et les cas personnels ne sont pas tranchés.", "La mention des pertes jaunâtres ou brunâtres est limitée au cas situé après purification dans le récit ; elle ne signifie pas qu’elles sont toujours sans effet.", "Cette fiche ne présente pas de comparaison entre les quatre écoles."],
    questions: [
      { id: "menstruation-prayers", question: "Faut-il rattraper les prières manquées pendant les menstrues ?", answer: [e("Dans le récit rapporté par ‘Â’isha, les femmes n’étaient pas appelées à rattraper les prières abandonnées pendant les menstrues.", "muslim-335a", "muslim-335c")] },
      { id: "menstruation-fasts", question: "Faut-il rattraper les jours de jeûne manqués ?", answer: [e("Le récit rapporté par ‘Â’isha mentionne le rattrapage des jours de jeûne manqués pendant les menstrues.", "muslim-335c")] },
      { id: "menstruation-istihada", question: "Que rapporte Bukhârî 320 sur l’istihâda ?", answer: [e("Le récit distingue un saignement provenant d’un vaisseau des menstrues et rapporte l’arrêt de la prière pendant la période menstruelle, puis la reprise après sa fin et le ghusl.", "bukhari-320")] },
      { id: "menstruation-colored-discharge", question: "Que rapporte le hadith sur les pertes jaunes ou brunes après purification ?", answer: [e("Dans le cas rapporté, les pertes jaunâtres ou brunâtres apparues après purification n’étaient pas prises en considération.", "abudawud-307", "abudawud-308")] },
      { id: "menstruation-quran", question: "Que dit Coran 2:222 au sujet des menstrues ?", answer: [e("Le verset mentionne les menstrues et encadre les rapports conjugaux pendant cette période dans le cadre qu’il expose.", "quran-2-222")] },
    ],
  } };
  if (topic.id === "soiled-clothing") return { ...topic, content: {
    introduction: "Les textes étudiés portent sur des situations précises. Cette fiche rapporte ces cas sans construire une théorie générale de toutes les impuretés.",
    definition: [e("Une souillure est étudiée ici uniquement à travers les situations particulières rapportées par les textes retenus.", "quran-74-4", "quran-5-6")],
    ceQuiEstEtabli: [
      e("Pour du sang menstruel sur un vêtement, le récit rapporte de gratter la souillure, de la frotter avec de l’eau, puis de verser de l’eau dessus avant de prier avec le vêtement.", "bukhari-227", "muslim-291a"),
      e("Pour de l’urine sur le sol d’une mosquée, les récits rapportent qu’une quantité d’eau a été versée sur la zone concernée.", "bukhari-220", "muslim-284a"),
      e("Pour une sandale touchée par une souillure, un récit mentionne la terre comme moyen de purification.", "abudawud-385", "abudawud-386"),
      e("Pour un récipient léché par un chien, les récits rapportent sept lavages ; une variante mentionne la terre lors du premier lavage.", "muslim-279a", "muslim-279c", "muslim-279d"),
    ],
    pratique: [e("Chaque cas doit être lu selon la situation exacte du récit : vêtement, sol de mosquée, sandale ou récipient.", "bukhari-227", "bukhari-220", "abudawud-385", "muslim-279a")],
    enseignements: [e("Le Coran apporte un appui général à la purification des vêtements et au cadre de la purification rituelle, sans détailler seul les méthodes de nettoyage des supports.", "quran-74-4", "quran-5-6")],
    limites: ["Ces récits ne constituent pas une liste exhaustive de toutes les souillures.", "Aucune règle générale n’est publiée ici sur les traces, l’odeur, la couleur résiduelle, le séchage, le soleil, le nettoyage sans eau, les petites quantités excusées ou les matériaux modernes.", "La règle de la sandale n’est pas étendue automatiquement aux baskets, tissus ou semelles modernes.", "La règle du récipient léché par un chien n’est pas généralisée à toute salive animale ni à tous les objets.", "Les conditions détaillées et les divergences entre écoles relèvent d’une étude de fiqh distincte."],
    questions: [
      { id: "soiled-menstrual-blood", question: "Comment nettoyer le sang menstruel sur un vêtement dans le récit ?", answer: [e("Le récit rapporte de gratter la souillure, de la frotter avec de l’eau, puis de verser de l’eau dessus avant de prier avec le vêtement.", "bukhari-227", "muslim-291a")] },
      { id: "soiled-mosque-urine", question: "Comment a été traité le sol souillé par de l’urine dans la mosquée ?", answer: [e("Les récits rapportent que de l’eau a été versée sur la zone concernée.", "bukhari-220", "muslim-284a")] },
      { id: "soiled-dog-vessel", question: "Que rapportent les hadiths concernant un récipient léché par un chien ?", answer: [e("Les récits rapportent sept lavages du récipient ; une formulation mentionne la terre lors du premier lavage.", "muslim-279a", "muslim-279c", "muslim-279d")] },
      { id: "soiled-shoe", question: "Que rapporte le récit concernant une sandale touchée par une souillure ?", answer: [e("Un récit rapporte que la terre est mentionnée comme moyen de purification de la sandale touchée par une souillure.", "abudawud-385", "abudawud-386")] },
    ],
  } };
  return topic;
});

const PHASE_A_PURIFICATION = EDITORIALLY_ENRICHED_PURIFICATION.map((topic) => {
  if (topic.id === "wudu") return { ...topic, content: { introduction: "Les ablutions sont présentées ici à partir des membres explicitement mentionnés dans le Coran.", definition: [e("Le wudû est une purification rituelle comprenant le lavage et l’essuyage des membres mentionnés dans le verset.", "quran-5-6")], ceQuiEstEtabli: [e("Le verset mentionne le visage, les bras jusqu’aux coudes, l’essuyage de la tête et les pieds jusqu’aux chevilles.", "quran-5-6")], enseignements: [e("La purification est mentionnée dans le contexte de la prière.", "quran-5-6")], limites: ["La description détaillée attribuée à Bukhârî 159 reste hors de cette fiche tant que son contenu Hadith n’est pas relié et vérifié dans l’application."] } };
  if (topic.id === "wudu-sunnas") return { ...topic, content: { ...topic.content, questions: [{ id: "wudu-washes", question: "Combien de fois certains membres sont-ils lavés dans le récit ?", answer: [e("Le récit mentionne trois lavages pour les mains, le visage, les bras et les pieds.", "muslim-226")] }, { id: "wudu-after", question: "Que rapporte le récit après les ablutions ?", answer: [e("Le récit mentionne deux raka‘ât accomplies sans distraction et la récompense associée dans le texte.", "muslim-226")] }] } };
  if (topic.id === "ghusl") return { ...topic, content: { introduction: "Le ghusl est présenté ici comme purification majeure dans le cadre de la janâba.", definition: [e("Le ghusl désigne la purification majeure mentionnée dans le contexte de la janâba.", "quran-5-6", "quran-4-43")], ceQuiEstEtabli: [e("Les versets traitent de la purification liée à la janâba.", "quran-5-6", "quran-4-43")], limites: ["La description détaillée de Bukhârî 248 n’est pas reprise ici tant que son contenu Hadith complet n’est pas relié et vérifié dans l’application.", "Cette fiche ne constitue pas une liste exhaustive de toutes les causes du ghusl."] } };
  if (topic.id === "khuff") return { ...topic, content: { ...topic.content, questions: [{ id: "khuff-resident", question: "Quelle durée est rapportée pour le résident ?", answer: [e("Un jour et une nuit sont rapportés pour le résident.", "muslim-276a")] }, { id: "khuff-traveller", question: "Quelle durée est rapportée pour le voyageur ?", answer: [e("Trois jours et trois nuits sont rapportés pour le voyageur.", "muslim-276a")] }] } };
  if (topic.id === "purification-doubt") return { ...topic, content: { ...topic.content, questions: [{ id: "purification-certainty", question: "Que faire lorsqu’on doute simplement d’avoir perdu ses ablutions ?", answer: [e("Le simple doute ne renverse pas la certitude antérieure dans le cas rapporté.", "muslim-361")] }] } };
  return topic;
});

const FINAL_PURIFICATION = PHASE_A_PURIFICATION.map((item) => item.id === "wudu-invalidators" || item.id === "postpartum" ? { ...item, publicationStatus: "coming_soon" as const } : item);
const PRAYER_FATIHA_COMPARATIVE: FiqhDifference = {
  id: "prayer-fatiha-behind-imam",
  question: "La récitation d’al-Fâtiha par le fidèle derrière l’imam",
  established: "Les passages étudiés présentent des qualifications différentes selon les écoles, notamment entre prière à voix haute et prière silencieuse. Aucun avis n’est sélectionné ici.",
  positions: [
    { label: "Hanafite", position: "Dans la formulation principale étudiée, la récitation du fidèle derrière l’imam n’est pas exigée, à voix haute comme à voix basse. Une nuance interne est rapportée pour certaines prières silencieuses.", sourceIds: ["fiqh-badai-fatiha-imam"], verificationStatus: "partial" },
    { label: "Malikite", position: "Le passage étudié indique que le fidèle récite lorsque l’imam ne récite pas à voix haute et délaisse la récitation lorsque l’imam récite à voix haute. La qualification précise n’est pas développée ici.", sourceIds: ["fiqh-zurqani-fatiha-imam"], verificationStatus: "partial" },
    { label: "Shafi‘ite", position: "Dans la position exposée, al-Fâtiha est requise pour le fidèle derrière l’imam dans les prières silencieuses comme dans les prières à voix haute.", sourceIds: ["fiqh-majmu-fatiha-imam"], verificationStatus: "partial" },
    { label: "Hanbalite", position: "La récitation du fidèle derrière l’imam est décrite comme non obligatoire dans les prières à voix haute et silencieuses. Le passage ne l’établit pas comme interdite.", sourceIds: ["fiqh-mughni-fatiha-imam"], verificationStatus: "partial" },
  ],
  practicalNote: "Cette présentation ne traite pas du retardataire, du fidèle qui n’entend pas l’imam, ni des exceptions détaillées. Aucun consensus ni avis préféré n’est affirmé.",
  limits: ["Les statuts documentaires internes ne sont pas affichés à l’utilisateur."]
};
const PRAYER_FATIHA_EXTRA_QUESTIONS: FiqhQuestion[] = [
  { id: "prayer-fatiha-behind-imam", question: "Dois-je réciter al-Fâtiha derrière l’imam ?", answer: [e("Les écoles divergent sur cette question. Les quatre positions documentées sont présentées séparément, sans sélectionner un avis.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
  { id: "prayer-fatiha-loud", question: "Est-ce différent dans une prière à voix haute ?", answer: [e("Les passages étudiés distinguent différemment la prière à voix haute selon les écoles.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
  { id: "prayer-fatiha-silent", question: "Et dans une prière silencieuse ?", answer: [e("Les passages étudiés ne donnent pas une réponse unique pour la prière silencieuse.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
];
const prayerFatihaTopic = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-fatiha");
if (prayerFatihaTopic) {
  prayerFatihaTopic.differences = [PRAYER_FATIHA_COMPARATIVE];
  prayerFatihaTopic.sourceIds = [...prayerFatihaTopic.sourceIds, "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam"];
  prayerFatihaTopic.content = { ...prayerFatihaTopic.content, limites: [...(prayerFatihaTopic.content?.limites ?? []), "Le cas du fidèle qui n’entend pas l’imam et le retardataire ne sont pas traités ici.", "Aucun avis n’est sélectionné et aucun consensus n’est affirmé."], questions: [...(prayerFatihaTopic.content?.questions ?? []), ...PRAYER_FATIHA_EXTRA_QUESTIONS] };
  prayerFatihaTopic.content = {
    ...prayerFatihaTopic.content,
    introduction: "La récitation d’al-Fâtiha occupe une place centrale dans la prière. Une question particulière se pose lorsque le fidèle prie derrière un imam : doit-il lui-même la réciter ? Les juristes ont développé des réponses différentes selon les situations.",
    questions: [
      { id: "prayer-fatiha-behind-imam", question: "Dois-je réciter al-Fâtiha derrière l’imam ?", answer: [e("Les écoles présentent des positions différentes. Hanafite : dans la formulation principale étudiée, la récitation du fidèle derrière l’imam n’est pas exigée. Malikite : le passage étudié distingue la prière silencieuse, où le fidèle récite, de la prière à voix haute, où il délaisse la récitation. Shafi‘ite : dans la position exposée, al-Fâtiha reste requise pour le fidèle derrière l’imam. Hanbalite : dans le passage étudié, la récitation du fidèle derrière l’imam est considérée comme non obligatoire. Cette présentation expose les positions documentées sans sélectionner un avis.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
      { id: "prayer-fatiha-loud", question: "Est-ce différent dans une prière à voix haute ?", answer: [e("Oui, les positions documentées diffèrent. Hanafite : la récitation du fidèle n’est pas exigée dans la formulation principale étudiée. Malikite : le fidèle délaisse la récitation lorsque l’imam récite à voix haute. Shafi‘ite : al-Fâtiha reste requise selon la position exposée. Hanbalite : la récitation du fidèle est décrite comme non obligatoire. Aucun avis n’est sélectionné ici.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
      { id: "prayer-fatiha-silent", question: "Et dans une prière silencieuse ?", answer: [e("Les positions documentées diffèrent également. Hanafite : la formulation principale étudiée retient la non-obligation, avec une nuance interne déjà documentée pour certaines prières silencieuses. Malikite : le passage étudié indique que le fidèle récite lorsque l’imam ne récite pas à voix haute, sans fixer ici une qualification plus précise. Shafi‘ite : al-Fâtiha reste requise selon la position exposée. Hanbalite : la récitation du fidèle est décrite comme non obligatoire. Cette comparaison ne sélectionne aucun avis.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam")] },
    ],
  };
}
const PRAYER_SAHW_EXTRA_QUESTION: FiqhQuestion = { id: "prayer-sahw-before-after", question: "Pourquoi le sujûd as-sahw est-il parfois mentionné avant le taslîm et parfois après ?", answer: [e("Les récits rapportent différentes situations, et les juristes ont développé différentes méthodes pour les articuler. Cette présentation ne transforme pas ces récits en règle universelle.", "bukhari-1224", "muslim-570b", "muslim-571a", "muslim-572a", "fiqh-badai-sahw", "fiqh-mawahib-sahw", "fiqh-majmu-sahw", "fiqh-mughni-sahw")] };
// Ajout éditorial — Regroupement (jam‘) en voyage, V1 comparative.
// Mutation additive uniquement : aucun contenu existant de prayer-combining n’est supprimé ou réécrit.
const PRAYER_COMBINING_TRAVEL_COMPARATIVE: FiqhDifference = {
  id: "prayer-combining-travel-four-schools",
  question: "Le voyage permet-il de regrouper réellement deux prières dans le temps de l’une d’elles ?",
  introduction: "Les ouvrages classiques étudiés ne traitent pas tous le regroupement du voyage de la même manière. Cette comparaison reste limitée au voyage et ne choisit aucun avis.",
  established: "Muslim 705c rapporte un regroupement pendant un voyage. Les juristes ont ensuite précisé différemment la portée et les conditions de cette pratique.",
  positions: [
    { label: "Hanafite", position: "Dans le passage étudié, le jam‘ réel de deux prières obligatoires dans le temps de l’une d’elles n’est pas admis pour le simple voyage ; ‘Arafah et Muzdalifah sont traitées comme exceptions textuelles. Les autres récits de voyage sont interprétés dans ce cadre comme un rapprochement des prières sans sortir chacune de son temps.", sourceIds: ["fiqh-badai-combining-travel"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "Le passage étudié d’ad-Dhakhira admet le regroupement en voyage dans des situations liées au déplacement et rapporte des nuances internes sur l’étendue de cette permission. La V1 n’en fait donc pas une règle sans condition pour tout voyage.", sourceIds: ["fiqh-dhakhira-combining-travel"], verificationStatus: "verified_primary" },
    { label: "Shafi‘ite", position: "Le passage étudié d’Al-Majmu permet au voyageur concerné de regrouper dans le temps de la première ou de la seconde prière. Le jam‘ taqdim et le jam‘ ta’khir y ont des conditions distinctes.", sourceIds: ["fiqh-majmu-combining-travel"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Le passage étudié d’Al-Mughni présente le regroupement en voyage dans le temps de l’une des deux prières comme permis, avec des conditions et modalités qui dépendent notamment du moment choisi.", sourceIds: ["fiqh-mughni-combining-travel"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "Cette comparaison explique une divergence de fiqh ; elle ne donne pas une règle universelle applicable à tout déplacement ni à toute situation personnelle.",
  limits: [
    "Cette V1 traite du voyage, pas de toutes les autres excuses possibles comme la pluie ou la maladie.",
    "Elle ne fixe pas ici la distance du voyage : cette question appartient à la fiche Voyage et raccourcissement.",
    "Elle ne présente ni consensus global ni avis préféré.",
    "Les conditions détaillées du jam‘ taqdim et du jam‘ ta’khir ne sont pas généralisées d’une école à l’autre.",
  ],
};

const PRAYER_COMBINING_EXTRA_QUESTIONS: FiqhQuestion[] = [
  { id: "prayer-combining-travel-difference", question: "Les quatre écoles permettent-elles le même regroupement en voyage ?", answer: [e("Non. Les passages classiques étudiés montrent une divergence : l’approche hanafite présentée ne permet pas le jam‘ réel pour le simple voyage hors des exceptions de ‘Arafah et Muzdalifah, tandis que les passages malikite, shafi‘ite et hanbalite étudiés admettent des formes de regroupement en voyage avec leurs propres conditions.", "fiqh-badai-combining-travel", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel")] },
  { id: "prayer-combining-taqdim-takhir", question: "Le regroupement peut-il se faire au temps de la première ou de la seconde prière ?", answer: [e("Les passages shafi‘ite et hanbalite étudiés documentent le regroupement dans le temps de la première ou de la seconde, avec des conditions distinctes. Le passage malikite étudié lie davantage l’exposé aux circonstances du déplacement. Cette formulation ne doit pas être transposée à l’école hanafite, qui traite différemment le jam‘ réel hors ‘Arafah et Muzdalifah.", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel", "fiqh-badai-combining-travel")] },
  { id: "prayer-combining-every-trip", question: "Peut-on en conclure qu’il faut regrouper à chaque voyage ?", answer: [e("Non. Muslim 705c rapporte un regroupement dans un voyage, tandis que les ouvrages de fiqh étudiés encadrent différemment cette pratique. La fiche ne transforme donc pas le récit en consigne automatique pour chaque déplacement.", "muslim-705c", "fiqh-badai-combining-travel", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel")] },
];

const prayerCombiningTopicForAppend = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-combining");
if (prayerCombiningTopicForAppend) {
  prayerCombiningTopicForAppend.differences.push(PRAYER_COMBINING_TRAVEL_COMPARATIVE);
  prayerCombiningTopicForAppend.sourceIds.push("fiqh-badai-combining-travel", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel");
  prayerCombiningTopicForAppend.content = {
    ...prayerCombiningTopicForAppend.content,
    enseignements: [
      ...(prayerCombiningTopicForAppend.content?.enseignements ?? []),
      e("Le récit de Muslim établit l’existence d’un regroupement en voyage ; les quatre écoles étudiées n’en déduisent pas toutes la même portée juridique ni les mêmes modalités.", "muslim-705c", "fiqh-badai-combining-travel", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel"),
    ],
    limites: [
      ...(prayerCombiningTopicForAppend.content?.limites ?? []),
      "La comparaison ajoutée reste limitée au voyage et ne couvre pas toutes les causes de regroupement.",
      "Les conditions détaillées propres à chaque école doivent rester attachées à leur source et ne doivent pas être fusionnées en une règle unique.",
    ],
    questions: [...(prayerCombiningTopicForAppend.content?.questions ?? []), ...PRAYER_COMBINING_EXTRA_QUESTIONS],
  };
}


// Ajout éditorial — Retardataire (masbûq), V1 comparative.
// Mutation additive uniquement : aucun contenu existant de prayer-latecomer n'est supprimé ou réécrit.
const PRAYER_LATECOMER_COMPARATIVE: FiqhDifference = {
  id: "prayer-latecomer-four-schools",
  question: "Les écoles considèrent-elles de la même manière les raka‘ât rejointes avec l’imam ?",
  introduction: "Le hadith retenu ordonne de rejoindre la prière avec calme, de prier ce qui est rejoint et de compléter ce qui a été manqué. Les juristes ont toutefois organisé différemment les raka‘ât du retardataire lorsqu’il complète sa prière.",
  established: "Bukhârî 908 fournit le principe de rejoindre la prière sans précipitation puis de compléter ce qui a été manqué. Les ouvrages classiques étudiés montrent une divergence sur la manière de qualifier ce qui a été rejoint et ce qui est complété ensuite.",
  positions: [
    { label: "Hanafite", position: "Dans le passage étudié d’al-Kâsânî, Abû Hanîfa et Abû Yûsuf considèrent juridiquement ce qui est rejoint avec l’imam comme la fin de la prière du retardataire, tandis que ce qu’il rattrape après le taslîm de l’imam est traité comme son début. Le même passage signale des nuances internes et une transmission différente de Muhammad.", sourceIds: ["fiqh-badai-latecomer"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "La formulation malikite étudiée combine deux logiques : le retardataire rattrape la récitation en tenant compte de ce qu’il a manqué, tandis qu’il construit les autres actes à partir de ce qu’il a déjà accompli avec l’imam. Cette distinction est souvent résumée par qada dans la récitation et bina dans les actes.", sourceIds: ["fiqh-maliki-latecomer"], verificationStatus: "partial" },
    { label: "Shafi‘ite", position: "Dans le passage étudié d’an-Nawawî, ce que le retardataire rejoint avec l’imam constitue le début de sa propre prière ; après le taslîm de l’imam, il complète ce qui reste comme la suite de sa prière.", sourceIds: ["fiqh-majmu-latecomer"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Dans le passage étudié d’Ibn Qudâma, la position attribuée à Ahmad traite ce qui est rejoint avec l’imam comme la fin de la prière du retardataire et ce qu’il rattrape ensuite comme son début. La V1 ne prétend pas couvrir toutes les transmissions internes.", sourceIds: ["fiqh-mughni-latecomer"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "Ces différences influencent notamment l’organisation de la récitation et de certaines assises lorsque plusieurs raka‘ât ont été manquées. La fiche expose la divergence sans choisir une école.",
  limits: [
    "Cette V1 ne traite pas le cas où l’on rejoint seulement le rukû‘, le sujûd ou le tashahhud.",
    "Elle ne donne pas un tableau exhaustif pour chaque combinaison de raka‘ât manquées dans Fajr, Maghrib et les prières de quatre raka‘ât.",
    "Les nuances internes rapportées dans certaines écoles ne sont pas effacées au profit d’une formule unique.",
    "Aucun consensus ni avis préféré n’est affirmé.",
  ],
};

const PRAYER_LATECOMER_EXTRA_QUESTIONS: FiqhQuestion[] = [
  { id: "prayer-latecomer-what-to-do", question: "Que faire lorsque j’arrive alors que la prière a déjà commencé ?", answer: [e("Le hadith retenu enseigne de venir avec calme, de rejoindre la prière dans l’état où elle se trouve, puis de compléter ce qui a été manqué. Il ne demande pas de courir pour rattraper une raka‘a.", "bukhari-908")] },
  { id: "prayer-latecomer-first-or-last", question: "La raka‘a que je rejoins avec l’imam est-elle le début ou la fin de ma prière ?", answer: [e("Les écoles ne l’organisent pas toutes de la même manière. Le passage shafi‘ite étudié la traite comme le début de la prière du retardataire ; les passages hanafite et hanbalite étudiés exposent une construction juridique où ce qui est rejoint est traité comme la fin ; la formulation malikite étudiée distingue la récitation des autres actes.", "fiqh-badai-latecomer", "fiqh-maliki-latecomer", "fiqh-majmu-latecomer", "fiqh-mughni-latecomer")] },
  { id: "prayer-latecomer-recitation", question: "Est-ce que cette divergence change ce que je récite après le taslîm de l’imam ?", answer: [e("Oui, elle peut modifier la manière d’organiser la récitation dans les raka‘ât complétées. C’est précisément pour cette raison que la fiche conserve les positions séparées et ne donne pas une seule séquence valable pour les quatre écoles.", "fiqh-badai-latecomer", "fiqh-maliki-latecomer", "fiqh-majmu-latecomer", "fiqh-mughni-latecomer")] },
];

const prayerLatecomerTopicForAppend = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-latecomer");
if (prayerLatecomerTopicForAppend) {
  prayerLatecomerTopicForAppend.differences.push(PRAYER_LATECOMER_COMPARATIVE);
  prayerLatecomerTopicForAppend.sourceIds.push("fiqh-badai-latecomer", "fiqh-maliki-latecomer", "fiqh-majmu-latecomer", "fiqh-mughni-latecomer");
  prayerLatecomerTopicForAppend.content = {
    ...prayerLatecomerTopicForAppend.content,
    enseignements: [
      ...(prayerLatecomerTopicForAppend.content?.enseignements ?? []),
      e("Le principe commun documenté est de rejoindre la prière avec calme et de compléter ce qui a été manqué ; la manière de structurer les raka‘ât complétées fait ensuite l’objet d’une divergence juridique.", "bukhari-908", "fiqh-badai-latecomer", "fiqh-maliki-latecomer", "fiqh-majmu-latecomer", "fiqh-mughni-latecomer"),
    ],
    limites: [
      ...(prayerLatecomerTopicForAppend.content?.limites ?? []),
      "Les cas détaillés selon le nombre exact de raka‘ât manquées restent hors de cette V1.",
      "Les positions des écoles sont affichées séparément afin de ne pas fusionner leurs méthodes en une règle artificielle.",
    ],
    questions: [...(prayerLatecomerTopicForAppend.content?.questions ?? []), ...PRAYER_LATECOMER_EXTRA_QUESTIONS],
  };
}

// Ajout éditorial — Invalidants de la prière, V1 limitée.
// Ajout uniquement : aucune fiche Prière existante n'est supprimée ou réécrite.
const PRAYER_INVALIDATORS_TOPIC: FiqhTopic = {
  id: "prayer-invalidators",
  categoryId: "prayer",
  title: "Ce qui invalide la prière",
  summary: "Repères documentés sur certains actes qui interrompent la validité de la prière, avec leurs principales nuances juridiques.",
  aliases: ["invalidants prière", "annule prière", "mubtilat salat", "parler prière", "manger prière", "rire prière"],
  badge: "DIVERGENCE JURIDIQUE",
  publicationStatus: "limited",
  established: [
    "Le récit de Muslim 537a enseigne que la parole ordinaire des gens n'a pas sa place dans la prière.",
    "Les ouvrages classiques étudiés traitent également la perte de purification, manger ou boire et le rire comme des causes pouvant invalider la prière, avec des nuances propres à chaque cas.",
  ],
  proofs: ["Sahîh Muslim, 537a ; passages classiques hanafite, malikite, shafi‘ite et hanbalite."],
  evidence: [
    e("Le récit de Mu‘âwiya ibn al-Hakam enseigne que la prière n'est pas un lieu pour la parole ordinaire des gens.", "muslim-537a"),
    e("Les passages hanafite, shafi‘ite et hanbalite étudiés traitent explicitement le fait de manger ou boire pendant la prière, avec des distinctions selon l'intention et l'oubli.", "fiqh-badai-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
    e("Les ouvrages classiques étudiés traitent le rire audible comme une question pouvant invalider la prière ; les conséquences annexes ne sont pas identiques dans toutes les écoles.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
  ],
  content: {
    introduction: "Certaines actions rompent la prière, tandis que d'autres sont excusées ou traitées différemment selon qu'elles sont volontaires, involontaires, brèves ou importantes. Cette V1 présente uniquement des cas directement documentés et ne prétend pas dresser une liste exhaustive.",
    definition: [
      e("Dans cette fiche, un invalidant désigne un acte ou un événement que les sources juridiques étudiées traitent comme mettant fin à la validité de la prière dans le cas décrit.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
    ],
    ceQuiEstEtabli: [
      e("Muslim 537a rapporte l'enseignement selon lequel la parole ordinaire des gens n'a pas sa place dans la prière.", "muslim-537a"),
      e("Les passages classiques étudiés distinguent la parole volontaire de plusieurs situations d'oubli, d'ignorance ou de besoin ; ces nuances empêchent d'appliquer une formule unique à tous les cas.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
      e("Manger ou boire volontairement pendant une prière obligatoire est traité comme invalidant dans les passages hanafite, shafi‘ite et hanbalite retenus pour cette V1.", "fiqh-badai-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
      e("Le rire audible est traité comme invalidant de la prière dans les passages classiques retenus ; la question de savoir s'il affecte également les ablutions fait l'objet d'une divergence distincte.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
    ],
    enseignements: [
      e("Il faut distinguer ce qui survient volontairement de ce qui échappe au fidèle : les ouvrages étudiés n'appliquent pas toujours les mêmes conséquences à l'oubli, à l'ignorance ou à un acte minime.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"),
    ],
    limites: [
      "Cette V1 n'est pas une liste complète de tous les invalidants de la prière.",
      "Les mouvements nombreux, le changement de qibla, la découverte d'une impureté, l'abandon détaillé d'un pilier et les nombreux cas d'excuse nécessitent des dossiers séparés avant publication exhaustive.",
      "Les cas d'oubli ou d'ignorance ne doivent pas être assimilés automatiquement à un acte volontaire.",
      "La fiche n'est pas destinée à trancher un cas personnel après coup ; les circonstances peuvent modifier la qualification juridique.",
    ],
    questions: [
      { id: "prayer-invalidators-speaking", question: "Parler pendant la prière l'annule-t-il toujours ?", answer: [e("Le hadith enseigne que la parole ordinaire n'a pas sa place dans la prière. Les ouvrages de fiqh étudiés distinguent toutefois la parole volontaire de certains cas d'oubli, d'ignorance ou de nécessité ; cette fiche ne transforme donc pas tous les cas de parole en une seule règle.", "muslim-537a", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators")] },
      { id: "prayer-invalidators-eating", question: "Manger ou boire pendant la prière invalide-t-il la prière ?", answer: [e("Les passages hanafite, shafi‘ite et hanbalite étudiés considèrent l'acte volontaire de manger ou boire pendant la prière obligatoire comme invalidant. Les situations d'oubli et les détails propres aux écoles restent distincts.", "fiqh-badai-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators")] },
      { id: "prayer-invalidators-laughter", question: "Rire pendant la prière et sourire ont-ils le même statut ?", answer: [e("Non. Les passages étudiés distinguent le sourire du rire audible. Le rire audible peut invalider la prière dans les cas décrits, tandis que le sourire n'est pas traité de la même manière. Les détails de ce qui constitue un rire juridiquement pris en compte varient selon les formulations des écoles.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators")] },
    ],
  },
  howTo: [],
  conditions: [],
  invalidators: [],
  commonMistakes: [],
  specialCases: [],
  differences: [
    {
      id: "prayer-invalidators-forgetful-speech",
      question: "Les écoles traitent-elles de la même manière une parole prononcée par oubli ?",
      introduction: "Les textes classiques distinguent nettement la parole volontaire de certaines paroles involontaires ou excusées.",
      established: "Muslim 537a établit le cadre de la parole humaine dans la prière ; les détails de validité en cas d'oubli sont ensuite organisés différemment par les juristes.",
      positions: [
        { label: "Hanafite", position: "Le passage hanafite étudié adopte une approche stricte de la parole étrangère à la prière et traite la parole comme une cause d'invalidation dans son cadre juridique, avec des subdivisions détaillées dans le chapitre.", sourceIds: ["fiqh-badai-prayer-invalidators"], verificationStatus: "verified_primary" },
        { label: "Malikite", position: "Le passage malikite étudié distingue notamment la parole légère prononcée par oubli du rire à voix haute ; certaines paroles involontaires peuvent être traitées par le sujûd as-sahw plutôt que comme une invalidation automatique.", sourceIds: ["fiqh-dusuqi-prayer-invalidators"], verificationStatus: "verified_primary" },
        { label: "Shafi‘ite", position: "An-Nawawî expose qu'une parole brève survenue sans intention, par oubli ou par ignorance excusable peut ne pas invalider la prière, tandis que la parole volontaire est traitée différemment.", sourceIds: ["fiqh-majmu-prayer-invalidators"], verificationStatus: "verified_primary" },
        { label: "Hanbalite", position: "Ibn Qudâma traite la parole comme un invalidant et développe séparément les cas de parole volontaire, d'oubli et de parole liée à l'intérêt de la prière ; la V1 ne réduit pas ces subdivisions à une formule unique.", sourceIds: ["fiqh-mughni-prayer-invalidators"], verificationStatus: "verified_primary" },
      ],
      practicalNote: "Une parole prononcée volontairement et une parole échappée par oubli ne doivent donc pas être assimilées sans tenir compte de la méthode juridique suivie.",
      limits: [
        "La V1 ne donne pas un nombre de mots ou de lettres valable pour toutes les écoles.",
        "Elle ne traite pas ici tous les cas de correction de l'imam, de salut, de réponse nécessaire ou de parole sous contrainte.",
        "Aucun avis n'est présenté comme supérieur.",
      ],
    },
  ],
  takeaway: ["La prière peut être invalidée par certains actes clairement étrangers à celle-ci, mais les détails dépendent souvent de l'intention, de l'oubli, de la quantité et de la situation."],
  sourceIds: ["muslim-537a", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators"],
};

PUBLISHED_PRAYER_TOPICS.push(PRAYER_INVALIDATORS_TOPIC);
const prayerCategoryForInvalidators = FIQH_CATEGORIES.find((category) => category.id === "prayer");
if (prayerCategoryForInvalidators && !prayerCategoryForInvalidators.topicIds.includes("prayer-invalidators")) {
  prayerCategoryForInvalidators.topicIds.push("prayer-invalidators");
}
if (!PRAYER_CHAPTERS.some((chapter) => chapter.id === "prayer-invalidators")) {
  PRAYER_CHAPTERS.push({ id: "prayer-invalidators", categoryId: "prayer", title: "Ce qui invalide la prière", topicIds: ["prayer-invalidators"] });
}

// Complément éditorial — mouvements dans la prière.
// Ajout uniquement à prayer-invalidators ; le contenu déjà présent reste intact.
const prayerInvalidatorsForMovements = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-invalidators");
if (prayerInvalidatorsForMovements) {
  prayerInvalidatorsForMovements.evidence.push(
    e("Un mouvement léger n'est pas assimilé automatiquement à un invalidant : les passages hanafite et hanbalite étudiés distinguent explicitement l'action légère de l'action importante.", "fiqh-badai-prayer-movements", "fiqh-mughni-prayer-movements"),
    e("La formule populaire « trois mouvements annulent la prière » ne peut pas être présentée comme une règle générale des écoles : Ibn Qudama refuse explicitement de fixer le mouvement permis à trois gestes, tandis qu'al-Kasani rapporte plusieurs critères avant de retenir une appréciation liée à l'apparence de l'acte.", "fiqh-badai-prayer-movements", "fiqh-mughni-prayer-movements"),
    e("Le passage malikite étudié distingue lui aussi le geste léger du geste devenu nombreux et renvoie, dans l'exemple étudié, à une appréciation par l'usage.", "fiqh-dusuqi-prayer-movements"),
  );
  prayerInvalidatorsForMovements.differences.push({
    id: "prayer-invalidators-many-movements",
    question: "Des mouvements nombreux annulent-ils la prière ?",
    introduction: "Les ouvrages étudiés distinguent le mouvement léger du mouvement important, mais ils ne permettent pas d'afficher un compteur universel de gestes.",
    established: "Un acte léger ou accompli pour un besoin n'est pas traité comme un acte important étranger à la prière. L'appréciation du mouvement important dépend de critères juridiques et de l'usage dans les passages contrôlés.",
    positions: [
      { label: "Hanafite", position: "Al-Kasani rapporte plusieurs critères pour distinguer le peu du beaucoup et retient comme plus juste le critère de l'observateur : est important l'acte qui ferait qu'un observateur ne douterait pas que la personne n'est plus en prière. La nécessité est traitée séparément.", sourceIds: ["fiqh-badai-prayer-movements"], verificationStatus: "verified_primary" },
      { label: "Malikite", position: "Ad-Dusuqi traite le geste léger comme distinct du geste devenu nombreux ; dans l'exemple du fait de se gratter, la quantité est appréciée par l'usage et l'acte nombreux peut invalider la prière dans le cas décrit.", sourceIds: ["fiqh-dusuqi-prayer-movements"], verificationStatus: "verified_primary" },
      { label: "Shafi‘ite", position: "La V1 ne publie pas encore de critère shafi‘ite détaillé ici : le passage primaire précis destiné à cette comparaison doit être isolé avant d'afficher une formulation technique.", sourceIds: ["fiqh-majmu-prayer-invalidators"], verificationStatus: "partial" },
      { label: "Hanbalite", position: "Ibn Qudama autorise le mouvement léger et précise qu'il n'est limité ni à trois gestes ni à un autre nombre fixe. Il renvoie la distinction entre beaucoup et peu à l'usage et aux actes comparables à ceux rapportés dans les textes.", sourceIds: ["fiqh-mughni-prayer-movements"], verificationStatus: "verified_primary" },
    ],
    practicalNote: "Il ne faut donc pas compter mécaniquement les gestes. Un petit ajustement, un mouvement lié à un besoin et une succession d'actions importantes ne relèvent pas automatiquement du même jugement.",
    limits: [
      "Aucune règle universelle « trois mouvements = prière annulée » n'est affichée.",
      "La nécessité et les actes accomplis dans l'intérêt de la prière doivent être distingués des mouvements inutiles.",
      "La position shafi‘ite détaillée reste volontairement incomplète dans cette comparaison tant que son passage primaire ciblé n'est pas isolé.",
      "Les situations personnelles où l'on hésite sur la quantité ou la nécessité ne sont pas tranchées automatiquement par cette fiche.",
    ],
  });
  prayerInvalidatorsForMovements.sourceIds.push("fiqh-badai-prayer-movements", "fiqh-dusuqi-prayer-movements", "fiqh-mughni-prayer-movements");
  prayerInvalidatorsForMovements.content = {
    ...prayerInvalidatorsForMovements.content,
    ceQuiEstEtabli: [
      ...(prayerInvalidatorsForMovements.content?.ceQuiEstEtabli ?? []),
      e("Les mouvements ne sont pas tous traités de la même manière : les sources étudiées distinguent notamment le mouvement léger du mouvement important et prennent en compte le besoin ou la nécessité.", "fiqh-badai-prayer-movements", "fiqh-dusuqi-prayer-movements", "fiqh-mughni-prayer-movements"),
    ],
    enseignements: [
      ...(prayerInvalidatorsForMovements.content?.enseignements ?? []),
      e("Compter simplement les gestes peut être trompeur : les passages contrôlés utilisent des critères qualitatifs et l'usage, et le texte hanbalite étudié rejette explicitement un seuil fixe de trois mouvements.", "fiqh-badai-prayer-movements", "fiqh-mughni-prayer-movements"),
    ],
    limites: [
      ...(prayerInvalidatorsForMovements.content?.limites ?? []),
      "Le complément sur les mouvements ne constitue pas encore une comparaison shafi‘ite complète ; aucune position manquante n'a été inventée.",
    ],
    questions: [
      ...(prayerInvalidatorsForMovements.content?.questions ?? []),
      { id: "prayer-invalidators-movements", question: "Est-ce que trois mouvements annulent automatiquement la prière ?", answer: [e("Non, cette formule ne doit pas être utilisée comme règle générale. Ibn Qudama indique explicitement que le mouvement permis n'est pas fixé à trois gestes et renvoie la distinction entre beaucoup et peu à l'usage. Al-Kasani rapporte lui aussi plusieurs critères et privilégie une appréciation qualitative plutôt qu'un compteur universel.", "fiqh-badai-prayer-movements", "fiqh-mughni-prayer-movements")] },
      { id: "prayer-invalidators-needed-movement", question: "Un mouvement fait pour un besoin annule-t-il forcément la prière ?", answer: [e("Non. Les passages étudiés distinguent les mouvements légers ou nécessaires des actions importantes étrangères à la prière. Ibn Qudama cite plusieurs mouvements accomplis pour un besoin sans invalidation, et al-Kasani traite séparément l'état de nécessité.", "fiqh-badai-prayer-movements", "fiqh-mughni-prayer-movements")] },
    ],
  };
}



// Finalisation éditoriale additive — livre Prière V1.
// Aucun contenu religieux existant n'est supprimé ; les blocs ci-dessous complètent uniquement les fiches existantes.

const PRAYER_TRAVEL_STATUS_DIFFERENCE: FiqhDifference = {
  id: "prayer-travel-qasr-status",
  question: "Quel est le statut du qasr selon les écoles ?",
  established: "Les textes établissent le raccourcissement en voyage, mais les écoles ne lui donnent pas toutes la même qualification juridique.",
  positions: [
    { label: "Hanafite", position: "Dans Badâ’i‘ as-Sanâ’i‘, le qasr est présenté comme une ‘azîma et l’argumentation le rattache au caractère obligatoire de l’ordre. Pour les prières concernées, les deux raka‘ât constituent le farḍ du voyageur dans l’exposé étudié.", sourceIds: ["fiqh-badai-qasr-hanafi"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "Al-Istidhkâr rapporte d’Abû Mus‘ab, de Mâlik, que le qasr est une sunna mu’akkada pour les hommes et les femmes ; le même développement le présente comme non obligatoire. Cette fiche conserve cette qualification sans la transformer en obligation.", sourceIds: ["fiqh-istidhkar-qasr-maliki"], verificationStatus: "verified_primary" },
    { label: "Shafi‘ite", position: "Al-Majmû‘ expose que le voyageur concerné peut raccourcir ou accomplir la prière complète ; le qasr est présenté comme préférable dans le cas principal étudié, avec des nuances selon les situations.", sourceIds: ["fiqh-majmu-qasr-shafii"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Al-Mughnî expose que le voyageur peut raccourcir ou accomplir la prière complète et rapporte une préférence d’Ahmad pour le qasr.", sourceIds: ["fiqh-mughni-qasr-hanbali"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "Cette comparaison décrit les qualifications documentées sans sélectionner un avis pour l’utilisateur.",
  limits: ["Les conditions permettant d’être juridiquement voyageur sont présentées séparément."],
};

const PRAYER_TRAVEL_DISTANCE_DIFFERENCE: FiqhDifference = {
  id: "prayer-travel-qasr-distance",
  question: "Quelle distance les écoles retiennent-elles ?",
  established: "Les ouvrages classiques expriment la distance avec leurs propres unités. Cette V1 conserve ces unités et ne publie pas de conversion unique en kilomètres.",
  positions: [
    { label: "Hanafite", position: "La formulation principale étudiée retient trois jours de marche habituelle. Le même passage rapporte des variantes internes, notamment deux jours et le début du troisième, quinze farsakh ou trois étapes.", sourceIds: ["fiqh-badai-qasr-hanafi"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "Al-Mudawwana retient quatre burud, également exprimés comme quarante-huit milles dans le passage étudié.", sourceIds: ["fiqh-mudawwana-qasr-maliki"], verificationStatus: "verified_primary" },
    { label: "Shafi‘ite", position: "Al-Majmû‘ retient deux marhala, expliquées dans le passage étudié comme quarante-huit milles hachémites.", sourceIds: ["fiqh-majmu-qasr-shafii"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Al-Mughnî rapporte seize farsakh, quarante-huit milles ou quatre burud pour la distance étudiée.", sourceIds: ["fiqh-mughni-qasr-hanbali"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "Les unités classiques ne sont pas converties automatiquement en kilomètres, car leurs équivalences modernes nécessitent une méthode documentaire distincte.",
};

const PRAYER_TRAVEL_STAY_DIFFERENCE: FiqhDifference = {
  id: "prayer-travel-qasr-stay",
  question: "Combien de temps un voyageur peut-il prévoir de rester tout en conservant le qasr ?",
  established: "L’intention de résidence met fin aux dispenses du voyage selon des seuils différents dans les ouvrages étudiés.",
  positions: [
    { label: "Hanafite", position: "Badâ’i‘ as-Sanâ’i‘ indique qu’une intention de résidence de quinze jours dans un même lieu fait devenir résident. Le cas d’un séjour sans durée déterminée est traité séparément dans le passage classique.", sourceIds: ["fiqh-badai-qasr-hanafi"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "Al-Mudawwana rattache l’itmâm à l’intention d’une résidence de quatre jours. Mawâhib al-Jalîl détaille le rapport avec vingt prières et distingue le traitement des jours d’arrivée et de départ ; cette V1 ne réduit pas ce calcul à 96 heures.", sourceIds: ["fiqh-mudawwana-qasr-maliki", "fiqh-mawahib-qasr-maliki"], verificationStatus: "partial" },
    { label: "Shafi‘ite", position: "Al-Majmû‘ indique que l’intention de séjourner quatre jours, en dehors du jour d’arrivée et du jour de départ, fait cesser les dispenses du voyage dans la position exposée.", sourceIds: ["fiqh-majmu-qasr-shafii"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Dans la transmission exposée par Al-Mughnî, l’intention d’une résidence dépassant le nombre de prières indiqué dans le passage entraîne l’itmâm ; le texte rapporte aussi des variantes internes.", sourceIds: ["fiqh-mughni-qasr-hanbali"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "La durée réellement passée sur place ne doit pas être confondue avec la durée que la personne a décidé de séjourner.",
  limits: ["Les séjours indéterminés et les changements d’intention comportent des développements propres à chaque école et ne sont pas résumés ici de manière exhaustive."],
};

const PRAYER_TRAVEL_START_DIFFERENCE: FiqhDifference = {
  id: "prayer-travel-qasr-start",
  question: "Quand le qasr commence-t-il ?",
  established: "Dans les passages étudiés, la simple intention de voyager ne suffit pas : le départ effectif de la zone habitée est pris en compte.",
  positions: [
    { label: "Hanafite", position: "Badâ’i‘ as-Sanâ’i‘ rattache le statut du voyageur à l’intention du voyage et à la sortie de la zone bâtie de la ville.", sourceIds: ["fiqh-badai-qasr-hanafi"], verificationStatus: "verified_primary" },
    { label: "Malikite", position: "Al-Mudawwana rapporte que le voyageur raccourcit après avoir dépassé les habitations de la localité dans le cas étudié.", sourceIds: ["fiqh-mudawwana-qasr-maliki"], verificationStatus: "verified_primary" },
    { label: "Shafi‘ite", position: "Al-Majmû‘ exige la séparation du lieu de résidence et traite la sortie de la zone bâtie selon la configuration de la localité.", sourceIds: ["fiqh-majmu-qasr-shafii"], verificationStatus: "verified_primary" },
    { label: "Hanbalite", position: "Al-Mughnî indique que celui qui a l’intention de voyager ne raccourcit pas avant d’avoir quitté les habitations de sa localité.", sourceIds: ["fiqh-mughni-qasr-hanbali"], verificationStatus: "verified_primary" },
  ],
  practicalNote: "Cette section décrit le début du statut de voyage dans les passages étudiés ; elle ne traite pas les frontières urbaines modernes complexes.",
};

const PRAYER_TRAVEL_EXTRA_QUESTIONS: FiqhQuestion[] = [
  { id: "prayer-travel-status-schools", question: "Le qasr est-il obligatoire ou simplement permis ?", answer: [e("Les écoles ne le qualifient pas toutes de la même manière. Le passage hanafite étudié le présente comme une ‘azîma avec un raisonnement d’obligation ; la transmission malikite retenue le qualifie de sunna mu’akkada et non obligatoire ; Al-Majmû‘ permet le qasr et l’itmâm et présente le qasr comme préférable dans le cas principal étudié ; Al-Mughnî permet les deux et rapporte une préférence pour le qasr.", "fiqh-badai-qasr-hanafi", "fiqh-istidhkar-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")] },
  { id: "prayer-travel-distance-schools", question: "Quelle distance faut-il parcourir pour le qasr ?", answer: [e("Les ouvrages utilisent des unités classiques. Hanafite : trois jours de marche habituelle dans la formulation principale. Malikite : quatre burud / quarante-huit milles. Shafi‘ite : deux marhala / quarante-huit milles hachémites. Hanbalite : seize farsakh / quarante-huit milles / quatre burud. Aucune conversion unique en kilomètres n’est imposée ici.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")] },
  { id: "prayer-travel-stay-schools", question: "Combien de temps puis-je prévoir de rester tout en conservant le qasr ?", answer: [e("Les seuils diffèrent et dépendent de l’intention de résidence. Hanafite : quinze jours dans le passage étudié. Malikite : un repère de quatre jours avec un calcul classique détaillé autour des jours d’arrivée, de départ et de vingt prières. Shafi‘ite : quatre jours hors jours d’arrivée et de départ. Hanbalite : le passage étudié organise le seuil par nombre de prières et rapporte des variantes. Cette réponse ne transforme pas ces repères en durée horaire universelle.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-mawahib-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")] },
  { id: "prayer-travel-start-schools", question: "Quand puis-je commencer à raccourcir ?", answer: [e("Les passages étudiés des quatre écoles prennent en compte le départ effectif de la zone habitée : la simple intention de voyager ne suffit pas à elle seule.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")] },
];

const prayerTravelFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-travel");
if (prayerTravelFinal && !prayerTravelFinal.differences.some((difference) => difference.id === "prayer-travel-qasr-status")) {
  prayerTravelFinal.differences.push(PRAYER_TRAVEL_STATUS_DIFFERENCE, PRAYER_TRAVEL_DISTANCE_DIFFERENCE, PRAYER_TRAVEL_STAY_DIFFERENCE, PRAYER_TRAVEL_START_DIFFERENCE);
  prayerTravelFinal.sourceIds.push("quran-4-101", "fiqh-badai-qasr-hanafi", "fiqh-istidhkar-qasr-maliki", "fiqh-mudawwana-qasr-maliki", "fiqh-mawahib-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali");
  prayerTravelFinal.content = {
    ...prayerTravelFinal.content,
    definition: [...(prayerTravelFinal.content?.definition ?? []), e("Le qasr désigne ici le raccourcissement des prières concernées pendant le voyage ; Muslim 687a rapporte deux raka‘ât pour le voyageur et quatre pour le résident dans le récit retenu.", "muslim-687a")],
    ceQuiEstEtabli: [...(prayerTravelFinal.content?.ceQuiEstEtabli ?? []), e("Coran 4:101 mentionne le raccourcissement de la prière en voyage dans le contexte énoncé par le verset.", "quran-4-101")],
    pratique: [...(prayerTravelFinal.content?.pratique ?? []), e("Les passages classiques étudiés des quatre écoles prennent en compte la sortie effective de la zone habitée pour le début du qasr, et non la seule intention de voyager.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")],
    enseignements: [...(prayerTravelFinal.content?.enseignements ?? []), e("Les écoles divergent sur la qualification du qasr, la distance et l’intention de résidence ; leurs unités et méthodes classiques sont conservées sans conversion moderne automatique.", "fiqh-badai-qasr-hanafi", "fiqh-istidhkar-qasr-maliki", "fiqh-mudawwana-qasr-maliki", "fiqh-mawahib-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali")],
    limites: [...(prayerTravelFinal.content?.limites ?? []), "Les unités classiques de distance ne sont pas converties ici en un nombre unique de kilomètres.", "La durée du séjour dépend de l’intention de résidence et de méthodes différentes selon les écoles ; elle ne doit pas être réduite à une règle horaire universelle.", "Le regroupement des prières relève de la fiche distincte « Regroupement ».", "Les transports modernes, le travail itinérant, les résidences multiples et les situations personnelles complexes ne sont pas tranchés dans cette V1."],
    questions: [...(prayerTravelFinal.content?.questions ?? []), ...PRAYER_TRAVEL_EXTRA_QUESTIONS],
  };
}

const PRAYER_INTENTION_TOPIC: FiqhTopic = {
  id: "prayer-intention",
  categoryId: "prayer",
  title: "Intention (niyya)",
  arabicTerm: "النية",
  summary: "L’intention précède l’acte ; sa place est dans le cœur et elle n’a pas besoin d’être prononcée.",
  aliases: ["intention prière", "niyya", "niyyah", "prononcer intention"],
  badge: "LARGEMENT ÉTABLI",
  publicationStatus: "published",
  established: ["Les actes dépendent des intentions dans le hadith authentique ; la formulation verbale de la niyya avant la prière n’est pas légiférée dans l’avis documenté de Shaykh Ibn Bâz."],
  proofs: ["Sahîh al-Bukhârî, 1 ; fatwâ de Shaykh Ibn Bâz sur la niyya de la prière."],
  evidence: [
    e("Le hadith authentique pose le principe général selon lequel les actes dépendent des intentions.", "bukhari-1"),
    e("Shaykh Ibn Bâz explique que la niyya de la prière est dans le cœur et que la prononcer verbalement avant la prière n’est pas légiférée.", "scholar-ibn-baz-niyyah-prayer"),
  ],
  content: {
    introduction: "La niyya est l’intention avec laquelle le fidèle accomplit sa prière. Elle ne demande pas une formule compliquée à réciter avant le takbîr.",
    definition: [e("Le principe général du hadith rattache les actes à l’intention de la personne.", "bukhari-1")],
    ceQuiEstEtabli: [
      e("L’intention est une affaire du cœur : savoir quelle prière on s’apprête à accomplir et la vouloir suffit dans l’explication retenue.", "bukhari-1", "scholar-ibn-baz-niyyah-prayer"),
      e("La prononciation d’une formule telle que « j’ai l’intention de prier… » avant la prière n’est pas légiférée dans la fatwâ retenue de Shaykh Ibn Bâz.", "scholar-ibn-baz-niyyah-prayer"),
    ],
    pratique: [e("Lorsque le fidèle se lève pour accomplir la prière qu’il connaît et qu’il veut accomplir, cette intention du cœur suffit dans l’explication retenue.", "scholar-ibn-baz-niyyah-prayer")],
    enseignements: [e("La simplicité de la niyya évite de transformer l’intention en formule verbale ou en source de doute répétitif.", "scholar-ibn-baz-niyyah-prayer")],
    limites: ["Cette fiche n’entre pas dans toutes les divergences techniques sur le moment exact de la niyya ou le changement d’intention en cours de prière."],
    questions: [
      { id: "prayer-intention-verbal", question: "Dois-je dire à voix haute : « j’ai l’intention de prier… » ?", answer: [e("Non dans l’avis documenté ici. Shaykh Ibn Bâz explique que la niyya est dans le cœur et que la prononciation verbale avant la prière n’est pas légiférée.", "scholar-ibn-baz-niyyah-prayer")] },
      { id: "prayer-intention-heart", question: "Comment avoir l’intention sans la prononcer ?", answer: [e("Le fait de savoir quelle prière on va accomplir et de se lever pour l’accomplir constitue l’intention du cœur dans l’explication retenue.", "bukhari-1", "scholar-ibn-baz-niyyah-prayer")] },
    ],
  },
  howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: ["L’intention est dans le cœur ; elle n’a pas besoin d’une formule prononcée."],
  sourceIds: ["bukhari-1", "scholar-ibn-baz-niyyah-prayer"],
};

const PRAYER_ADHAN_TOPIC: FiqhTopic = {
  id: "prayer-adhan-iqama",
  categoryId: "prayer",
  title: "Adhân et iqâma",
  arabicTerm: "الأذان والإقامة",
  summary: "L’appel à la prière et l’annonce de son commencement dans les récits authentiques.",
  aliases: ["adhan", "adhân", "azan", "iqama", "iqâma", "appel prière"],
  badge: "LARGEMENT ÉTABLI",
  publicationStatus: "published",
  established: ["Bukhârî 628 rapporte que lorsque le temps de la prière arrive, l’un des musulmans prononce l’adhân et qu’un imam dirige la prière."],
  proofs: ["Sahîh al-Bukhârî, 628."],
  evidence: [e("Le récit ordonne à l’un des membres du groupe de prononcer l’adhân lorsque le temps de la prière arrive.", "bukhari-628")],
  content: {
    introduction: "L’adhân annonce l’entrée du temps de la prière et rassemble les fidèles. Cette fiche présente le principe rapporté sans reproduire toute la jurisprudence de l’appel à la prière.",
    ceQuiEstEtabli: [e("Dans le récit de Mâlik ibn al-Huwayrith, lorsque le temps de la prière arrive, l’un des membres du groupe prononce l’adhân et l’un d’eux dirige la prière.", "bukhari-628")],
    enseignements: [e("L’adhân est relié au temps de la prière et à l’organisation de la prière en groupe dans le récit retenu.", "bukhari-628")],
    limites: ["Les formulations détaillées de l’adhân, le nombre de répétitions, le statut de l’iqâma et les divergences de fiqh ne sont pas développés dans cette V1."],
    questions: [
      { id: "prayer-adhan-when", question: "Quand l’adhân est-il prononcé dans le récit ?", answer: [e("Le récit le rattache à l’arrivée du temps de la prière.", "bukhari-628")] },
      { id: "prayer-adhan-group", question: "Qui prononce l’adhân lorsqu’un groupe prie ?", answer: [e("Dans le récit, l’un des membres du groupe le prononce lorsque le temps de la prière arrive.", "bukhari-628")] },
    ],
  },
  howTo: [], conditions: [], invalidators: [], commonMistakes: [], specialCases: [], differences: [], takeaway: ["L’adhân est relié à l’entrée du temps et à la prière en groupe dans le récit authentique."],
  sourceIds: ["bukhari-628"],
};

if (!PUBLISHED_PRAYER_TOPICS.some((topic) => topic.id === "prayer-intention")) PUBLISHED_PRAYER_TOPICS.push(PRAYER_INTENTION_TOPIC);
if (!PUBLISHED_PRAYER_TOPICS.some((topic) => topic.id === "prayer-adhan-iqama")) PUBLISHED_PRAYER_TOPICS.push(PRAYER_ADHAN_TOPIC);
const prayerCategoryFinal = FIQH_CATEGORIES.find((category) => category.id === "prayer");
if (prayerCategoryFinal) {
  if (!prayerCategoryFinal.topicIds.includes("prayer-intention")) prayerCategoryFinal.topicIds.splice(1, 0, "prayer-intention");
  if (!prayerCategoryFinal.topicIds.includes("prayer-adhan-iqama")) prayerCategoryFinal.topicIds.splice(2, 0, "prayer-adhan-iqama");
}
const prayerFoundationsFinal = PRAYER_CHAPTERS.find((chapter) => chapter.id === "prayer-foundations");
if (prayerFoundationsFinal) {
  if (!prayerFoundationsFinal.topicIds.includes("prayer-intention")) prayerFoundationsFinal.topicIds.splice(1, 0, "prayer-intention");
  if (!prayerFoundationsFinal.topicIds.includes("prayer-adhan-iqama")) prayerFoundationsFinal.topicIds.push("prayer-adhan-iqama");
}

const prayerStatusFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-status");
if (prayerStatusFinal && !prayerStatusFinal.sourceIds.includes("bukhari-8")) {
  prayerStatusFinal.sourceIds.push("bukhari-8");
  prayerStatusFinal.evidence?.push(e("Le récit d’Ibn ‘Umar compte l’établissement de la prière parmi les cinq piliers mentionnés de l’Islam.", "bukhari-8"));
  prayerStatusFinal.content = {
    ...prayerStatusFinal.content,
    ceQuiEstEtabli: [...(prayerStatusFinal.content?.ceQuiEstEtabli ?? []), e("Le hadith d’Ibn ‘Umar mentionne l’établissement de la prière parmi les cinq piliers de l’Islam.", "bukhari-8")],
    questions: [...(prayerStatusFinal.content?.questions ?? []), { id: "prayer-status-pillar", question: "La prière fait-elle partie des piliers de l’Islam ?", answer: [e("Oui. Le récit authentique d’Ibn ‘Umar mentionne l’établissement de la prière parmi les cinq piliers.", "bukhari-8")] }],
  };
}

const prayerImamFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-imam-following");
if (prayerImamFinal && !prayerImamFinal.sourceIds.includes("bukhari-722")) {
  prayerImamFinal.sourceIds.push("bukhari-722");
  prayerImamFinal.evidence?.push(e("Le hadith établit le principe que l’imam est fait pour être suivi et décrit le fait de s’incliner, se relever et se prosterner à sa suite.", "bukhari-722"));
  prayerImamFinal.content = {
    ...prayerImamFinal.content,
    ceQuiEstEtabli: [...(prayerImamFinal.content?.ceQuiEstEtabli ?? []), e("Bukhârî 722 énonce explicitement que l’imam est fait pour être suivi et relie le rukû‘, le redressement et le sujûd du fidèle à ceux de l’imam.", "bukhari-722")],
    pratique: [...(prayerImamFinal.content?.pratique ?? []), e("Le récit décrit le fidèle accomplissant les mouvements à la suite de l’imam plutôt qu’en contradiction avec lui.", "bukhari-722")],
    limites: [...(prayerImamFinal.content?.limites ?? []), "La récitation derrière l’imam est traitée séparément dans la fiche al-Fâtiha ; les cas de retard et de devancement détaillés demandent leur propre étude."],
    questions: [...(prayerImamFinal.content?.questions ?? []), { id: "prayer-imam-following-basic", question: "Quel principe le hadith donne-t-il pour suivre l’imam ?", answer: [e("Le hadith dit que l’imam est fait pour être suivi et décrit le fidèle s’inclinant, se relevant et se prosternant à sa suite.", "bukhari-722")] }],
  };
}

const prayerRukuFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-ruku");
if (prayerRukuFinal && !prayerRukuFinal.sourceIds.includes("muslim-479a")) {
  prayerRukuFinal.sourceIds.push("muslim-479a");
  prayerRukuFinal.evidence?.push(e("Le récit distingue le rukû‘ comme lieu de glorification du Seigneur plutôt que de récitation du Coran.", "muslim-479a"));
  prayerRukuFinal.content = {
    ...prayerRukuFinal.content,
    enseignements: [...(prayerRukuFinal.content?.enseignements ?? []), e("Muslim 479a enseigne de glorifier le Seigneur en rukû‘ et rapporte l’interdiction d’y réciter le Coran.", "muslim-479a")],
    questions: [...(prayerRukuFinal.content?.questions ?? []), { id: "prayer-ruku-quran", question: "Récite-t-on le Coran pendant le rukû‘ ?", answer: [e("Le récit de Muslim 479a rapporte l’interdiction de réciter le Coran en rukû‘ et oriente cette position vers la glorification du Seigneur.", "muslim-479a")] }],
  };
}

const prayerSujudFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-sujud");
if (prayerSujudFinal) {
  for (const sourceId of ["muslim-479a", "muslim-482"]) if (!prayerSujudFinal.sourceIds.includes(sourceId)) prayerSujudFinal.sourceIds.push(sourceId);
  prayerSujudFinal.content = {
    ...prayerSujudFinal.content,
    enseignements: [
      ...(prayerSujudFinal.content?.enseignements ?? []),
      e("Muslim 479a oriente le sujûd vers l’invocation plutôt que vers la récitation du Coran.", "muslim-479a"),
      e("Muslim 482 encourage à multiplier l’invocation en prosternation.", "muslim-482"),
    ],
    questions: [...(prayerSujudFinal.content?.questions ?? []), { id: "prayer-sujud-dua", question: "Le sujûd est-il un moment d’invocation ?", answer: [e("Oui. Muslim 482 encourage à multiplier l’invocation en prosternation, et Muslim 479a distingue le sujûd de la récitation du Coran.", "muslim-482", "muslim-479a")] }],
  };
}

const prayerFridayFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-friday");
if (prayerFridayFinal) {
  for (const sourceId of ["muslim-857a", "muslim-857b"]) if (!prayerFridayFinal.sourceIds.includes(sourceId)) prayerFridayFinal.sourceIds.push(sourceId);
  prayerFridayFinal.content = {
    ...prayerFridayFinal.content,
    ceQuiEstEtabli: [
      ...(prayerFridayFinal.content?.ceQuiEstEtabli ?? []),
      e("Muslim 857a rapporte le ghusl, la venue à Jumu‘a, la prière possible avant la khutba, l’écoute silencieuse de la khutba puis la prière avec l’imam.", "muslim-857a"),
      e("Muslim 857b insiste sur l’écoute et le silence pendant la khutba et met en garde contre un geste distrayant dans le récit.", "muslim-857b"),
    ],
    pratique: [...(prayerFridayFinal.content?.pratique ?? []), e("Pendant la khutba, les récits retenus mettent l’accent sur l’écoute et le silence.", "muslim-857a", "muslim-857b")],
    limites: [...(prayerFridayFinal.content?.limites ?? []), "Le nombre minimal de participants, les conditions territoriales, les détails de la khutba et les catégories de personnes concernées ne sont pas tranchés dans cette V1."],
    questions: [
      ...(prayerFridayFinal.content?.questions ?? []),
      { id: "prayer-friday-listen", question: "Que faire pendant la khutba ?", answer: [e("Les récits retenus mettent l’accent sur l’écoute et le silence jusqu’à la fin de la khutba.", "muslim-857a", "muslim-857b")] },
      { id: "prayer-friday-enter-khutba", question: "Que rapporte le hadith pour celui qui entre pendant la khutba ?", answer: [e("Muslim 875g rapporte deux raka‘ât dans le cas de celui qui entre pendant la khutba.", "muslim-875g")] },
    ],
  };
}

const prayerEidFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-eid");
if (prayerEidFinal) {
  prayerEidFinal.publicationStatus = "limited";
  prayerEidFinal.badge = "V1 LIMITÉ";
  prayerEidFinal.summary = "Repères authentiques sur la prière des deux Aïd : deux raka‘ât, prière avant la khutba, sans adhân ni iqâma dans les récits retenus.";
  for (const sourceId of ["bukhari-957", "bukhari-958-961", "bukhari-989", "muslim-886a"]) if (!prayerEidFinal.sourceIds.includes(sourceId)) prayerEidFinal.sourceIds.push(sourceId);
  prayerEidFinal.evidence = [
    ...(prayerEidFinal.evidence ?? []),
    e("Le récit d’Ibn ‘Umar rapporte la prière de l’Aïd avant la khutba.", "bukhari-957"),
    e("Les récits de Bukhârî et Muslim rapportent l’absence d’adhân et d’iqâma pour les prières des deux Aïd.", "bukhari-958-961", "muslim-886a"),
    e("Bukhârî 989 rapporte deux raka‘ât accomplies le jour de ‘Îd al-Fitr.", "bukhari-989"),
  ];
  prayerEidFinal.content = {
    introduction: "Les récits authentiques permettent déjà de présenter quelques repères sûrs sur la prière des deux Aïd, sans reconstruire tous les détails juridiques à partir de sources insuffisantes.",
    ceQuiEstEtabli: [
      e("La prière de l’Aïd est rapportée avant la khutba.", "bukhari-957", "bukhari-958-961"),
      e("Aucun adhân ni iqâma n’est rapporté pour les prières de ‘Îd al-Fitr et ‘Îd al-Adhâ dans les récits retenus.", "bukhari-958-961", "muslim-886a"),
      e("Bukhârî 989 rapporte une prière de deux raka‘ât le jour de ‘Îd al-Fitr.", "bukhari-989"),
    ],
    pratique: [e("Dans les récits retenus, la prière précède la khutba et se déroule sans adhân ni iqâma.", "bukhari-957", "bukhari-958-961", "muslim-886a")],
    limites: ["Cette V1 ne fixe pas le nombre de takbîr supplémentaires, leurs emplacements, les règles du retardataire, le statut juridique détaillé de la prière ni toutes les divergences entre écoles."],
    questions: [
      { id: "prayer-eid-rakah", question: "Combien de raka‘ât sont rapportées pour la prière de l’Aïd ?", answer: [e("Bukhârî 989 rapporte deux raka‘ât dans le cas de ‘Îd al-Fitr.", "bukhari-989")] },
      { id: "prayer-eid-adhan", question: "Y a-t-il un adhân ou une iqâma pour l’Aïd ?", answer: [e("Les récits retenus de Bukhârî et Muslim rapportent qu’il n’y avait ni adhân ni iqâma pour les prières des deux Aïd.", "bukhari-958-961", "muslim-886a")] },
      { id: "prayer-eid-khutba", question: "La khutba vient-elle avant ou après la prière ?", answer: [e("Dans les récits retenus, la prière est accomplie avant la khutba.", "bukhari-957", "bukhari-958-961")] },
    ],
  };
  prayerEidFinal.established.push("Les récits authentiques retenus rapportent deux raka‘ât, la prière avant la khutba et l’absence d’adhân et d’iqâma.");
  prayerEidFinal.proofs.push("Sahîh al-Bukhârî, 957, 958–961 et 989 ; Sahîh Muslim, 886a.");
}

const prayerFuneralFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-funeral");
if (prayerFuneralFinal && !prayerFuneralFinal.sourceIds.includes("bukhari-1335")) {
  prayerFuneralFinal.sourceIds.push("bukhari-1335");
  prayerFuneralFinal.evidence?.push(e("Ibn ‘Abbâs récite al-Fâtiha dans la prière funéraire et indique qu’elle relève de la Sunnah dans le récit authentique.", "bukhari-1335"));
  prayerFuneralFinal.content = {
    ...prayerFuneralFinal.content,
    ceQuiEstEtabli: [...(prayerFuneralFinal.content?.ceQuiEstEtabli ?? []), e("Bukhârî 1335 rapporte qu’Ibn ‘Abbâs récite al-Fâtiha dans la prière funéraire et la rattache à la Sunnah.", "bukhari-1335")],
    enseignements: [...(prayerFuneralFinal.content?.enseignements ?? []), e("Les deux récits retenus documentent au moins quatre takbîr dans le cas du Najâshî et la récitation d’al-Fâtiha dans le récit d’Ibn ‘Abbâs.", "bukhari-1334", "bukhari-1335")],
    limites: [...(prayerFuneralFinal.content?.limites ?? []), "La V1 ne reconstruit pas toute la procédure de la prière funéraire, les invocations après chaque takbîr ni toutes les variantes juridiques."],
    questions: [...(prayerFuneralFinal.content?.questions ?? []), { id: "prayer-funeral-fatiha", question: "Al-Fâtiha est-elle rapportée dans la prière funéraire ?", answer: [e("Oui. Bukhârî 1335 rapporte qu’Ibn ‘Abbâs la récite et indique qu’elle relève de la Sunnah.", "bukhari-1335")] }],
  };
}

const prayerInvalidatorsMovementFinal = PUBLISHED_PRAYER_TOPICS.find((topic) => topic.id === "prayer-invalidators");
if (prayerInvalidatorsMovementFinal && !prayerInvalidatorsMovementFinal.sourceIds.includes("fiqh-majmu-prayer-movements")) {
  prayerInvalidatorsMovementFinal.sourceIds.push("fiqh-majmu-prayer-movements");
  const movementDifference = prayerInvalidatorsMovementFinal.differences.find((difference) => difference.id === "prayer-invalidators-many-movements");
  const shafiiPosition = movementDifference?.positions.find((position) => position.label === "Shafi‘ite");
  if (shafiiPosition) {
    shafiiPosition.position = "An-Nawawî distingue les actions légères des actions importantes étrangères à la prière. Le passage étudié traite notamment trois actions consécutives importantes comme invalidantes, tout en précisant que les mouvements très légers ne sont pas soumis mécaniquement à ce même compteur.";
    shafiiPosition.sourceIds = ["fiqh-majmu-prayer-movements"];
    shafiiPosition.verificationStatus = "verified_primary";
  }
  prayerInvalidatorsMovementFinal.content = {
    ...prayerInvalidatorsMovementFinal.content,
    enseignements: [...(prayerInvalidatorsMovementFinal.content?.enseignements ?? []), e("Le passage shafi‘ite étudié confirme lui aussi qu’il faut distinguer la nature et l’importance du mouvement : il ne permet pas de transformer la formule des trois mouvements en règle universelle valable pour toutes les écoles et tous les gestes.", "fiqh-majmu-prayer-movements")],
    limites: [...(prayerInvalidatorsMovementFinal.content?.limites ?? []), "La comparaison des mouvements est désormais documentée pour les quatre écoles, mais leurs critères restent distincts et ne doivent pas être fusionnés."],
  };
}


// Finalisation pédagogique — compléments interactifs Prière V1.
// Ces ajouts réutilisent exclusivement les preuves déjà enregistrées dans chaque fiche.
const prayerFaqFinalizations: Record<string, FiqhQuestion[]> = {
  "prayer-times": [
    { id: "prayer-times-text", question: "Que rapportent les textes sur les horaires de la prière ?", answer: [e("Coran 4:103 établit que la prière est prescrite à des temps déterminés, et Muslim 613b décrit des repères horaires dans le récit retenu.", "quran-4-103", "muslim-613b")] },
  ],
  "prayer-qibla": [
    { id: "prayer-qibla-direction", question: "Vers quelle direction la prière est-elle orientée ?", answer: [e("Coran 2:144 ordonne, dans le contexte du verset, de tourner le visage vers al-Masjid al-Harâm.", "quran-2-144")] },
  ],
  "prayer-purification": [
    { id: "prayer-purification-before", question: "Pourquoi la purification apparaît-elle avant la prière ?", answer: [e("Coran 5:6 relie directement les ablutions à la préparation pour la prière, tandis que Coran 4:43 mentionne également la purification et le tayammum dans ce contexte.", "quran-5-6", "quran-4-43")] },
  ],
  "prayer-takbir": [
    { id: "prayer-takbir-start", question: "Comment le récit retenu décrit-il l’entrée dans la prière ?", answer: [e("Bukhârî 757 commence la description enseignée de la prière par le takbîr, avant la récitation et les mouvements suivants.", "bukhari-757")] },
  ],
  "prayer-rising": [
    { id: "prayer-rising-place", question: "Que rapporte le récit après le rukû‘ ?", answer: [e("Bukhârî 757 distingue le redressement complet après le rukû‘ avant de passer au sujûd.", "bukhari-757")] },
  ],
  "prayer-tumanina": [
    { id: "prayer-tumanina-meaning", question: "Pourquoi la quiétude est-elle répétée dans la description de la prière ?", answer: [e("Dans Bukhârî 757, la personne est invitée à demeurer avec calme dans plusieurs positions successives ; la fiche retient cette répétition sans en déduire ici toutes les qualifications juridiques détaillées.", "bukhari-757")] },
  ],
  "prayer-tashahhud": [
    { id: "prayer-tashahhud-report", question: "Que contient la source retenue sur le tashahhud ?", answer: [e("Bukhârî 831 rapporte un texte de tashahhud enseigné dans le récit retenu. Cette fiche ne prétend pas que cette formulation épuise toutes les variantes authentiquement rapportées.", "bukhari-831")] },
  ],
  "prayer-sick": [
    { id: "prayer-sick-capacity", question: "Comment le malade prie-t-il selon le récit retenu ?", answer: [e("Bukhârî 1117 rapporte une gradation selon la capacité : debout si possible, puis assis, puis sur le côté lorsque la personne ne peut pas s’asseoir.", "bukhari-1117")] },
  ],
};
for (const [topicId, questions] of Object.entries(prayerFaqFinalizations)) {
  const current = PUBLISHED_PRAYER_TOPICS.find((candidate) => candidate.id === topicId);
  if (!current) continue;
  const existing = current.content?.questions ?? [];
  const additions = questions.filter((question) => !existing.some((item) => item.id === question.id));
  if (additions.length) current.content = { ...current.content, questions: [...existing, ...additions] };
}

// La fiche Aïd est désormais une V1 limitée et reçoit son propre chapitre afin que toute fiche publiée
// reste rattachée à la table des matières du livre Prière.
if (!PRAYER_CHAPTERS.some((chapter) => chapter.id === "prayer-eid")) {
  PRAYER_CHAPTERS.push({ id: "prayer-eid", categoryId: "prayer", title: "Les deux Aïd", topicIds: ["prayer-eid"] });
}

export const FIQH_TOPICS: FiqhTopic[] = [...FINAL_PURIFICATION, ...PUBLISHED_PRAYER_TOPICS.map((topic) => topic.id === "prayer-sahw" ? { ...topic, differences: [PRAYER_SAHW_COMPARATIVE], sourceIds: [...topic.sourceIds, "fiqh-badai-sahw", "fiqh-mawahib-sahw", "fiqh-majmu-sahw", "fiqh-mughni-sahw"], content: { ...topic.content, questions: [...(topic.content?.questions ?? []), PRAYER_SAHW_EXTRA_QUESTION] } } : topic), ...FASTING_TOPICS, ...ENRICHED_ZAKAT_TOPICS, ...HAJJ_TOPICS];
export const topicById = new Map(FIQH_TOPICS.map((topic) => [topic.id, topic]));
export const categoryById = new Map(FIQH_CATEGORIES_WITH_CHAPTERS.map((category) => [category.id, category]));
export const chapterById = new Map([...PURIFICATION_CHAPTERS, ...PRAYER_CHAPTERS].map((chapter) => [chapter.id, chapter]));
