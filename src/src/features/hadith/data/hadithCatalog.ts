import type { Hadith } from "../domain/Hadith";

export const HADITH_CATALOG: readonly Hadith[] = [
  {
    id: "regular-deeds-bukhari-6464-muslim-783",
    category: "Adoration",
    title: "La régularité",
    text:
      "Les œuvres les plus aimées d’Allah sont celles qui sont accomplies avec le plus de régularité, même si elles sont peu nombreuses.",
    narrator: "D’après ‘Aïcha رضي الله عنها",
    source: "Sahih al-Bukhari n°6464 · Sahih Muslim n°783",
    lesson:
      "Une petite action durable construit davantage qu’un grand effort vite abandonné. Choisissez une œuvre simple que vous pourrez garder.",
  },
  {
    id: "intentions-bukhari-1-muslim-1907",
    category: "Foi",
    title: "La valeur de l’intention",
    text:
      "Les actes ne valent que par les intentions, et chacun n’aura que ce qu’il a eu comme intention.",
    narrator: "D’après ‘Umar ibn al-Khattab رضي الله عنه",
    source: "Sahih al-Bukhari n°1 · Sahih Muslim n°1907",
    lesson:
      "L’intention donne son sens à l’action. Avant d’agir, prenez un instant pour vous rappeler pourquoi vous le faites.",
  },
  {
    id: "tongue-hand-bukhari-10-muslim-40",
    category: "Comportement",
    title: "Préserver les autres",
    text:
      "Le musulman est celui dont les musulmans sont à l’abri de sa langue et de sa main.",
    narrator: "D’après ‘Abd Allah ibn ‘Amr رضي الله عنهما",
    source: "Sahih al-Bukhari n°10 · Sahih Muslim n°40",
    lesson:
      "La foi se manifeste aussi par la sécurité que les autres trouvent auprès de nous, dans nos paroles comme dans nos gestes.",
  },
  {
    id: "love-for-brother-bukhari-13-muslim-45",
    category: "Relations",
    title: "Aimer pour son frère",
    text:
      "Aucun de vous ne croit vraiment tant qu’il n’aime pas pour son frère ce qu’il aime pour lui-même.",
    narrator: "D’après Anas ibn Malik رضي الله عنه",
    source: "Sahih al-Bukhari n°13 · Sahih Muslim n°45",
    lesson:
      "Souhaiter sincèrement le bien d’autrui purifie les relations de la jalousie et renforce la fraternité.",
  },
  {
    id: "good-or-silent-bukhari-6018-muslim-47",
    category: "Comportement",
    title: "Dire du bien ou se taire",
    text:
      "Que celui qui croit en Allah et au Jour dernier dise du bien ou qu’il se taise.",
    narrator: "D’après Abou Hourayra رضي الله عنه",
    source: "Sahih al-Bukhari n°6018 · Sahih Muslim n°47",
    lesson:
      "Toutes les paroles possibles ne sont pas forcément utiles. Le silence peut devenir une protection et une sagesse.",
  },
  {
    id: "hearts-deeds-muslim-2564",
    category: "Foi",
    title: "Le cœur et les œuvres",
    text:
      "Allah ne regarde ni vos corps ni vos apparences, mais Il regarde vos cœurs et vos œuvres.",
    narrator: "D’après Abou Hourayra رضي الله عنه",
    source: "Sahih Muslim n°2564",
    lesson:
      "La valeur réelle ne repose pas sur l’apparence. Travaillez la sincérité du cœur et la qualité des actes.",
  },
  {
    id: "strong-believer-muslim-2664",
    category: "Foi",
    title: "Rechercher ce qui est utile",
    text:
      "Le croyant fort est meilleur et plus aimé d’Allah que le croyant faible, et il y a du bien en chacun. Attache-toi à ce qui t’est utile, demande l’aide d’Allah et ne faiblis pas.",
    narrator: "D’après Abou Hourayra رضي الله عنه",
    source: "Sahih Muslim n°2664",
    lesson:
      "La confiance en Allah accompagne l’effort : recherchez ce qui vous élève, demandez Son aide puis avancez avec constance.",
  },
  {
    id: "modesty-bukhari-6117-muslim-37",
    category: "Comportement",
    title: "La pudeur",
    text: "La pudeur n’apporte que du bien.",
    narrator: "D’après ‘Imran ibn Husayn رضي الله عنه",
    source: "Sahih al-Bukhari n°6117 · Sahih Muslim n°37",
    lesson:
      "La pudeur saine oriente vers la dignité, la retenue et le respect de soi comme des autres.",
  },
  {
    id: "purity-muslim-223",
    category: "Adoration",
    title: "La purification",
    text: "La purification est la moitié de la foi.",
    narrator: "D’après Abou Malik al-Ach‘ari رضي الله عنه",
    source: "Sahih Muslim n°223",
    lesson:
      "La purification prépare le corps et le cœur à l’adoration. Elle rappelle que la foi se vit aussi dans les gestes quotidiens.",
  },
  {
    id: "make-easy-bukhari-69-muslim-1734",
    category: "Relations",
    title: "Faciliter",
    text:
      "Facilitez et ne rendez pas les choses difficiles. Annoncez la bonne nouvelle et ne faites pas fuir.",
    narrator: "D’après Anas ibn Malik رضي الله عنه",
    source: "Sahih al-Bukhari n°69 · Sahih Muslim n°1734",
    lesson:
      "Transmettre le bien demande douceur et discernement. Une parole accueillante ouvre souvent davantage les cœurs.",
  },
  {
    id: "religion-sincerity-muslim-55",
    category: "Relations",
    title: "Le conseil sincère",
    text: "La religion, c’est le conseil sincère.",
    narrator: "D’après Tamim ad-Dari رضي الله عنه",
    source: "Sahih Muslim n°55",
    lesson:
      "Le conseil véritable cherche le bien avec sincérité, douceur et discrétion, sans humilier ni dominer.",
  },
  {
    id: "path-knowledge-muslim-2699",
    category: "Savoir",
    title: "Le chemin du savoir",
    text:
      "Celui qui emprunte un chemin à la recherche d’un savoir, Allah lui facilite par cela un chemin vers le Paradis.",
    narrator: "D’après Abou Hourayra رضي الله عنه",
    source: "Sahih Muslim n°2699",
    lesson:
      "Apprendre avec une intention sincère est une adoration. Chaque pas régulier vers un savoir utile compte.",
  },
] as const;

export const HADITH_CATEGORIES = [
  "Tous",
  "Foi",
  "Adoration",
  "Comportement",
  "Relations",
  "Savoir",
] as const;
