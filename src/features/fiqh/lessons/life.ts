import { c, p, type LessonEntry } from "./types";


export const TRANSACTION_LESSONS: Record<string, LessonEntry> = {
  "transactions-consent": {
    title: "Le consentement",
    short: "Une transaction se fait par consentement mutuel, sans manger injustement les biens d’autrui.",
    rules: [
      p("« Que les uns d’entre vous ne mangent pas les biens des autres illégalement. Mais qu’il y ait du négoce (légal), entre vous, par consentement mutuel. »", "quran-4-29"),
      p("« Qu’Allah fasse miséricorde à celui qui est indulgent dans ses achats, ses ventes et quand il réclame son argent. »", "bukhari-2076"),
    ],
    sensitive: false,
  },
  "transactions-clarity": {
    title: "La clarté et l’absence de tromperie",
    short: "Le Prophète ﷺ a interdit la vente aléatoire (gharar) et la tromperie, et de vendre ce que l’on ne possède pas.",
    rules: [
      p("Interdiction de la vente comportant un aléa (gharar).", "muslim-1513"),
      p("« Celui qui trompe n’est pas des miens. »", "muslim-102"),
      p("« Ne vends pas ce que tu ne possèdes pas. »", "abudawud-3503"),
    ],
    sensitive: false,
  },
  "transactions-sale": {
    title: "La vente",
    short: "La vente est permise. On ne vend pas ce que l’on ne possède pas, et la franchise attire la bénédiction.",
    rules: [
      p("« Allah a rendu licite le commerce, et illicite l’intérêt. »", "quran-2-275"),
      p("« Si les deux disent la vérité et décrivent les défauts et les qualités de la marchandise, ils seront bénis dans leur transaction. Mais s’ils mentent ou cachent quelque chose, la bénédiction de leur transaction sera perdue. »", "bukhari-2079"),
      p("« Ne vends pas ce que tu ne possèdes pas. »", "abudawud-3503"),
    ],
    cases: [c("Vendre un article que je n’ai pas encore reçu ?", "Attendez de l’avoir en votre possession. La commande à terme (salam) est possible si la description, la quantité et la date sont fixées et le prix payé d’avance.", "abudawud-3503", "bukhari-2240")],
    sensitive: false,
  },
  "transactions-defects": {
    title: "Les défauts cachés",
    short: "Il n’est pas permis de vendre un bien en cachant son défaut.",
    rules: [
      p("Il n’est pas permis de vendre un bien en cachant son défaut.", "ibnmajah-2246"),
      p("« Celui qui trompe n’est pas des miens. »", "muslim-102"),
    ],
    sensitive: false,
  },
  "transactions-options": {
    title: "Le droit de se rétracter",
    short: "Tant qu’acheteur et vendeur ne se sont pas séparés, chacun peut garder ou rendre la marchandise.",
    rules: [
      p("« Le vendeur et l’acheteur ont le droit de garder ou de rendre la marchandise tant qu’ils ne se sont pas séparés. »", "bukhari-2079"),
      p("À l’homme qui se faisait souvent tromper, le Prophète ﷺ a dit de dire au moment d’acheter : « Pas de tromperie. »", "bukhari-2117"),
    ],
    sensitive: false,
  },
  "transactions-debt": {
    title: "La dette",
    short: "On écrit la dette à terme, on la rembourse à l’échéance, et l’on accorde un délai au débiteur en difficulté. Le riche qui retarde le paiement commet une injustice.",
    rules: [
      p("« Quand vous contractez une dette à échéance déterminée, mettez-la par écrit. »", "quran-2-282"),
      p("« A celui qui est dans la gêne, accordez un sursis jusqu’à ce qu’il soit dans l’aisance. »", "quran-2-280"),
      p("« Retarder le paiement d’une dette par une personne riche est une injustice. »", "bukhari-2287"),
      p("L’âme du croyant reste suspendue à sa dette jusqu’à son règlement.", "tirmidhi-1078"),
      p("Celui qui emprunte avec l’intention de rendre, Allah l’aide à rendre.", "bukhari-2387"),
    ],
    sensitive: false,
  },
  "transactions-loan": {
    title: "Le prêt (qard)",
    short: "Al-Wajîz : prêter deux fois à un musulman vaut une aumône une fois. Rendre mieux que ce qu’on a emprunté est une belle manière : le Prophète ﷺ l’a fait.",
    rules: [
      p("Le Prophète ﷺ a rendu un chameau meilleur que celui emprunté : « Donne-lui ce chameau, car les meilleures personnes sont celles qui remboursent le mieux leurs dettes. »", "muslim-1600"),
      p("Al-Wajîz cite le hadith : aucun musulman ne prête deux fois à un musulman sans que ce soit comme une aumône une fois.", "wajiz-buyu"),
    ],
  },
  "transactions-guarantee": {
    title: "Garantie et gage",
    short: "On peut garantir la dette d’autrui ou remettre un bien en gage. Le Prophète ﷺ a lui-même mis sa cotte de mailles en gage.",
    rules: [
      p("« Et j’en suis garant. »", "quran-12-72"),
      p("Le gage remis en garantie d’une dette.", "quran-2-283"),
      p("Le Prophète ﷺ a mis sa cotte de mailles en gage chez un juif contre de l’orge.", "bukhari-2068"),
    ],
    sourceIds: ["bukhari-2291"],
    sensitive: false,
  },
  "transactions-riba": {
    title: "L’intérêt (ribâ)",
    short: "Le ribâ est interdit. Celui qui le prend, le donne, l’écrit et en témoigne est maudit. Certains biens de même nature ne s’échangent qu’à quantité égale et de main à main.",
    rules: [
      p("« Allah a rendu licite le commerce, et illicite l’intérêt. »", "quran-2-275"),
      p("Le Prophète ﷺ a maudit celui qui consomme le ribâ, celui qui le donne, celui qui l’écrit et ses deux témoins.", "muslim-1598"),
      p("Or contre or, argent contre argent, blé contre blé… à quantité égale et de main à main.", "muslim-1587c"),
    ],
  },
  "transactions-currency": {
    title: "Le change de monnaies",
    short: "On peut changer une monnaie contre une autre à n’importe quel taux, à condition que l’échange soit immédiat.",
    rules: [p("« Si les catégories diffèrent, alors vendez comme vous le souhaitez, à condition que le paiement soit fait sur place. »", "muslim-1587c")],
    sensitive: false,
  },
  "transactions-rental": {
    title: "La location",
    short: "On peut louer ses services contre un salaire : le Prophète ﷺ a gardé des troupeaux contre rémunération.",
    rules: [
      p("Le Prophète ﷺ a gardé des troupeaux contre rémunération.", "bukhari-2262"),
      p("« Donnez-leur leurs salaires. »", "quran-65-6"),
    ],
    sensitive: false,
  },
  "transactions-wages": {
    title: "Le salaire",
    short: "Le salaire est payé à temps. Ne pas payer un salarié est un péché grave.",
    rules: [
      p("« Donnez au travailleur son salaire avant que sa sueur ne sèche. »", "ibnmajah-2443"),
      p("Allah est l’adversaire, au Jour dernier, de celui qui emploie un salarié sans le payer.", "bukhari-2227"),
    ],
    sensitive: false,
  },
  "transactions-partnership": {
    title: "L’association",
    short: "On peut s’associer pour le commerce. Al-Wajîz : dans la mudâraba, l’un apporte l’argent, l’autre le fait fructifier, et le bénéfice se partage selon ce dont ils conviennent.",
    rules: [
      p("« Beaucoup de gens transgressent les droits de leurs associés, sauf ceux qui croient et accomplissent les bonnes œuvres. »", "quran-38-24"),
      p("Le Prophète ﷺ a confié Khaybar aux exploitants contre la moitié de la récolte.", "muslim-1551"),
      p("Al-Wajîz rapporte d’Ibn al-Mundhir le consensus sur la permission de la mudâraba avec des dinars et des dirhams.", "wajiz-buyu"),
    ],
  },
  "transactions-agency": {
    title: "Le mandat",
    short: "On peut charger quelqu’un d’acheter ou de vendre pour soi : le Prophète ﷺ a confié à ‘Urwa un dinar pour acheter un mouton.",
    rules: [p("Le Prophète ﷺ a confié à ‘Urwa un dinar pour acheter un mouton.", "bukhari-3642")],
    sensitive: false,
  },
};

