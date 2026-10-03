export type QuranTopicSource = {
  title: string;
  body: string;
  reference: string;
};

export type QuranTopic = {
  id: string;
  canonicalName: string;
  aliases: string[];
  sourceIds: string[];
  quickAnswer?: {
    title: string;
    body: string;
    sourceIds: string[];
  };
};

export const quranTopicSources: Record<string, QuranTopicSource> = {

  "quran-topic:mercy:hope": {
    title: "Ne pas désespérer de la miséricorde d’Allah",
    body:
      "Allah appelle Ses serviteurs qui ont commis des excès à ne pas désespérer de Sa miséricorde et rappelle qu’Il est le Pardonneur, le Très Miséricordieux.",
    reference: "Coran 39:53",
  },
  "quran-topic:mercy:embraces": {
    title: "La miséricorde d’Allah embrasse toute chose",
    body:
      "Allah déclare que Sa miséricorde embrasse toute chose. Ce passage est une référence centrale lorsqu’on cherche un verset général sur l’étendue de la miséricorde divine.",
    reference: "Coran 7:156",
  },
  "quran-topic:patience:help": {
    title: "Chercher secours dans la patience et la prière",
    body:
      "Allah appelle les croyants à chercher secours dans la patience et la prière et affirme qu’Il est avec les patients.",
    reference: "Coran 2:153",
  },
  "quran-topic:patience:trials": {
    title: "La patience dans les épreuves",
    body:
      "Le Coran annonce des épreuves et donne une bonne nouvelle aux patients, ceux qui se tournent vers Allah lorsqu’un malheur les atteint.",
    reference: "Coran 2:155-157",
  },
  "quran-topic:repentance:hope": {
    title: "L’espérance dans le pardon d’Allah",
    body:
      "Le Coran interdit de désespérer de la miséricorde d’Allah, même après avoir commis des excès contre soi-même.",
    reference: "Coran 39:53",
  },
  "quran-topic:repentance:sincere": {
    title: "Le repentir sincère",
    body:
      "Allah appelle les croyants à revenir à Lui par un repentir sincère.",
    reference: "Coran 66:8",
  },
  "quran-topic:gratitude:increase": {
    title: "La reconnaissance et l’augmentation des bienfaits",
    body:
      "Allah annonce qu’Il augmente Ses bienfaits à ceux qui font preuve de reconnaissance.",
    reference: "Coran 14:7",
  },
  "quran-topic:parents:kindness": {
    title: "La bonté envers les parents",
    body:
      "Allah ordonne de L’adorer seul puis de faire preuve de bonté envers les parents, avec douceur et humilité, particulièrement lorsqu’ils atteignent la vieillesse.",
    reference: "Coran 17:23-24",
  },
  "quran-topic:tranquility:remembrance": {
    title: "L’apaisement des cœurs par l’évocation d’Allah",
    body:
      "Le Coran rappelle que les cœurs trouvent leur tranquillité dans l’évocation d’Allah.",
    reference: "Coran 13:28",
  },
  "quran-topic:trust:sufficiency": {
    title: "Placer sa confiance en Allah",
    body:
      "Le Coran enseigne que celui qui place sa confiance en Allah trouve en Lui ce qui lui suffit.",
    reference: "Coran 65:2-3",
  },
  "quran-topic:marriage:affection": {
    title: "Affection et miséricorde dans le mariage",
    body:
      "Le Coran présente parmi les signes d’Allah la création des époux afin qu’ils trouvent la tranquillité l’un auprès de l’autre, avec affection et miséricorde entre eux.",
    reference: "Coran 30:21",
  },
  "quran-topic:charity:reward": {
    title: "La récompense de ceux qui dépensent dans le bien",
    body:
      "Le Coran donne l’image d’un grain produisant de nombreux épis pour illustrer la multiplication de la récompense de ceux qui dépensent leurs biens dans le sentier d’Allah.",
    reference: "Coran 2:261",
  },
  "quran-topic:musa:call": {
    title: "L’appel de Mûsâ",
    body:
      "Mûsâ reçoit l’appel d’Allah dans la vallée sacrée, voit les signes du bâton et de la main, puis reçoit la mission d’aller vers Pharaon avec son frère Hârûn. Ce passage contient aussi son invocation demandant l’aisance, l’ouverture de la poitrine et la clarté de la parole.",
    reference: "Coran 20:9-36",
  },
  "quran-topic:musa:pharaoh": {
    title: "Mûsâ face à Pharaon",
    body:
      "Mûsâ et Hârûn exposent les signes d’Allah à Pharaon. Le récit présente la confrontation avec les magiciens, leur foi après avoir reconnu la vérité, puis le rejet obstiné de Pharaon.",
    reference: "Coran 20:43-76",
  },
  "quran-topic:musa:exodus": {
    title: "La sortie d’Égypte et la mer",
    body:
      "Allah ordonne à Mûsâ de partir de nuit avec les enfants d’Israël. La mer s’ouvre, les croyants sont sauvés et Pharaon avec ses troupes est englouti.",
    reference: "Coran 26:52-68",
  },
  "quran-topic:musa:early-life": {
    title: "La naissance et la jeunesse de Mûsâ",
    body:
      "Le récit décrit la naissance de Mûsâ sous la menace de Pharaon, l’inspiration donnée à sa mère, son retour auprès d’elle, puis sa jeunesse, son départ d’Égypte et son séjour à Madyan.",
    reference: "Coran 28:3-28",
  },
  "quran-topic:musa:mission": {
    title: "La mission de Mûsâ dans la sourate Al-Qasas",
    body:
      "Après son séjour à Madyan, Mûsâ reçoit l’appel près du feu, les signes de sa mission et l’ordre d’aller vers Pharaon. Il demande que Hârûn l’assiste dans cette mission.",
    reference: "Coran 28:29-35",
  },
  "quran-topic:musa:people": {
    title: "Mûsâ et les enfants d’Israël",
    body:
      "Ces passages rappellent le salut hors d’Égypte, l’alliance, les bienfaits reçus, l’épisode du veau et plusieurs épreuves qui montrent la patience de Mûsâ face à son peuple.",
    reference: "Coran 2:49-74",
  },
  "quran-topic:musa:khidr": {
    title: "Mûsâ et le serviteur savant",
    body:
      "Mûsâ entreprend un voyage d’apprentissage auprès d’un serviteur à qui Allah a accordé une science particulière. Les épisodes du bateau, de l’enfant et du mur enseignent l’humilité devant la sagesse divine et les limites de la perception humaine.",
    reference: "Coran 18:60-82",
  },
  "quran-topic:musa:summary-araf": {
    title: "Mûsâ, Pharaon et le peuple dans Al-A‘râf",
    body:
      "La sourate Al-A‘râf rassemble une longue séquence sur la mission de Mûsâ, les signes adressés à Pharaon, la sortie d’Égypte, la révélation des Tables et l’épreuve du veau.",
    reference: "Coran 7:103-160",
  },

  "quran-topic:ibrahim:tawhid": {
    title: "Ibrâhîm et l’appel au monothéisme",
    body:
      "Ibrâhîm rejette l’adoration des astres et expose à son peuple que seul Allah mérite l’adoration. Le passage met en avant son raisonnement, sa certitude et son opposition à l’association.",
    reference: "Coran 6:74-83",
  },
  "quran-topic:ibrahim:idols": {
    title: "Ibrâhîm face aux idoles",
    body:
      "Ibrâhîm interroge son peuple sur ses idoles, les brise pour démontrer leur impuissance et est jeté dans le feu, qu’Allah rend frais et paisible pour lui.",
    reference: "Coran 21:51-70",
  },
  "quran-topic:ibrahim:kaaba": {
    title: "Ibrâhîm et la Maison sacrée",
    body:
      "Ibrâhîm et Ismâ‘îl élèvent les fondations de la Kaaba et invoquent Allah pour l’acceptation de leur œuvre, la soumission de leur descendance et l’envoi d’un messager parmi elle.",
    reference: "Coran 2:124-129",
  },
  "quran-topic:ibrahim:duas": {
    title: "Les invocations d’Ibrâhîm",
    body:
      "Ibrâhîm demande la sécurité de la cité, l’éloignement de l’idolâtrie, l’établissement de la prière pour sa descendance et le pardon pour lui-même, ses parents et les croyants.",
    reference: "Coran 14:35-41",
  },
  "quran-topic:ibrahim:sacrifice": {
    title: "L’épreuve du sacrifice",
    body:
      "Ibrâhîm voit en rêve qu’il sacrifie son fils. Tous deux se soumettent à l’ordre d’Allah, qui remplace le sacrifice et honore cette obéissance exemplaire.",
    reference: "Coran 37:99-113",
  },
  "quran-topic:ibrahim:maryam": {
    title: "Ibrâhîm et son père",
    body:
      "Ibrâhîm appelle son père avec douceur à abandonner les idoles, l’avertit avec respect et s’éloigne lorsque son appel est rejeté.",
    reference: "Coran 19:41-50",
  },

  "quran-topic:yusuf:story": {
    title: "L’histoire de Yûsuf",
    body:
      "La sourate Yûsuf présente un récit suivi : le rêve de l’enfance, la jalousie des frères, le puits, l’Égypte, l’épreuve dans la maison du ministre, la prison, l’interprétation des rêves, la responsabilité publique et les retrouvailles familiales.",
    reference: "Coran 12:4-101",
  },
  "quran-topic:yusuf:temptation": {
    title: "Yûsuf face à l’épreuve",
    body:
      "Yûsuf résiste à la tentation, cherche refuge auprès d’Allah et préfère la prison à la désobéissance. Le passage souligne sa chasteté, sa sincérité et la protection divine.",
    reference: "Coran 12:23-35",
  },
  "quran-topic:yusuf:forgiveness": {
    title: "Le pardon de Yûsuf",
    body:
      "Après avoir retrouvé ses frères, Yûsuf ne se venge pas. Il leur accorde son pardon et attribue la réunion de sa famille à la grâce et à la sagesse d’Allah.",
    reference: "Coran 12:89-100",
  },

  "quran-topic:isa:birth": {
    title: "La naissance de ‘Îsâ",
    body:
      "Maryam reçoit l’annonce d’un fils pur, puis donne naissance à ‘Îsâ sans père par un signe d’Allah. Le nouveau-né parle pour défendre sa mère et se présente comme serviteur et prophète d’Allah.",
    reference: "Coran 19:16-36",
  },
  "quran-topic:isa:mission": {
    title: "La mission et les signes de ‘Îsâ",
    body:
      "‘Îsâ est envoyé aux enfants d’Israël avec l’Évangile et des signes accomplis par la permission d’Allah. Le passage rappelle aussi son appel à adorer Allah seul.",
    reference: "Coran 3:45-55",
  },
  "quran-topic:isa:disciples": {
    title: "‘Îsâ et les disciples",
    body:
      "Les disciples affirment leur foi et leur soutien. Le Coran présente ‘Îsâ comme messager d’Allah et condamne l’exagération à son sujet.",
    reference: "Coran 5:110-120",
  },

  "quran-topic:nuh:call": {
    title: "L’appel de Nûh",
    body:
      "Nûh appelle son peuple nuit et jour, publiquement et discrètement, au pardon et à l’adoration d’Allah seul. Le passage montre sa persévérance malgré un rejet prolongé.",
    reference: "Coran 71:1-28",
  },
  "quran-topic:nuh:flood": {
    title: "L’arche et le déluge",
    body:
      "Allah ordonne à Nûh de construire l’arche. Les croyants sont sauvés, les négateurs sont submergés et le récit de son fils enseigne que le lien de foi prime sur le seul lien familial.",
    reference: "Coran 11:25-49",
  },

  "quran-topic:adam:creation": {
    title: "La création d’Âdam",
    body:
      "Allah annonce la création d’un représentant sur terre, enseigne à Âdam les noms et ordonne aux anges de se prosterner devant lui, tandis qu’Iblîs refuse par orgueil.",
    reference: "Coran 2:30-39",
  },
  "quran-topic:adam:temptation": {
    title: "Âdam, le Jardin et le repentir",
    body:
      "Âdam et son épouse sont avertis contre Satan, puis commettent une faute avant de reconnaître leur tort et de demander pardon. Le récit insiste sur la responsabilité, le repentir et la miséricorde d’Allah.",
    reference: "Coran 7:11-27",
  },
};

