import { c, p, type LessonEntry } from "./types";

const F = "wajiz-salah";
const N = "wajiz-nikah";

export const FUNERAL_LESSONS: Record<string, LessonEntry> = {
  "funerals-dying-person": {
    title: "Accompagner le mourant",
    short: "On aide doucement le mourant à prononcer « lâ ilâha illa-llâh », on l’encourage à espérer en la miséricorde d’Allah, et l’on reste patient.",
    rules: [
      p("« Faites dire à vos mourants : lâ ilâha illa-llâh. »", "muslim-916a"),
      p("Les larmes sont une miséricorde ; on appelle à la patience et à l’espoir de la récompense.", "bukhari-1284"),
    ],
    avoid: ["Insister lourdement ou lui faire répéter la formule sans cesse : on la lui rappelle avec douceur."],
  },

  "funerals-after-death": {
    title: "Juste après le décès",
    short: "On ferme les yeux du défunt, on invoque pour lui, on le couvre, puis on hâte la toilette, la prière et l’enterrement.",
    rules: [
      p("Le Prophète ﷺ a fermé les yeux d’Abû Salama et a invoqué pour son pardon et l’élargissement de sa tombe.", "muslim-920a"),
      p("« Hâtez les funérailles. »", "bukhari-1315"),
      p("Se frapper le visage et déchirer ses habits sont interdits.", "bukhari-1294"),
    ],
    cases: [c("Peut-on retarder l’enterrement pour attendre la famille ?", "Seulement un court délai raisonnable ; la Sunnah est de ne pas tarder.", "bukhari-1315")],
  },

  "funerals-washing": {
    title: "La toilette mortuaire",
    short: "On lave le défunt un nombre impair de fois (trois, cinq ou plus) avec de l’eau et du sidr, en commençant par la droite et les membres du wudû’, avec du camphre au dernier lavage.",
    rules: [
      p("« Lavez-la trois fois, cinq fois ou plus si vous le jugez nécessaire, avec de l’eau et du sidr, et mettez du camphre au dernier lavage. »", "bukhari-1253"),
      p("« Commencez par son côté droit et par les membres du wudû’. »", "bukhari-1254"),
    ],
    steps: [
      p("Couvrez la ‘awra du défunt et lavez doucement les impuretés.", F),
      p("Faites-lui le wudû’, en commençant par la droite.", "bukhari-1254"),
      p("Lavez tout le corps avec de l’eau et du sidr, trois fois ou plus, en nombre impair.", "bukhari-1253"),
      p("Mettez du camphre dans la dernière eau, puis séchez.", "bukhari-1253"),
    ],
    cases: [c("Qui lave le défunt ?", "Les hommes lavent les hommes et les femmes les femmes ; l’époux et l’épouse peuvent se laver l’un l’autre.", F)],
  },

  "funerals-washing-cases": {
    title: "Cas particuliers de la toilette",
    short: "Le pèlerin mort en ihrâm est lavé sans parfum et sa tête reste découverte. Le martyr tombé au combat est enterré sans être lavé.",
    rules: [
      p("Le pèlerin mort en ihrâm : lavé à l’eau et au sidr, sans parfum, tête découverte ; il sera ressuscité en prononçant la talbiya.", "bukhari-1265"),
      p("Les martyrs de Uhud ont été enterrés dans leur sang, sans être lavés.", "bukhari-1343"),
    ],
    cases: [c("Le corps est abîmé ou contagieux.", "On verse l’eau sans frotter ; si le lavage est impossible, on fait le tayammum au défunt.", F)],
  },

  "funerals-shroud": {
    title: "Le linceul",
    short: "Le linceul de l’homme se compose de trois pièces de tissu blanc. Celui du Prophète ﷺ était de trois étoffes blanches en coton, sans chemise ni turban.",
    rules: [p("Le Prophète ﷺ a été enveloppé dans trois étoffes blanches de coton, sans chemise ni turban.", "bukhari-1264", "muslim-941a")],
    cases: [c("Et la femme ?", "Beaucoup de savants recommandent cinq pièces pour la femme ; le minimum pour tous est une pièce qui couvre tout le corps.", F)],
    avoid: ["Les linceuls coûteux et l’ostentation."],
  },

  "funerals-shroud-cases": {
    title: "Le linceul du pèlerin",
    short: "Le pèlerin mort en ihrâm est enveloppé dans ses deux pièces d’ihrâm, sans parfum et la tête découverte.",
    rules: [p("« Enveloppez-le dans ses deux vêtements ; ne le parfumez pas et ne couvrez pas sa tête. »", "bukhari-1265")],
  },

  "funerals-prayer-basics": {
    title: "La prière funéraire",
    short: "Debout, sans inclinaison ni prosternation, avec quatre takbîr : al-Fâtiha, la prière sur le Prophète ﷺ, l’invocation pour le défunt, puis le salut.",
    rules: [
      p("Quatre takbîr.", "bukhari-1334"),
      p("Al-Fâtiha après le premier : « C’est la Sunnah. »", "bukhari-1335"),
      p("Invocation pour le défunt : « Allâhumma-ghfir lahu wa-rḥamhu, wa ‘âfihi wa-‘fu ‘anhu… »", "muslim-963a"),
      p("Assister à la prière vaut un qîrât, suivre jusqu’à l’enterrement deux.", "bukhari-1325"),
    ],
    steps: [
      p("1er takbîr : al-Fâtiha.", "bukhari-1335"),
      p("2e takbîr : la prière sur le Prophète ﷺ (celle du tashahhud).", "bukhari-3370", F),
      p("3e takbîr : invocation pour le défunt.", "muslim-963a"),
      p("4e takbîr : un court silence ou une invocation, puis le salut à droite.", F),
    ],
    cases: [c("Où se place l’imam ?", "Au niveau de la tête pour un homme, au milieu du corps pour une femme.", F)],
  },

  "funerals-prayer-absent": {
    title: "La prière sur le défunt absent",
    short: "On peut prier sur un défunt mort au loin : le Prophète ﷺ a prié sur le Najâshî, roi d’Abyssinie, le jour de sa mort.",
    rules: [p("Le Prophète ﷺ a annoncé la mort du Najâshî, est sorti au lieu de prière et a fait quatre takbîr.", "bukhari-1334")],
    note: ["Les savants divergent : certains la permettent pour tout défunt absent, d’autres la réservent à celui sur qui personne n’a prié."],
  },

  "funerals-burial": {
    title: "L’enterrement",
    short: "On hâte l’enterrement, on creuse une tombe profonde et large, de préférence avec une niche latérale (lahd), on y couche le défunt sur le côté droit face à la qibla, puis on invoque pour lui.",
    rules: [
      p("« Hâtez les funérailles. »", "bukhari-1315"),
      p("« Creusez, élargissez et faites bien. »", "abudawud-3215"),
      p("La tombe du Prophète ﷺ avait une niche latérale (lahd) fermée de briques.", "muslim-966"),
      p("Après l’enterrement : « Demandez pardon pour votre frère et demandez pour lui la fermeté, car il est maintenant interrogé. »", "abudawud-3221"),
    ],
    cases: [c("Les femmes suivent-elles le convoi ?", "Umm ‘Atiyya a dit : « Il nous a été déconseillé de suivre les convois, sans insistance. »", "bukhari-1278")],
  },

  "funerals-grave": {
    title: "La tombe",
    short: "La tombe reste simple, légèrement surélevée. On ne la plâtre pas, on ne construit pas dessus et on ne s’assoit pas dessus.",
    rules: [p("Le Prophète ﷺ a interdit de plâtrer les tombes, de s’asseoir dessus et de construire dessus.", "muslim-970a")],
    sourceIds: ["muslim-966"],
  },

  "funerals-condolences": {
    title: "Les condoléances et le deuil",
    short: "On console la famille en l’invitant à la patience : « À Allah appartient ce qu’Il a pris et ce qu’Il a donné. » Le deuil dure trois jours, sauf pour la veuve.",
    rules: [
      p("« À Allah appartient ce qu’Il prend et ce qu’Il donne ; toute chose a auprès de Lui un terme fixé : sois patiente et espère la récompense. »", "bukhari-1284"),
      p("Pas de deuil au-delà de trois jours, sauf la veuve : quatre mois et dix jours.", "bukhari-1280"),
      p("« Préparez à manger pour la famille de Ja‘far. »", "abudawud-3132"),
    ],
    avoid: ["Les lamentations, les cris, et faire porter à la famille du défunt la charge de nourrir les visiteurs."],
  },

  "funerals-graves": {
    title: "La visite des tombes",
    short: "Visiter les tombes rappelle l’au-delà. On salue les défunts et l’on invoque Allah pour eux ; on ne leur adresse aucune demande.",
    rules: [
      p("« Visitez les tombes, car elles rappellent la mort. »", "muslim-976b"),
      p("« As-salâmu ‘alaykum ahla-d-diyâri mina-l-mu’minîna wa-l-muslimîn, wa innâ in shâ’a-llâhu bikum la-lâḥiqûn, as’alu-llâha lanâ wa lakumu-l-‘âfiya. »", "muslim-975"),
      p("L’invocation s’adresse à Allah seul.", "muslim-975", "binbaz-grave-visit"),
    ],
  },
};