export const FOOD_LESSONS: Record<string, LessonEntry> = {
  "food-principles": {
    title: "Le principe : tout est permis",
    short: "Al-Wajîz : le principe pour les aliments est la permission. On mange en disant « Bismillâh », de la main droite.",
    rules: [
      p("« Ce qui est permis et ce qui est interdit sont clairs, mais entre les deux il y a des choses douteuses (suspectes) que la plupart des gens ne connaissent pas. »", "bukhari-52"),
      p("La nourriture des gens du Livre vous est permise.", "quran-5-5"),
      p("« Dis le nom d’Allah, mange avec ta main droite et mange ce qui est devant toi dans le plat. »", "bukhari-5376"),
    ],
    cases: [c("Une viande dont j’ignore si le nom d’Allah a été prononcé ?", "Les Compagnons ont posé la question ; le Prophète ﷺ a répondu : « Mentionnez le nom d’Allah dessus et mangez. »", "bukhari-5507")],
  },
  "food-prohibited": {
    title: "Ce qui est interdit",
    short: "Sont interdits : la bête morte, le sang, le porc, ce qui est sacrifié pour autre qu’Allah, les fauves à crocs, les oiseaux à serres, l’âne domestique et tout ce qui enivre.",
    rules: [
      p("La bête morte, le sang, la viande de porc et ce qui est sacrifié pour autre qu’Allah.", "quran-5-3"),
      p("Les fauves à crocs et les oiseaux à serres.", "muslim-1933", "muslim-1934"),
      p("L’âne domestique ; le cheval est permis.", "muslim-1941"),
      p("« Tout ce qui enivre est du khamr, et tout khamr est interdit. »", "muslim-2003", "quran-5-90"),
      p("Les poissons, les animaux marins et les sauterelles sont permis.", "abudawud-83", "bukhari-5495"),
    ],
  },
  "food-slaughter": {
    title: "L’abattage",
    short: "On égorge en tranchant la gorge pour faire couler le sang, en prononçant « Bismillâh, Allâhu akbar », avec une lame bien aiguisée et sans faire souffrir la bête.",
    rules: [
      p("« Utilisez tout ce qui fait couler le sang, et mangez les animaux si le nom d’Allah a été prononcé lors de l’abattage. »", "bukhari-2488"),
      p("« Ne mangez pas de ce sur quoi le nom d’Allah n’a pas été prononcé. »", "quran-6-121"),
      p("« En vérité, Allah a prescrit la bienfaisance en toute chose. […] Lorsque vous égorgez, égorgez de la meilleure façon. Que chacun d’entre vous aiguise bien son couteau et épargne à l’animal toute souffrance. »", "muslim-1955a"),
    ],
  },
  "food-slaughter-tools": {
    title: "L’instrument d’abattage",
    short: "Tout instrument tranchant qui fait couler le sang convient, sauf la dent et l’ongle.",
    rules: [p("« Utilisez tout ce qui fait couler le sang, et mangez les animaux si le nom d’Allah a été prononcé lors de l’abattage. » Il a interdit d’égorger avec les dents ou les ongles.", "bukhari-2488")],
  },
  "food-udhiyah": {
    title: "Le sacrifice de l’Aïd",
    short: "Al-Wajîz : le sacrifice de l’Aïd al-Adhâ est obligatoire pour celui qui en a les moyens. La bête est sans défaut et de l’âge requis.",
    rules: [
      p("« Accomplis la Ṣalāt pour ton Seigneur et sacrifie. »", "quran-108-2"),
      p("Al-Wajîz cite le hadith : que celui qui en a les moyens et ne sacrifie pas ne s’approche pas de notre lieu de prière.", "wajiz-atimah"),
      p("Le Prophète ﷺ a sacrifié deux béliers de sa main, en disant « Bismillâh, Allâhu akbar ».", "muslim-1966"),
      p("N’égorgez qu’une bête de l’âge requis.", "muslim-1963"),
      p("Quatre défauts l’excluent : borgne évidente, malade évidente, boiteuse évidente, très maigre.", "abudawud-2802"),
      p("Celui qui veut sacrifier ne coupe ni cheveux ni ongles dès l’entrée de Dhul-Hijja.", "muslim-1977"),
      p("« Mangez-en, et nourrissez-en le besogneux discret et le mendiant. »", "quran-22-36"),
    ],
  },
  "food-udhiyah-time": {
    title: "Le moment du sacrifice",
    short: "Le sacrifice se fait après la prière de l’Aïd. Al-Wajîz le définit comme ce qui est égorgé le jour du sacrifice et les jours de Tashrîq.",
    rules: [
      p("« Celui qui sacrifie avant la prière, c’est juste pour la viande de sa famille. »", "muslim-1961"),
      p("Al-Wajîz : le sacrifice est ce que l’on égorge le jour du sacrifice et les jours de Tashrîq pour se rapprocher d’Allah.", "wajiz-atimah"),
    ],
  },
  "food-aqiqah": {
    title: "La ‘aqîqa",
    sourceIds: ["binbaz-aqiqah"],
    short: "À la naissance d’un enfant, on sacrifie deux moutons pour un garçon et un pour une fille, le septième jour, où l’on rase aussi la tête du bébé et lui donne son nom.",
    rules: [
      p("« On doit offrir une ‘aqiqa pour un garçon nouveau-né, alors sacrifiez un animal pour lui. »", "bukhari-5472"),
      p("Deux moutons pour le garçon, un pour la fille.", "tirmidhi-1513"),
      p("Égorgée le septième jour ; on rase l’enfant et on lui donne son nom.", "abudawud-2838"),
      p("Al-Wajîz la juge obligatoire pour celui à qui l’enfant est né ; Ibn Bâz la présente comme une Sunnah appuyée.", "wajiz-atimah", "binbaz-aqiqah"),
    ],
  },
  "food-aqiqah-time": {
    title: "Le moment de la ‘aqîqa",
    short: "Le septième jour après la naissance est le moment de la Sunnah. Si on le manque, on peut la faire plus tard.",
    rules: [
      p("Le septième jour.", "abudawud-2838"),
      p("C’est une Sunnah appuyée, qui peut être faite plus tard en cas d’empêchement.", "binbaz-aqiqah"),
    ],
  },
};

