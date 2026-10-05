import { c, p, type LessonEntry } from "./types";


export const ZAKAT_LESSONS: Record<string, LessonEntry> = {
  "zakat-obligation": {
    title: "L’obligation de la zakât",
    short: "La zakât est le troisième pilier de l’islam : une part déterminée de certains biens, due chaque année par le musulman qui possède le seuil (nisâb), et versée à des bénéficiaires précis.",
    rules: [
      p("« Et accomplissez la prière (As-Ṣalāt), et acquittez l’aumône (Az- Zakāt). »", "quran-2-43"),
      p("Elle est l’un des cinq piliers de l’islam.", "bukhari-8"),
      p("Elle est prise des riches et rendue aux pauvres.", "bukhari-1395"),
      p("Celui qui ne la paie pas s’expose à un châtiment sévère.", "bukhari-1403", "quran-9-34"),
    ],
    cases: [
      c("Quels biens sont concernés ?", "Al-Wajîz cite l’or et l’argent, les récoltes et les fruits, le bétail et le trésor enfoui (rikâz). Ibn ‘Uthaymîn y ajoute tout bien destiné au commerce.", "wajiz-zakat", "uthaymin-liqa-zakat"),
      c("Et l’argent en billets ou sur un compte ?", "Ibn Bâz : l’argent épargné, qu’il soit en or, en argent ou en monnaie papier, est soumis à la zakât s’il atteint le seuil et qu’une année est passée.", "binbaz-zakat-savings"),
      c("Ma maison, ma voiture, mes meubles ?", "Ibn ‘Uthaymîn distingue les biens destinés au commerce de ce que l’on garde pour soi, comme sa maison. Le Prophète ﷺ a dit que le musulman ne doit pas de zakât sur son esclave ni sur son cheval.", "uthaymin-liqa-zakat", "bukhari-1463"),
    ],
  },

  "zakat-purification": {
    title: "Le sens de la zakât",
    short: "La zakât purifie le croyant de l’avarice, purifie ses biens et y met la bénédiction. Elle ne diminue pas la richesse.",
    rules: [
      p("« Prélève de leurs biens une aumône (As-Sadaqâh) par laquelle tu les purifies et les bénis. »", "quran-9-103"),
      p("« L’aumône ne diminue pas la richesse. »", "muslim-2588"),
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
      c("Dois-je répartir sur les huit catégories ?", "Al-Wajîz rapporte d’Ibn Kathîr deux avis : pour ash-Shâfi‘î, il faut couvrir les huit ; pour Mâlik et de nombreux savants, on peut tout donner à une seule. Ibn Jarîr dit que c’est l’avis de la généralité des savants.", "wajiz-zakat"),
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
      c("Combien cela fait-il en grammes ?", "Ibn ‘Uthaymîn : « Le seuil de l’or, avec les mesures actuelles, est de quatre-vingt-cinq grammes, et celui de l’argent de cinq cent quatre-vingt-quinze grammes. »", "uthaymin-liqa-zakat"),
      c("J’ai un demi-seuil d’or et un demi-seuil d’argent.", "Ibn ‘Uthaymîn : on ne complète pas l’or par l’argent ; il n’y a donc pas de zakât, puisque vous n’avez le seuil ni de l’un ni de l’autre.", "uthaymin-liqa-zakat"),
    ],
  },

  "zakat-money-gold": {
    title: "La zakât de l’argent et de l’or",
    short: "Sur l’épargne, l’or et l’argent qui atteignent le seuil et restent un an, on verse 2,5 % (un quarantième).",
    rules: [
      p("Pour 200 dirhams : 5 dirhams ; pour 20 dinars : un demi-dinar, soit un quarantième.", "abudawud-1573"),
      p("Sur l’argent, le quart du dixième (2,5 %).", "bukhari-1454"),
      p("Ibn Bâz : l’argent épargné, qu’il soit en or, en argent ou en monnaie papier, est soumis à la zakât s’il atteint le seuil et qu’une année est passée.", "binbaz-zakat-savings"),
    ],
    steps: [
      p("Quand une année lunaire est passée sur votre argent, vérifiez qu’il atteint le seuil.", "abudawud-1573"),
      p("Versez-en le quarantième (2,5 %).", "abudawud-1573"),
      p("Donnez ce montant aux bénéficiaires nommés par le Coran.", "quran-9-60"),
    ],
    cases: [
      c("Les bijoux en or portés sont-ils soumis à la zakât ?", "Al-Wajîz : la zakât des bijoux est obligatoire. Umm Salama portait des bijoux en or ; le Prophète ﷺ lui a dit que ce dont la zakât est payée n’est pas un trésor. Il a dit à ‘Â’isha, qui portait des bagues en argent sans en payer la zakât : « Cela suffit pour te mener au Feu de l’Enfer. » Ibn ‘Uthaymîn dit aussi que l’or et l’argent sont soumis à la zakât en toutes circonstances, bijoux compris.", "wajiz-zakat", "abudawud-1564", "abudawud-1565", "uthaymin-liqa-zakat"),
      c("Les marchandises de mon commerce ?", "Ibn ‘Uthaymîn : tout bien destiné au commerce (terrains, voitures, tissus, ustensiles…) est soumis à la zakât, au quart du dixième, s’il atteint le seuil.", "uthaymin-liqa-zakat"),
    ],
  },

  "zakat-hawl": {
    title: "L’année de possession (hawl)",
    short: "La zakât de la monnaie, de l’or et du bétail n’est due qu’après une année lunaire pendant laquelle le bien est resté au-dessus du seuil. Les récoltes, elles, se paient à la récolte.",
    rules: [
      p("« Aucune zakat n’est due sur un bien avant qu’une année ne s’écoule. »", "abudawud-1573"),
      p("Pour les récoltes : « acquittez-en les droits le jour de la récolte. »", "quran-6-141"),
    ],
  },

  "zakat-camels": {
    title: "La zakât des chameaux",
    short: "De 5 à 24 chameaux, un mouton par tranche de cinq ; à partir de 25, on donne de jeunes chamelles dont l’âge augmente avec le troupeau.",
    rules: [
      p("De 5 à 24 : un mouton pour chaque tranche de cinq.", "bukhari-1454"),
      p("25 à 35 : une chamelle d’un an ; 36 à 45 : de deux ans ; 46 à 60 : de trois ans ; 61 à 75 : de quatre ans ; 76 à 90 : deux de deux ans ; 91 à 120 : deux de trois ans.", "bukhari-1454"),
      p("Au-delà de 120 : une chamelle de deux ans par quarante, une de trois ans par cinquante.", "bukhari-1454"),
      p("Al-Wajîz : il faut que le bétail pâture librement la plus grande partie de l’année.", "wajiz-zakat"),
    ],
  },

  "zakat-sheep": {
    title: "La zakât des moutons et chèvres",
    short: "De 40 à 120 têtes : un mouton ; de 121 à 200 : deux ; de 201 à 300 : trois ; puis un par centaine.",
    rules: [
      p("Ces paliers sont fixés dans la lettre d’Abû Bakr transmise par Anas.", "bukhari-1454"),
      p("Al-Wajîz : il faut que le bétail pâture librement la plus grande partie de l’année.", "wajiz-zakat"),
    ],
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
    short: "Al-Wajîz : la zakât des récoltes se prend sur le blé, l’orge, les dattes et les raisins secs qui atteignent 5 awsuq : 10 % s’ils sont arrosés par la pluie, 5 % s’ils sont irrigués avec effort.",
    rules: [
      p("Al-Wajîz : le Prophète ﷺ a envoyé Abû Mûsâ et Mu‘âdh au Yémen en leur ordonnant de ne prendre l’aumône que sur ces quatre denrées : le blé, l’orge, les dattes et les raisins secs.", "wajiz-zakat"),
      p("Pas de zakât en dessous de cinq awsuq.", "bukhari-1405"),
      p("Un dixième pour ce qu’arrosent la pluie et les sources, un vingtième pour ce qui est irrigué par un moyen coûteux.", "bukhari-1483", "muslim-981"),
      p("Elle se paie le jour de la récolte, sans attendre un an.", "quran-6-141"),
    ],
    cases: [
      c("Combien font cinq awsuq ?", "Al-Wajîz rapporte d’Ibn Hajar qu’un wasq vaut soixante sâ‘, par accord des savants : cinq awsuq font donc trois cents sâ‘.", "wajiz-zakat"),
    ],
  },

  "zakat-rikaz": {
    title: "Le trésor trouvé (rikâz)",
    short: "Celui qui trouve un trésor enfoui des temps anciens en donne un cinquième (20 %).",
    rules: [
      p("« Le Khumus est obligatoire sur le Rikaz. »", "bukhari-1499"),
      p("Al-Wajîz : le rikâz est le trésor enfoui d’avant l’islam, trouvé sans dépense ni grand effort ; on en donne le cinquième aussitôt, sans condition d’année ni de seuil.", "wajiz-zakat"),
    ],
  },

  "zakat-fitr": {
    title: "La zakât al-fitr",
    short: "À la fin de Ramadan, chaque musulman donne un sâ‘ de nourriture pour lui et pour ceux qu’il prend en charge, avant la prière de l’Aïd. Elle purifie le jeûneur et nourrit les pauvres.",
    rules: [
      p("Le Prophète ﷺ l’a prescrite : un sâ‘ de dattes ou d’orge.", "bukhari-1503", "bukhari-1504", "muslim-984e"),
      p("Elle purifie le jeûneur des paroles vaines et nourrit les pauvres.", "abudawud-1609"),
      p("Al-Wajîz : elle ne se donne qu’aux pauvres (masâkîn), d’après les mots « nourriture pour les pauvres ».", "wajiz-zakat", "abudawud-1609"),
    ],
    cases: [
      c("Est-ce la même chose que la zakât des biens ?", "Non. Al-Wajîz : elle est due par le musulman qui possède plus que sa nourriture et celle de sa famille pour un jour et une nuit.", "wajiz-zakat"),
    ],
  },

  "zakat-fitr-amount": {
    title: "La quantité",
    short: "Un sâ‘ par personne. Le sâ‘ est une mesure de volume : Ibn Bâz le décrit comme quatre poignées des deux mains moyennes remplies, soit environ 3 kg ; Ibn ‘Uthaymîn l’a pesé à 2,040 kg de bon blé.",
    rules: [
      p("Un sâ‘ de nourriture par personne.", "bukhari-1503", "bukhari-1504"),
      p("Ibn Bâz : un sâ‘ de toutes les denrées, soit quatre poignées des deux mains moyennes remplies ; au poids, environ 3 kg.", "binbaz-zakat-fitr-sa"),
      p("Ibn ‘Uthaymîn : le sâ‘ prophétique, pesé en bon blé, fait 2,040 kg ; pour une denrée plus lourde, il faut augmenter le poids.", "uthaymin-sa"),
    ],
  },

  "zakat-fitr-food": {
    title: "Nourriture ou argent ?",
    short: "On donne de la nourriture : dattes, orge, fromage séché, raisins secs, ou l’aliment de base du pays. Abû Hanîfa a permis d’en donner la valeur ; la majorité des juristes ne l’ont pas permis.",
    rules: [
      p("Le Prophète ﷺ l’a fixée en dattes ou en orge ; les Compagnons donnaient un sâ‘ de nourriture, d’orge, de dattes, de fromage séché ou de raisins secs.", "bukhari-1503", "bukhari-1506"),
      p("Al-Wajîz : ou tout ce qui sert d’aliment de base, comme le riz ou le maïs.", "wajiz-zakat"),
      p("Al-Wajîz rapporte d’an-Nawawî que la généralité des juristes n’ont pas permis d’en donner la valeur, et qu’Abû Hanîfa l’a permis. Badawî rejette cet avis : si la valeur suffisait, Allah et Son Messager l’auraient précisé.", "wajiz-zakat"),
    ],
  },

  "zakat-fitr-persons": {
    title: "Pour qui la donner",
    short: "Elle est due pour chaque musulman, petit ou grand, homme ou femme. Le chef de famille la donne pour lui-même et pour ceux qu’il entretient.",
    rules: [
      p("Un sâ‘ « pour chaque personne parmi les musulmans, qu’elle soit homme libre ou esclave, homme ou femme, jeune ou âgé ».", "bukhari-1503", "muslim-984e"),
      p("Al-Wajîz : il la donne pour lui-même et pour ceux dont il a la charge, comme son épouse et ses enfants, s’ils sont musulmans.", "wajiz-zakat"),
    ],
    cases: [
      c("Et celui qui n’a pas de quoi ?", "Al-Wajîz : elle n’est due que par celui qui possède plus que sa nourriture et celle de sa famille pour un jour et une nuit.", "wajiz-zakat"),
    ],
  },

  "zakat-fitr-timing": {
    title: "Quand la donner",
    short: "Avant la prière de l’Aïd. On peut l’avancer d’un ou deux jours. Donnée après la prière, elle n’est plus qu’une aumône ordinaire.",
    rules: [
      p("Le Prophète ﷺ a ordonné de la donner avant que les gens sortent pour la prière.", "bukhari-1503"),
      p("Les Compagnons la donnaient un ou deux jours avant l’Aïd.", "bukhari-1511"),
      p("« Celui qui la donne avant la prière (‘Id), elle sera acceptée comme zakat. Celui qui la donne après la prière, ce sera une simple aumône comme les autres. »", "abudawud-1609"),
    ],
  },
};