export const quranTopics: QuranTopic[] = [

  {
    id: "mercy",
    canonicalName: "La miséricorde d’Allah",
    aliases: ["miséricorde", "misericorde", "rahma", "rahmah", "compassion"],
    sourceIds: ["quran-topic:mercy:hope", "quran-topic:mercy:embraces"],
    quickAnswer: {
      title: "La miséricorde d’Allah",
      body:
        "Un des versets les plus connus sur la miséricorde d’Allah est celui où Il appelle Ses serviteurs à ne pas désespérer de Sa miséricorde. Un autre passage très clair affirme que Sa miséricorde embrasse toute chose.",
      sourceIds: ["quran-topic:mercy:hope", "quran-topic:mercy:embraces"],
    },
  },
  {
    id: "patience",
    canonicalName: "La patience",
    aliases: ["patience", "sabr", "patienter"],
    sourceIds: ["quran-topic:patience:help", "quran-topic:patience:trials"],
    quickAnswer: {
      title: "La patience dans le Coran",
      body:
        "Un verset central appelle les croyants à chercher secours dans la patience et la prière et rappelle qu’Allah est avec les patients. Le Coran donne aussi une bonne nouvelle à ceux qui patientent lorsqu’ils sont éprouvés.",
      sourceIds: ["quran-topic:patience:help", "quran-topic:patience:trials"],
    },
  },
  {
    id: "repentance",
    canonicalName: "Le repentir et le pardon",
    aliases: ["repentir", "repentance", "tawba", "tawbah", "pardon", "istighfar"],
    sourceIds: ["quran-topic:repentance:hope", "quran-topic:repentance:sincere"],
    quickAnswer: {
      title: "Le repentir et le pardon",
      body:
        "Parmi les passages les plus forts sur le repentir, le Coran appelle à ne jamais désespérer de la miséricorde d’Allah et invite les croyants à revenir à Lui par un repentir sincère.",
      sourceIds: ["quran-topic:repentance:hope", "quran-topic:repentance:sincere"],
    },
  },
  {
    id: "gratitude",
    canonicalName: "La gratitude envers Allah",
    aliases: ["gratitude", "reconnaissance", "shukr", "choukr"],
    sourceIds: ["quran-topic:gratitude:increase"],
    quickAnswer: {
      title: "La gratitude envers Allah",
      body:
        "Un verset très connu sur la gratitude annonce qu’Allah augmente Ses bienfaits à ceux qui sont reconnaissants.",
      sourceIds: ["quran-topic:gratitude:increase"],
    },
  },
  {
    id: "parents",
    canonicalName: "La bonté envers les parents",
    aliases: ["parents", "père et mère", "pere et mere", "mère", "mere", "père", "pere"],
    sourceIds: ["quran-topic:parents:kindness"],
    quickAnswer: {
      title: "La bonté envers les parents",
      body:
        "Le Coran ordonne de faire preuve de bonté envers les parents, de leur parler avec respect et de se montrer humble et miséricordieux envers eux, notamment lorsqu’ils vieillissent.",
      sourceIds: ["quran-topic:parents:kindness"],
    },
  },
  {
    id: "tranquility",
    canonicalName: "L’apaisement et la confiance en Allah",
    aliases: ["angoisse", "anxiété", "anxiete", "stress", "tristesse", "tawakkul", "confiance en allah", "apaisement"],
    sourceIds: ["quran-topic:tranquility:remembrance", "quran-topic:trust:sufficiency"],
    quickAnswer: {
      title: "L’apaisement et la confiance en Allah",
      body:
        "Le Coran rappelle que les cœurs trouvent leur tranquillité dans l’évocation d’Allah et enseigne que celui qui place sa confiance en Lui trouve en Lui ce qui lui suffit.",
      sourceIds: ["quran-topic:tranquility:remembrance", "quran-topic:trust:sufficiency"],
    },
  },
  {
    id: "marriage",
    canonicalName: "Le mariage",
    aliases: ["mariage", "époux", "epoux", "épouse", "epouse", "couple"],
    sourceIds: ["quran-topic:marriage:affection"],
    quickAnswer: {
      title: "Le mariage dans le Coran",
      body:
        "Un des versets les plus connus sur le mariage présente la tranquillité entre les époux ainsi que l’affection et la miséricorde qu’Allah place entre eux.",
      sourceIds: ["quran-topic:marriage:affection"],
    },
  },
  {
    id: "charity",
    canonicalName: "L’aumône et la générosité",
    aliases: ["aumône", "aumone", "sadaqa", "sadaqah", "charité", "charite", "générosité", "generosite"],
    sourceIds: ["quran-topic:charity:reward"],
    quickAnswer: {
      title: "L’aumône et la générosité",
      body:
        "Le Coran illustre la récompense de celui qui dépense dans le bien par l’image d’un grain dont la récolte est multipliée de façon abondante.",
      sourceIds: ["quran-topic:charity:reward"],
    },
  },
  {
    id: "musa",
    canonicalName: "Mûsâ",
    aliases: ["moussa", "musa", "moise", "moïse", "mûsâ"],
    sourceIds: [
      "quran-topic:musa:call",
      "quran-topic:musa:pharaoh",
      "quran-topic:musa:exodus",
      "quran-topic:musa:early-life",
      "quran-topic:musa:mission",
      "quran-topic:musa:people",
      "quran-topic:musa:khidr",
      "quran-topic:musa:summary-araf",
    ],
  },
  {
    id: "ibrahim",
    canonicalName: "Ibrâhîm",
    aliases: ["ibrahim", "ibrâhîm", "abraham"],
    sourceIds: [
      "quran-topic:ibrahim:tawhid",
      "quran-topic:ibrahim:idols",
      "quran-topic:ibrahim:kaaba",
      "quran-topic:ibrahim:duas",
      "quran-topic:ibrahim:sacrifice",
      "quran-topic:ibrahim:maryam",
    ],
  },
  {
    id: "yusuf",
    canonicalName: "Yûsuf",
    aliases: ["yusuf", "youssouf", "joseph", "yûsuf"],
    sourceIds: [
      "quran-topic:yusuf:story",
      "quran-topic:yusuf:temptation",
      "quran-topic:yusuf:forgiveness",
    ],
  },
  {
    id: "isa",
    canonicalName: "‘Îsâ",
    aliases: ["issa", "isa", "jesus", "jésus", "‘îsâ"],
    sourceIds: [
      "quran-topic:isa:birth",
      "quran-topic:isa:mission",
      "quran-topic:isa:disciples",
    ],
  },
  {
    id: "nuh",
    canonicalName: "Nûh",
    aliases: ["nouh", "nuh", "noe", "noé", "nûh"],
    sourceIds: ["quran-topic:nuh:call", "quran-topic:nuh:flood"],
  },
  {
    id: "adam",
    canonicalName: "Âdam",
    aliases: ["adam", "âdam"],
    sourceIds: ["quran-topic:adam:creation", "quran-topic:adam:temptation"],
  },
];