export const OATH_LESSONS: Record<string, LessonEntry> = {
  "oaths-types": {
    title: "Les sortes de serments",
    short: "On ne jure que par Allah. Le serment irréfléchi (« non, par Allah ») n’engage pas ; le serment sur l’avenir engage ; le faux serment délibéré est un grand péché.",
    rules: [
      p("« Celui qui doit prêter serment doit jurer par Allah ou se taire. »", "bukhari-2679"),
      p("« Celui qui jure par autre qu’Allah commet un acte de polythéisme. »", "abudawud-3251"),
      p("Allah ne vous tient pas rigueur des serments irréfléchis.", "quran-2-225", "quran-5-89"),
      p("Le faux serment délibéré fait partie des grands péchés.", "bukhari-6675"),
    ],
  },
  "oaths-breaking": {
    title: "Rompre un serment",
    short: "Si l’on a juré de faire ou de ne pas faire quelque chose, et que le contraire est meilleur, on fait le meilleur et l’on expie son serment.",
    rules: [
      p("« Chaque fois que tu fais un serment de faire quelque chose et que tu trouves ensuite que quelque chose d’autre est meilleur, fais ce qui est meilleur et accomplis l’expiation pour ton serment. »", "bukhari-6622"),
      p("Celui qui ajoute « in shâ’ Allah » à son serment n’est pas parjure.", "tirmidhi-1532"),
      p("Allah a prescrit la façon de se délier de ses serments.", "quran-66-2"),
    ],
  },
  "oaths-expiation": {
    title: "L’expiation du serment",
    short: "Nourrir ou habiller dix pauvres, ou affranchir un esclave ; celui qui ne le peut pas jeûne trois jours.",
    rules: [p("« L’expiation en sera de nourrir dix pauvres, de ce dont vous nourrissez normalement vos familles, ou de les habiller, ou de libérer un esclave. Quiconque n’en trouve pas les moyens devra jeûner trois jours. »", "quran-5-89")],
    cases: [c("Puis-je jeûner directement ?", "Non : le jeûne vient seulement si l’on ne peut ni nourrir ni habiller dix pauvres.", "quran-5-89")],
  },
  "vows-basics": {
    title: "Le vœu (nadhr)",
    short: "Le vœu, c’est s’obliger à un acte d’adoration non obligatoire. Il est déconseillé d’en faire, mais celui qui le fait doit l’accomplir s’il s’agit d’une obéissance.",
    rules: [
      p("« En réalité, le vœu ne change rien, mais il pousse l’avare à dépenser ses biens. »", "bukhari-6608"),
      p("« Celui qui fait le vœu d’obéir à Allah doit Lui obéir ; et celui qui fait le vœu de désobéir à Allah ne doit pas Lui désobéir. »", "bukhari-6696"),
    ],
  },
  "vows-fulfilment": {
    title: "Accomplir un vœu",
    short: "On accomplit le vœu d’obéissance. On n’accomplit pas un vœu de désobéissance. Un vœu impossible ou non tenu s’expie comme un serment.",
    rules: [
      p("Le vœu d’obéissance s’accomplit, pas celui de désobéissance.", "bukhari-6696"),
      p("« L’expiation pour la rupture d’un vœu est la même que pour la rupture d’un serment. »", "muslim-1645"),
      p("On peut accomplir le vœu d’un proche défunt.", "bukhari-6698"),
    ],
  },
  "expiations-overview": {
    title: "Les expiations en un coup d’œil",
    short: "Serment rompu : dix pauvres nourris ou habillés, sinon trois jours de jeûne. Rapport conjugal en Ramadan : deux mois de jeûne consécutifs, sinon soixante pauvres. Interdit de l’ihrâm pour une gêne : trois jours de jeûne, six pauvres ou un mouton.",
    rules: [
      p("Serment et vœu.", "quran-5-89", "muslim-1645"),
      p("Rapport conjugal en journée de Ramadan.", "bukhari-1935"),
      p("Rasage en ihrâm à cause d’une gêne.", "quran-2-196", "bukhari-1814"),
    ],
    sourceIds: ["wajiz-ayman"],
  },
};

