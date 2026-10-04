import type { ImageSourcePropType } from "react-native";

/** Cover of each Fiqh book. */
export const FIQH_BOOK_IMAGES: Record<string, ImageSourcePropType> = {
  purification: require("../../assets/images/fiqh/purification.png"),
  prayer: require("../../assets/images/fiqh/prayer-book.png"),
  fasting: require("../../assets/images/fiqh/fasting.png"),
  zakat: require("../../assets/images/fiqh/zakat.png"),
  "hajj-umra": require("../../assets/images/fiqh/hajj-umrah-final.jpg"),
  funerals: require("../../assets/images/fiqh/funerals.png"),
  family: require("../../assets/images/fiqh/family.png"),
  transactions: require("../../assets/images/fiqh/transactions.png"),
  "food-sacrifices": require("../../assets/images/fiqh/food-sacrifices.png"),
  "oaths-vows": require("../../assets/images/fiqh/oaths-vows.png"),
  "clothing-adornment": require("../../assets/images/fiqh/clothing-adornment.png"),
  "daily-life": require("../../assets/images/fiqh/daily-life.png"),
  "justice-rights": require("../../assets/images/fiqh/justice-rights.png"),
  "inheritance-wills": require("../../assets/images/fiqh/inheritance-wills.png"),
  "hunting-animals": require("../../assets/images/fiqh/hunting-animals.png"),
  "siyar-relations": require("../../assets/images/fiqh/siyar-relations.png"),
};

/** One-sentence presentation of each book, shown on the library and on the book's first page. */
export const FIQH_BOOK_INTROS: Record<string, string> = {
  purification: "L’eau, les ablutions, le grand bain, le tayammum et les règles des femmes : tout ce qui rend la prière valable.",
  prayer: "Les conditions, les gestes de la prière dans l’ordre, puis les situations du quotidien : voyage, maladie, oubli, retard, vendredi et fêtes.",
  fasting: "Le mois de Ramadan du suhûr à l’iftâr, ce qui rompt le jeûne, les dispenses, le rattrapage et les jeûnes recommandés.",
  zakat: "Qui doit la zakât, sur quels biens, à partir de quel seuil, à qui la donner, et la zakât al-fitr.",
  "hajj-umra": "L’obligation du pèlerinage, l’ihrâm, les rites dans l’ordre et les situations particulières.",
  funerals: "Accompagner le mourant, laver, envelopper, prier sur le défunt, l’enterrer et consoler sa famille.",
  family: "Le mariage, les droits des époux, la séparation et les enfants.",
  transactions: "Vendre, acheter, prêter, louer et s’associer dans la loyauté, sans ribâ ni tromperie.",
  "food-sacrifices": "Ce qui est permis à manger, l’abattage, le sacrifice de l’Aïd et la ‘aqîqa.",
  "oaths-vows": "Ce qu’engage un serment ou un vœu, et comment l’expier quand on le rompt.",
  "clothing-adornment": "Le vêtement, la ‘awra, l’or et la soie, le parfum, les cheveux et l’apparence.",
  "daily-life": "Les bonnes manières du quotidien : toilettes, sommeil, salutations, voisins, voyage et assemblées.",
  "justice-rights": "Les preuves, les témoignages, les litiges, les biens trouvés et les dommages.",
  "inheritance-wills": "Le testament, les dettes du défunt, les héritiers et leurs parts.",
  "hunting-animals": "La chasse, les animaux domestiques, la bienfaisance envers les bêtes et les produits animaux.",
  "siyar-relations": "Les pactes, la protection accordée et les règles qui encadrent les relations, dans leur cadre d’autorité.",
};

/** The five acts of worship open the library; the rest is « La vie du musulman ». */
export const FIQH_WORSHIP_BOOKS = ["purification", "prayer", "fasting", "zakat", "hajj-umra"];
