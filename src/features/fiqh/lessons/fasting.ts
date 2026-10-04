import { c, p, type LessonEntry } from "./types";

const W = "wajiz-siyam";

export const FASTING_LESSONS: Record<string, LessonEntry> = {
  "fasting-obligation": {
    title: "L’obligation du jeûne de Ramadan",
    short: "Le jeûne de Ramadan est obligatoire pour tout musulman pubère, sain d’esprit, résident et en bonne santé. Il consiste à s’abstenir de manger, de boire et des rapports conjugaux de l’aube au coucher du soleil.",
    rules: [
      p("« Ô vous qui croyez, le jeûne vous a été prescrit comme il l’a été à ceux d’avant vous. »", "quran-2-183"),
      p("« Celui d’entre vous qui assiste à ce mois, qu’il le jeûne. »", "quran-2-185"),
      p("Le jeûne de Ramadan est l’un des cinq piliers de l’islam.", "bukhari-8"),
      p("On s’abstient de l’aube jusqu’à la nuit : « Mangez et buvez jusqu’à ce que se distingue le fil blanc du fil noir, puis complétez le jeûne jusqu’à la nuit. »", "quran-2-187"),
    ],
    cases: [
      c("À partir de quel âge ?", "Il devient obligatoire à la puberté. On y habitue les enfants avant, selon leurs forces.", W),
      c("Qui en est dispensé ?", "Le malade et le voyageur (qui rattrapent), la femme en règles ou en lochies (qui rattrape), et la personne âgée ou malade chronique qui ne peut pas jeûner (qui nourrit un pauvre par jour).", "quran-2-184", "bukhari-4505"),
    ],
  },

  "fasting-taqwa": {
    title: "Le sens du jeûne",
    short: "Le jeûne a pour but la piété (taqwâ). Celui qui jeûne préserve aussi sa langue et son comportement : le mensonge et l’insulte vident le jeûne de son sens.",
    rules: [
      p("« … afin que vous atteigniez la piété. »", "quran-2-183"),
      p("« Celui qui ne délaisse pas la parole mensongère et l’agir selon elle, Allah n’a pas besoin qu’il délaisse sa nourriture et sa boisson. »", "bukhari-1903"),
      p("Le jeûne est un bouclier ; si quelqu’un insulte le jeûneur, qu’il dise : « Je jeûne. »", "bukhari-1904"),
      p("« Celui qui jeûne Ramadan avec foi et espérance, ses péchés passés lui sont pardonnés. »", "bukhari-1901"),
    ],
  },

  "fasting-intention": {
    title: "L’intention du jeûne",
    chapter: "fasting-foundations",
    aliases: ["niyya jeûne", "intention ramadan"],
    short: "Pour le jeûne obligatoire, on doit avoir décidé de jeûner avant l’aube. Pour un jeûne surérogatoire, on peut le décider dans la journée si l’on n’a encore rien mangé.",
    rules: [
      p("« Pas de jeûne pour celui qui ne l’a pas résolu avant l’aube. »", "abudawud-2454"),
      p("Le Prophète ﷺ décidait parfois de jeûner dans la journée, pour un jeûne surérogatoire, quand il n’y avait rien à manger.", "muslim-1154"),
      p("L’intention est dans le cœur : se lever pour le suhûr en vue de jeûner suffit.", "bukhari-1"),
    ],
    cases: [c("Faut-il renouveler l’intention chaque nuit de Ramadan ?", "Pour les malikites, une intention au début du mois suffit ; pour les autres écoles, on la renouvelle chaque nuit. Le simple fait de prévoir de jeûner le lendemain la constitue.", W)],
  },

  "fasting-month-start": {
    title: "Le début du mois",
    short: "Ramadan commence quand on voit le croissant, ou quand Sha‘bân a compté trente jours. On ne devance pas le mois d’un ou deux jours de jeûne.",
    rules: [
      p("« Ne jeûnez pas avant de le voir, et ne rompez pas avant de le voir ; s’il est caché, estimez-le. »", "bukhari-1906"),
      p("« Ne devancez pas Ramadan d’un jour ou deux de jeûne », sauf pour celui qui avait l’habitude de jeûner ce jour-là.", "bukhari-1914"),
    ],
    cases: [c("Suivre son pays ou l’Arabie saoudite ?", "Les savants divergent entre l’observation locale et l’observation dans un autre pays. Suivez la décision de la communauté de votre pays pour rester uni avec elle.", W)],
    sourceIds: ["bukhari-1900"],
  },

  "fasting-crescent": {
    title: "L’observation du croissant",
    short: "Le mois lunaire commence avec la vue du croissant. Si le ciel est couvert, on complète le mois en cours à trente jours.",
    rules: [
      p("« Jeûnez à sa vue et rompez à sa vue ; s’il vous est caché, complétez le nombre. »", "bukhari-1900", "bukhari-1906"),
    ],
    sourceIds: [W],
  },

  "fasting-thirty-days": {
    title: "Mois de 29 ou 30 jours",
    short: "Le mois lunaire compte 29 ou 30 jours, jamais plus. Sans observation du croissant, on complète trente jours.",
    rules: [p("« Le mois fait ainsi et ainsi » : vingt-neuf jours, ou trente ; s’il est caché, complétez trente.", "bukhari-1907")],
  },

  "fasting-dawn": {
    title: "L’aube : début du jeûne",
    short: "Le jeûne commence à l’aube vraie (l’heure de Fajr). On peut manger et boire jusqu’à ce moment.",
    rules: [
      p("« Mangez et buvez jusqu’à ce que se distingue pour vous le fil blanc du fil noir à l’aube. »", "quran-2-187"),
      p("Le fil blanc est la clarté du jour, le fil noir l’obscurité de la nuit.", "bukhari-1916"),
      p("« Bilâl appelle de nuit : mangez et buvez jusqu’à l’appel d’Ibn Umm Maktûm » qui appelait à l’aube.", "bukhari-1918"),
    ],
    cases: [c("J’ai bu en entendant l’adhân de Fajr.", "Arrêtez dès que vous êtes sûr que l’aube est arrivée. Si l’adhân est donné à l’heure exacte, ce que vous buvez après rompt le jeûne.", W)],
  },

  "fasting-iftar-time": {
    title: "Le coucher du soleil : fin du jeûne",
    short: "Le jeûne prend fin dès que le soleil est couché, à l’heure de Maghrib. Il est recommandé de rompre sans tarder.",
    rules: [
      p("« Quand la nuit arrive d’ici, que le jour s’en va d’ici et que le soleil s’est couché, le jeûneur rompt. »", "bukhari-1954"),
      p("« Les gens restent dans le bien tant qu’ils hâtent la rupture du jeûne. »", "bukhari-1957"),
    ],
    sourceIds: ["bukhari-1958"],
  },

  "fasting-suhur": {
    title: "Le suhûr",
    short: "Le repas d’avant l’aube est béni. Il est recommandé de le prendre et de le retarder jusqu’à peu avant Fajr.",
    rules: [
      p("« Prenez le suhûr, car il y a une bénédiction dans le suhûr. »", "bukhari-1923"),
      p("Entre le suhûr du Prophète ﷺ et la prière, il y avait le temps de réciter cinquante versets.", "bukhari-1921"),
    ],
    cases: [c("Je me suis réveillé en état de janâba juste avant l’aube.", "Prenez le suhûr et jeûnez ; faites le ghusl ensuite. Le Prophète ﷺ le faisait.", "bukhari-1926")],
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
    short: "Le jeûne est rompu volontairement en mangeant, en buvant, par le rapport conjugal, en se faisant vomir et par l’éjaculation provoquée. L’apparition des règles le rompt aussi.",
    rules: [
      p("Manger, boire et le rapport conjugal pendant la journée rompent le jeûne.", "quran-2-187"),
      p("Se faire vomir volontairement rompt le jeûne ; le vomissement involontaire ne le rompt pas.", "abudawud-2380"),
      p("Les règles et les lochies rompent le jeûne, même juste avant le coucher du soleil.", "muslim-335c"),
      p("L’éjaculation provoquée par des caresses ou volontairement rompt le jeûne.", W),
    ],
    cases: [
      c("Que doit faire celui qui a rompu sans excuse ?", "Se repentir, s’abstenir le reste de la journée et rattraper ce jour. Pour le rapport conjugal, s’y ajoute l’expiation.", "bukhari-1935", W),
      c("Une perfusion nutritive rompt-elle le jeûne ?", "Oui, car elle nourrit. Une injection de médicament qui ne nourrit pas ne le rompt pas, selon de nombreux savants contemporains.", W),
    ],
  },

  "fasting-not-breaking": {
    title: "Ce qui ne rompt pas le jeûne",
    chapter: "fasting-invalidations",
    aliases: ["ne rompt pas", "brosse à dents", "siwak", "prise de sang", "baiser"],
    short: "Ne rompent pas le jeûne : manger par oubli, le vomissement involontaire, se réveiller en état de janâba, un rêve érotique, avaler sa salive, se rincer la bouche, le siwâk, une prise de sang.",
    rules: [
      p("Manger ou boire par oubli : « C’est Allah qui l’a nourri et abreuvé. »", "muslim-1155"),
      p("Le vomissement qui surprend ne rompt pas le jeûne.", "abudawud-2380"),
      p("Se réveiller en état de janâba : le Prophète ﷺ faisait le ghusl après l’aube et jeûnait.", "bukhari-1926"),
      p("Le baiser, pour celui qui se maîtrise : le Prophète ﷺ embrassait son épouse en jeûnant.", "bukhari-1927"),
      p("Se rincer la bouche est permis, sans aspirer l’eau profondément par le nez.", "abudawud-142"),
    ],
    cases: [
      c("Les ventouses (hijâma) ?", "Le Prophète ﷺ s’est fait poser des ventouses en jeûnant. Les hanbalites considèrent qu’elles rompent le jeûne ; la majorité, non. Une prise de sang suit le même débat ; mieux vaut la faire après l’iftâr si possible.", "bukhari-1938", W),
      c("Les gouttes dans les yeux ou le dentifrice ?", "Les gouttes oculaires ne rompent pas le jeûne pour de nombreux savants. Le dentifrice est permis si l’on n’en avale rien ; le siwâk est préférable.", W),
    ],
  },

  "fasting-forgetfulness": {
    title: "Manger ou boire par oubli",
    short: "Celui qui mange ou boit en oubliant qu’il jeûne poursuit son jeûne : il est valable et il n’a rien à rattraper.",
    rules: [p("« Celui qui oublie qu’il jeûne, puis mange ou boit, qu’il complète son jeûne : c’est Allah qui l’a nourri et abreuvé. »", "muslim-1155")],
    cases: [
      c("Je m’en suis souvenu la bouche pleine.", "Recrachez ce qui est dans votre bouche et poursuivez votre jeûne.", W),
      c("Je vois quelqu’un manger par oubli.", "Rappelez-le-lui avec douceur : c’est l’aider dans le bien.", W),
    ],
  },

  "fasting-intercourse": {
    title: "Le rapport conjugal en journée",
    short: "Le rapport conjugal pendant la journée de Ramadan rompt le jeûne et impose, en plus du rattrapage, une expiation lourde.",
    rules: [
      p("Le rapport est permis la nuit de Ramadan, interdit le jour.", "quran-2-187"),
      p("À l’homme qui avait eu un rapport en journée, le Prophète ﷺ a imposé l’expiation.", "bukhari-1935", "muslim-1112a"),
    ],
    cases: [c("Et l’épouse ?", "Si elle a été consentante, elle rattrape et doit l’expiation selon la majorité ; si elle a été contrainte, elle n’a rien à expier.", W)],
    sensitive: true,
  },

  "fasting-kaffara": {
    title: "L’expiation (kaffâra)",
    short: "L’expiation du rapport conjugal en journée de Ramadan est, dans l’ordre : affranchir un esclave ; sinon jeûner deux mois consécutifs ; sinon nourrir soixante pauvres.",
    rules: [
      p("Le Prophète ﷺ a demandé à l’homme s’il pouvait affranchir un esclave, puis jeûner deux mois consécutifs, puis nourrir soixante pauvres.", "bukhari-1935", "bukhari-1937"),
      p("Cette expiation est liée au rapport conjugal ; manger ou boire volontairement impose le rattrapage et le repentir.", "muslim-1112a", W),
    ],
    note: ["Pour les hanafites et les malikites, manger ou boire volontairement impose aussi l’expiation."],
  },

  "fasting-illness": {
    title: "Le malade",
    short: "Le malade à qui le jeûne nuit ou retarde la guérison peut rompre et rattrape plus tard. Celui dont la maladie est chronique et sans espoir de guérison nourrit un pauvre par jour.",
    rules: [
      p("« Quiconque est malade ou en voyage jeûnera un nombre égal d’autres jours. »", "quran-2-184", "quran-2-185"),
      p("Celui qui ne peut pas jeûner du tout nourrit un pauvre pour chaque jour.", "quran-2-184", "bukhari-4505"),
    ],
    cases: [c("Un léger rhume me permet-il de rompre ?", "Non. La dispense concerne la maladie qui rend le jeûne difficile ou nuisible ; fiez-vous à votre état réel et à l’avis d’un médecin.", W)],
  },

  "fasting-travel": {
    title: "Le voyageur",
    short: "Le voyageur peut jeûner ou rompre, puis rattraper. S’il jeûne sans peine, c’est bien ; si le jeûne l’épuise, il vaut mieux rompre.",
    rules: [
      p("À Hamza al-Aslamî : « Jeûne si tu veux, romps si tu veux. »", "bukhari-1943"),
      p("« Ce n’est pas de la piété de jeûner en voyage », dit à propos d’un homme épuisé.", "bukhari-1946"),
      p("Les Compagnons voyageaient avec lui : certains jeûnaient, d’autres non, et personne ne le reprochait à l’autre.", "muslim-1113e"),
    ],
  },

  "fasting-makeup": {
    title: "Rattraper les jours manqués",
    short: "Les jours manqués pour une excuse se rattrapent avant le Ramadan suivant, consécutifs ou non. Le proche d’un défunt peut jeûner à sa place.",
    rules: [
      p("« … un nombre égal d’autres jours. »", "quran-2-185"),
      p("‘Â’isha rattrapait ses jours en Sha‘bân.", "bukhari-1950"),
      p("« Celui qui meurt en devant des jours de jeûne, son proche jeûne pour lui. »", "bukhari-1952"),
    ],
    cases: [c("Le Ramadan suivant est arrivé sans que j’aie rattrapé.", "Rattrapez après. Si le retard était sans excuse, plusieurs écoles ajoutent un repas à un pauvre par jour.", W)],
  },

  "fasting-menstruation": {
    title: "Règles et lochies pendant Ramadan",
    short: "La femme ne jeûne pas pendant ses règles ou ses lochies ; elle rattrape ces jours ensuite. Si le sang s’arrête avant l’aube, elle jeûne même si elle fait le ghusl après.",
    rules: [
      p("« Nous recevions l’ordre de rattraper le jeûne, et non la prière. »", "muslim-335c"),
      p("La femme en règles ne jeûne pas.", "bukhari-304"),
      p("Le ghusl peut être fait après l’aube : le jeûne reste valable.", "bukhari-1926"),
    ],
    sensitive: true,
  },

  "fasting-elderly-pregnant": {
    title: "Personne âgée, grossesse, allaitement",
    chapter: "fasting-excuses",
    aliases: ["enceinte", "allaitement", "vieillard", "fidya", "personne âgée"],
    short: "La personne âgée qui ne peut plus jeûner nourrit un pauvre pour chaque jour. La femme enceinte ou qui allaite peut rompre si elle craint pour elle ou pour l’enfant.",
    rules: [
      p("Ibn ‘Abbâs : le vieillard et la vieille femme qui ne peuvent jeûner nourrissent un pauvre par jour.", "bukhari-4505"),
      p("« Allah a allégé le jeûne pour le voyageur, la femme enceinte et celle qui allaite. »", "abudawud-2408"),
    ],
    cases: [c("Enceinte ou allaitante : rattraper ou nourrir ?", "La majorité des savants demandent le rattrapage ; certains y ajoutent la nourriture d’un pauvre quand elle a rompu par crainte pour l’enfant. D’autres, comme Ibn ‘Abbâs, se contentent de la nourriture.", "abudawud-2408", W)],
    sensitive: true,
  },

  "fasting-shawwal": {
    title: "Les six jours de Shawwâl",
    short: "Jeûner six jours de Shawwâl après Ramadan équivaut à jeûner toute l’année.",
    rules: [p("« Celui qui jeûne Ramadan puis le fait suivre de six jours de Shawwâl, c’est comme s’il avait jeûné toute l’année. »", "muslim-1164c")],
    cases: [c("Faut-il les jeûner à la suite ?", "Non, ils peuvent être séparés tant qu’ils sont en Shawwâl. Il est préférable de rattraper d’abord les jours de Ramadan manqués.", W)],
  },

  "fasting-ashura": {
    title: "‘Âshûrâ’",
    short: "Le jeûne du 10 Muharram efface les péchés de l’année passée. Il est recommandé d’y ajouter le 9.",
    rules: [
      p("Il efface les péchés de l’année précédente.", "muslim-1162a"),
      p("Il est devenu facultatif après l’obligation de Ramadan.", "bukhari-2002"),
      p("« Si je vis jusqu’à l’an prochain, je jeûnerai le neuvième. »", "muslim-1134"),
    ],
  },

  "fasting-arafah": {
    title: "Le jour de ‘Arafa",
    short: "Le jeûne du 9 Dhul-Hijja efface les péchés de l’année passée et de l’année à venir. Il concerne ceux qui ne font pas le Hajj.",
    rules: [
      p("Il efface les péchés de l’année précédente et de l’année suivante.", "muslim-1162a"),
      p("Le pèlerin à ‘Arafa ne jeûne pas : le Prophète ﷺ y a bu du lait devant les gens.", "bukhari-1988"),
    ],
  },

  "fasting-tashriq": {
    title: "Les jours de Tashrîq",
    short: "On ne jeûne pas les 11, 12 et 13 Dhul-Hijja : ce sont des jours où l’on mange, boit et évoque Allah. Seul le pèlerin qui n’a pas trouvé de bête à sacrifier peut les jeûner.",
    rules: [
      p("« Les jours de Tashrîq sont des jours où l’on mange et boit. »", "muslim-1141a"),
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
      p("« La Nuit du Destin vaut mieux que mille mois. »", "quran-97-3"),
      p("« Recherchez-la dans les nuits impaires des dix dernières. »", "bukhari-2017", "bukhari-2020"),
      p("Invocation : « Allâhumma innaka ‘afuwwun tuḥibbu-l-‘afwa fa‘fu ‘annî » (Ô Allah, Tu es Pardonneur, Tu aimes le pardon, pardonne-moi).", "tirmidhi-3513"),
    ],
  },

  "fasting-itikaf": {
    title: "La retraite à la mosquée (i‘tikâf)",
    chapter: "fasting-qadr",
    aliases: ["itikaf", "retraite", "dix dernières nuits"],
    short: "L’i‘tikâf consiste à rester à la mosquée pour l’adoration. Le Prophète ﷺ le faisait les dix dernières nuits de Ramadan.",
    rules: [p("Le Prophète ﷺ faisait l’i‘tikâf les dix dernières nuits de Ramadan, jusqu’à sa mort ; ses épouses l’ont fait après lui.", "bukhari-2026")],
    cases: [c("Puis-je sortir de la mosquée ?", "Seulement pour un besoin nécessaire : toilettes, repas si personne ne l’apporte.", W)],
  },
};