export const CLOTHING_LESSONS: Record<string, LessonEntry> = {
  "clothing-principles": {
    title: "Le vêtement : principes",
    short: "Le vêtement couvre et embellit. Tout est permis sauf ce qu’un texte interdit : l’orgueil, l’imitation de l’autre sexe, la soie et l’or pour les hommes.",
    rules: [
      p("« Nous avons fait descendre sur vous un vêtement pour cacher vos nudités, ainsi que des parures. » « Mais le vêtement de la piété voilà qui est meilleur. »", "quran-7-26"),
      p("« En vérité, Allah est Beau et Il aime la beauté. »", "muslim-91"),
      p("Le Prophète ﷺ a maudit les hommes qui imitent les femmes et les femmes qui imitent les hommes.", "bukhari-5885"),
      p("Le vêtement qui traîne sous les chevilles par orgueil est menacé du Feu.", "bukhari-5787"),
    ],
  },
  "clothing-awrah": {
    title: "La ‘awra",
    short: "Le Coran ordonne aux croyantes de rabattre leur voile sur leurs poitrines et de ramener sur elles leurs grands voiles.",
    rules: [
      p("« Qu’elles rabattent leur voile sur leurs poitrines ; et qu’elles ne montrent leurs atours qu’à leurs maris, ou à leurs pères… »", "quran-24-31"),
      p("« Dis à tes épouses, à tes filles et aux femmes des croyants de ramener sur elles leurs grands voiles. »", "quran-33-59"),
    ],
  },
  "clothing-gold-silk": {
    title: "L’or et la soie",
    short: "L’or et la soie sont interdits aux hommes, sauf une petite bande de soie.",
    rules: [
      p("Tenant de la soie et de l’or : « Ces deux choses sont interdites aux hommes de ma communauté. »", "abudawud-4057"),
      p("La soie masculine est interdite, sauf une petite bande.", "muslim-2069i"),
    ],
  },
  "clothing-perfume": {
    title: "Le parfum",
    short: "Le parfum est recommandé le vendredi. La femme qui se rend à la mosquée ne se parfume pas.",
    rules: [
      p("Le ghusl et le parfum du vendredi.", "bukhari-883"),
      p("La femme qui se rend à la mosquée ne se parfume pas.", "muslim-443b"),
    ],
  },
  "clothing-hair": {
    title: "Cheveux, barbe et fitra",
    short: "La fitra comprend la circoncision, le rasage du pubis, la taille de la moustache, la coupe des ongles et l’épilation des aisselles. On laisse la barbe, on teint les cheveux blancs en évitant le noir, et on ne rase pas une partie de la tête seulement.",
    rules: [
      p("Cinq actes de la fitra.", "bukhari-5889", "muslim-261"),
      p("« Laissez pousser la barbe et raccourcissez la moustache. »", "bukhari-5892"),
      p("« Changez cela, mais évitez le noir. »", "muslim-2102"),
      p("Interdiction du qaza‘ : raser une partie de la tête et laisser l’autre.", "bukhari-5921"),
    ],
  },
  "clothing-body-modification": {
    title: "Tatouages et modifications du corps",
    short: "Le Prophète ﷺ a maudit la tatoueuse et la tatouée, celle qui s’épile les sourcils et celle qui écarte ses dents pour embellir, changeant la création d’Allah.",
    rules: [
      p("Le Prophète ﷺ a maudit la tatoueuse et la tatouée, celle qui s’épile les sourcils et celle qui écarte ses dents pour embellir, changeant la création d’Allah.", "bukhari-5931"),
    ],
  },
};

