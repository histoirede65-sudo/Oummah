import { c, p, type LessonEntry } from "./types";


export const FASTING_LESSONS: Record<string, LessonEntry> = {
  "fasting-obligation": {
    title: "L’obligation du jeûne de Ramadan",
    short: "Le jeûne de Ramadan est obligatoire pour tout musulman pubère, sain d’esprit, résident et en bonne santé. Il consiste à s’abstenir de manger, de boire et des rapports conjugaux de l’aube au coucher du soleil.",
    rules: [
      p("« O les croyants ! On vous a prescrit as-Siyâm comme on l’a prescrit à ceux d’avant vous. »", "quran-2-183"),
      p("« Quiconque d’entre vous est présent en ce mois, qu’il jeûne ! »", "quran-2-185"),
      p("Le jeûne de Ramadan est l’un des cinq piliers de l’islam.", "bukhari-8"),
      p("On s’abstient de l’aube jusqu’à la nuit : « Mangez et buvez jusqu’à ce que se distingue, pour vous, le fil blanc de l’aube du fil noir de la nuit. Puis accomplissez le jeûne jusqu’à la nuit. »", "quran-2-187"),
      p("Al-Wajîz : les savants sont unanimes qu’il est obligatoire pour le musulman sain d’esprit, pubère, en bonne santé et résident, et que la femme doit être pure des règles et des lochies.", "wajiz-siyam"),
    ],
    cases: [
      c("À partir de quel âge ?", "Al-Wajîz : il n’est pas obligatoire avant la puberté, d’après le hadith selon lequel le calame est levé pour trois : le fou jusqu’à ce qu’il reprenne ses esprits, le dormeur jusqu’à ce qu’il se réveille, et l’enfant jusqu’à la puberté.", "wajiz-siyam"),
      c("Qui en est dispensé ?", "Le malade et le voyageur (qui rattrapent), la femme en règles ou en lochies (qui rattrape), et la personne âgée qui ne peut pas jeûner (qui nourrit un pauvre par jour).", "quran-2-184", "bukhari-4505"),
    ],
  },

  "fasting-taqwa": {
    title: "Le sens du jeûne",
    short: "Le jeûne a pour but la piété (taqwâ). Celui qui ne renonce pas au mensonge et aux mauvaises actions, Allah n’a pas besoin qu’il abandonne sa nourriture et sa boisson.",
    rules: [
      p("« … ainsi atteindrez-vous la piété. »", "quran-2-183"),
      p("« Celui qui ne renonce pas au mensonge et aux mauvaises actions, Allah n’a pas besoin qu’il abandonne sa nourriture et sa boisson. »", "bukhari-1903"),
      p("Le jeûne est un bouclier ; si quelqu’un insulte le jeûneur, qu’il dise : « Je jeûne. »", "bukhari-1904"),
      p("« Celui qui jeûne pendant le mois de Ramadan avec une foi sincère et dans l’espoir d’une récompense d’Allah, tous ses péchés passés seront pardonnés. »", "bukhari-1901"),
    ],
  },

  "fasting-intention": {
    title: "L’intention du jeûne",
    chapter: "fasting-foundations",
    aliases: ["niyya jeûne", "intention ramadan"],
    short: "Pour le jeûne obligatoire, on doit avoir décidé de jeûner avant l’aube, chaque nuit selon al-Wajîz. Pour un jeûne surérogatoire, on peut le décider dans la journée si l’on n’a encore rien mangé.",
    rules: [
      p("« Celui qui ne prend pas l’intention de jeûner avant l’aube, son jeûne n’est pas valable. »", "abudawud-2454"),
      p("Le Prophète ﷺ décidait parfois de jeûner dans la journée, pour un jeûne surérogatoire, quand il n’y avait rien à manger.", "muslim-1154"),
    ],
    cases: [
      c("Faut-il renouveler l’intention chaque nuit de Ramadan ?", "Al-Wajîz : l’intention doit être faite avant l’aube, chaque nuit.", "wajiz-siyam", "abudawud-2454"),
    ],
  },

  "fasting-month-start": {
    title: "Le début du mois",
    sourceIds: ["bukhari-1900"],
    short: "Ramadan commence quand on voit le croissant, ou quand Sha‘bân a compté trente jours. On ne devance pas le mois d’un ou deux jours de jeûne.",
    rules: [
      p("« Ne jeûnez que lorsque vous voyez le croissant (de Ramadan), et ne cessez de jeûner que lorsque vous voyez le croissant (de Shawwal). Mais si le ciel est couvert (et que vous ne pouvez pas le voir), alors comptez le mois de Sha’ban comme 30 jours. »", "bukhari-1906"),
      p("« Aucun de vous ne doit jeûner un jour ou deux avant le mois de Ramadan, sauf s’il a l’habitude de jeûner (Nawafil). »", "bukhari-1914"),
      p("Al-Wajîz : le début de Ramadan est établi par la vue du croissant, même par un seul témoin digne de confiance ; la fin, par deux témoins.", "wajiz-siyam"),
    ],
    cases: [
      c("Suivre son pays ou l’Arabie saoudite ?", "Al-Wajîz cite : « Le jeûne est le jour où les gens jeûnent, la rupture le jour où ils rompent. » At-Tirmidhî rapporte que certains savants l’expliquent ainsi : jeûner et rompre avec la communauté et la majorité des gens. Al-Wajîz ajoute que celui qui voit seul le croissant ne jeûne pas avant les gens.", "wajiz-siyam", "tirmidhi-697"),
    ],
  },

  "fasting-crescent": {
    title: "L’observation du croissant",
    short: "Le mois lunaire commence avec la vue du croissant. Si le ciel est couvert, on complète le mois en cours à trente jours.",
    rules: [
      p("« Quand vous voyez le croissant (du mois de Ramadan), commencez à jeûner, et quand vous voyez le croissant (du mois de Shawwal), arrêtez de jeûner ; et si le ciel est couvert (et que vous ne pouvez pas le voir), considérez le mois de Ramadan comme ayant 30 jours. »", "bukhari-1900", "bukhari-1906"),
    ],
    sourceIds: ["wajiz-siyam"],
  },

  "fasting-thirty-days": {
    title: "Mois de 29 ou 30 jours",
    short: "Le mois lunaire compte 29 ou 30 jours, jamais plus. Sans observation du croissant, on complète trente jours.",
    rules: [p("« Le mois peut avoir 29 nuits (c’est-à-dire jours), et ne commencez pas à jeûner tant que vous n’avez pas vu la lune, et si le ciel est couvert, alors complétez Sha’ban à 30 jours. »", "bukhari-1907")],
  },

  "fasting-dawn": {
    title: "L’aube : début du jeûne",
    short: "Le jeûne commence à l’aube vraie (l’heure de Fajr). On peut manger et boire jusqu’à ce moment.",
    rules: [
      p("« Mangez et buvez jusqu’à ce que se distingue, pour vous, le fil blanc de l’aube du fil noir de la nuit. »", "quran-2-187"),
      p("Le fil blanc est la clarté du jour, le fil noir l’obscurité de la nuit.", "bukhari-1916"),
      p("Bilâl faisait l’appel de nuit ; le Prophète ﷺ a dit : « Continuez à manger et à boire jusqu’à ce qu’Ibn Um Maktum fasse l’Adhan, car il ne l’annonce qu’à l’aube. »", "bukhari-1918"),
    ],
    cases: [
      c("J’entends l’adhân de Fajr avec un verre à la main.", "Al-Wajîz cite : « Quand l’un d’entre vous entend l’appel à la prière alors qu’il a un récipient dans la main, qu’il ne le pose pas avant d’avoir terminé son besoin. »", "wajiz-siyam", "abudawud-2350"),
    ],
  },

  "fasting-iftar-time": {
    title: "Le coucher du soleil : fin du jeûne",
    short: "Le jeûne prend fin dès que le soleil est couché, à l’heure de Maghrib. Il est recommandé de rompre sans tarder.",
    rules: [
      p("« Quand la nuit tombe de ce côté, que le jour disparaît de l’autre côté et que le soleil se couche, alors la personne qui jeûne doit rompre son jeûne. »", "bukhari-1954"),
      p("« Les gens resteront sur la bonne voie tant qu’ils se dépêcheront de rompre le jeûne. »", "bukhari-1957"),
    ],
    sourceIds: ["bukhari-1958"],
  },

  "fasting-suhur": {
    title: "Le suhûr",
    short: "Le repas d’avant l’aube est béni. Al-Wajîz le recommande, même d’une gorgée d’eau, et recommande de le retarder.",
    rules: [
      p("« Prenez le Suhur car il y a une bénédiction dedans. »", "bukhari-1923"),
      p("Entre le suhûr du Prophète ﷺ et la prière, il y avait le temps de réciter cinquante versets.", "bukhari-1921"),
      p("Al-Wajîz : le suhûr est accompli même avec une gorgée d’eau, et il est recommandé de le retarder.", "wajiz-siyam"),
    ],
    cases: [
      c("Je me suis réveillé en état de janâba juste avant l’aube.", "Le Prophète ﷺ se levait en état de janâba à l’aube, faisait le ghusl et jeûnait ; al-Wajîz le compte parmi ce qui est permis au jeûneur.", "bukhari-1926", "wajiz-siyam"),
    ],
  },

  "fasting-iftar": {
    title: "La rupture du jeûne",
    short: "On rompt le jeûne dès le coucher du soleil, de préférence avec des dattes fraîches, sinon sèches, sinon de l’eau, puis on fait l’invocation de l’iftâr.",
    rules: [
      p("Hâter l’iftâr est une marque de bien.", "bukhari-1957"),
      p("Le Prophète ﷺ rompait avec des dattes fraîches, sinon des dattes sèches, sinon quelques gorgées d’eau.", "abudawud-2356"),
      p("Il disait : « Dhahaba-ẓ-ẓama’, wa-btallati-l-‘urûq, wa thabata-l-ajru in shâ’a-llâh » (La soif est partie, les veines sont abreuvées et la récompense est acquise, si Allah le veut).", "abudawud-2357"),
      p("Celui qui donne à manger à un jeûneur reçoit une récompense égale à la sienne.", "tirmidhi-807"),
    ],
  },

  "fasting-breakers": {
    title: "Ce qui rompt le jeûne",
    chapter: "fasting-invalidations",
    aliases: ["rompre le jeûne", "annule le jeûne", "vomir", "injection"],
    short: "Al-Wajîz compte six choses qui rompent le jeûne : manger et boire volontairement, se faire vomir volontairement, les règles, les lochies et le rapport conjugal.",
    rules: [
      p("Manger, boire et le rapport conjugal pendant la journée rompent le jeûne.", "quran-2-187"),
      p("Se faire vomir volontairement rompt le jeûne ; le vomissement involontaire ne le rompt pas.", "abudawud-2380"),
      p("Al-Wajîz : les règles et les lochies rompent le jeûne, même au dernier instant de la journée, par consensus des savants.", "wajiz-siyam"),
      p("Le rapport conjugal impose en plus l’expiation.", "bukhari-1935"),
    ],
  },

  "fasting-not-breaking": {
    title: "Ce qui ne rompt pas le jeûne",
    chapter: "fasting-invalidations",
    aliases: ["ne rompt pas", "brosse à dents", "siwak", "prise de sang", "baiser"],
    short: "Al-Wajîz cite parmi ce qui est permis au jeûneur : le bain pour se rafraîchir, se rincer la bouche et le nez sans excès, les ventouses, le baiser pour qui se maîtrise, se réveiller en état de janâba, le siwâk, le parfum, le khôl et les gouttes.",
    rules: [
      p("Manger ou boire par oubli : « qu’il termine son jeûne, car c’est Allah seul qui l’a nourri et abreuvé. »", "muslim-1155"),
      p("Le vomissement qui surprend ne rompt pas le jeûne.", "abudawud-2380"),
      p("Se réveiller en état de janâba : le Prophète ﷺ faisait le ghusl après l’aube et jeûnait.", "bukhari-1926"),
      p("Le baiser, pour celui qui se maîtrise : le Prophète ﷺ embrassait son épouse en jeûnant.", "bukhari-1927"),
      p("Se rincer la bouche est permis, sans aspirer l’eau profondément par le nez.", "abudawud-142"),
      p("Al-Wajîz : le siwâk, le parfum, les huiles, le khôl, les gouttes et l’injection (huqna) sont permis au jeûneur, car le principe est la permission : s’ils étaient interdits, Allah et Son Messager l’auraient précisé.", "wajiz-siyam"),
    ],
    cases: [
      c("Les ventouses (hijâma) ou une prise de sang ?", "Le Prophète ﷺ s’est fait poser des ventouses en jeûnant. Interrogé sur la saignée pour le jeûneur, Anas a répondu : « Sauf si cela cause de la faiblesse. ». Al-Wajîz met le don de sang au même rang : celui qui craint de s’affaiblir ne donne pas son sang dans la journée, sauf nécessité.", "bukhari-1938", "bukhari-1940", "wajiz-siyam"),
    ],
  },

  "fasting-forgetfulness": {
    title: "Manger ou boire par oubli",
    short: "Celui qui mange ou boit en oubliant qu’il jeûne poursuit son jeûne. Al-Wajîz : il n’a ni rattrapage ni expiation.",
    rules: [
      p("« Si quelqu’un oublie qu’il jeûne et mange ou boit, qu’il termine son jeûne, car c’est Allah seul qui l’a nourri et abreuvé. »", "muslim-1155"),
      p("Al-Wajîz : il n’a ni rattrapage ni expiation.", "wajiz-siyam"),
    ],
  },

  "fasting-intercourse": {
    title: "Le rapport conjugal en journée",
    sensitive: true,
    short: "Le rapport conjugal pendant la journée de Ramadan rompt le jeûne et impose une expiation lourde.",
    rules: [
      p("Le rapport est permis la nuit de Ramadan, interdit le jour.", "quran-2-187"),
      p("À l’homme qui avait eu un rapport en journée, le Prophète ﷺ a imposé l’expiation.", "bukhari-1935", "muslim-1112a"),
    ],
  },

  "fasting-kaffara": {
    title: "L’expiation (kaffâra)",
    short: "L’expiation du rapport conjugal en journée de Ramadan est, dans l’ordre : affranchir un esclave ; sinon jeûner deux mois consécutifs ; sinon nourrir soixante pauvres.",
    rules: [
      p("Le Prophète ﷺ a demandé à l’homme s’il pouvait affranchir un esclave, puis jeûner deux mois consécutifs, puis nourrir soixante pauvres.", "bukhari-1935", "bukhari-1937"),
      p("Al-Wajîz ne mentionne cette expiation que pour le rapport conjugal.", "wajiz-siyam"),
    ],
  },

  "fasting-illness": {
    title: "Le malade",
    short: "Le malade peut rompre et rattrape plus tard. Al-Wajîz : s’il ne trouve pas de difficulté à jeûner, le jeûne vaut mieux ; s’il en trouve, la rupture vaut mieux. Celui qui ne peut plus jeûner nourrit un pauvre par jour.",
    rules: [
      p("« Quiconque d’entre vous est malade ou en voyage, devra jeûner un nombre égal d’autres jours. »", "quran-2-184", "quran-2-185"),
      p("Al-Wajîz : si le malade ou le voyageur jeûne, son jeûne est valable ; sans difficulté, le jeûne vaut mieux ; avec difficulté, la rupture vaut mieux.", "wajiz-siyam"),
      p("Celui qui ne peut pas jeûner du tout nourrit un pauvre pour chaque jour.", "quran-2-184", "bukhari-4505"),
    ],
  },

  "fasting-travel": {
    title: "Le voyageur",
    short: "Le voyageur peut jeûner ou rompre, puis rattraper. Al-Wajîz : s’il jeûne sans peine, le jeûne vaut mieux ; si le jeûne lui est pénible, il vaut mieux rompre.",
    rules: [
      p("À Hamza al-Aslamî : « Tu peux jeûner si tu veux, et tu peux ne pas jeûner si tu veux. »", "bukhari-1943"),
      p("Voyant un homme qui jeûnait et que l’on protégeait du soleil : « Ce n’est pas un acte de piété de jeûner en voyage. »", "bukhari-1946"),
      p("Les Compagnons voyageaient avec lui : certains jeûnaient, d’autres non, et personne ne le reprochait à l’autre.", "muslim-1113e"),
    ],
  },

  "fasting-makeup": {
    title: "Rattraper les jours manqués",
    short: "Les jours manqués pour une excuse se rattrapent : « un nombre égal d’autres jours ». ‘Â’isha rattrapait les siens en Sha‘bân. Le proche d’un défunt peut jeûner à sa place.",
    rules: [
      p("« … un nombre égal d’autres jours. »", "quran-2-185"),
      p("‘Â’isha rattrapait ses jours en Sha‘bân.", "bukhari-1950"),
      p("« Celui qui meurt alors qu’il devait encore des jours de jeûne (du Ramadan), ses proches doivent jeûner à sa place. »", "bukhari-1952"),
    ],
  },

  "fasting-menstruation": {
    title: "Règles et lochies pendant Ramadan",
    sensitive: true,
    short: "La femme ne jeûne pas pendant ses règles ou ses lochies ; si elle jeûne, son jeûne ne compte pas. Elle rattrape ces jours ensuite.",
    rules: [
      p("‘Â’isha : « On nous a ordonné de rattraper les jours de jeûne, mais pas les prières. »", "muslim-335c"),
      p("La femme en règles ne jeûne pas.", "bukhari-304"),
      p("Al-Wajîz : si elle jeûne pendant ses règles ou ses lochies, son jeûne ne compte pas, et elle doit le rattraper.", "wajiz-siyam"),
    ],
  },

  "fasting-elderly-pregnant": {
    title: "Personne âgée, grossesse, allaitement",
    chapter: "fasting-excuses",
    aliases: ["enceinte", "allaitement", "vieillard", "fidya", "personne âgée"],
    sensitive: true,
    short: "La personne âgée qui ne peut plus jeûner nourrit un pauvre pour chaque jour. Al-Wajîz : la femme enceinte ou qui allaite, si elle ne peut pas jeûner ou craint pour son enfant, rompt et nourrit un pauvre par jour, sans rattrapage.",
    rules: [
      p("Ibn ‘Abbâs : le vieillard et la vieille femme qui ne peuvent jeûner nourrissent un pauvre par jour.", "bukhari-4505"),
      p("« Allah a allégé la prière pour le voyageur, et le jeûne pour le voyageur, la femme qui allaite et la femme enceinte. »", "abudawud-2408"),
      p("Al-Wajîz rapporte d’Ibn ‘Abbâs : la femme enceinte qui craint pour elle et celle qui allaite qui craint pour son enfant rompent, nourrissent un pauvre chaque jour et ne rattrapent pas ; Ibn ‘Umar a ordonné la même chose à sa fille enceinte.", "wajiz-siyam"),
      p("Al-Wajîz : Anas, devenu trop faible pour jeûner une année, a préparé un plat de tharîd et a rassasié trente pauvres.", "wajiz-siyam"),
    ],
  },

  "fasting-shawwal": {
    title: "Les six jours de Shawwâl",
    short: "Jeûner six jours de Shawwâl après Ramadan équivaut à jeûner toute l’année.",
    rules: [
      p("« Celui qui jeûne le mois de Ramadan puis le suit de six jours de Chawwal, c’est comme s’il avait jeûné toute l’année. »", "muslim-1164a"),
    ],
  },

  "fasting-ashura": {
    title: "‘Âshûrâ’",
    short: "Le jeûne du 10 Muharram efface les péchés de l’année passée. Il est recommandé d’y ajouter le 9.",
    rules: [
      p("Il efface les péchés de l’année précédente.", "muslim-1162a"),
      p("Il est devenu facultatif après l’obligation de Ramadan.", "bukhari-2002"),
      p("« Si je vis jusqu’à l’année prochaine, je jeûnerai sûrement le neuvième jour. »", "muslim-1134"),
    ],
  },

  "fasting-arafah": {
    title: "Le jour de ‘Arafa",
    sourceIds: ["wajiz-siyam"],
    short: "Le jeûne du 9 Dhul-Hijja efface les péchés de l’année passée et de l’année à venir. Al-Wajîz : il est recommandé à celui qui ne fait pas le Hajj.",
    rules: [
      p("Il efface les péchés de l’année précédente et de l’année suivante.", "muslim-1162a"),
      p("Le Prophète ﷺ a bu du lait à ‘Arafa devant les gens : il ne jeûnait pas ce jour-là.", "bukhari-1988"),
    ],
  },

  "fasting-tashriq": {
    title: "Les jours de Tashrîq",
    short: "On ne jeûne pas les 11, 12 et 13 Dhul-Hijja : ce sont des jours où l’on mange, boit et évoque Allah. Seul le pèlerin qui n’a pas trouvé de bête à sacrifier peut les jeûner.",
    rules: [
      p("« Les jours de Tashriq sont des jours de nourriture et de boisson. »", "muslim-1141a"),
      p("L’exception concerne le pèlerin en tamattu‘ ou qirân sans sacrifice.", "bukhari-1997"),
    ],
  },

  "fasting-eid-fitr": {
    title: "Le jour de l’Aïd al-Fitr",
    short: "Il est interdit de jeûner le jour de l’Aïd al-Fitr.",
    rules: [p("Le Prophète ﷺ a interdit de jeûner les deux jours de fête.", "bukhari-1990")],
  },

  "fasting-eid-adha": {
    title: "Le jour de l’Aïd al-Adhâ",
    short: "Il est interdit de jeûner le jour de l’Aïd al-Adhâ.",
    rules: [p("Le Prophète ﷺ a interdit de jeûner les deux jours de fête.", "bukhari-1990")],
  },

  "fasting-voluntary-days": {
    title: "Lundi, jeudi et trois jours par mois",
    chapter: "fasting-voluntary",
    aliases: ["lundi", "jeudi", "jours blancs", "jeûne surérogatoire", "dawud"],
    short: "Il est recommandé de jeûner le lundi et le jeudi, et trois jours chaque mois. Le meilleur jeûne surérogatoire est celui de Dâwûd : un jour sur deux.",
    rules: [
      p("Les œuvres sont présentées le lundi et le jeudi ; le Prophète ﷺ aimait jeûner ces jours-là.", "tirmidhi-747"),
      p("Trois jours par mois : un conseil du Prophète ﷺ à Abû Hurayra.", "bukhari-1981"),
      p("Le meilleur jeûne est celui de Dâwûd : un jour sur deux.", "muslim-1159"),
      p("On ne jeûne pas le vendredi seul, sans un jour avant ou après.", "bukhari-1985"),
    ],
  },

  "fasting-qadr": {
    title: "La Nuit du Destin",
    short: "Laylat al-Qadr vaut mieux que mille mois. On la recherche dans les nuits impaires des dix dernières nuits de Ramadan.",
    rules: [
      p("« La nuit d’Al-Qadr est meilleure que mille mois. »", "quran-97-3"),
      p("« Cherchez la nuit du Qadr dans les nuits impaires des dix derniers jours de Ramadan. »", "bukhari-2017", "bukhari-2020"),
      p("Invocation : « Allâhumma innaka ‘afuwwun tuḥibbu-l-‘afwa fa‘fu ‘annî » (Ô Allah, Tu es Pardonneur, Tu aimes le pardon, pardonne-moi).", "tirmidhi-3513"),
    ],
  },

  "fasting-itikaf": {
    title: "La retraite à la mosquée (i‘tikâf)",
    chapter: "fasting-qadr",
    aliases: ["itikaf", "retraite", "dix dernières nuits"],
    short: "L’i‘tikâf consiste à rester à la mosquée pour l’adoration. Le Prophète ﷺ le faisait les dix dernières nuits de Ramadan ; al-Wajîz le compte parmi les sunnas recommandées.",
    rules: [
      p("Le Prophète ﷺ faisait l’i‘tikâf les dix dernières nuits de Ramadan, jusqu’à sa mort ; ses épouses l’ont fait après lui.", "bukhari-2026"),
      p("Al-Wajîz : il ne se fait que dans une mosquée : « pendant que vous êtes en retraite rituelle dans les mosquées ».", "wajiz-siyam", "quran-2-187"),
    ],
    cases: [
      c("Puis-je sortir de la mosquée ?", "Al-Wajîz : seulement pour un besoin indispensable ; sortir sans besoin et le rapport conjugal annulent la retraite.", "wajiz-siyam"),
    ],
  },
};
