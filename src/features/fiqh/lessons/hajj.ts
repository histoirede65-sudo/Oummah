import { c, p, type LessonEntry } from "./types";

const W = "wajiz-hajj";

export const HAJJ_LESSONS: Record<string, LessonEntry> = {
  "hajj-obligation": {
    title: "L’obligation du Hajj",
    short: "Le Hajj est obligatoire une fois dans la vie pour le musulman pubère, sain d’esprit et qui en a la capacité : la santé, les moyens du voyage et ce qui suffit à sa famille pendant son absence.",
    rules: [
      p("« Et c’est un devoir envers Allah pour les gens qui ont les moyens, d’aller faire le pèlerinage de la Maison. »", "quran-3-97"),
      p("C’est le cinquième pilier de l’islam.", "bukhari-8"),
      p("Celui qui le fait sans obscénité ni perversité en revient comme au jour où sa mère l’a mis au monde.", "bukhari-1521"),
      p("Le Hajj accepté n’a d’autre récompense que le Paradis.", "bukhari-1773"),
    ],
    cases: [
      c("La femme peut-elle partir sans mahram ?", "Le Prophète ﷺ a dit que la femme ne voyage qu’avec un mahram, et a demandé à un homme d’accompagner son épouse au Hajj. Les shafi‘ites et les malikites permettent à la femme de partir avec un groupe de femmes de confiance pour le Hajj obligatoire.", "bukhari-1862", W),
      c("J’ai des dettes.", "Remboursez d’abord ce qui est exigible, ou obtenez l’accord de votre créancier.", W),
    ],
  },

  "hajj-once": {
    title: "Une fois dans la vie",
    short: "Le Hajj n’est obligatoire qu’une fois. Ce qui dépasse est surérogatoire.",
    rules: [p("Quand on lui a demandé « chaque année ? », le Prophète ﷺ a répondu que s’il disait oui, cela deviendrait obligatoire, et que les gens n’en seraient pas capables.", "muslim-1337")],
  },

  "hajj-pillars": {
    title: "Piliers et obligations du Hajj",
    chapter: "hajj-foundations",
    aliases: ["arkan hajj", "piliers hajj", "wajibat hajj", "obligations hajj", "dam"],
    short: "Les piliers du Hajj sont l’ihrâm, la station à ‘Arafa, le tawâf al-ifâda et le sa‘y. Sans eux, le Hajj n’est pas valable. Les obligations (mîqât, Muzdalifa, nuits à Minâ, lapidation, rasage, tawâf d’adieu) se compensent par un sacrifice si on les manque.",
    rules: [
      p("Station à ‘Arafa : « Le hajj, le hajj, c’est le jour de ‘Arafah. »", "abudawud-1949"),
      p("Tawâf al-ifâda et sa‘y entre Safâ et Marwa.", "muslim-1218a", "quran-2-158"),
      p("L’ihrâm : l’intention d’entrer dans le rite.", "muslim-1218"),
    ],
    cases: [
      c("Quelle différence entre pilier et obligation ?", "Un pilier manqué rend le Hajj invalide et ne se compense pas. Une obligation manquée se compense, selon la majorité, par le sacrifice d’un mouton à La Mecque.", W),
      c("Les écoles sont-elles d’accord ?", "Pour les hanafites, les piliers sont seulement ‘Arafa et le tawâf al-ifâda ; le sa‘y est une obligation. Les autres écoles comptent l’ihrâm et le sa‘y parmi les piliers.", W),
    ],
    sourceIds: [W],
  },

  "hajj-ihram-miqat-talbiya": {
    title: "Ihrâm, mîqât et talbiya",
    short: "On entre en ihrâm au mîqât : l’homme porte deux pièces de tissu non cousues, on formule l’intention du rite, puis on répète la talbiya jusqu’au début des rites.",
    rules: [
      p("Les mîqât : Dhul-Hulayfa pour Médine, al-Juhfa pour le Shâm, Qarn al-Manâzil pour le Najd, Yalamlam pour le Yémen.", "bukhari-1528"),
      p("La talbiya : « Labbayka-llâhumma labbayk, labbayka lâ sharîka laka labbayk, inna-l-ḥamda wa-n-ni‘mata laka wa-l-mulk, lâ sharîka lak. »", "bukhari-1549"),
      p("La femme en règles ou en lochies entre aussi en ihrâm : elle fait le ghusl et formule son intention.", "muslim-1209"),
    ],
    steps: [
      p("Faites le ghusl, mettez du parfum sur le corps (pas sur les habits d’ihrâm).", "muslim-1209", W),
      p("Hommes : un pagne et un drap blancs ; femmes : leurs vêtements habituels couvrants, sans niqâb ni gants.", "bukhari-1542", "bukhari-1838"),
      p("Au mîqât, formulez l’intention : « Labbayka ‘umratan » ou « Labbayka ḥajjan ».", "muslim-1218"),
      p("Répétez la talbiya, les hommes à voix haute.", "bukhari-1549"),
    ],
    cases: [c("Je voyage en avion.", "Entrez en ihrâm en survolant le mîqât ou un peu avant. L’app peut vous prévenir : voyez « Alerte mîqât » dans le guide Hajj & ‘Umra.", "bukhari-1528", W)],
  },

  "hajj-prohibitions": {
    title: "Les interdits de l’ihrâm",
    chapter: "hajj-ihram",
    aliases: ["interdits ihram", "parfum ihram", "fidya", "chasse ihram", "mariage ihram"],
    short: "En ihrâm, on ne se rase pas, on ne coupe ni ongles ni cheveux, on ne se parfume pas, on ne chasse pas, on ne se marie pas et on n’a pas de rapport. L’homme ne porte pas de vêtement cousu ni ne se couvre la tête ; la femme ne porte ni niqâb ni gants.",
    rules: [
      p("Le muhrim ne porte ni chemise, ni turban, ni pantalon, ni burnous, ni khuff, ni vêtement parfumé.", "bukhari-1542"),
      p("La femme en ihrâm ne porte ni niqâb ni gants.", "bukhari-1838"),
      p("Pas de rapports, pas de perversité, pas de dispute pendant le Hajj.", "quran-2-197"),
      p("Ne pas tuer le gibier.", "quran-5-95"),
      p("Le muhrim ne se marie pas et ne marie personne.", "muslim-1409"),
      p("Celui qui se rase pour une gêne compense par trois jours de jeûne, six pauvres nourris ou un mouton.", "quran-2-196", "bukhari-1814"),
    ],
    cases: [
      c("J’ai commis un interdit par oubli ou ignorance.", "Retirez-le dès que vous vous en rendez compte. Selon de nombreux savants, rien n’est dû pour l’oubli ou l’ignorance, sauf pour ce qui détruit (rasage, ongles), où la compensation est discutée.", W),
      c("Le rapport conjugal avant ‘Arafa ?", "Il annule le Hajj selon les quatre écoles : il faut le terminer, sacrifier et le refaire. Demandez conseil immédiatement.", W),
    ],
    sensitive: true,
  },

  "hajj-tawaf-sai": {
    title: "Tawâf et sa‘y",
    short: "Le tawâf, ce sont sept tours autour de la Ka‘ba, en la gardant à gauche, en commençant à la Pierre noire. Le sa‘y, ce sont sept trajets entre Safâ et Marwa, en commençant par Safâ.",
    rules: [
      p("Le Prophète ﷺ a fait sept tours, puis a prié deux rak‘ât derrière le Maqâm Ibrâhîm, puis est allé à Safâ.", "muslim-1218a"),
      p("« As-Safâ et Al-Marwah sont vraiment parmi les lieux sacrés d’Allah. »", "quran-2-158"),
    ],
    cases: [c("Faut-il les ablutions pour le tawâf ?", "Oui selon la majorité des savants ; les hanafites les jugent obligatoires mais non conditions de validité. Le sa‘y peut se faire sans ablutions.", W)],
  },

  "hajj-arafah-muzdalifah-mina": {
    title: "‘Arafa, Muzdalifa et Minâ",
    short: "Le 9 Dhul-Hijja, on se tient à ‘Arafa jusqu’au coucher du soleil ; on passe la nuit à Muzdalifa ; puis on séjourne à Minâ les jours suivants pour lapider les stèles.",
    rules: [
      p("« Le hajj, le hajj, c’est le jour de ‘Arafah. »", "abudawud-1949"),
      p("Le Prophète ﷺ est resté à ‘Arafa jusqu’au coucher du soleil, puis a passé la nuit à Muzdalifa et y a prié Fajr.", "muslim-1218c"),
      p("Les faibles, les femmes et ceux qui les accompagnent peuvent quitter Muzdalifa après le milieu de la nuit.", "bukhari-1681"),
    ],
    cases: [c("Je suis arrivé à ‘Arafa de nuit.", "Votre station est valable si vous y êtes avant l’aube du 10.", W)],
  },

  "hajj-jamarat-sacrifice-hair": {
    title: "Lapidation, sacrifice et cheveux",
    short: "Le jour du sacrifice, on lance sept cailloux sur la grande stèle, on sacrifie (pour le tamattu‘ et le qirân), puis on se rase ou on raccourcit les cheveux. Les jours suivants, on lapide les trois stèles.",
    rules: [
      p("Sept cailloux à la grande stèle, avec « Allâhu akbar » à chaque lancer.", "bukhari-1748"),
      p("Le rasage est meilleur que le raccourcissement pour les hommes ; le Prophète ﷺ a invoqué trois fois pour ceux qui se rasent.", "bukhari-1727", "bukhari-1728"),
      p("La femme raccourcit ses cheveux de la longueur d’une phalange.", W),
      p("Ce jour-là, interrogé sur un acte fait avant ou après son moment, le Prophète ﷺ répondait : « Fais-le maintenant, il n’y a pas de mal. »", "bukhari-1736"),
    ],
    sourceIds: ["bukhari-1730", "bukhari-1731", "muslim-1218"],
  },

  "hajj-ifada-farewell": {
    title: "Tawâf al-ifâda et tawâf d’adieu",
    short: "Le tawâf al-ifâda est un pilier du Hajj, fait à partir du jour du sacrifice. Le tawâf d’adieu est le dernier acte avant de quitter La Mecque ; la femme en règles en est dispensée.",
    rules: [
      p("Le Prophète ﷺ a fait le tawâf al-ifâda le jour du sacrifice.", "muslim-1218"),
      p("Les gens ont reçu l’ordre d’accomplir le Tawâf d’adieu comme dernière chose avant de quitter La Mecque, sauf les femmes ayant leurs règles, qui en étaient dispensées.", "bukhari-1755"),
      p("Safiyya, qui avait déjà fait l’ifâda, a pu partir malgré ses règles.", "muslim-1211ab", "muslim-1211ae"),
    ],
  },

  "hajj-types": {
    title: "Les trois formes du Hajj",
    short: "Tamattu‘ : une ‘Umra, on sort de l’ihrâm, puis le Hajj, avec un sacrifice. Qirân : ‘Umra et Hajj ensemble sans sortir d’ihrâm, avec un sacrifice. Ifrâd : le Hajj seul, sans sacrifice.",
    rules: [p("Les trois formes ont été pratiquées avec le Prophète ﷺ.", "muslim-1213c", "muslim-1216a", "muslim-1226g")],
    cases: [c("Laquelle choisir ?", "Le tamattu‘ est le plus recommandé pour celui qui n’amène pas de bête (avis hanbalite) ; le Prophète ﷺ a fait le qirân car il avait amené la sienne. Les écoles ont chacune leur préférence.", W)],
  },

  "hajj-umrah": {
    title: "La ‘Umra",
    chapter: "hajj-types",
    aliases: ["umra", "omra", "oumra"],
    short: "La ‘Umra comprend l’ihrâm, le tawâf, le sa‘y, puis le rasage ou le raccourcissement. Elle se fait à tout moment de l’année.",
    rules: [
      p("« Et accomplissez pour Allah le pèlerinage et l’Umra. »", "quran-2-196"),
      p("D’une ‘Umra à l’autre, les péchés commis entre les deux sont expiés.", "bukhari-1773"),
      p("Une ‘Umra en Ramadan équivaut à un Hajj.", "bukhari-1782"),
    ],
    note: ["Elle est obligatoire une fois pour les shafi‘ites et les hanbalites ; une Sunnah très appuyée pour les hanafites et les malikites."],
  },

  "hajj-menstruation": {
    title: "Les règles pendant le Hajj",
    short: "La femme en règles accomplit tous les rites, sauf le tawâf, qu’elle fait après sa purification. Si elle a déjà fait le tawâf al-ifâda, elle est dispensée du tawâf d’adieu.",
    rules: [
      p("« Fais tout ce que font les pèlerins, sauf le tawaf autour de la Ka`ba jusqu’à ce que tu sois purifiée. »", "bukhari-305", "bukhari-1652"),
      p("Ayant déjà fait l’ifâda, elle peut partir sans tawâf d’adieu.", "muslim-1211ab", "bukhari-1755"),
    ],
    cases: [c("Mon vol part et je n’ai pas fait le tawâf al-ifâda.", "C’est une situation difficile qui demande l’avis d’un savant sur place : certains permettent, en dernier recours, de le faire avec une protection.", W)],
    sensitive: true,
  },

  "hajj-child-incapacity": {
    title: "L’enfant et la personne incapable",
    short: "Le Hajj de l’enfant est valable et récompensé, mais il devra refaire le Hajj obligatoire après la puberté. Celui qui ne peut plus voyager à cause de l’âge ou d’une maladie durable peut faire faire le Hajj à sa place.",
    rules: [
      p("Une femme souleva un enfant et dit : « Ô Messager d’Allah, aura-t-il la récompense du Hajj ? » Il répondit : « Oui, et tu auras une récompense. »", "muslim-1336c"),
      p("Une femme a fait le Hajj pour son père âgé, incapable de tenir sur une monture.", "muslim-1334"),
    ],
    cases: [c("Qui peut faire le Hajj pour autrui ?", "Celui qui a déjà fait son propre Hajj, selon la majorité des savants.", W)],
  },
};