export const DAILY_LESSONS: Record<string, LessonEntry> = {
  "daily-toilet": {
    title: "Aller aux toilettes",
    short: "On demande refuge contre les démons en entrant, on se nettoie de la main gauche avec de l’eau ou des pierres, on ne fait pas face à la qibla, puis on dit « Ghufrânak » en sortant.",
    rules: [
      p("En entrant : « Allâhumma innî a‘ûdhu bika mina-l-khubuthi wa-l-khabâ’ith. »", "bukhari-142"),
      p("En sortant : « Ghufrânak » (Ton pardon).", "tirmidhi-7"),
      p("Ne pas se nettoyer de la main droite.", "bukhari-153"),
      p("Ne pas faire face à la qibla ni lui tourner le dos ; al-Wajîz : ni en plein air ni dans un bâtiment.", "bukhari-144", "wajiz-taharah"),
      p("Se préserver des éclaboussures d’urine.", "bukhari-218"),
      p("Al-Wajîz : on peut se nettoyer avec de l’eau ou avec des pierres, et l’eau est meilleure ; il recommande d’entrer du pied gauche et de sortir du pied droit.", "wajiz-taharah"),
    ],
  },
  "daily-sleep": {
    title: "Avant de dormir",
    short: "On fait le wudû’, on époussette son lit, on se couche sur le côté droit et l’on récite les invocations du coucher.",
    rules: [
      p("« Chaque fois que tu vas te coucher, fais les ablutions comme pour la prière, allonge-toi sur le côté droit… »", "bukhari-247"),
      p("Épousseter son lit avant de s’y coucher.", "bukhari-6320"),
    ],
  },
  "daily-greetings": {
    title: "Le salut",
    short: "On répand le salâm. Celui qui est monté salue le piéton, le passant salue celui qui est assis, le petit groupe le grand. On répond au salut, et à l’éternuement.",
    rules: [
      p("« Voulez-vous que je vous indique une chose qui, si vous la faites, fera naître l’amour entre vous : répandez la salutation en disant “as-salamu alaikum”. »", "muslim-54"),
      p("L’ordre du salut.", "bukhari-6232"),
      p("À l’éternuement : « Al-ḥamdu li-llâh » ; on lui répond « Yarḥamuka-llâh » ; il répond « Yahdîkumu-llâhu wa yuṣliḥu bâlakum ».", "bukhari-6224"),
    ],
  },
  "daily-permission": {
    title: "Demander la permission d’entrer",
    short: "On salue et l’on demande la permission avant d’entrer chez quelqu’un, trois fois au plus ; sans réponse, on repart.",
    rules: [
      p("« N’entrez pas dans des maisons autres que les vôtres avant de demander la permission [d’une façon délicate] et de saluer leurs habitants. »", "quran-24-27"),
      p("« Si l’un de vous demande la permission d’entrer trois fois et qu’on ne la lui donne pas, il doit repartir. »", "bukhari-6245"),
    ],
  },
  "daily-neighbours": {
    title: "Le voisin",
    short: "Le voisin a des droits : on ne lui nuit pas. Jibrîl a tant insisté que le Prophète ﷺ a cru qu’il hériterait.",
    rules: [
      p("Jibrîl a tant recommandé le voisin que le Prophète ﷺ a pensé qu’il en ferait un héritier.", "bukhari-6014"),
      p("« Celui qui croit en Allah et au Jour dernier ne doit pas nuire à son voisin. »", "bukhari-6018"),
    ],
  },
  "daily-travel-etiquette": {
    title: "Le voyage",
    short: "À trois en voyage, on désigne l’un d’entre eux comme responsable, et l’on dit l’invocation du voyage en partant.",
    rules: [
      p("L’invocation du voyage : « Subḥâna-lladhî sakhkhara lanâ hâdhâ… »", "muslim-1342"),
      p("À trois, désignez l’un de vous comme responsable.", "abudawud-2608"),
    ],
  },
  "daily-return": {
    title: "Le retour de voyage",
    short: "Au retour, on dit : « Âyibûna, tâ’ibûna, ‘âbidûna, li-rabbinâ ḥâmidûn. »",
    rules: [p("« Nous revenons repentants, adorant, prosternés et louant notre Seigneur. »", "bukhari-1797")],
  },
  "daily-roads": {
    title: "Le droit de la route",
    short: "Celui qui s’assoit sur la voie publique baisse le regard, ne nuit à personne, rend le salut, ordonne le bien et interdit le mal.",
    rules: [p("Les droits de la route : baisser le regard, ne pas nuire, rendre le salut, ordonner le bien et interdire le mal.", "bukhari-2465")],
  },
  "daily-gatherings": {
    title: "Les assemblées",
    short: "On ne fait pas lever quelqu’un pour prendre sa place, on ne parle pas à deux en excluant le troisième, et l’on termine l’assemblée par son invocation d’expiation.",
    rules: [
      p("Ne pas faire lever quelqu’un pour s’asseoir à sa place.", "bukhari-6269"),
      p("Deux ne conversent pas à l’écart du troisième.", "bukhari-6288"),
      p("À la fin : « Subḥânaka-llâhumma wa bi-ḥamdik, ash-hadu an lâ ilâha illâ anta, astaghfiruka wa atûbu ilayk. »", "tirmidhi-3433"),
    ],
  },
};

