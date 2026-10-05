import { c, p, type LessonEntry } from "./types";


export const FUNERAL_LESSONS: Record<string, LessonEntry> = {
  "funerals-dying-person": {
    title: "Accompagner le mourant",
    short: "On rappelle au mourant « lâ ilâha illa-llâh ». Les larmes sont une miséricorde, et l’on appelle à la patience.",
    rules: [
      p("« Faites dire à vos mourants : lâ ilâha illa-llâh. »", "muslim-916a"),
      p("Les larmes sont une miséricorde ; on appelle à la patience et à l’espoir de la récompense.", "bukhari-1284"),
    ],
  },

  "funerals-after-death": {
    title: "Juste après le décès",
    short: "On ferme les yeux du défunt, on invoque pour lui, puis on hâte la toilette, la prière et l’enterrement.",
    rules: [
      p("Le Prophète ﷺ a fermé les yeux d’Abû Salama et a invoqué pour son pardon et l’élargissement de sa tombe.", "muslim-920a"),
      p("« Dépêchez-vous d’enterrer le défunt. »", "bukhari-1315"),
      p("Se frapper le visage et déchirer ses habits sont interdits.", "bukhari-1294"),
    ],
  },

  "funerals-washing": {
    title: "La toilette mortuaire",
    short: "On lave le défunt un nombre impair de fois (trois, cinq ou plus) avec de l’eau et du sidr, en commençant par la droite et les membres du wudû’, avec du camphre au dernier lavage.",
    rules: [
      p("« Lavez-la trois fois, cinq fois ou plus si vous le jugez nécessaire, avec de l’eau et du jujubier, puis mettez du camphre ou un peu de camphre à la fin. »", "bukhari-1253"),
      p("« Il a aussi été dit qu’il fallait commencer par le côté droit et par les parties lavées lors des ablutions. »", "bukhari-1254"),
    ],
    steps: [
      p("Commencez par le côté droit et les membres du wudû’.", "bukhari-1254"),
      p("Lavez tout le corps avec de l’eau et du sidr, trois fois ou plus, en nombre impair.", "bukhari-1253"),
      p("Mettez du camphre dans la dernière eau.", "bukhari-1253"),
    ],
    cases: [
      c("Qui lave le défunt ?", "Al-Wajîz : les hommes lavent les hommes et les femmes les femmes ; l’époux et l’épouse peuvent se laver l’un l’autre. ‘Â’isha a dit que si elle avait su, seules ses épouses auraient lavé le Prophète ﷺ.", "wajiz-salah"),
    ],
  },

  "funerals-washing-cases": {
    title: "Cas particuliers de la toilette",
    short: "Le pèlerin mort en ihrâm est lavé sans parfum et sa tête reste découverte. Les martyrs de Uhud ont été enterrés sans être lavés.",
    rules: [
      p("Le pèlerin mort en ihrâm : lavé à l’eau et au sidr, sans parfum, tête découverte ; il sera ressuscité en prononçant la talbiya.", "bukhari-1265"),
      p("Les martyrs de Uhud ont été enterrés dans leur sang, sans être lavés.", "bukhari-1343"),
    ],
  },

  "funerals-shroud": {
    title: "Le linceul",
    short: "Le Prophète ﷺ a été enveloppé dans trois étoffes blanches de coton, sans chemise ni turban.",
    rules: [
      p("Le Prophète ﷺ a été enveloppé dans trois étoffes blanches de coton, sans chemise ni turban.", "bukhari-1264", "muslim-941a"),
    ],
  },

  "funerals-shroud-cases": {
    title: "Le linceul du pèlerin",
    short: "Le pèlerin mort en ihrâm est enveloppé dans ses deux pièces d’ihrâm, sans parfum et la tête découverte.",
    rules: [p("Pour le pèlerin mort en ihrâm : « Lavez-le avec de l’eau et du Sidr et enveloppez-le dans deux pièces de tissu, ne le parfumez pas et ne couvrez pas sa tête. »", "bukhari-1265")],
  },

  "funerals-prayer-basics": {
    title: "La prière funéraire",
    short: "Debout, sans inclinaison ni prosternation, avec quatre takbîr : al-Fâtiha, la prière sur le Prophète ﷺ, l’invocation pour le défunt, puis le salut.",
    rules: [
      p("Quatre takbîr.", "bukhari-1334"),
      p("Al-Fâtiha après le premier ; Ibn ‘Abbâs a dit : « Sachez que cela (c’est-à-dire la récitation d’Al-Fatiha) fait partie de la tradition du Prophète ﷺ. »", "bukhari-1335"),
      p("Invocation pour le défunt : « Allâhumma-ghfir lahu wa-rḥamhu, wa ‘âfihi wa-‘fu ‘anhu… »", "muslim-963a"),
      p("Assister à la prière vaut un qîrât, suivre jusqu’à l’enterrement deux.", "bukhari-1325"),
    ],
    steps: [
      p("1er takbîr : al-Fâtiha.", "bukhari-1335"),
      p("2e takbîr : la prière sur le Prophète ﷺ (al-Wajîz, d’après le hadith d’Abû Umâma).", "wajiz-salah"),
      p("3e takbîr : invocation pour le défunt.", "muslim-963a"),
      p("Al-Wajîz : l’invocation entre le dernier takbîr et le salut est légiférée, d’après le hadith d’Ibn Abî Awfâ ; puis on salue.", "wajiz-salah"),
    ],
    cases: [
      c("Où se place l’imam ?", "Al-Wajîz : au niveau de la tête pour un homme, au milieu du corps pour une femme, comme l’a fait Anas en disant que le Prophète ﷺ faisait ainsi.", "wajiz-salah"),
    ],
  },

  "funerals-prayer-absent": {
    title: "La prière sur le défunt absent",
    short: "Le Prophète ﷺ a prié sur le Najâshî, roi d’Abyssinie, le jour de sa mort.",
    rules: [
      p("Le Prophète ﷺ a annoncé la mort du Najâshî, est sorti au lieu de prière et a fait quatre takbîr.", "bukhari-1334"),
    ],
  },

  "funerals-burial": {
    title: "L’enterrement",
    short: "On hâte l’enterrement et l’on creuse une tombe large. Al-Wajîz : la niche latérale (lahd) et la fosse sont permises, et la niche est meilleure ; puis on invoque pour le défunt.",
    rules: [
      p("« Dépêchez-vous d’enterrer le défunt. »", "bukhari-1315"),
      p("Le jour de Uhud : « Creusez des tombes larges et enterrez deux ou trois personnes dans une même tombe. »", "abudawud-3215"),
      p("La tombe du Prophète ﷺ avait une niche latérale (lahd) fermée de briques.", "muslim-966", "wajiz-salah"),
      p("Après l’enterrement : « Demandez pardon pour votre frère et demandez pour lui la fermeté, car il va maintenant être interrogé. »", "abudawud-3221"),
    ],
    cases: [
      c("Les femmes suivent-elles le convoi ?", "Umm ‘Atiyya a dit : « On nous a interdit de suivre les cortèges funèbres, mais ce n’était pas strict. »", "bukhari-1278"),
    ],
  },

  "funerals-grave": {
    title: "La tombe",
    sourceIds: ["muslim-966"],
    short: "Al-Wajîz : la tombe est surélevée d’environ un empan, sans être nivelée au sol. On ne la plâtre pas, on ne construit pas dessus et on ne s’assoit pas dessus.",
    rules: [
      p("Le Prophète ﷺ a interdit de plâtrer les tombes, de s’asseoir dessus et de construire dessus.", "muslim-970a"),
      p("Al-Wajîz : la tombe du Prophète ﷺ a été surélevée d’environ un empan, d’après le hadith de Jâbir.", "wajiz-salah"),
    ],
  },

  "funerals-condolences": {
    title: "Les condoléances et le deuil",
    short: "On console la famille en l’invitant à la patience. Le deuil dure trois jours, sauf pour la veuve.",
    rules: [
      p("« Ce qu’Allah prend Lui appartient et ce qu’Il donne Lui appartient, et toute chose auprès de Lui a un terme fixé (dans ce monde), alors elle doit être patiente et espérer la récompense d’Allah. »", "bukhari-1284"),
      p("Pas de deuil au-delà de trois jours, sauf la veuve : quatre mois et dix jours.", "bukhari-1280"),
      p("« Préparez à manger pour la famille de Ja‘far. »", "abudawud-3132"),
      p("Se frapper le visage et déchirer ses habits sont interdits.", "bukhari-1294"),
    ],
  },

  "funerals-graves": {
    title: "La visite des tombes",
    short: "Visiter les tombes rappelle l’au-delà. On salue les défunts et l’on invoque Allah pour eux ; on ne leur adresse aucune demande.",
    rules: [
      p("« Visitez les tombes, car cela vous rappelle la mort. »", "muslim-976b"),
      p("« As-salâmu ‘alaykum ahla-d-diyâri mina-l-mu’minîna wa-l-muslimîn, wa innâ in shâ’a-llâhu bikum la-lâḥiqûn, as’alu-llâha lanâ wa lakumu-l-‘âfiya. »", "muslim-975"),
      p("L’invocation s’adresse à Allah seul.", "muslim-975", "binbaz-grave-visit"),
    ],
  },
};

