export type ProphetSourceKind = "QURAN" | "SUNNA" | "TAFSIR";

export type ProphetReference = {
  kind: ProphetSourceKind;
  label: string;
  surahId?: number;
  verse?: number;
  note: string;
};

export type ProphetChapter = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  image: number;
  atmosphere: string;
  paragraphs: string[];
  references: ProphetReference[];
  lessons: string[];
};

export const MUSA_CHAPTERS: ProphetChapter[] = [
  {
    id: "nile", index: 1, title: "L’enfant confié au fleuve", subtitle: "Une promesse au milieu de la peur",
    image: require("../../assets/images/prophets/musa-scenes/nile.jpg"), atmosphere: "Le Nil · l’enfance · la confiance",
    paragraphs: [
      "Dans une Égypte où Pharaon opprime les Enfants d’Israël, Allah inspire à la mère de Mûsâ de l’allaiter puis, lorsqu’elle craint pour lui, de le déposer dans le fleuve sans céder à la peur ni au chagrin.",
      "L’enfant est recueilli par la famille de Pharaon. Sa sœur suit sa trace à distance, tandis qu’Allah empêche Mûsâ d’accepter les nourrices qui lui sont présentées.",
      "Sa propre mère lui est finalement rendue afin que son œil se réjouisse, qu’elle ne s’afflige plus et qu’elle sache que la promesse d’Allah est vraie."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:3–13", surahId: 28, verse: 3, note: "L’oppression de Pharaon, l’inspiration donnée à la mère de Mûsâ, le fleuve et le retour auprès de sa mère." }],
    lessons: ["La confiance en Allah accompagne l’action et les moyens concrets.", "La promesse d’Allah peut se réaliser par des chemins impossibles à prévoir.", "Le récit coranique suffit : aucun détail romancé n’a besoin d’être ajouté."]
  },
  {
    id: "youth", index: 2, title: "Une erreur, puis le retour", subtitle: "Reconnaître sa faute et demander pardon",
    image: require("../../assets/images/prophets/musa-scenes/youth.jpg"), atmosphere: "Égypte · erreur · repentir",
    paragraphs: [
      "Devenu adulte, Mûsâ entre dans la ville et trouve deux hommes qui se battent. Celui de son peuple lui demande de l’aide contre son adversaire. Mûsâ frappe ce dernier, qui meurt.",
      "Le Coran rapporte immédiatement sa réaction : Mûsâ reconnaît avoir été injuste envers lui-même et demande pardon à Allah. Allah lui pardonne.",
      "Le lendemain, un homme vient l’avertir que les notables délibèrent pour le tuer. Mûsâ quitte alors la ville, inquiet et vigilant, en demandant à son Seigneur de le sauver des gens injustes."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:14–21", surahId: 28, verse: 14, note: "L’altercation, la mort involontaire, le repentir puis le départ d’Égypte." }],
    lessons: ["Le Coran montre la faute sans l’embellir et le repentir sans délai.", "Reconnaître son erreur est une force spirituelle.", "Se mettre à l’abri d’un danger réel fait partie des moyens permis."]
  },
  {
    id: "madyan", index: 3, title: "Le refuge de Madyan", subtitle: "Servir alors que l’on manque de tout",
    image: require("../../assets/images/prophets/musa-scenes/madyan.jpg"), atmosphere: "Madyan · eau · secours",
    paragraphs: [
      "En direction de Madyan, Mûsâ demande à Allah de le guider vers la voie droite. Arrivé au point d’eau, il voit des bergers et, à l’écart, deux femmes qui retiennent leur troupeau.",
      "Il les aide à abreuver leurs bêtes puis se retire à l’ombre. Là, sans ressources apparentes, il invoque Allah et reconnaît son besoin de tout bien que son Seigneur fera descendre vers lui.",
      "L’une des deux femmes revient ensuite avec pudeur et l’invite. Mûsâ trouve sécurité et travail à Madyan pour une période convenue."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:22–28", surahId: 28, verse: 22, note: "L’arrivée à Madyan, le service au point d’eau, l’invocation et l’accord conclu." }],
    lessons: ["Même dans le besoin, Mûsâ commence par rendre service.", "L’invocation peut être simple, directe et profondément confiante.", "Après la peur vient une période de stabilité accordée par Allah."]
  },
  {
    id: "tuwa", index: 4, title: "L’appel dans la vallée sacrée", subtitle: "Ṭuwâ : lorsque la mission commence",
    image: require("../../assets/images/prophets/musa-scenes/tuwa.jpg"), atmosphere: "Ṭuwâ · nuit · révélation",
    paragraphs: [
      "Après avoir accompli la période convenue, Mûsâ repart avec sa famille. Sur le chemin, il aperçoit un feu du côté du mont et s’en approche.",
      "Dans la vallée sacrée de Ṭuwâ, Allah l’appelle, lui ordonne de retirer ses sandales et lui annonce qu’Il l’a choisi. Mûsâ reçoit les signes du bâton et de la main.",
      "La mission est immense : aller vers Pharaon. Mûsâ demande alors que sa poitrine soit ouverte, sa tâche facilitée, sa langue déliée et que son frère Hârûn soit associé à sa mission."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:9–36", surahId: 20, verse: 9, note: "Le feu, Ṭuwâ, les signes et l’invocation de Mûsâ." },
      { kind: "QURAN", label: "Al-Qasas 28:29–35", surahId: 28, verse: 29, note: "Le retour depuis Madyan et la mission confiée à Mûsâ." }
    ],
    lessons: ["Une mission immense peut commencer dans un moment de solitude.", "Mûsâ demande les capacités nécessaires avant le résultat.", "Demander l’aide d’un proche compétent fait partie des moyens."]
  },
  {
    id: "pharaoh-call", index: 5, title: "Parler à Pharaon", subtitle: "La vérité, sans perdre la justesse",
    image: require("../../assets/images/prophets/musa-scenes/pharaoh-call.jpg"), atmosphere: "Palais · appel · signes",
    paragraphs: [
      "Allah envoie Mûsâ et Hârûn vers Pharaon et leur ordonne de lui parler avec douceur, malgré sa tyrannie, afin qu’il se rappelle ou craigne Allah.",
      "Mûsâ transmet le message et présente les signes qui lui ont été donnés. Pharaon refuse, conteste et cherche à réduire le signe à de la magie.",
      "Le débat porte aussi sur le Seigneur des mondes et sur les générations passées. Mûsâ reste attaché à la mission qui lui a été confiée sans se laisser entraîner par l’orgueil du pouvoir."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:43–56", surahId: 20, verse: 43, note: "L’ordre de parler avec douceur et les premiers échanges avec Pharaon." },
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:10–33", surahId: 26, verse: 10, note: "La mission de Mûsâ et Hârûn et la présentation des signes." }
    ],
    lessons: ["La fermeté dans la vérité n’exige pas la brutalité.", "Le pouvoir ne transforme pas le faux en vrai.", "La mission reste centrée sur le rappel d’Allah."]
  },
  {
    id: "magicians", index: 6, title: "Le jour des magiciens", subtitle: "Quand ceux qui savent reconnaissent le signe",
    image: require("../../assets/images/prophets/musa-scenes/magicians.jpg"), atmosphere: "Rassemblement · bâtons · prosternation",
    paragraphs: [
      "Pharaon rassemble les magiciens pour une confrontation publique. Ils jettent leurs cordes et leurs bâtons et donnent aux spectateurs l’illusion qu’ils se déplacent.",
      "Allah ordonne à Mûsâ de jeter son bâton. Le signe engloutit ce qu’ils ont fabriqué. Les magiciens comprennent immédiatement que ce qu’ils voient n’est pas de leur art.",
      "Ils se prosternent et déclarent leur foi au Seigneur de Hârûn et de Mûsâ. Les menaces de Pharaon ne leur font plus renier ce qu’ils viennent de reconnaître."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:57–73", surahId: 20, verse: 57, note: "La confrontation publique et la foi des magiciens." },
      { kind: "QURAN", label: "Al-A‘râf 7:111–126", surahId: 7, verse: 111, note: "Le rassemblement, le signe et la réaction des magiciens." }
    ],
    lessons: ["La connaissance peut permettre de reconnaître plus vite ce qui dépasse l’art humain.", "La vérité peut bouleverser une vie en un instant.", "La foi des magiciens devient plus forte que la peur du tyran."]
  },
  {
    id: "signs-egypt", index: 7, title: "Les signes en Égypte", subtitle: "Des avertissements répétés, puis oubliés",
    image: require("../../assets/images/prophets/musa-scenes/signs-egypt.jpg"), atmosphere: "Égypte · avertissements · obstination",
    paragraphs: [
      "Malgré les signes, Pharaon et les siens persistent. Le Coran mentionne plusieurs épreuves envoyées comme signes distincts : le déluge, les sauterelles, les poux, les grenouilles et le sang.",
      "À chaque épreuve, ils demandent à Mûsâ d’invoquer son Seigneur et promettent de croire et de laisser partir les Enfants d’Israël.",
      "Lorsque l’épreuve est levée, ils rompent leur engagement. Le récit montre une obstination qui se répète malgré les avertissements."
    ],
    references: [{ kind: "QURAN", label: "Al-A‘râf 7:130–135", surahId: 7, verse: 130, note: "Les années difficiles, les signes successifs et les engagements rompus." }],
    lessons: ["Un signe ne profite pas à celui qui choisit continuellement l’obstination.", "Les promesses faites dans la difficulté doivent survivre au retour de l’aisance.", "Le récit insiste sur la répétition du refus avant le dénouement."]
  },
  {
    id: "exodus", index: 8, title: "Le départ dans la nuit", subtitle: "Quitter l’oppression sur ordre d’Allah",
    image: require("../../assets/images/prophets/musa-scenes/exodus.jpg"), atmosphere: "Nuit · exode · poursuite",
    paragraphs: [
      "Allah ordonne à Mûsâ de partir de nuit avec Ses serviteurs. Le départ marque la fin d’une longue période de confrontation avec Pharaon.",
      "Pharaon rassemble alors ses forces et se lance à leur poursuite. Au lever du jour, les deux groupes se voient.",
      "Les compagnons de Mûsâ pensent être rejoints. Mûsâ répond avec certitude que son Seigneur est avec lui et qu’Il le guidera."
    ],
    references: [
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:52–62", surahId: 26, verse: 52, note: "L’ordre de partir, la poursuite et la parole de confiance de Mûsâ." },
      { kind: "QURAN", label: "Tâ-Hâ 20:77", surahId: 20, verse: 77, note: "L’ordre donné à Mûsâ de partir de nuit avec les Enfants d’Israël." }
    ],
    lessons: ["La confiance apparaît pleinement lorsque les causes visibles semblent se fermer.", "Mûsâ ne nie pas le danger : il affirme la guidance d’Allah au cœur du danger.", "La délivrance arrive après une longue patience."]
  },
  {
    id: "sea", index: 9, title: "La mer s’ouvre", subtitle: "Un passage là où aucune route n’existait",
    image: require("../../assets/images/prophets/musa-scenes/sea.jpg"), atmosphere: "Mer · passage · délivrance",
    paragraphs: [
      "Allah ordonne à Mûsâ de frapper la mer avec son bâton. La mer se fend et un chemin sec apparaît pour les Enfants d’Israël.",
      "Pharaon et son armée s’engagent à leur suite. Lorsque Mûsâ et les siens sont sauvés, les eaux se referment sur leurs poursuivants.",
      "Le Coran présente cette délivrance comme un signe majeur : celui qui se proclamait supérieur ne peut échapper au jugement d’Allah."
    ],
    references: [
      { kind: "QURAN", label: "Ash-Shu‘arâ 26:63–68", surahId: 26, verse: 63, note: "La mer fendue, le passage et la noyade des poursuivants." },
      { kind: "QURAN", label: "Yûnus 10:90–92", surahId: 10, verse: 90, note: "La noyade de Pharaon et le signe laissé aux générations suivantes." }
    ],
    lessons: ["Allah peut ouvrir une issue là où aucune route n’est visible.", "La puissance politique ne protège pas du jugement d’Allah.", "La délivrance est un signe à méditer, pas seulement une scène spectaculaire."]
  },
  {
    id: "after-sea", index: 10, title: "Après la délivrance", subtitle: "Être sauvé ne met pas fin aux épreuves",
    image: require("../../assets/images/prophets/musa-scenes/after-sea.jpg"), atmosphere: "Désert · rappel · impatience",
    paragraphs: [
      "Après la traversée, les Enfants d’Israël passent auprès d’un peuple attaché à ses idoles et demandent à Mûsâ de leur faire une divinité semblable. Mûsâ leur rappelle l’ignorance d’une telle demande.",
      "Le Coran rappelle aussi les bienfaits accordés dans le désert, ainsi que les réactions d’un peuple qui doit encore apprendre la gratitude et l’obéissance.",
      "La sortie d’Égypte a libéré les corps de l’oppression ; elle n’a pas instantanément transformé les cœurs."
    ],
    references: [
      { kind: "QURAN", label: "Al-A‘râf 7:138–141", surahId: 7, verse: 138, note: "La demande d’une idole après la traversée et le rappel de Mûsâ." },
      { kind: "QURAN", label: "Al-Baqara 2:57–61", surahId: 2, verse: 57, note: "Des bienfaits accordés aux Enfants d’Israël et certaines de leurs réactions dans le désert." }
    ],
    lessons: ["Une délivrance extérieure ne produit pas automatiquement une réforme intérieure.", "Les bienfaits demandent gratitude et fidélité.", "L’histoire continue après le miracle : l’éducation d’une communauté prend du temps."]
  },
  {
    id: "mount", index: 11, title: "Le rendez-vous du Mont", subtitle: "Les Tables et la parole adressée à Mûsâ",
    image: require("../../assets/images/prophets/musa-scenes/mount.jpg"), atmosphere: "Mont · révélation · alliance",
    paragraphs: [
      "Allah fixe à Mûsâ un rendez-vous de trente nuits, complétées par dix. Mûsâ confie son peuple à Hârûn avant de se rendre au rendez-vous de son Seigneur.",
      "Le Coran rapporte qu’Allah parle à Mûsâ. Celui-ci demande à voir son Seigneur ; il lui est répondu qu’il ne Le verra pas, et la manifestation au mont le réduit en poussière tandis que Mûsâ tombe foudroyé.",
      "Lorsqu’il revient à lui, il glorifie Allah et reçoit les Tables contenant exhortation et explication."
    ],
    references: [{ kind: "QURAN", label: "Al-A‘râf 7:142–145", surahId: 7, verse: 142, note: "Le rendez-vous, la parole adressée à Mûsâ et les Tables." }],
    lessons: ["La proximité accordée à Mûsâ ne supprime pas sa condition de serviteur.", "La révélation s’accompagne de responsabilité.", "Les Tables sont reçues pour être tenues avec force et transmises au peuple."]
  },
  {
    id: "calf", index: 12, title: "L’épreuve du veau", subtitle: "Une communauté éprouvée pendant l’absence de Mûsâ",
    image: require("../../assets/images/prophets/musa-scenes/calf.jpg"), atmosphere: "Camp · veau · retour",
    paragraphs: [
      "Pendant l’absence de Mûsâ, son peuple est éprouvé par le veau. Hârûn les avertit et leur rappelle que leur Seigneur est le Tout Miséricordieux, mais beaucoup refusent de l’écouter.",
      "Mûsâ revient en colère et attristé. Il interroge Hârûn, puis confronte celui que le Coran désigne comme al-Sâmirî au sujet de ce qu’il a fait.",
      "Le veau est détruit et le peuple est rappelé à l’adoration d’Allah seul."
    ],
    references: [
      { kind: "QURAN", label: "Tâ-Hâ 20:83–98", surahId: 20, verse: 83, note: "L’épreuve du veau, Hârûn, le retour de Mûsâ et al-Sâmirî." },
      { kind: "QURAN", label: "Al-A‘râf 7:148–154", surahId: 7, verse: 148, note: "Le veau, le retour de Mûsâ et les Tables." }
    ],
    lessons: ["Les grandes expériences spirituelles n’immunisent pas une communauté contre l’égarement.", "Hârûn cherche à préserver l’unité tout en rappelant la vérité.", "La correction d’une faute collective demande vérité, responsabilité et retour à Allah."]
  },
  {
    id: "holy-land", index: 13, title: "Aux portes de la Terre sainte", subtitle: "Quand la peur empêche d’avancer",
    image: require("../../assets/images/prophets/musa-scenes/holy-land.jpg"), atmosphere: "Terre sainte · peur · refus",
    paragraphs: [
      "Mûsâ rappelle à son peuple les bienfaits d’Allah et leur ordonne d’entrer dans la Terre sainte qui leur a été prescrite.",
      "Ils refusent par peur des habitants puissants qui s’y trouvent. Deux hommes craignant Allah les encouragent pourtant à entrer par la porte et à placer leur confiance en Lui.",
      "Le refus persiste. La terre leur est alors interdite pendant quarante années durant lesquelles ils erreront. Mûsâ demande à Allah de juger entre lui et les gens désobéissants."
    ],
    references: [{ kind: "QURAN", label: "Al-Mâ’ida 5:20–26", surahId: 5, verse: 20, note: "L’ordre d’entrer dans la Terre sainte, le refus du peuple et les quarante années." }],
    lessons: ["La peur peut empêcher de profiter d’un bienfait pourtant annoncé.", "Le tawakkul ne signifie pas ignorer les obstacles, mais obéir malgré eux.", "Une communauté porte les conséquences de ses choix collectifs."]
  },
  {
    id: "khidr", index: 14, title: "Ce que Mûsâ ne savait pas encore", subtitle: "Un voyage pour apprendre les limites du regard humain",
    image: require("../../assets/images/prophets/musa-scenes/khidr.jpg"), atmosphere: "Voyage · patience · connaissance",
    paragraphs: [
      "Dans la sourate Al-Kahf, Mûsâ entreprend un voyage jusqu’au confluent des deux mers. Il y rencontre un serviteur auquel Allah a accordé une miséricorde et une science venant de Lui.",
      "Mûsâ demande à le suivre afin d’apprendre. Trois événements successifs le surprennent : un bateau endommagé, un jeune garçon tué et un mur redressé sans paiement dans une ville qui avait refusé l’hospitalité.",
      "À la fin, l’explication révèle une sagesse que Mûsâ ne pouvait pas connaître au moment des faits. Le passage enseigne avec force les limites de ce que l’être humain peut saisir d’une situation."
    ],
    references: [{ kind: "QURAN", label: "Al-Kahf 18:60–82", surahId: 18, verse: 60, note: "Le voyage de Mûsâ, sa rencontre avec le serviteur d’Allah et l’explication des trois événements." }],
    lessons: ["Même Mûsâ poursuit l’apprentissage avec humilité.", "Ce qui paraît mauvais à première vue peut cacher une réalité inaccessible à notre connaissance immédiate.", "Le passage enseigne la patience devant ce dont on ne possède pas encore l’explication."]
  },
  {
    id: "qarun", index: 15, title: "Qârûn et l’illusion de la richesse", subtitle: "Un dernier contraste au sein du peuple de Mûsâ",
    image: require("../../assets/images/prophets/musa-scenes/qarun.jpg"), atmosphere: "Richesse · arrogance · chute",
    paragraphs: [
      "Le Coran présente Qârûn comme appartenant au peuple de Mûsâ. Une immense richesse lui a été accordée, mais il se montre arrogant envers les siens.",
      "Son peuple lui rappelle de rechercher, avec ce qu’Allah lui a donné, la demeure dernière sans oublier sa part en ce monde, de faire le bien et de ne pas rechercher la corruption.",
      "Qârûn attribue sa richesse à son propre savoir. Il finit englouti avec sa demeure, et ceux qui enviaient sa position comprennent que la réussite ne se mesure pas à l’apparence de la fortune."
    ],
    references: [{ kind: "QURAN", label: "Al-Qasas 28:76–82", surahId: 28, verse: 76, note: "Qârûn, son arrogance, les conseils de son peuple et sa chute." }],
    lessons: ["La richesse est une épreuve autant qu’un bienfait.", "Attribuer entièrement ses bienfaits à soi-même nourrit l’orgueil.", "Le récit de Mûsâ comporte aussi l’éducation de son peuple face aux épreuves intérieures."]
  }
];

export const PROPHETS_PREVIEW = [
  { id: "adam", name: "Âdam", arabic: "آدم", status: "coming" as const },
  { id: "nuh", name: "Nûh", arabic: "نوح", status: "coming" as const },
  { id: "ibrahim", name: "Ibrâhîm", arabic: "إبراهيم", status: "coming" as const },
  { id: "yusuf", name: "Yûsuf", arabic: "يوسف", status: "coming" as const },
  { id: "musa", name: "Mûsâ", arabic: "موسى", status: "available" as const },
  { id: "isa", name: "‘Îsâ", arabic: "عيسى", status: "coming" as const },
  { id: "muhammad", name: "Muhammad ﷺ", arabic: "محمد", status: "coming" as const },
];