export const JUSTICE_LESSONS: Record<string, LessonEntry> = {
  "justice-testimony": {
    title: "Le témoignage",
    short: "On témoigne avec justice, même contre soi ou ses proches. Le faux témoignage est parmi les plus grands péchés.",
    rules: [
      p("« Observez strictement la justice et soyez des témoins (véridiques) comme Allah l’ordonne, fût-ce contre vous-mêmes, contre vos père et mère ou proches parents. »", "quran-4-135"),
      p("« Prenez deux hommes intègres parmi vous comme témoins. »", "quran-65-2"),
      p("Le faux témoignage est parmi les plus grands péchés.", "bukhari-2654"),
    ],
  },
  "justice-oaths": {
    title: "La preuve et le serment",
    short: "La preuve incombe à celui qui réclame ; le serment à celui qui nie. Le juge peut aussi statuer sur un témoin et le serment du demandeur.",
    rules: [
      p("Si l’on donnait aux gens selon leurs seules prétentions, ils réclameraient les biens et le sang d’autrui ; le serment incombe au défendeur.", "muslim-1711"),
      p("Le Prophète ﷺ a jugé avec un témoin et un serment.", "muslim-1712"),
    ],
  },
  "justice-disputes": {
    title: "Juger un litige",
    short: "On ne juge pas en colère, et un jugement humain ne rend pas licite ce qui est à autrui.",
    rules: [
      p("Le juge ne juge pas en colère.", "bukhari-7158"),
      p("« Je ne suis qu’un être humain […]. Donc, si jamais je juge par erreur et que je donne le droit d’un frère à un autre, alors ce dernier ne doit pas le prendre, car je ne lui donne en réalité qu’un morceau de Feu. »", "bukhari-7169"),
    ],
    sensitive: true,
  },
  "justice-settlement": {
    title: "La conciliation",
    short: "La conciliation entre deux parties est permise, tant qu’elle ne rend pas licite l’illicite ni illicite le licite.",
    rules: [
      p("« La réconciliation entre musulmans est permise », « sauf la réconciliation qui rend licite ce qui est illicite et illicite ce qui est licite ».", "abudawud-3594"),
      p("« Réconciliez-les avec justice. »", "quran-49-9"),
    ],
  },
  "justice-found-property": {
    title: "Le bien trouvé",
    short: "Al-Wajîz : celui qui trouve un bien en note la nature et le nombre, prend un témoin intègre, le garde et l’annonce un an ; si le propriétaire le décrit, il le lui rend, sinon il en profite.",
    rules: [
      p("Reconnaître le contenant et le lien, puis annoncer un an.", "bukhari-2426"),
      p("Si son propriétaire vient, on le lui rend.", "muslim-1722", "wajiz-qada"),
    ],
  },
  "justice-usurpation": {
    title: "S’emparer du bien d’autrui",
    short: "Prendre injustement le bien d’autrui est un grand péché. Le bien doit être rendu.",
    rules: [
      p("Celui qui s’empare injustement d’un empan de terre en portera sept terres au cou.", "bukhari-2453"),
      p("« Que les uns d’entre vous ne mangent pas les biens des autres illégalement. »", "quran-4-29"),
    ],
  },
  "justice-damages": {
    title: "Réparer un dommage",
    short: "Celui qui abîme le bien d’autrui le remplace. Il ne doit y avoir ni préjudice ni riposte au préjudice.",
    rules: [
      p("« Il ne doit y avoir ni préjudice ni riposte au préjudice. »", "ibnmajah-2340"),
      p("Un plat cassé a été remplacé par un plat semblable.", "bukhari-5225"),
    ],
  },
};