export const FAMILY_LESSONS: Record<string, LessonEntry> = {
  "family-marriage-purpose": {
    title: "Le sens du mariage",
    sourceIds: ["wajiz-nikah"],
    short: "Le mariage est un lieu de tranquillité, d’affection et de bonté ; le Prophète ﷺ y a appelé les jeunes qui en ont la capacité.",
    rules: [
      p("« Il a créé de vous, pour vous, des épouses pour que vous viviez en tranquillité avec elles et Il a mis entre vous de l’affection et de la bonté. »", "quran-30-21"),
      p("« Ô jeunes gens ! Celui d’entre vous qui en a la capacité doit se marier. »", "bukhari-5065"),
      p("Le Prophète ﷺ a dit que le meilleur d’entre vous est le meilleur envers ses épouses.", "tirmidhi-3895"),
    ],
  },

  "family-proposal": {
    title: "La demande en mariage",
    short: "On choisit d’abord la religion. Il est permis de voir la personne avant de s’engager. On ne demande pas en mariage une femme déjà demandée par un autre.",
    rules: [
      p("« On épouse une femme pour quatre raisons : sa richesse, sa famille, sa beauté et sa religion. Choisis la femme pieuse. »", "bukhari-5090"),
      p("« Va la regarder » : il est recommandé de voir la future épouse.", "muslim-1424"),
      p("On ne demande pas en mariage une femme déjà demandée tant que le premier n’a pas renoncé.", "bukhari-5142"),
    ],
  },

  "family-contract": {
    title: "Le contrat de mariage",
    sensitive: true,
    short: "Le mariage se conclut par le consentement de la femme, l’accord de son tuteur (wali), deux témoins et un mahr.",
    rules: [
      p("La femme ne se marie pas sans son consentement ; pour la vierge, son silence vaut accord.", "bukhari-5136"),
      p("« Il n’y a pas de mariage sans l’autorisation d’un tuteur. »", "abudawud-2085"),
      p("Al-Wajîz : le contrat exige l’accord du tuteur et la présence de deux témoins intègres, d’après le hadith : pas de mariage sans tuteur et deux témoins intègres.", "wajiz-nikah"),
      p("Le contrat se fait en présence du tuteur, de l’époux et de deux témoins.", "binbaz-nikah-witnesses"),
      p("« Organise un banquet, même si c’est avec un seul mouton. »", "bukhari-5167"),
    ],
  },

  "family-wali": {
    title: "Le tuteur (wali)",
    sensitive: true,
    short: "Le mariage de la femme se fait par son tuteur. Il ne peut pas la marier contre son gré, ni l’empêcher injustement d’épouser un homme convenable.",
    rules: [
      p("« Il n’y a pas de mariage sans l’autorisation d’un tuteur. »", "abudawud-2085"),
      p("Le mariage conclu sans l’accord du tuteur est nul.", "abudawud-2083"),
      p("Le tuteur n’empêche pas injustement un mariage convenable.", "quran-2-232"),
      p("Il ne peut marier la femme sans son consentement.", "bukhari-5136"),
    ],
  },

  "family-witnesses": {
    title: "Les témoins",
    sourceIds: ["wajiz-nikah"],
    short: "Le contrat de mariage se conclut devant deux témoins intègres.",
    rules: [
      p("Le contrat est établi avec le tuteur, l’époux et deux témoins.", "binbaz-nikah-witnesses"),
      p("Al-Wajîz cite le hadith : pas de mariage sans tuteur et deux témoins intègres.", "wajiz-nikah"),
    ],
  },

  "family-mahr": {
    title: "Le mahr (la dot)",
    short: "Le mahr est un droit de l’épouse et lui appartient. Al-Wajîz : la Charia ne lui fixe ni minimum ni maximum, mais elle encourage à l’alléger.",
    rules: [
      p("« Et donnez aux épouses leur mahr, de bonne grâce. »", "quran-4-4"),
      p("« Cherche même si ce n’est qu’une bague en fer. »", "muslim-1425"),
      p("Al-Wajîz : le mahr est la propriété de la femme ; personne, pas même son père, ne peut en prendre sans son accord.", "wajiz-nikah"),
    ],
    cases: [
      c("Peut-on le payer plus tard ?", "Al-Wajîz : on peut le verser entièrement tout de suite, entièrement plus tard, ou une partie maintenant et le reste plus tard.", "wajiz-nikah"),
    ],
  },

  "family-spousal-rights": {
    title: "Les droits des époux",
    sensitive: true,
    short: "Les époux se doivent un bon comportement : chacun a des droits équivalents à ses obligations, conformément à la bienséance.",
    rules: [
      p("« Comportez-vous convenablement envers elles. »", "quran-4-19"),
      p("« Elles ont des droits équivalents à leurs obligations, conformément à la bienséance. »", "quran-2-228"),
      p("Le Prophète ﷺ a dit que le meilleur d’entre vous est le meilleur envers ses épouses.", "tirmidhi-3895"),
      p("Refuser sans raison l’intimité à son conjoint est une faute.", "bukhari-5193"),
    ],
  },

  "family-maintenance": {
    title: "L’entretien (nafaqa)",
    short: "Le mari doit l’entretien de son épouse et de ses enfants, selon ses moyens.",
    rules: [
      p("« Que celui qui est aisé dépense de sa fortune. »", "quran-65-7"),
      p("À Hind, dont le mari était avare : « Prends ce qui est suffisant pour toi et tes enfants, mais de façon juste et raisonnable. »", "bukhari-5364"),
      p("L’entretien de la mère qui allaite revient au père.", "quran-2-233"),
    ],
  },

  "family-disagreements": {
    title: "Les désaccords dans le couple",
    sensitive: true,
    short: "Si la discorde est à craindre, chaque famille désigne un arbitre pour tenter la réconciliation.",
    rules: [
      p("« Si vous craignez le désaccord entre les deux [époux], envoyez alors un arbitre de sa famille à lui, et un arbitre de sa famille à elle. Si les deux veulent la réconciliation, Allah rétablira l’entente entre eux. »", "quran-4-35"),
    ],
  },

  "family-divorce": {
    title: "Le divorce (talâq)",
    sensitive: true,
    short: "Le divorce se prononce en tenant compte du délai d’attente, en période de pureté. Après un premier ou un deuxième divorce, le mari peut reprendre son épouse pendant le délai ; après le troisième, non.",
    rules: [
      p("« Répudiez-les conformément à leur période d’attente prescrite ; et comptez la période. »", "quran-65-1"),
      p("Ibn ‘Umar avait divorcé pendant les règles : le Prophète ﷺ lui a ordonné de reprendre son épouse.", "bukhari-5251"),
      p("« Le divorce est permis pour seulement deux fois. Alors, c’est soit la reprise conformément à la bienséance, ou la libération avec gentillesse. »", "quran-2-229"),
      p("Après le troisième, elle ne lui est plus permise avant d’avoir épousé un autre homme.", "quran-2-230"),
    ],
  },

  "family-khul": {
    title: "Le khul‘",
    short: "L’épouse qui ne supporte plus la vie commune peut obtenir la séparation en rendant son mahr ou une compensation convenue.",
    rules: [
      p("Le Coran permet à l’épouse de se libérer moyennant compensation quand les deux craignent de ne pas respecter les limites d’Allah.", "quran-2-229"),
      p("L’épouse de Thâbit ibn Qays a rendu le jardin reçu en mahr et a obtenu la séparation.", "bukhari-5273"),
    ],
    sensitive: true,
  },

  "family-iddah": {
    title: "Le délai de viduité (‘idda)",
    short: "Après un divorce, la femme attend trois cycles ; si elle n’a pas de règles, trois mois ; enceinte, jusqu’à l’accouchement. La veuve attend quatre mois et dix jours.",
    rules: [
      p("Divorcée : trois périodes.", "quran-2-228"),
      p("Enceinte : jusqu’à l’accouchement.", "quran-65-4"),
      p("Veuve : quatre mois et dix jours.", "quran-2-234"),
      p("Pendant la ‘idda d’un divorce révocable, elle reste au domicile conjugal.", "quran-65-1"),
    ],
    sensitive: true,
  },

  "family-lineage": {
    title: "La filiation",
    sensitive: true,
    short: "L’enfant est rattaché au mari de sa mère. On attribue chacun à son vrai père ; l’adoption ne change pas la filiation.",
    rules: [
      p("« L’enfant appartient au propriétaire du lit. »", "bukhari-6749"),
      p("« Appelez-les du nom de leurs pères. »", "quran-33-5"),
    ],
  },

  "family-breastfeeding": {
    title: "L’allaitement",
    short: "L’allaitement complet dure deux ans. Cinq tétées connues créent un lien de parenté : la nourrice et sa famille deviennent mahram pour l’enfant.",
    rules: [
      p("« Et les mères, qui veulent donner un allaitement complet, allaiteront leurs bébés deux ans complets. »", "quran-2-233"),
      p("L’allaitement rend interdit au mariage ce que rend interdit la parenté.", "bukhari-2645"),
      p("Cinq tétées connues établissent ce lien.", "muslim-1452"),
    ],
  },

  "family-custody": {
    title: "La garde des enfants",
    sensitive: true,
    short: "Après la séparation, la mère est la plus en droit de garder l’enfant tant qu’elle ne se remarie pas. Le père reste tenu de l’entretien.",
    rules: [
      p("« Tu as plus de droits sur lui tant que tu ne te remaries pas. »", "abudawud-2276"),
      p("L’entretien de l’enfant revient au père.", "quran-2-233"),
    ],
  },

  "family-mahram": {
    title: "Les femmes qu’on ne peut pas épouser",
    chapter: "family-marriage",
    aliases: ["mahram", "interdits mariage", "inceste"],
    short: "Il est interdit d’épouser sa mère, sa fille, sa sœur, sa tante, sa nièce, sa belle-mère, la fille de son épouse, la belle-fille, deux sœurs en même temps, et celles qui le sont devenues par l’allaitement.",
    rules: [
      p("Le Coran en donne la liste.", "quran-4-23"),
      p("L’allaitement crée les mêmes interdits que la parenté.", "bukhari-2645"),
    ],
  },
};
