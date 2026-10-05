import { c, p, type LessonEntry } from "./types";


export const HAJJ_LESSONS: Record<string, LessonEntry> = {
  "hajj-obligation": {
    title: "L’obligation du Hajj",
    short: "Al-Wajîz : le Hajj est obligatoire, avec la ‘Umra, une fois dans la vie, pour tout musulman pubère, sain d’esprit, libre et qui en a la capacité.",
    rules: [
      p("« Et c’est un devoir envers Allah pour les gens qui ont les moyens, d’aller faire le pèlerinage de la Maison. »", "quran-3-97"),
      p("C’est le cinquième pilier de l’islam.", "bukhari-8"),
      p("Celui qui le fait sans obscénité ni perversité en revient comme au jour où sa mère l’a mis au monde.", "bukhari-1521"),
      p("Le Hajj accepté n’a d’autre récompense que le Paradis.", "bukhari-1773"),
      p("Al-Wajîz : celui qui en a la capacité doit s’y empresser.", "wajiz-hajj"),
    ],
    cases: [
      c("Qu’est-ce que la capacité ?", "Al-Wajîz : la santé, posséder de quoi faire l’aller et le retour en plus de ses besoins et de ceux des personnes qu’on a à charge, et la sécurité de la route.", "wajiz-hajj"),
      c("La femme peut-elle partir sans mahram ?", "Le Prophète ﷺ a dit que la femme ne voyage qu’avec un mahram, et a dit à un homme d’aller faire le Hajj avec son épouse. Al-Wajîz : la femme doit être accompagnée de son mari ou d’un mahram ; si elle n’en trouve pas, elle n’est pas considérée comme capable.", "bukhari-1862", "wajiz-hajj"),
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
    sourceIds: ["wajiz-hajj"],
    short: "Al-Wajîz compte cinq piliers : l’intention, la station à ‘Arafa, la nuit à Muzdalifa jusqu’à l’aube avec la prière de Fajr, le tawâf al-ifâda et le sa‘y. Et cinq obligations : l’ihrâm depuis le mîqât, les nuits à Minâ, la lapidation dans l’ordre, le tawâf d’adieu, le rasage ou le raccourcissement.",
    rules: [
      p("Station à ‘Arafa : « Le hajj, le hajj, c’est le jour de ‘Arafah. »", "abudawud-1949"),
      p("Tawâf al-ifâda et sa‘y entre Safâ et Marwa.", "muslim-1218a", "quran-2-158"),
      p("Al-Wajîz : l’intention est un pilier, d’après « La récompense des actions dépend des intentions ».", "wajiz-hajj", "bukhari-1"),
      p("Al-Wajîz : le Prophète ﷺ a permis aux bergers de ne pas passer les nuits à Minâ ; cette permission montre que c’est une obligation pour les autres.", "wajiz-hajj"),
    ],
    cases: [
      c("Le rasage est-il un pilier ?", "Al-Wajîz : la plupart des juristes en font une obligation dont l’omission se répare par un sacrifice ; les shafi‘ites en font un pilier. Badawî rapporte d’al-Albânî qu’aucun texte ne tranche entre les deux.", "wajiz-hajj"),
    ],
  },

  "hajj-ihram-miqat-talbiya": {
    title: "Ihrâm, mîqât et talbiya",
    short: "On entre en ihrâm au mîqât : l’homme porte un pagne et un drap, on formule l’intention du rite, puis on répète la talbiya. Pendant le Hajj, le Prophète ﷺ l’a répétée jusqu’à la lapidation de Jamrat al-‘Aqaba.",
    rules: [
      p("Les mîqât : Dhul-Hulayfa pour Médine, al-Juhfa pour le Shâm, Qarn al-Manâzil pour le Najd, Yalamlam pour le Yémen.", "bukhari-1528"),
      p("La talbiya : « Labbayka-llâhumma labbayk, labbayka lâ sharîka laka labbayk, inna-l-ḥamda wa-n-ni‘mata laka wa-l-mulk, lâ sharîka lak. »", "bukhari-1549"),
      p("La femme en règles ou en lochies entre aussi en ihrâm : elle fait le ghusl et formule son intention.", "muslim-1209"),
      p("Le Prophète ﷺ a continué la talbiya jusqu’à la lapidation de Jamrat al-‘Aqaba.", "bukhari-1685"),
    ],
    steps: [
      p("Al-Wajîz : faites le ghusl et mettez du parfum sur le corps ; pas de vêtement touché par le safran ou le wars.", "wajiz-hajj", "bukhari-1542"),
      p("Hommes : un pagne et un drap, blancs selon al-Wajîz ; femmes : sans niqâb ni gants.", "wajiz-hajj", "bukhari-1542", "bukhari-1838"),
      p("Au mîqât, formulez l’intention ; al-Wajîz donne : « Labbayka-llâhumma bi-‘umra » pour la ‘Umra.", "wajiz-hajj", "muslim-1218"),
      p("Al-Wajîz : élevez la voix dans la talbiya.", "wajiz-hajj"),
    ],
    cases: [
      c("J’ai dépassé le mîqât sans ihrâm.", "Al-Wajîz : celui qui le dépasse sans ihrâm alors qu’il veut faire le Hajj ou la ‘Umra a péché ; il revient au mîqât pour y entrer en ihrâm. Selon Badawî, s’il ne revient pas, son rite reste valable et il n’a pas de sacrifice à faire, mais il a péché.", "wajiz-hajj"),
    ],
  },

  "hajj-prohibitions": {
    title: "Les interdits de l’ihrâm",
    chapter: "hajj-ihram",
    aliases: ["interdits ihram", "parfum ihram", "fidya", "chasse ihram", "mariage ihram"],
    sensitive: true,
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
      c("J’ai commis un interdit par oubli ou ignorance.", "L’homme entré en ihrâm parfumé et vêtu d’un manteau a reçu l’ordre de laver le parfum et d’ôter le manteau, sans ordre de sacrifice. Al-Wajîz en conclut, citant Shuqra, que celui qui commet un interdit doit seulement le cesser. Pour le gibier, il rapporte d’Ibn Kathîr que la majorité impose la compensation même en cas d’oubli.", "bukhari-1536", "wajiz-hajj"),
      c("Le rapport conjugal pendant le Hajj ?", "Al-Wajîz : avant la lapidation de Jamrat al-‘Aqaba, il annule le Hajj ; après elle et avant le tawâf al-ifâda, il ne l’annule pas, mais c’est un péché. Ibn ‘Umar et Ibn ‘Abbâs ont dit à celui dont le Hajj était annulé de le terminer avec les gens, puis de le refaire l’année suivante avec un sacrifice.", "wajiz-hajj"),
    ],
  },

  "hajj-tawaf-sai": {
    title: "Tawâf et sa‘y",
    short: "Le tawâf, ce sont sept tours autour de la Ka‘ba, en la gardant à gauche, de la Pierre noire à la Pierre noire. Le sa‘y, ce sont sept trajets entre Safâ et Marwa, en commençant par Safâ.",
    rules: [
      p("Le Prophète ﷺ a fait sept tours, puis a prié deux rak‘ât derrière le Maqâm Ibrâhîm, puis est allé à Safâ.", "muslim-1218a"),
      p("« As-Safâ et Al-Marwah sont vraiment parmi les lieux sacrés d’Allah. »", "quran-2-158"),
      p("Al-Wajîz : conditions du tawâf : la purification des deux impuretés, couvrir la ‘awra, sept tours complets, de la Pierre noire à la Pierre noire avec la Maison à gauche, en dehors du Hijr, et sans longue interruption.", "wajiz-hajj"),
      p("Al-Wajîz : conditions du sa‘y : sept trajets, commencer par Safâ et finir à Marwa, dans le mas‘â.", "wajiz-hajj"),
    ],
    cases: [
      c("Faut-il les ablutions pour le tawâf ?", "Oui selon al-Wajîz : le tawâf est comme la prière ; et le Prophète ﷺ a dit à ‘Â’isha, qui avait ses règles, de ne pas faire le tawâf avant d’être purifiée.", "wajiz-hajj", "bukhari-305"),
      c("Je doute du nombre de tours.", "Al-Wajîz : on se base sur le plus petit nombre jusqu’à être certain.", "wajiz-hajj"),
      c("Puis-je interrompre le tawâf ?", "Al-Wajîz : si on l’interrompt pour faire ses ablutions, pour la prière obligatoire qui commence ou pour se reposer un peu, on reprend là où on en était ; si l’interruption est longue, on recommence.", "wajiz-hajj"),
    ],
  },

  "hajj-arafah-muzdalifah-mina": {
    title: "‘Arafa, Muzdalifa et Minâ",
    short: "Le 9 Dhul-Hijja, on se tient à ‘Arafa jusqu’au coucher du soleil ; on passe la nuit à Muzdalifa ; puis on séjourne à Minâ les jours suivants pour lapider les stèles.",
    rules: [
      p("« Le hajj, le hajj, c’est le jour de ‘Arafah. »", "abudawud-1949"),
      p("Le Prophète ﷺ est resté à ‘Arafa jusqu’au coucher du soleil, puis a passé la nuit à Muzdalifa et y a prié Fajr.", "muslim-1218c"),
      p("Les faibles, les femmes et ceux qui les accompagnent peuvent quitter Muzdalifa après le milieu de la nuit.", "bukhari-1681"),
    ],
    cases: [
      c("Je suis arrivé à ‘Arafa de nuit.", "Le Prophète ﷺ a fait annoncer : « Si quelqu’un arrive là-bas avant la prière de l’aube dans la nuit d’Al Muzdalifah, son hajj sera complet. »", "abudawud-1949"),
    ],
  },

  "hajj-jamarat-sacrifice-hair": {
    title: "Lapidation, sacrifice et cheveux",
    sourceIds: ["bukhari-1730", "bukhari-1731", "muslim-1218"],
    short: "Le jour du sacrifice, on lance sept cailloux sur la grande stèle, on sacrifie (pour le tamattu‘ et le qirân), puis on se rase ou on raccourcit les cheveux. Les jours suivants, on lapide les trois stèles.",
    rules: [
      p("Sept cailloux à la grande stèle, avec « Allâhu akbar » à chaque lancer.", "bukhari-1748"),
      p("Le rasage est meilleur que le raccourcissement pour les hommes ; le Prophète ﷺ a invoqué trois fois pour ceux qui se rasent.", "bukhari-1727", "bukhari-1728"),
      p("« Le rasage n’est pas une obligation pour les femmes ; seule la coupe des cheveux leur est demandée. »", "abudawud-1985"),
      p("Ce jour-là, interrogé sur un acte fait avant ou après son moment, le Prophète ﷺ répondait : « Fais-le maintenant, il n’y a pas de mal. »", "bukhari-1736"),
    ],
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
    short: "Tamattu‘ : une ‘Umra, on sort de l’ihrâm, puis le Hajj, avec un sacrifice. Qirân : ‘Umra et Hajj ensemble sans sortir d’ihrâm, avec un sacrifice. Ifrâd : le Hajj seul.",
    rules: [
      p("Les trois formes ont été pratiquées avec le Prophète ﷺ.", "muslim-1213c", "muslim-1216a", "muslim-1226g"),
      p("Al-Wajîz : le sacrifice est dû pour le tamattu‘ et pour le qirân.", "wajiz-hajj", "quran-2-196"),
    ],
    cases: [
      c("Laquelle choisir ?", "Al-Wajîz, citant Shuqra et al-Albânî : le tamattu‘ est le meilleur pour celui qui n’a pas amené de bête. Le Prophète ﷺ, qui avait amené la sienne, a fait le qirân et a dit que s’il avait su ce qu’il savait ensuite, il n’aurait pas amené de bête et en aurait fait une ‘Umra.", "wajiz-hajj", "muslim-1218"),
    ],
  },

  "hajj-umrah": {
    title: "La ‘Umra",
    chapter: "hajj-types",
    aliases: ["umra", "omra", "oumra"],
    short: "Al-Wajîz : les piliers de la ‘Umra sont l’ihrâm, le tawâf, le sa‘y, puis le rasage ou le raccourcissement. Elle se fait à tout moment de l’année, et en Ramadan elle vaut mieux.",
    rules: [
      p("« Et accomplissez pour Allah le pèlerinage et l’Umra. »", "quran-2-196"),
      p("D’une ‘Umra à l’autre, les péchés commis entre les deux sont expiés.", "bukhari-1773"),
      p("Une ‘Umra en Ramadan équivaut à un Hajj.", "bukhari-1782"),
      p("Al-Wajîz : le Hajj est obligatoire avec la ‘Umra, une fois dans la vie.", "wajiz-hajj"),
    ],
  },

  "hajj-menstruation": {
    title: "Les règles pendant le Hajj",
    sensitive: true,
    short: "La femme en règles accomplit tous les rites, sauf le tawâf, qu’elle fait après sa purification. Si elle a déjà fait le tawâf al-ifâda, elle est dispensée du tawâf d’adieu.",
    rules: [
      p("« Fais tout ce que font les pèlerins, sauf le tawaf autour de la Ka`ba jusqu’à ce que tu sois purifiée. »", "bukhari-305", "bukhari-1652"),
      p("Ayant déjà fait l’ifâda, elle peut partir sans tawâf d’adieu.", "muslim-1211ab", "bukhari-1755"),
    ],
  },

  "hajj-child-incapacity": {
    title: "L’enfant et la personne incapable",
    short: "Le Hajj de l’enfant est valable et récompensé, mais il devra refaire le Hajj obligatoire après la puberté. Celui qui ne peut plus voyager à cause de l’âge peut faire faire le Hajj à sa place.",
    rules: [
      p("Une femme souleva un enfant et dit : « Ô Messager d’Allah, aura-t-il la récompense du Hajj ? » Il répondit : « Oui, et tu auras une récompense. »", "muslim-1336c"),
      p("Al-Wajîz : le Hajj de l’enfant est valable, mais ne le dispense pas du Hajj obligatoire une fois pubère.", "wajiz-hajj"),
      p("Une femme a fait le Hajj pour son père âgé, incapable de tenir sur une monture.", "muslim-1334"),
    ],
    cases: [
      c("Qui peut faire le Hajj pour autrui ?", "Le Prophète ﷺ a demandé à un homme qui faisait la talbiya pour Shubruma s’il avait fait son propre Hajj ; il a répondu non. Le Prophète ﷺ a dit : « Accomplis d’abord le hajj pour toi-même, puis fais-le pour Shubrumah. »", "abudawud-1811"),
    ],
  },
};