export const INHERITANCE_LESSONS: Record<string, LessonEntry> = {
  "wills-basics": {
    title: "Le testament",
    short: "Le musulman qui a de quoi léguer ne passe pas deux nuits sans testament écrit.",
    rules: [
      p("Le musulman qui a de quoi léguer ne passe pas deux nuits sans testament écrit.", "bukhari-2738"),
      p("Le testament est mentionné dans le Coran.", "quran-2-180"),
    ],
  },
  "wills-limits": {
    title: "Les limites du testament",
    short: "On ne lègue pas plus d’un tiers, et rien à un héritier.",
    rules: [
      p("À Sa‘d, qui voulait léguer ses biens : « Oui, un tiers, mais même un tiers c’est trop. »", "bukhari-2742"),
      p("« Allah a attribué à chacun ses droits, il n’est donc pas permis de faire un legs à un héritier. »", "abudawud-2870"),
    ],
  },
  "inheritance-estate": {
    title: "L’ordre de la succession",
    short: "La dette et le testament passent avant le partage entre les héritiers.",
    rules: [
      p("« … après exécution du testament qu’il aurait fait ou paiement d’une dette. »", "quran-4-11"),
      p("‘Alî : le Prophète ﷺ a fait régler la dette avant le testament.", "tirmidhi-2094"),
    ],
  },
  "inheritance-debts": {
    title: "Les dettes du défunt",
    short: "Les dettes du défunt sont réglées avant le testament et le partage.",
    rules: [
      p("L’âme du croyant reste suspendue à sa dette jusqu’à son règlement.", "tirmidhi-1078"),
      p("La dette passe avant le testament.", "tirmidhi-2094"),
    ],
  },
  "inheritance-heirs": {
    title: "Les héritiers",
    short: "Héritent notamment les enfants, les parents, le conjoint, puis les frères et sœurs et d’autres proches selon les cas. Ni le meurtrier ni le non-musulman n’héritent.",
    rules: [
      p("« Aux hommes revient une part de ce qu’ont laissé les père et mère ainsi que les proches ; et aux femmes une part de ce qu’ont laissé les père et mère ainsi que les proches. »", "quran-4-7"),
      p("Le musulman n’hérite pas du non-musulman, ni l’inverse.", "bukhari-6764"),
      p("Le meurtrier n’hérite pas.", "tirmidhi-2109"),
    ],
  },
  "inheritance-shares": {
    title: "Les parts",
    short: "Le Coran fixe les parts : moitié, quart, huitième, deux tiers, tiers, sixième. Le reste revient au plus proche parent masculin.",
    rules: [
      p("Aux garçons le double de la part des filles ; aux parents un sixième chacun s’il y a des enfants.", "quran-4-11"),
      p("Au mari la moitié sans enfant, le quart avec ; à l’épouse le quart sans enfant, le huitième avec.", "quran-4-12"),
      p("« Donnez les parts d’héritage prescrites dans le Coran à ceux qui y ont droit. Ensuite, ce qui reste doit être donné au parent masculin le plus proche du défunt. »", "bukhari-6732"),
    ],
  },
  "inheritance-blocking": {
    title: "L’exclusion entre héritiers",
    short: "Al-Wajîz : certains héritiers en excluent d’autres ; par exemple, le fils exclut le frère, et celui qui se rattache au défunt par une personne n’hérite pas avec elle.",
    rules: [p("Le reste va au plus proche parent masculin : le plus proche écarte le plus éloigné.", "bukhari-6732")],
    sourceIds: ["wajiz-faraid"],
  },
  "inheritance-unresolved": {
    title: "Les cas complexes",
    sourceIds: ["wajiz-faraid"],
    short: "Le partage suit les parts fixées par les textes.",
    rules: [
      p("Les parts sont fixées par le Coran.", "quran-4-11", "quran-4-12", "quran-4-176"),
    ],
  },
};

