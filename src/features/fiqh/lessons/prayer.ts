import { c, p, type LessonEntry } from "./types";


export const PRAYER_LESSONS: Record<string, LessonEntry> = {
  "prayer-status": {
    title: "La prière, deuxième pilier",
    sourceIds: ["wajiz-salah"],
    short: "Les cinq prières quotidiennes sont obligatoires pour tout musulman pubère et sain d’esprit. C’est le deuxième pilier de l’islam.",
    rules: [
      p("La prière est prescrite aux croyants à des heures déterminées.", "quran-4-103"),
      p("Elle est le deuxième des cinq piliers de l’islam, après l’attestation de foi.", "bukhari-8"),
      p("Elles sont cinq par jour : Fajr, Dhuhr, ‘Asr, Maghrib et ‘Ishâ’.", "muslim-610a"),
      p("« Ce qui sépare l’homme du polythéisme et de la mécréance, c’est le fait de négliger la prière. »", "muslim-82"),
      p("On l’ordonne aux enfants dès sept ans.", "abudawud-495"),
    ],
    cases: [
      c("Le malade est-il dispensé ?", "Non : il prie selon sa capacité, debout, assis ou couché sur le côté.", "bukhari-1117"),
      c("La femme en période de règles prie-t-elle ?", "Non, et elle ne rattrape pas ces prières.", "muslim-335a"),
    ],
  },

  "prayer-intention": {
    title: "L’intention (niyya)",
    short: "L’intention est dans le cœur : savoir quelle prière on accomplit et la vouloir suffit. Elle ne se prononce pas.",
    rules: [
      p("« La récompense des actions dépend des intentions. »", "bukhari-1"),
      p("Al-Wajîz : l’intention consiste à vouloir dans son cœur la prière que l’on accomplit et à la déterminer (Dhuhr, ‘Asr…) ; la prononcer n’est pas légiféré, car le Prophète ﷺ ne l’a pas fait.", "wajiz-salah"),
      p("Prononcer une formule comme « j’ai l’intention de prier… » n’a pas été enseigné par le Prophète ﷺ.", "scholar-ibn-baz-niyyah-prayer"),
    ],
  },

  "prayer-purification": {
    title: "Les conditions de la prière",
    short: "Avant de prier, il faut être en état de purification, avoir le corps, les vêtements et le lieu propres, couvrir sa ‘awra, que l’heure soit entrée et se tourner vers la qibla.",
    rules: [
      p("Aucune prière n’est acceptée sans purification : le wudû’, le ghusl si nécessaire, ou le tayammum.", "muslim-224", "quran-5-6", "quran-4-43"),
      p("Le corps, le vêtement et le lieu doivent être purs de toute impureté.", "quran-74-4", "wajiz-salah"),
      p("Il faut couvrir sa ‘awra : « Dans chaque lieu de Salât portez votre parure (vos habits). »", "quran-7-31"),
      p("Al-Wajîz : la ‘awra de l’homme est ce qui est entre le nombril et le genou ; il ne prie pas les épaules entièrement découvertes.", "bukhari-359", "wajiz-salah"),
      p("« Allah n’accepte pas la prière d’une femme qui a atteint la puberté si elle ne porte pas de voile. » Al-Wajîz : dans la prière, toute la femme est ‘awra sauf le visage et les mains.", "abudawud-641", "wajiz-salah"),
      p("L’heure de la prière doit être entrée.", "quran-4-103"),
      p("On se tourne vers la qibla.", "quran-2-144"),
    ],
    cases: [
      c("J’ai découvert après la prière une impureté sur mon vêtement.", "Al-Wajîz : celui qui prie avec une impureté qu’il ignore a une prière valable et ne la refait pas ; s’il l’apprend pendant la prière, il l’enlève si possible et continue.", "abudawud-650", "wajiz-salah"),
    ],
  },

  "prayer-adhan-iqama": {
    short: "L’adhân annonce l’entrée de l’heure, l’iqâma le début de la prière. Celui qui les entend répète les paroles du muezzin, puis prie sur le Prophète ﷺ et fait l’invocation de l’adhân.",
    rules: [
      p("Quand l’heure arrive, l’un du groupe fait l’adhân et le plus apte dirige la prière.", "bukhari-628"),
      p("Al-Wajîz : l’adhân est obligatoire, car le Prophète ﷺ l’a ordonné.", "wajiz-salah"),
      p("Paroles de l’adhân : « Allâhu akbar » (4 fois), « Ash-hadu an lâ ilâha illa-llâh » (2), « Ash-hadu anna Muḥammadan rasûlu-llâh » (2), « Ḥayya ‘ala-ṣ-ṣalâh » (2), « Ḥayya ‘ala-l-falâḥ » (2), « Allâhu akbar » (2), « Lâ ilâha illa-llâh » (1).", "abudawud-499"),
      p("Al-Wajîz : « Aṣ-ṣalâtu khayrun mina-n-nawm » se dit dans le premier adhân de l’aube, d’après le hadith d’Abû Mahdhûra.", "wajiz-salah"),
    ],
    steps: [
      p("Répétez chaque phrase après le muezzin.", "bukhari-611"),
      p("À « ḥayya ‘ala-ṣ-ṣalâh » et « ḥayya ‘ala-l-falâḥ », dites : « Lâ ḥawla wa lâ quwwata illâ billâh ».", "muslim-385"),
      p("À la fin, priez sur le Prophète ﷺ.", "muslim-384"),
      p("Puis dites : « Allâhumma rabba hâdhihi-d-da‘wati-t-tâmmah, wa-ṣ-ṣalâti-l-qâ’imah, âti Muḥammadan al-wasîlata wa-l-faḍîlah, wa-b‘ath-hu maqâman maḥmûdan-illadhî wa‘adtah. »", "bukhari-614"),
    ],
    cases: [
      c("Celui qui prie seul fait-il l’adhân ?", "Al-Wajîz cite le hadith d’Abû Sa‘îd : quand tu es avec tes moutons ou dans la campagne et que tu fais l’appel à la prière, élève la voix, car tout ce qui entend la voix du muezzin témoignera pour lui le Jour de la Résurrection.", "wajiz-salah"),
    ],
  },

  "prayer-times": {
    title: "Les heures de la prière",
    sourceIds: ["muslim-613b", "quran-4-103"],
    short: "Chaque prière a un début et une fin. Le mieux est de prier au début de l’heure : c’est l’acte le plus aimé d’Allah.",
    rules: [
      p("Fajr : de l’aube vraie jusqu’au lever du soleil.", "muslim-612"),
      p("Dhuhr : dès que le soleil a passé le zénith, jusqu’à ce que l’ombre d’un objet égale sa longueur.", "muslim-612"),
      p("‘Asr : ensuite, jusqu’à ce que le soleil jaunisse ; au-delà, seulement par nécessité, jusqu’au coucher.", "muslim-612"),
      p("Maghrib : du coucher du soleil jusqu’à la disparition de la lueur rouge.", "muslim-612"),
      p("‘Ishâ’ : ensuite, jusqu’au milieu de la nuit.", "muslim-612"),
      p("L’acte le plus aimé d’Allah est la prière à son heure.", "bukhari-527"),
    ],
  },

  "prayer-qibla": {
    title: "La qibla",
    short: "On prie tourné vers la Ka‘ba. Loin de La Mecque, il suffit de viser sa direction après avoir fait l’effort de la trouver.",
    rules: [
      p("« Tourne donc ton visage vers la Mosquée sacrée. »", "quran-2-144"),
      p("Pour les gens de Médine, le Prophète ﷺ a dit que ce qui est entre l’est et l’ouest est une qibla.", "tirmidhi-342"),
      p("Pour une prière surérogatoire en voyage, le Prophète ﷺ priait sur sa monture dans la direction où elle allait ; pour l’obligatoire, il descendait et faisait face à la qibla.", "bukhari-400"),
    ],
    cases: [
      c("Je me suis trompé de direction après avoir cherché.", "Al-Wajîz : celui qui a cherché la qibla, a prié dans la direction qu’il croyait juste, puis découvre son erreur, n’a pas à refaire sa prière, d’après le hadith de ‘Âmir ibn Rabî‘a.", "wajiz-salah"),
    ],
  },

  "prayer-structure": {
    title: "Comment prier, pas à pas",
    sourceIds: ["wajiz-salah"],
    short: "La prière commence par « Allâhu akbar » et se termine par le salut. Chaque rak‘a comprend la station debout avec al-Fâtiha, l’inclinaison, le redressement et deux prosternations, chaque position étant tenue avec calme.",
    rules: [
      p("« La clé de la prière, c’est la purification ; elle commence par le takbir et se termine par le salut. »", "abudawud-61"),
      p("Le Prophète ﷺ a enseigné la prière à un homme qui priait trop vite, position après position, en insistant sur le calme dans chacune.", "bukhari-757"),
      p("« Priez comme vous m’avez vu prier. »", "bukhari-631"),
    ],
    steps: [
      p("Debout face à la qibla, levez les mains à hauteur des épaules en disant « Allâhu akbar ».", "bukhari-735"),
      p("Posez la main droite sur la gauche, sur la poitrine, et dites l’invocation d’ouverture.", "bukhari-740", "bukhari-744", "wajiz-salah"),
      p("Récitez al-Fâtiha, puis une sourate dans les deux premières rak‘ât.", "bukhari-756", "bukhari-776"),
      p("Inclinez-vous en disant « Allâhu akbar », le dos droit, les mains sur les genoux : « Subḥâna rabbiya-l-‘aẓîm ».", "bukhari-828", "muslim-772"),
      p("Redressez-vous : « Sami‘a-llâhu liman ḥamidah », puis « Allâhumma rabbanâ laka-l-ḥamd ».", "bukhari-796"),
      p("Prosternez-vous sur sept os (front et nez, mains, genoux, orteils) : « Subḥâna rabbiya-l-a‘lâ ».", "bukhari-812", "muslim-772"),
      p("Asseyez-vous : « Rabbi-ghfir lî », puis faites une seconde prosternation.", "ibnmajah-897"),
      p("Relevez-vous pour la rak‘a suivante. Après la deuxième, asseyez-vous pour le tashahhud.", "bukhari-828", "bukhari-831"),
      p("À la dernière assise, dites le tashahhud, la prière sur le Prophète ﷺ, puis saluez à droite et à gauche : « As-salâmu ‘alaykum wa raḥmatu-llâh ».", "bukhari-831", "bukhari-3370", "wajiz-salah"),
    ],
    cases: [
      c("Combien de rak‘ât pour chaque prière ?", "Fajr 2, Dhuhr 4, ‘Asr 4, Maghrib 3, ‘Ishâ’ 4. En voyage, les prières de 4 se réduisent à 2.", "muslim-687a"),
      c("Que réciter dans les rak‘ât 3 et 4 ?", "Al-Fâtiha seule.", "bukhari-776"),
    ],
  },

  "prayer-takbir": {
    title: "Le takbîr d’ouverture",
    short: "La prière commence par « Allâhu akbar ». Al-Wajîz le compte parmi les piliers de la prière.",
    rules: [
      p("« La clé de la prière, c’est la purification ; elle commence par le takbir et se termine par le salut. »", "abudawud-61"),
      p("Le Prophète ﷺ a commencé par lui l’enseignement de la prière.", "bukhari-757"),
      p("On lève les mains à hauteur des épaules ou des oreilles en le prononçant.", "bukhari-735", "wajiz-salah"),
    ],
  },

  "prayer-ruku": {
    title: "L’inclinaison (rukû‘)",
    short: "On s’incline, le dos droit, les mains sur les genoux, et l’on reste calme en disant « Subḥâna rabbiya-l-‘aẓîm ». On n’y récite pas le Coran.",
    rules: [
      p("Rester incliné jusqu’à être stable.", "bukhari-757"),
      p("Le Prophète ﷺ avait le dos droit et les mains posées sur les genoux.", "bukhari-828"),
      p("Il disait : « Subḥâna rabbiya-l-‘aẓîm » (Gloire à mon Seigneur l’Immense).", "muslim-772"),
      p("« Sachez que j’ai été interdit de réciter le Coran en état d’inclinaison et de prosternation. Pendant l’inclinaison, glorifiez le Seigneur Suprême et Glorieux. »", "muslim-479a"),
    ],
    cases: [
      c("Combien de fois le dire ?", "Al-Wajîz, résumant al-Albânî : il le disait trois fois, et il disait aussi dans cette position d’autres formules.", "wajiz-salah"),
    ],
  },

  "prayer-rising": {
    title: "Le redressement",
    short: "On se redresse complètement après le rukû‘ en disant « Sami‘a-llâhu liman ḥamidah » puis « Allâhumma rabbanâ laka-l-ḥamd », et l’on se tient droit un instant.",
    rules: [
      p("Se redresser jusqu’à être droit et stable.", "bukhari-757"),
      p("L’imam dit « Sami‘a-llâhu liman ḥamidah » ; derrière lui, on dit « Allâhumma rabbanâ laka-l-ḥamd ».", "bukhari-796"),
    ],
  },

  "prayer-sujud": {
    title: "La prosternation (sujûd)",
    short: "On se prosterne sur sept os — le front avec le nez, les deux mains, les deux genoux et les orteils — en disant « Subḥâna rabbiya-l-a‘lâ ». C’est le moment où l’on est le plus proche de son Seigneur.",
    rules: [
      p("« J’ai reçu l’ordre de me prosterner sur sept os. »", "bukhari-812"),
      p("Posez les paumes et levez les coudes du sol.", "muslim-494"),
      p("Dites « Subḥâna rabbiya-l-a‘lâ » (Gloire à mon Seigneur le Très-Haut).", "muslim-772"),
      p("C’est le moment de multiplier les invocations : on y est au plus près de son Seigneur.", "muslim-482", "muslim-479a"),
    ],
  },

  "prayer-between-sujuds": {
    title: "L’assise entre les deux prosternations",
    short: "Entre les deux prosternations, on s’assoit calmement en disant « Rabbi-ghfir lî » (Seigneur, pardonne-moi).",
    rules: [
      p("S’asseoir jusqu’à être stable avant la seconde prosternation.", "bukhari-757"),
      p("Dire : « Rabbi-ghfir lî, rabbi-ghfir lî ».", "ibnmajah-897"),
    ],
  },

  "prayer-tumanina": {
    title: "Le calme dans chaque position",
    short: "La tumânîna est le fait de se stabiliser dans chaque position avant de passer à la suivante. Al-Wajîz la compte parmi les piliers de la prière.",
    rules: [
      p("À l’homme qui priait vite, le Prophète ﷺ a dit trois fois : « Retourne prier, car tu n’as pas prié », puis il lui a enseigné de rester calme à l’inclinaison, au redressement, en prosternation et assis.", "bukhari-757", "wajiz-salah"),
    ],
  },

  "prayer-fatiha": {
    title: "La récitation d’al-Fâtiha",
    short: "Al-Fâtiha est récitée à chaque rak‘a. Derrière l’imam, les écoles divergent.",
    rules: [
      p("« Celui qui ne récite pas Al-Fatiha dans sa prière, sa prière n’est pas valable. »", "bukhari-756"),
      p("Dans les deux premières rak‘ât, on ajoute une sourate ; dans les suivantes, al-Fâtiha seule.", "bukhari-776"),
      p("Quand l’imam dit « Âmîn », dites « Âmîn ».", "bukhari-780"),
    ],
    cases: [
      c("Dois-je réciter al-Fâtiha derrière l’imam ?", "Pour les shafi‘ites, oui, dans toutes les prières. Pour les malikites, on la récite quand l’imam récite à voix basse et on écoute quand il récite à voix haute. Pour les hanafites et les hanbalites, elle n’est pas obligatoire derrière l’imam. Voir les avis détaillés plus bas.", "fiqh-badai-fatiha-imam", "fiqh-zurqani-fatiha-imam", "fiqh-majmu-fatiha-imam", "fiqh-mughni-fatiha-imam"),
    ],
  },

  "prayer-tashahhud": {
    title: "Le tashahhud",
    short: "À l’assise après la deuxième rak‘a et à la dernière, on récite le tashahhud. À la dernière, on y ajoute la prière sur le Prophète ﷺ et une invocation avant le salut.",
    rules: [
      p("« At-taḥiyyâtu li-llâhi wa-ṣ-ṣalawâtu wa-ṭ-ṭayyibât. As-salâmu ‘alayka ayyuha-n-nabiyyu wa raḥmatu-llâhi wa barakâtuh. As-salâmu ‘alaynâ wa ‘alâ ‘ibâdi-llâhi-ṣ-ṣâliḥîn. Ash-hadu an lâ ilâha illa-llâh, wa ash-hadu anna Muḥammadan ‘abduhu wa rasûluh. »", "bukhari-831"),
      p("Puis, à la dernière assise : « Allâhumma ṣalli ‘alâ Muḥammadin wa ‘alâ âli Muḥammad, kamâ ṣallayta ‘alâ Ibrâhîma wa ‘alâ âli Ibrâhîm, innaka ḥamîdun majîd… »", "bukhari-3370"),
      p("Avant le salut, demandez refuge contre le châtiment de l’Enfer, celui de la tombe, l’épreuve de la vie et de la mort et celle du Faux Messie.", "muslim-588"),
    ],
    cases: [
      c("J’ai oublié le premier tashahhud.", "Continuez et faites deux prosternations de l’oubli avant le salut, comme l’a fait le Prophète ﷺ.", "bukhari-1224"),
    ],
  },

  "prayer-taslim": {
    title: "Le salut final",
    sourceIds: ["wajiz-salah"],
    short: "On termine la prière en tournant la tête à droite puis à gauche : « As-salâmu ‘alaykum wa raḥmatu-llâh ».",
    rules: [
      p("La prière « commence par le takbir et se termine par le salut ».", "abudawud-61"),
      p("Al-Wajîz, résumant al-Albânî : il saluait à droite « As-salâmu ‘alaykum wa raḥmatu-llâh », et à gauche de même ; il ajoutait parfois « wa barakâtuh » au premier salut.", "muslim-582", "wajiz-salah"),
    ],
  },

  "prayer-after-dhikr": {
    title: "Les invocations après la prière",
    chapter: "prayer-seated-ending",
    aliases: ["dhikr après la prière", "tasbih", "33", "astaghfirullah"],
    short: "Après le salut, on demande pardon trois fois, puis on glorifie Allah 33 fois, on Le loue 33 fois et on dit Allâhu akbar 33 fois.",
    rules: [p("Ces formules ont été enseignées par le Prophète ﷺ après chaque prière obligatoire.", "muslim-591", "muslim-597", "bukhari-844")],
    steps: [
      p("« Astaghfiru-llâh » trois fois, puis « Allâhumma anta-s-salâm wa minka-s-salâm, tabârakta yâ dha-l-jalâli wa-l-ikrâm ».", "muslim-591"),
      p("« Lâ ilâha illa-llâhu waḥdahu lâ sharîka lah, lahu-l-mulku wa lahu-l-ḥamd, wa huwa ‘alâ kulli shay’in qadîr. Allâhumma lâ mâni‘a limâ a‘ṭayt, wa lâ mu‘ṭiya limâ mana‘t, wa lâ yanfa‘u dha-l-jaddi minka-l-jadd. »", "bukhari-844"),
      p("« Subḥâna-llâh » 33 fois, « Al-ḥamdu li-llâh » 33 fois, « Allâhu akbar » 33 fois, et pour compléter cent : « Lâ ilâha illa-llâhu waḥdahu lâ sharîka lah… ».", "muslim-597"),
    ],
  },

  "prayer-sick": {
    title: "La prière du malade",
    short: "Le malade prie selon sa capacité : debout ; s’il ne peut pas, assis ; s’il ne peut pas, sur le côté.",
    rules: [
      p("« Prie debout, et si tu ne peux pas, prie assis, et si tu ne peux même pas faire cela, alors prie couché sur le côté. »", "bukhari-1117"),
      p("« Allah n’impose à aucune âme une charge supérieure à sa capacité. »", "quran-2-286"),
      p("« Craignez Allah, donc autant que vous pouvez. »", "quran-64-16"),
    ],
    cases: [
      c("Je ne peux pas faire le wudû’.", "Le Coran permet le tayammum au malade : « alors recourez à une terre pure ».", "quran-4-43"),
      c("Puis-je regrouper les prières ?", "Al-Wajîz cite le hadith d’Ibn ‘Abbâs : le Prophète ﷺ a regroupé à Médine sans crainte ni voyage, « afin de ne pas mettre sa communauté dans la gêne » ; il rapporte d’an-Nawawî que des imams l’ont permis pour un besoin, à condition de ne pas en faire une habitude.", "wajiz-salah"),
    ],
  },

  "prayer-travel": {
    title: "La prière en voyage",
    short: "En voyage, les prières de quatre rak‘ât (Dhuhr, ‘Asr, ‘Ishâ’) se font en deux. Fajr et Maghrib ne changent pas. On commence à raccourcir une fois sorti de sa ville.",
    rules: [
      p("« Allah a prescrit la prière par la parole de votre Prophète ﷺ : quatre rak‘ats en résidence, deux en voyage. »", "muslim-687a"),
      p("Le Coran mentionne le raccourcissement de la prière en voyage.", "quran-4-101"),
      p("Selon les quatre écoles, on commence à raccourcir après avoir quitté les habitations de sa ville, pas dès l’intention.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali"),
      p("Al-Wajîz : le raccourcissement est obligatoire pour le voyageur ; il commence en quittant sa ville, d’après Anas : « J’ai prié Dhuhr avec le Prophète ﷺ à Médine quatre rak‘ât, et à Dhul-Hulayfa deux. »", "wajiz-salah"),
    ],
    cases: [
      c("Quelle distance faut-il parcourir ?", "Les malikites, shafi‘ites et hanbalites retiennent 48 milles, les hanafites trois jours de marche. Al-Wajîz retient, avec Ibn Hazm, qu’il n’y a pas de distance fixée : tout ce que la langue arabe appelle un voyage.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali", "wajiz-salah"),
      c("Combien de temps puis-je rester sur place en raccourcissant ?", "Si vous décidez de rester plus de quatre jours, vous priez normalement selon les malikites, shafi‘ites et hanbalites ; plus de quinze jours selon les hanafites. Al-Wajîz : le Prophète ﷺ est resté vingt jours à Tabûk en raccourcissant ; celui qui n’a pas décidé de s’installer raccourcit jusqu’à son départ, et selon Ibn ‘Abbâs, celui qui décide de rester complète au-delà de dix-neuf jours.", "fiqh-badai-qasr-hanafi", "fiqh-mudawwana-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali", "fiqh-mawahib-qasr-maliki", "wajiz-salah"),
      c("Je prie derrière un imam résident.", "Al-Wajîz : le voyageur qui prie derrière un résident complète sa prière, comme l’ont dit Ibn ‘Abbâs et Ibn ‘Umar.", "wajiz-salah"),
      c("Est-ce obligatoire de raccourcir ?", "Pour les hanafites et pour al-Wajîz, oui. Les malikites en font une sunna appuyée ; les hanbalites préfèrent le raccourcissement tout en validant la prière complète ; les shafi‘ites le permettent.", "fiqh-badai-qasr-hanafi", "fiqh-istidhkar-qasr-maliki", "fiqh-majmu-qasr-shafii", "fiqh-mughni-qasr-hanbali", "wajiz-salah"),
    ],
  },

  "prayer-combining": {
    title: "Regrouper deux prières",
    short: "En voyage, on peut regrouper Dhuhr avec ‘Asr, et Maghrib avec ‘Ishâ’, à l’heure de la première ou de la seconde. Les hanafites ne le permettent qu’à ‘Arafa et Muzdalifa.",
    rules: [
      p("Le Prophète ﷺ a regroupé les prières pendant ses voyages.", "muslim-705c"),
      p("Les malikites, shafi‘ites et hanbalites le permettent en voyage ; les hanafites le réservent à ‘Arafa et Muzdalifa.", "fiqh-badai-combining-travel", "fiqh-dhakhira-combining-travel", "fiqh-majmu-combining-travel", "fiqh-mughni-combining-travel"),
      p("Al-Wajîz cite trois causes : le voyage, la pluie, et un besoin passager, à condition de ne pas en faire une habitude.", "wajiz-salah"),
    ],
    steps: [
      p("Priez la première (raccourcie si vous êtes en voyage), puis la seconde aussitôt après.", "muslim-705c"),
    ],
  },

  "prayer-latecomer": {
    title: "Le retardataire",
    short: "Celui qui arrive en retard rejoint l’imam dans la position où il se trouve, sans courir, puis complète ce qu’il a manqué après le salut de l’imam. Al-Wajîz : on compte la rak‘a si l’on a rejoint le rukû‘.",
    rules: [
      p("« Si la prière commence, ne courez pas pour y aller mais marchez calmement, priez ce que vous pouvez et complétez ce que vous avez manqué. »", "bukhari-908"),
      p("Al-Wajîz : « Quand l’un de vous vient à la prière et que l’imam est dans une position, qu’il fasse comme l’imam. »", "wajiz-salah"),
    ],
    steps: [
      p("Dites « Allâhu akbar » debout, puis rejoignez l’imam dans sa position.", "bukhari-908", "wajiz-salah"),
      p("Al-Wajîz : si vous le rejoignez au rukû‘, la rak‘a compte ; si vous le rejoignez en prosternation, prosternez-vous sans la compter.", "wajiz-salah"),
      p("Après son salut, levez-vous et complétez les rak‘ât manquées.", "bukhari-908"),
    ],
    cases: [
      c("La rak‘a rejointe est-elle le début ou la fin de ma prière ?", "Pour les shafi‘ites, c’est le début de votre prière ; pour les hanafites (Abû Hanîfa et Abû Yûsuf) et les hanbalites, c’en est la fin ; les malikites distinguent la récitation des autres actes.", "fiqh-badai-latecomer", "fiqh-maliki-latecomer", "fiqh-majmu-latecomer", "fiqh-mughni-latecomer"),
    ],
  },

  "prayer-sahw": {
    title: "La prosternation de l’oubli",
    short: "Celui qui ajoute, oublie ou doute dans sa prière fait deux prosternations. En cas de doute sur le nombre de rak‘ât, on cherche le plus juste ; si rien ne l’emporte, on retient le plus petit nombre.",
    rules: [
      p("Le Prophète ﷺ a oublié le premier tashahhud et s’est prosterné deux fois avant le salut.", "bukhari-1224"),
      p("Il a prié cinq rak‘ât par oubli et s’est prosterné deux fois après le salut.", "muslim-572a"),
      p("En cas de doute, écartez le doute, basez-vous sur ce dont vous êtes sûr, puis prosternez-vous deux fois avant le salut.", "muslim-571a"),
      p("Al-Wajîz : la prosternation de l’oubli est obligatoire, car le Prophète ﷺ l’a ordonnée et ne l’a jamais délaissée.", "wajiz-salah"),
    ],
    steps: [
      p("Terminez votre prière normalement jusqu’au tashahhud.", "muslim-571a"),
      p("Faites deux prosternations, séparées par une assise, en disant « Allâhu akbar » à chaque mouvement.", "bukhari-1224"),
      p("Saluez (si vous vous êtes prosterné avant le salut, saluez ensuite).", "bukhari-1224", "muslim-572a"),
    ],
    cases: [
      c("Avant ou après le salut ?", "Les malikites : avant pour un oubli qui diminue la prière, après pour un ajout. Les hanafites : après le salut. Les hanbalites : généralement avant, avec des cas rapportés après. Al-Wajîz retient l’avis d’Ibn Taymiyya : avant le salut pour une diminution ou un doute sans préférence, après le salut pour un ajout ou un doute tranché par la réflexion.", "fiqh-badai-sahw", "fiqh-mawahib-sahw", "fiqh-mughni-sahw", "wajiz-salah"),
    ],
  },

  "prayer-friday": {
    title: "La prière du vendredi",
    short: "La prière du vendredi (jumu‘a) remplace Dhuhr. Elle comprend un sermon puis deux rak‘ât en groupe.",
    rules: [
      p("« Quand on appelle à la Salât du jour du Vendredi, accourez à l’invocation d’Allah et laissez tout négoce. »", "quran-62-9"),
      p("Elle est un devoir pour tout musulman, sauf l’esclave, la femme, l’enfant et le malade.", "abudawud-1067"),
      p("Al-Wajîz : elle est une obligation individuelle pour tout musulman, sauf l’esclave, la femme, l’enfant, le malade et le voyageur.", "wajiz-salah"),
      p("Délaisser trois vendredis par négligence est une grave faute.", "abudawud-1052"),
      p("Pendant le sermon, on écoute en silence ; même dire « tais-toi » est une parole vaine.", "bukhari-934", "muslim-857b"),
      p("Celui qui entre pendant le sermon prie deux rak‘ât brèves avant de s’asseoir.", "muslim-875g"),
    ],
    steps: [
      p("Faites le ghusl, mettez du parfum et vos plus beaux vêtements.", "bukhari-883", "bukhari-877"),
      p("Venez tôt, priez ce que vous pouvez, puis écoutez le sermon.", "muslim-857a"),
      p("Priez les deux rak‘ât avec l’imam.", "muslim-857a"),
      p("Après, priez quatre rak‘ât à la mosquée ou deux chez vous.", "muslim-881", "bukhari-937"),
    ],
    cases: [
      c("La femme peut-elle y assister ?", "Oui : « Ne privez pas les servantes d’Allah d’aller dans les mosquées d’Allah. »", "bukhari-900"),
      c("Y a-t-il un moment d’exaucement ?", "Oui, une heure du vendredi où l’invocation est exaucée.", "bukhari-935"),
    ],
  },

  "prayer-eid": {
    title: "La prière de l’Aïd",
    sourceIds: ["wajiz-salah"],
    short: "La prière des deux Aïd compte deux rak‘ât, avec des takbîr supplémentaires, sans adhân ni iqâma. Le sermon vient après la prière.",
    rules: [
      p("Deux rak‘ât.", "bukhari-989"),
      p("Ni adhân ni iqâma.", "bukhari-958-961", "muslim-886a"),
      p("La prière avant le sermon.", "bukhari-957"),
      p("Sept takbîr dans la première rak‘a et cinq dans la seconde, avant la récitation.", "abudawud-1151"),
      p("Les femmes sortent aussi, même celles qui ont leurs règles, qui se tiennent à l’écart du lieu de prière.", "bukhari-974"),
      p("Al-Wajîz : la prière des deux Aïd est obligatoire pour les hommes et les femmes, car le Prophète ﷺ l’a toujours accomplie et a ordonné d’y sortir.", "wajiz-salah"),
    ],
    steps: [
      p("Pour l’Aïd al-Fitr, mangez quelques dattes en nombre impair avant de sortir.", "bukhari-953"),
      p("Priez les deux rak‘ât avec les takbîr, puis écoutez le sermon.", "abudawud-1151", "bukhari-957"),
      p("Revenez par un autre chemin.", "bukhari-986"),
    ],
  },

  "prayer-funeral": {
    title: "La prière funéraire",
    short: "Elle se prie debout, sans inclinaison ni prosternation, avec quatre takbîr : al-Fâtiha, la prière sur le Prophète ﷺ, l’invocation pour le défunt, puis le salut.",
    rules: [
      p("Le Prophète ﷺ a prié sur le Najâshî avec quatre takbîr.", "bukhari-1334"),
      p("Ibn ‘Abbâs y a récité al-Fâtiha et a dit : « Sachez que cela (c’est-à-dire la récitation d’Al-Fatiha) fait partie de la tradition du Prophète ﷺ. »", "bukhari-1335"),
      p("Y assister vaut un qîrât de récompense, et deux en suivant jusqu’à l’enterrement.", "bukhari-1325"),
    ],
    steps: [
      p("1er takbîr : récitez al-Fâtiha.", "bukhari-1335"),
      p("2e takbîr : priez sur le Prophète ﷺ (al-Wajîz, d’après le hadith d’Abû Umâma).", "wajiz-salah"),
      p("Takbîr suivants : invoquez sincèrement pour le défunt, par exemple « Allâhumma-ghfir lahu wa-rḥamhu… ».", "muslim-963a", "wajiz-salah"),
      p("Puis saluez.", "wajiz-salah"),
    ],
  },

  "prayer-imam-following": {
    title: "Prier derrière l’imam",
    short: "L’imam est là pour être suivi : on fait chaque mouvement après lui, jamais avant. On aligne les rangs.",
    rules: [
      p("« L’imam est là pour être suivi. Ne divergez donc pas de lui, inclinez-vous quand il s’incline… »", "bukhari-722"),
      p("Celui qui lève la tête avant l’imam s’expose à une grave menace.", "bukhari-691"),
      p("« Alignez vos rangs, car l’alignement des rangs est essentiel pour une prière correcte et complète. »", "bukhari-723"),
      p("Dirige celui qui récite le mieux le Coran.", "muslim-673"),
      p("L’imam allège la prière, car derrière lui il y a des faibles et des malades.", "bukhari-703"),
    ],
    cases: [
      c("Nous ne sommes que deux.", "Le fidèle se place à droite de l’imam, à sa hauteur.", "bukhari-699", "wajiz-salah"),
      c("Où se placent les femmes ?", "Derrière les hommes ; leurs meilleurs rangs sont les derniers.", "muslim-440"),
    ],
  },

  "prayer-congregation": {
    title: "La prière en groupe",
    chapter: "prayer-collective-friday",
    aliases: ["jamaa", "groupe", "mosquée", "en commun"],
    sourceIds: ["wajiz-salah"],
    short: "Prier en groupe vaut vingt-sept fois plus que prier seul. Al-Wajîz : c’est une obligation individuelle pour celui qui prie, sauf excuse. Les femmes peuvent venir à la mosquée, et leur prière chez elles est meilleure.",
    rules: [
      p("« La prière en groupe est vingt-sept fois supérieure à la prière faite seul. »", "bukhari-645"),
      p("Même à l’aveugle qui entendait l’appel, le Prophète ﷺ a dit : « Réponds. »", "muslim-653"),
      p("Al-Wajîz : elle est une obligation individuelle sauf excuse, d’après ces hadiths et la menace contre ceux qui la délaissent.", "wajiz-salah"),
      p("« Ne privez pas les servantes d’Allah d’aller dans les mosquées d’Allah. »", "bukhari-900"),
      p("Al-Wajîz : la femme peut aller à la mosquée sans parfum ni parure qui attire, mais sa prière chez elle est meilleure.", "wajiz-salah"),
      p("En entrant à la mosquée, priez deux rak‘ât avant de vous asseoir.", "bukhari-444"),
    ],
  },

  "prayer-missed": {
    title: "Rattraper une prière manquée",
    chapter: "prayer-corrections",
    aliases: ["qada", "prière manquée", "rattrapage", "oubli", "endormi"],
    short: "Celui qui a oublié une prière ou s’est endormi la prie dès qu’il s’en souvient. Plusieurs prières manquées se rattrapent dans l’ordre.",
    rules: [
      p("« Celui qui oublie la prière doit la faire dès qu’il s’en souvient, il n’y a pas d’autre expiation que cela. »", "bukhari-597", "muslim-684"),
      p("Le Prophète ﷺ a rattrapé ‘Asr après le coucher du soleil, puis a prié Maghrib : on respecte l’ordre.", "bukhari-596"),
      p("Al-Wajîz : pour plusieurs prières manquées, on fait un seul adhân et une iqâma pour chaque prière.", "wajiz-salah"),
    ],
    cases: [
      c("Je n’ai pas prié pendant des années.", "Al-Wajîz rapporte l’avis d’Ibn Hazm : le rattrapage n’est pas prescrit pour celui qui a délaissé volontairement une prière jusqu’à la fin de son heure, car s’il était obligatoire, Allah et Son Messager l’auraient précisé.", "wajiz-salah"),
      c("Puis-je rattraper à un moment déconseillé ?", "Oui : la prière obligatoire oubliée se fait dès qu’on s’en souvient.", "bukhari-597", "wajiz-salah"),
    ],
  },

  "prayer-forbidden-times": {
    title: "Les moments où l’on ne prie pas",
    chapter: "prayer-times-qibla",
    aliases: ["heures interdites", "moments interdits", "lever du soleil", "zénith"],
    short: "On ne fait pas de prière surérogatoire après Fajr jusqu’à ce que le soleil soit levé, au zénith, et après ‘Asr jusqu’au coucher du soleil.",
    rules: [
      p("Pas de prière après Fajr jusqu’au lever du soleil, ni après ‘Asr jusqu’à son coucher.", "bukhari-586"),
      p("Trois moments sont interdits : quand le soleil se lève, quand il est au zénith, quand il se couche.", "muslim-831"),
      p("Une prière obligatoire oubliée se fait à tout moment.", "bukhari-597"),
      p("Al-Wajîz : l’interdiction concerne la prière surérogatoire sans cause ; sont permis à ces moments le rattrapage, la prière après le wudû’ et la salutation de la mosquée.", "wajiz-salah"),
    ],
    cases: [
      c("J’entre à la mosquée après ‘Asr.", "Al-Wajîz : la salutation de la mosquée est permise : « Si l'un de vous entre dans une mosquée, il doit prier deux rak`at avant de s'asseoir. »", "bukhari-444", "wajiz-salah"),
    ],
  },

  "prayer-invalidators": {
    short: "La prière est annulée par la perte certaine des ablutions, l’abandon volontaire d’un pilier ou d’une condition, le fait de manger ou boire volontairement, la parole volontaire et le rire.",
    rules: [
      p("« Il n’est pas convenable de parler aux gens pendant la prière, car elle consiste à glorifier Allah, à proclamer Sa grandeur et à réciter le Coran. »", "muslim-537a"),
      p("Manger ou boire volontairement annule la prière obligatoire ; al-Wajîz rapporte d’Ibn al-Mundhir le consensus des savants.", "fiqh-badai-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators", "wajiz-salah"),
      p("Le rire l’annule ; al-Wajîz rapporte d’Ibn al-Mundhir le consensus des savants.", "fiqh-badai-prayer-invalidators", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators", "fiqh-mughni-prayer-invalidators", "wajiz-salah"),
      p("Les mouvements légers ou faits pour un besoin ne l’annulent pas ; ce sont les gestes nombreux et étrangers à la prière qui l’annulent.", "fiqh-badai-prayer-movements", "fiqh-dusuqi-prayer-movements", "fiqh-mughni-prayer-movements", "fiqh-majmu-prayer-movements"),
      p("Perdre ses ablutions annule la prière.", "bukhari-135"),
    ],
    cases: [
      c("Trois mouvements annulent-ils la prière ?", "Non, ce n’est pas une règle fixe. On regarde si le geste est léger ou important.", "fiqh-mughni-prayer-movements", "fiqh-badai-prayer-movements"),
      c("J’ai parlé par oubli.", "Les shafi‘ites et les malikites excusent, dans certains cas, une parole brève prononcée par oubli.", "fiqh-dusuqi-prayer-invalidators", "fiqh-majmu-prayer-invalidators"),
    ],
  },

  "prayer-witr": {
    title: "Le witr",
    chapter: "prayer-voluntary",
    aliases: ["witr", "prière impaire", "qunut"],
    short: "Le witr est une prière en nombre impair qui clôt la nuit, au minimum une rak‘a, après ‘Ishâ’ et avant l’aube. Al-Wajîz : c’est une sunna appuyée.",
    rules: [
      p("« Faites du witr votre dernière prière de la nuit. »", "bukhari-998"),
      p("« Le Witr est une rak‘a à la fin de la prière de la nuit. »", "muslim-752"),
      p("Celui qui craint de ne pas se lever le fait avant de dormir.", "muslim-755"),
      p("Al-Wajîz : ‘Alî a dit que le witr n’est pas obligatoire comme les prières prescrites ; on peut le faire d’une, trois, cinq, sept ou neuf rak‘ât.", "wajiz-salah"),
    ],
  },

  "prayer-rawatib": {
    title: "Les sunnas de la journée",
    chapter: "prayer-voluntary",
    aliases: ["rawatib", "sunna", "nafila", "duha", "tahiyyat al-masjid"],
    short: "Douze rak‘ât surérogatoires par jour bâtissent une maison au Paradis : deux avant Fajr, quatre avant Dhuhr et deux après, deux après Maghrib, deux après ‘Ishâ’.",
    rules: [
      p("« Si un serviteur musulman prie pour Allah douze unités de prière (Sounan) chaque jour, en plus des prières obligatoires, Allah lui construira une maison au Paradis. »", "muslim-728"),
      p("« Les deux unités de prière à l’aube valent mieux que ce monde et tout ce qu’il contient. »", "muslim-725"),
      p("Ibn ‘Umar en a retenu dix : deux avant et deux après Dhuhr, deux après Maghrib, deux après ‘Ishâ’, deux avant Fajr.", "bukhari-1180"),
      p("Deux rak‘ât de duḥâ, en matinée, valent une aumône pour chaque articulation du corps.", "muslim-720"),
      p("En entrant à la mosquée, priez deux rak‘ât avant de vous asseoir.", "bukhari-444"),
    ],
  },

  "prayer-night": {
    title: "La prière de la nuit et le tarâwîh",
    chapter: "prayer-voluntary",
    aliases: ["qiyam", "tahajjud", "tarawih", "prière de nuit"],
    short: "La prière de la nuit est la meilleure après l’obligatoire. Elle se prie deux rak‘ât par deux. En Ramadan, c’est le tarâwîh.",
    rules: [
      p("« La meilleure prière après les prières obligatoires est la prière de nuit. »", "muslim-1163"),
      p("« La prière de nuit se fait par deux rak`at à la fois, puis encore deux, et ainsi de suite. »", "bukhari-990"),
      p("Le Prophète ﷺ ne dépassait pas onze rak‘ât, en Ramadan comme en dehors.", "bukhari-1147"),
      p("Al-Wajîz : au minimum une rak‘a, au plus onze, d’après le hadith de ‘Â’isha ; ‘Umar a réuni les gens derrière Ubayy ibn Ka‘b en Ramadan.", "wajiz-salah"),
      p("« Celui qui prie la nuit pendant tout le mois de Ramadan avec une foi sincère et en espérant une récompense d’Allah, tous ses péchés passés lui seront pardonnés. »", "bukhari-2009"),
    ],
  },
};
