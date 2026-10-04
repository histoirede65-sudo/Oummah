import { c, p, type LessonEntry } from "./types";

const W = "wajiz-zakat";
const E = "contemporary-estimates";

export const ZAKAT_LESSONS: Record<string, LessonEntry> = {
  "zakat-obligation": {
    title: "L’obligation de la zakât",
    short: "La zakât est le troisième pilier de l’islam : une part déterminée de certains biens, due chaque année par le musulman qui possède le seuil (nisâb), et versée à des bénéficiaires précis.",
    rules: [
      p("« Accomplissez la prière et acquittez la zakât. »", "quran-2-43"),
      p("Elle est l’un des cinq piliers de l’islam.", "bukhari-8"),
      p("Elle est prise des riches et rendue aux pauvres.", "bukhari-1395"),
      p("Celui qui ne la paie pas s’expose à un châtiment sévère.", "bukhari-1403", "quran-9-34"),
    ],
    cases: [
      c("Quels biens sont concernés ?", "L’or, l’argent et l’argent liquide (épargne, comptes), les marchandises destinées à la vente, les récoltes, le bétail en pâturage, et les trésors trouvés (rikâz).", W),
      c("Ma maison, ma voiture, mes meubles ?", "Non : les biens d’usage personnel ne sont pas soumis à la zakât.", "bukhari-1463"),
    ],
  },

  "zakat-purification": {
    title: "Le sens de la zakât",
    short: "La zakât purifie le croyant de l’avarice, purifie ses biens et y met la bénédiction. Elle ne diminue pas la richesse.",
    rules: [
      p("« Prélève de leurs biens une aumône par laquelle tu les purifies et les bénis. »", "quran-9-103"),
      p("« L’aumône ne diminue en rien les biens. »", "muslim-2588"),
    ],
  },

  "zakat-beneficiaries": {
    title: "À qui donner la zakât",
    short: "Le Coran nomme huit catégories : les pauvres, les nécessiteux, ceux qui la collectent, ceux dont on rapproche les cœurs, l’affranchissement, les endettés, la cause d’Allah et le voyageur en détresse.",
    rules: [
      p("Les huit catégories sont fixées par le verset 9:60.", "quran-9-60"),
      p("Elle ne revient ni au riche ni à l’homme valide capable de gagner sa vie.", "abudawud-1633"),
      p("Elle ne convient pas à la famille du Prophète ﷺ.", "muslim-1072"),
      p("Donner à des proches dans le besoin vaut deux récompenses : celle de l’aumône et celle du lien de parenté.", "bukhari-1466"),
    ],
    cases: [
      c("Puis-je la donner à mes parents ou à mes enfants ?", "Non, si vous avez l’obligation de les entretenir : ce serait vous acquitter d’un devoir avec votre zakât. Vos frères, sœurs, oncles et tantes dans le besoin peuvent la recevoir.", W, "bukhari-1466"),
      c("Puis-je la donner à mon épouse ?", "Non, son entretien est à votre charge. L’épouse peut en revanche donner sa zakât à son mari pauvre.", "bukhari-1466"),
      c("Dois-je répartir sur les huit catégories ?", "Non : donner à une seule catégorie suffit selon la majorité des savants.", W),
    ],
  },

  "zakat-nisab": {
    title: "Le seuil (nisâb)",
    short: "La zakât n’est due qu’à partir d’un seuil : 20 dinars d’or ou 200 dirhams d’argent pour la monnaie, 5 chameaux, 40 moutons, 30 bovins, 5 awsuq de récolte.",
    rules: [
      p("Or : 20 dinars ; argent : 200 dirhams.", "abudawud-1573"),
      p("Pas de zakât en dessous de cinq awq d’argent, cinq chameaux, cinq awsuq de récolte.", "bukhari-1405", "bukhari-1447"),
      p("Moutons : à partir de quarante.", "bukhari-1454"),
      p("Bovins : à partir de trente.", "tirmidhi-623"),
    ],
    cases: [
      c("Combien cela fait-il en grammes ?", "Les savants contemporains estiment généralement 20 dinars à environ 85 g d’or, et 200 dirhams à environ 595 g d’argent. Vérifiez le cours du jour pour connaître le montant.", E),
      c("Je dois me baser sur l’or ou sur l’argent ?", "Les savants divergent. Le seuil de l’argent est plus bas et profite davantage aux pauvres ; beaucoup le préfèrent pour l’argent liquide.", W),
    ],
  },

  "zakat-money-gold": {
    title: "La zakât de l’argent et de l’or",
    short: "Sur l’épargne, l’or et l’argent qui atteignent le seuil et restent un an, on verse 2,5 % (un quarantième).",
    rules: [
      p("Pour 200 dirhams : 5 dirhams ; pour 20 dinars : un demi-dinar, soit un quarantième.", "abudawud-1573"),
      p("Sur l’argent, le quart du dixième (2,5 %).", "bukhari-1454"),
      p("La monnaie actuelle (espèces, comptes, épargne) suit la règle de l’or et de l’argent.", W),
    ],
    steps: [
      p("Le jour anniversaire de votre zakât, additionnez votre épargne, vos espèces et votre or ou argent.", W),
      p("Si le total atteint le nisâb, multipliez-le par 2,5 % (divisez par 40).", "abudawud-1573"),
      p("Versez ce montant aux bénéficiaires.", "quran-9-60"),
    ],
    cases: [
      c("Les bijoux en or portés sont-ils soumis à la zakât ?", "Les écoles divergent : les hanafites la rendent obligatoire ; les malikites, shafi‘ites et hanbalites l’en dispensent pour un usage personnel habituel. Payer est la voie la plus prudente.", W),
      c("Les marchandises de mon commerce ?", "Selon la majorité des savants, on estime leur valeur à la date de la zakât et on paie 2,5 %.", W),
    ],
  },

  "zakat-hawl": {
    title: "L’année de possession (hawl)",
    short: "La zakât de la monnaie, de l’or et du bétail n’est due qu’après une année lunaire pendant laquelle le bien est resté au-dessus du seuil. Les récoltes, elles, se paient à la récolte.",
    rules: [
      p("« Pas de zakât sur un bien tant qu’une année n’est pas passée. »", "abudawud-1573"),
      p("Pour les récoltes : « Acquittez-en le droit le jour de la récolte. »", "quran-6-141"),
    ],
    cases: [c("Mon épargne augmente pendant l’année.", "Le plus simple : fixez une date annuelle et payez sur la totalité du montant ce jour-là, s’il atteint le nisâb.", W)],
  },

  "zakat-camels": {
    title: "La zakât des chameaux",
    short: "De 5 à 24 chameaux, un mouton par tranche de cinq ; à partir de 25, on donne de jeunes chamelles dont l’âge augmente avec le troupeau.",
    rules: [
      p("De 5 à 24 : un mouton pour chaque tranche de cinq.", "bukhari-1454"),
      p("25 à 35 : une chamelle d’un an ; 36 à 45 : de deux ans ; 46 à 60 : de trois ans ; 61 à 75 : de quatre ans ; 76 à 90 : deux de deux ans ; 91 à 120 : deux de trois ans.", "bukhari-1454"),
      p("Au-delà de 120 : une chamelle de deux ans par quarante, une de trois ans par cinquante.", "bukhari-1454"),
    ],
    note: ["Cela concerne le bétail qui pâture librement la plus grande partie de l’année."],
  },

  "zakat-sheep": {
    title: "La zakât des moutons et chèvres",
    short: "De 40 à 120 têtes : un mouton ; de 121 à 200 : deux ; de 201 à 300 : trois ; puis un par centaine.",
    rules: [p("Ces paliers sont fixés dans la lettre d’Abû Bakr transmise par Anas.", "bukhari-1454")],
    note: ["Cela concerne le bétail qui pâture librement la plus grande partie de l’année."],
  },

  "zakat-cattle": {
    title: "La zakât des bovins",
    chapter: "zakat-livestock",
    aliases: ["vaches", "bovins", "boeufs"],
    short: "À partir de 30 bovins, un veau d’un an ; à partir de 40, une vache de deux ans ; ensuite, un veau par trente et une vache par quarante.",
    rules: [p("Le Prophète ﷺ a envoyé Mu‘âdh au Yémen avec ces paliers.", "tirmidhi-623")],
  },

  "zakat-crops": {
    title: "La zakât des récoltes",
    short: "Les céréales et les fruits qui se conservent (blé, orge, dattes, raisins secs…) atteignant 5 awsuq : 10 % s’ils sont arrosés par la pluie, 5 % s’ils sont irrigués avec effort.",
    rules: [
      p("Pas de zakât en dessous de cinq awsuq.", "bukhari-1405"),
      p("Un dixième pour ce qu’arrosent la pluie et les sources, un vingtième pour ce qui est irrigué par un moyen coûteux.", "bukhari-1483", "muslim-981"),
      p("Elle se paie le jour de la récolte, sans attendre un an.", "quran-6-141"),
    ],
    cases: [c("Combien font cinq awsuq ?", "Cinq awsuq font trois cents sâ‘, estimés par les savants contemporains à environ 600 kg selon la denrée.", E)],
  },

  "zakat-rikaz": {
    title: "Le trésor trouvé (rikâz)",
    short: "Celui qui trouve un trésor enfoui des temps anciens en donne un cinquième (20 %).",
    rules: [p("« Sur le rikâz, le cinquième. »", "bukhari-1499")],
    note: ["Un objet perdu récemment n’est pas un rikâz : il suit les règles du bien trouvé (luqata)."],
  },

  "zakat-fitr": {
    title: "La zakât al-fitr",
    short: "À la fin de Ramadan, chaque musulman donne un sâ‘ de nourriture pour lui et pour ceux qu’il prend en charge, avant la prière de l’Aïd. Elle purifie le jeûne et nourrit les pauvres le jour de la fête.",
    rules: [
      p("Le Prophète ﷺ l’a prescrite : un sâ‘ de dattes ou d’orge.", "bukhari-1503", "bukhari-1504", "muslim-984e"),
      p("Elle purifie le jeûneur des paroles vaines et nourrit les pauvres.", "abudawud-1609"),
    ],
    cases: [c("Est-ce la même chose que la zakât des biens ?", "Non : elle concerne chaque personne, riche ou non, dès qu’elle a de quoi manger le jour de l’Aïd.", W)],
  },

  "zakat-fitr-amount": {
    title: "La quantité",
    short: "Un sâ‘ par personne. Le sâ‘ est une mesure de volume (quatre fois deux mains jointes, environ 2,7 litres) : son poids change selon la denrée. Dans le doute, 2,5 à 3 kg couvrent toutes les denrées courantes.",
    rules: [
      p("Un sâ‘ de nourriture par personne.", "bukhari-1503", "bukhari-1504"),
      p("Blé : environ 2 kg (2,04 kg selon l’estimation d’Ibn ‘Uthaymîn).", E),
      p("Riz : environ 2,5 kg ; le Comité permanent des savants d’Arabie saoudite a retenu 3 kg par précaution.", E),
      p("Dattes : environ 2 à 2,5 kg, selon la variété.", E),
      p("Couscous ou semoule : environ 2 kg.", E),
      p("Lentilles, pois chiches, haricots secs : environ 2,2 kg.", E),
      p("Raisins secs : environ 1,8 kg.", E),
      p("Orge : environ 1,7 kg.", E),
    ],
    cases: [
      c("Pour une famille de cinq personnes ?", "Cinq sâ‘ : par exemple environ 12,5 à 15 kg de riz, ou 10 kg de blé.", E),
      c("Je n’ai pas de balance précise.", "Arrondissez vers le haut : donner un peu plus est une aumône en plus.", E),
    ],
    note: ["Ces poids sont des estimations : le sâ‘ se mesure en volume, et le poids exact dépend de la variété et de l’humidité de la denrée."],
  },

  "zakat-fitr-food": {
    title: "Nourriture ou argent ?",
    short: "On donne l’aliment de base du pays : dattes, orge, blé, riz… Les hanafites permettent de donner sa valeur en argent ; les autres écoles demandent de la nourriture.",
    rules: [
      p("Le Prophète ﷺ l’a fixée en dattes ou en orge ; les Compagnons donnaient aussi du blé, du fromage séché ou des raisins secs.", "bukhari-1503", "bukhari-1506"),
      p("Les hanafites permettent l’équivalent en argent ; les malikites, shafi‘ites et hanbalites exigent de la nourriture.", W),
    ],
  },

  "zakat-fitr-persons": {
    title: "Pour qui la donner",
    short: "Elle est due pour chaque musulman, petit ou grand, homme ou femme. Le chef de famille la donne pour lui-même et pour ceux qu’il entretient.",
    rules: [p("« Sur l’esclave et le libre, l’homme et la femme, le petit et le grand parmi les musulmans. »", "bukhari-1503", "muslim-984e")],
    cases: [
      c("Et le bébé à naître ?", "Elle n’est pas obligatoire pour l’enfant à naître ; certains Compagnons la donnaient par recommandation.", W),
      c("Et celui qui n’a pas de quoi ?", "Elle n’est due que par celui qui possède plus que sa nourriture et celle de sa famille pour le jour et la nuit de l’Aïd.", W),
    ],
  },

  "zakat-fitr-timing": {
    title: "Quand la donner",
    short: "Avant la prière de l’Aïd. On peut l’avancer d’un ou deux jours. Donnée après la prière, elle n’est plus qu’une aumône ordinaire.",
    rules: [
      p("Le Prophète ﷺ a ordonné de la donner avant que les gens sortent pour la prière.", "bukhari-1503"),
      p("Les Compagnons la donnaient un ou deux jours avant l’Aïd.", "bukhari-1511"),
      p("« Celui qui la donne avant la prière, c’est une zakât acceptée ; après la prière, c’est une aumône parmi d’autres. »", "abudawud-1609"),
    ],
  },
};