export const FAMILY_LESSONS: Record<string, LessonEntry> = {
  "family-marriage-purpose": {
    title: "Le sens du mariage",
    short: "Le mariage est une Sunnah des prophètes, une protection et un lieu de tranquillité, d’affection et de miséricorde.",
    rules: [
      p("« Il a créé de vous, pour vous, des épouses pour que vous viviez en tranquillité avec elles, et Il a mis entre vous affection et miséricorde. »", "quran-30-21"),
      p("« Ô jeunes gens, que celui d’entre vous qui en a les moyens se marie. »", "bukhari-5065"),
      p("« Le meilleur d’entre vous est le meilleur envers sa famille. »", "tirmidhi-3895"),
    ],
    sourceIds: [N],
  },

  "family-proposal": {
    title: "La demande en mariage",
    short: "On choisit d’abord la religion et le caractère. Il est permis de voir la personne avant de s’engager. On ne demande pas en mariage une femme déjà demandée par un autre.",
    rules: [
      p("« On épouse une femme pour sa richesse, sa lignée, sa beauté et sa religion : choisis celle qui a la religion. »", "bukhari-5090"),
      p("« Va la regarder » : il est recommandé de voir la future épouse.", "muslim-1424"),
      p("On ne demande pas en mariage une femme déjà demandée tant que le premier n’a pas renoncé.", "bukhari-5142"),
    ],
    avoid: ["Les rencontres seul à seul pendant les fiançailles : les fiancés restent étrangers l’un à l’autre jusqu’au contrat."],
  },

  "family-contract": {
    title: "Le contrat de mariage",
    short: "Le mariage se conclut par le consentement des deux époux, l’accord du tuteur (wali) de la femme, deux témoins et un mahr.",
    rules: [
      p("La femme ne se marie pas sans son consentement ; pour la vierge, son silence vaut accord.", "bukhari-5136"),
      p("« Pas de mariage sans tuteur. »", "abudawud-2085"),
      p("Le contrat se fait en présence du tuteur, de l’époux et de deux témoins.", "binbaz-nikah-witnesses"),
      p("« Donne un repas de noces, ne serait-ce qu’avec un mouton. »", "bukhari-5167"),
    ],
    cases: [c("Le mariage civil suffit-il ?", "Le mariage civil seul ne remplit pas forcément les conditions (tuteur, témoins, mahr). Faites le contrat religieux dans les règles, en respectant aussi la loi de votre pays.", N)],
    sensitive: true,
  },

  "family-wali": {
    title: "Le tuteur (wali)",
    short: "Le tuteur est le père de la femme, à défaut son grand-père, son fils, son frère, puis les proches parents par le père. Il ne peut pas la marier contre son gré, ni l’empêcher sans raison d’épouser un homme convenable.",
    rules: [
      p("« Pas de mariage sans tuteur. »", "abudawud-2085"),
      p("Le mariage conclu sans l’accord du tuteur est nul.", "abudawud-2083"),
      p("Le tuteur n’empêche pas injustement un mariage convenable.", "quran-2-232"),
      p("Il ne peut marier la femme sans son consentement.", "bukhari-5136"),
    ],
    note: ["Les hanafites permettent à la femme majeure de conclure elle-même son mariage avec un homme de rang équivalent ; les autres écoles exigent le tuteur."],
    sensitive: true,
  },

  "family-witnesses": {
    title: "Les témoins",
    short: "Le contrat de mariage se conclut devant deux témoins musulmans intègres, pour le rendre public et protéger les droits de chacun.",
    rules: [p("Le contrat est établi avec le tuteur, l’époux et deux témoins.", "binbaz-nikah-witnesses")],
    note: ["Les malikites mettent l’accent sur l’annonce publique du mariage, les autres écoles sur la présence des témoins lors du contrat."],
    sourceIds: [N],
  },

  "family-mahr": {
    title: "Le mahr (la dot)",
    short: "Le mahr est un droit de l’épouse, offert par l’époux. Il lui appartient entièrement. Il n’a pas de minimum fixé : même une bague en fer convient, et la simplicité est préférable.",
    rules: [
      p("« Donnez aux femmes leur mahr de bon cœur. »", "quran-4-4"),
      p("« Cherche, ne serait-ce qu’une bague en fer. »", "muslim-1425"),
    ],
    cases: [c("Peut-on le payer plus tard ?", "Oui : on peut en verser une partie au contrat et le reste à une date convenue.", N)],
  },

  "family-spousal-rights": {
    title: "Les droits des époux",
    short: "Les époux se doivent bon comportement, respect et fidélité. Le mari doit l’entretien et la bienveillance ; l’épouse la confiance et la préservation du foyer.",
    rules: [
      p("« Comportez-vous convenablement envers elles. »", "quran-4-19"),
      p("« Elles ont des droits équivalents à leurs obligations, conformément au bien. »", "quran-2-228"),
      p("« Le meilleur d’entre vous est le meilleur envers sa famille. »", "tirmidhi-3895"),
      p("Refuser sans raison l’intimité à son conjoint est une faute.", "bukhari-5193"),
    ],
    sensitive: true,
  },

  "family-maintenance": {
    title: "L’entretien (nafaqa)",
    short: "Le mari doit à son épouse et à ses enfants le logement, la nourriture et l’habillement, selon ses moyens. L’argent de l’épouse lui reste propre.",
    rules: [
      p("« Que l’aisé dépense selon ses moyens. »", "quran-65-7"),
      p("Hind, dont le mari était avare : « Prends de quoi te suffire, toi et ton enfant, convenablement. »", "bukhari-5364"),
      p("L’entretien de la mère qui allaite revient au père.", "quran-2-233"),
    ],
  },

  "family-disagreements": {
    title: "Les désaccords dans le couple",
    short: "On cherche d’abord à se réconcilier par le dialogue. Si la discorde s’installe, chaque famille désigne un arbitre pour tenter la réconciliation.",
    rules: [p("« Si vous craignez la rupture entre eux, désignez un arbitre de sa famille et un de la sienne ; s’ils veulent la réconciliation, Allah rétablira l’entente. »", "quran-4-35")],
    note: ["En cas de violence ou de danger, protégez-vous d’abord et faites appel aux autorités compétentes."],
    sensitive: true,
  },

  "family-divorce": {
    title: "Le divorce (talâq)",
    short: "Le divorce est permis mais il est la dernière solution. Il se prononce en période de pureté sans rapport, une fois. Après un premier ou un deuxième divorce, le mari peut reprendre son épouse pendant le délai ; après le troisième, non.",
    rules: [
      p("« Divorcez-les en tenant compte de leur délai, et comptez le délai. »", "quran-65-1"),
      p("Ibn ‘Umar avait divorcé pendant les règles : le Prophète ﷺ lui a ordonné de reprendre son épouse.", "bukhari-5251"),
      p("« Le divorce, c’est deux fois ; ensuite, la garder convenablement ou la libérer avec bonté. »", "quran-2-229"),
      p("Après le troisième, elle ne lui est plus permise avant d’avoir épousé un autre homme.", "quran-2-230"),
    ],
    cases: [c("J’ai prononcé le divorce sous la colère.", "Les mots exacts, la colère et l’intention changent le jugement. Exposez votre cas à une personne de science avant toute conclusion.", N)],
    sensitive: true,
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
    short: "L’enfant est rattaché au mari de sa mère. On attribue chacun à son vrai père ; l’adoption ne change pas la filiation.",
    rules: [
      p("« L’enfant appartient au lit conjugal. »", "bukhari-6749"),
      p("« Appelez-les du nom de leurs pères. »", "quran-33-5"),
    ],
    note: ["Le recueil d’un enfant (kafâla) est une grande œuvre, sans lui donner son nom de famille."],
    sensitive: true,
  },

  "family-breastfeeding": {
    title: "L’allaitement",
    short: "L’allaitement complet dure deux ans. Cinq tétées dans les deux premières années créent un lien de parenté : la nourrice et sa famille deviennent mahram pour l’enfant.",
    rules: [
      p("« Les mères allaitent leurs enfants deux ans complets. »", "quran-2-233"),
      p("L’allaitement rend interdit au mariage ce que rend interdit la parenté.", "bukhari-2645"),
      p("Cinq tétées connues établissent ce lien.", "muslim-1452"),
    ],
    note: ["Pour les hanafites et les malikites, une seule tétée suffit à créer le lien."],
  },

  "family-custody": {
    title: "La garde des enfants",
    short: "Après la séparation, la mère est la plus en droit de garder le jeune enfant tant qu’elle ne se remarie pas. Le père reste tenu de l’entretien.",
    rules: [
      p("« Tu y as plus droit tant que tu ne te remaries pas. »", "abudawud-2276"),
      p("L’entretien de l’enfant revient au père.", "quran-2-233"),
    ],
    note: ["L’intérêt de l’enfant prime. Les âges de transfert de garde varient selon les écoles et les lois."],
    sensitive: true,
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