export const ANIMAL_LESSONS: Record<string, LessonEntry> = {
  "hunting-basics": {
    title: "La chasse",
    short: "La chasse est permise pour se nourrir, en mentionnant le nom d’Allah. Le gibier de mer est toujours permis ; le gibier de terre est interdit en ihrâm.",
    rules: [
      p("« La chasse en mer vous est permise » ; « Et vous est illicite la chasse à terre tant que vous êtes en état de sacralisation (Ihrâm). »", "quran-5-96"),
      p("Ce que capturent les animaux dressés, en mentionnant le nom d’Allah.", "quran-5-4"),
    ],
  },
  "hunting-tools": {
    title: "Les moyens de chasse",
    short: "Le gibier atteint par la pointe d’une arme ou par un chien dressé lâché avec le nom d’Allah est permis ; celui qui est assommé par le plat ne l’est pas.",
    rules: [
      p("Atteint par la pointe : on mange ; par le plat : il est assommé, on ne mange pas.", "bukhari-5476"),
      p("Le chien dressé lâché avec le nom d’Allah.", "muslim-1929", "bukhari-5486"),
      p("Le gibier retrouvé plus tard se mange s’il n’est pas avarié.", "muslim-1931"),
    ],
  },
  "animals-domestic": {
    title: "Les animaux domestiques",
    short: "Garder un chien sans nécessité (chasse, troupeau, champ) diminue chaque jour les œuvres d’un qîrât.",
    rules: [p("Garder un chien sans nécessité diminue chaque jour les œuvres d’un qîrât.", "bukhari-2322")],
  },
  "animals-welfare": {
    title: "La bienfaisance envers les animaux",
    short: "Il est interdit d’enfermer un animal sans le nourrir, de le frapper au visage ou de le prendre pour cible. Abreuver un chien assoiffé a valu le pardon à un homme.",
    rules: [
      p("Un homme a été pardonné pour avoir abreuvé un chien assoiffé.", "bukhari-2363"),
      p("Une femme est entrée en Enfer à cause d’une chatte enfermée sans nourriture.", "bukhari-3482"),
      p("Malédiction de celui qui prend un être vivant pour cible.", "muslim-1957"),
      p("Interdiction de frapper ou de marquer au visage.", "muslim-2117"),
      p("« Lorsque vous égorgez, égorgez de la meilleure façon. »", "muslim-1955a"),
    ],
    cases: [
      c("Peut-on tuer les nuisibles ?", "Le Prophète ﷺ a nommé cinq nuisibles que l’on tue même dans l’enceinte sacrée, dont le rat et le scorpion.", "bukhari-3314"),
    ],
  },
  "animals-products": {
    title: "Les produits animaux",
    short: "La peau d’une bête morte devient pure une fois tannée.",
    rules: [p("« Quand la peau est tannée, elle devient pure. »", "muslim-366")],
    sourceIds: ["wajiz-atimah"],
  },
};

export const SIYAR_LESSONS: Record<string, LessonEntry> = {
  "siyar-covenants": {
    title: "Respecter les engagements",
    short: "Le musulman respecte ses pactes et ses engagements, envers tous.",
    rules: [
      p("« Et remplissez l’engagement, car on sera interrogé au sujet des engagements. »", "quran-17-34"),
      p("« Respectez pleinement le pacte conclu avec eux jusqu’au terme convenu. »", "quran-9-4"),
      p("À Hudhayfa et son père, qui avaient promis aux Quraysh de ne pas combattre : « Retournez tous les deux à Médine ; nous respecterons le pacte que nous avons fait avec eux. »", "muslim-1787"),
    ],
  },
  "siyar-protection": {
    title: "La protection accordée",
    short: "Celui qui demande protection la reçoit et est conduit en lieu sûr. La protection accordée par un musulman engage tous les musulmans.",
    rules: [
      p("« Et si l’un des polythéistes te demande asile, accorde-le lui » … « puis fais-le parvenir à son lieu de sécurité. »", "quran-9-6"),
      p("La protection des musulmans est une : le plus humble d’entre eux peut l’accorder.", "bukhari-3179"),
      p("Tuer une personne sous pacte est une faute très grave.", "bukhari-3166"),
    ],
  },
  "siyar-noncombatants": {
    title: "Les non-combattants",
    short: "Il est interdit de s’en prendre aux femmes, aux enfants et aux non-combattants, de mutiler et de trahir.",
    rules: [
      p("Interdiction de tuer les femmes et les enfants.", "bukhari-3015"),
      p("Le Prophète ﷺ disait à ceux qu’il envoyait en expédition de ne pas détourner le butin, de ne pas trahir leur engagement, de ne pas mutiler et de ne pas tuer d’enfant.", "muslim-1731"),
      p("« Ne transgressez pas. »", "quran-2-190"),
    ],
  },
  "siyar-property": {
    title: "Justice envers tous",
    short: "La justice est due à tous, même à celui qu’on n’aime pas. Allah n’interdit pas la bonté envers ceux qui ne combattent pas les musulmans.",
    rules: [
      p("« Et que la haine pour un peuple ne vous incite pas à être injuste. Soyez justes, cela est plus proche de la piété. »", "quran-5-8"),
      p("« Allah ne vous défend pas d’être bienfaisants et équitables envers ceux qui ne vous ont pas combattus pour la religion. »", "quran-60-8"),
    ],
  },
  "siyar-historical-context": {
    title: "Lire ces textes dans leur cadre",
    short: "Les règles de la guerre et de la paix relèvent de l’autorité légitime, jamais de l’initiative individuelle.",
    rules: [
      p("« Et s’ils inclinent à la paix, incline vers celle-ci (toi aussi). »", "quran-8-61"),
      p("Ces matières sont replacées dans leur cadre d’autorité légitime et de droit.", "wajiz-siyar"),
    ],
  },
};
