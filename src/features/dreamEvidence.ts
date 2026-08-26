export type DreamEvidenceLevel =
  | "AUTHENTIC_SOURCE"
  | "CLASSICAL_INTERPRETATION"
  | "CONTEXT_DEPENDENT"
  | "INSUFFICIENT_BASIS";

export type DreamSourceRecord = {
  id: string;
  ref: string;
  kind: "QURAN" | "SAHIH_HADITH" | "CLASSICAL_SOURCE" | "METHODOLOGY";
  label: string;
  supports: string[];
};

/**
 * Curated local corpus used by the Dreams module.
 *
 * The corpus separates authentic textual evidence from classical methodology.
 * Classical material is NEVER treated as revelation or as a fixed symbol
 * dictionary. Attribution to the popular dream book bearing Ibn Sirin's name is
 * intentionally excluded because its authorship is disputed.
 */
export const DREAM_EVIDENCE: DreamSourceRecord[] = [
  {
    id: "quran-yusuf-4-6",
    ref: "Coran 12:4–6",
    kind: "QURAN",
    label: "Yûsuf raconte sa vision à son père dans le récit coranique.",
    supports: ["Le Coran rapporte l’existence de visions et leur place dans le récit de Yûsuf."],
  },
  {
    id: "quran-yusuf-43-49",
    ref: "Coran 12:43–49",
    kind: "QURAN",
    label: "Le rêve du roi et son interprétation dans le récit de Yûsuf.",
    supports: ["Le Coran rapporte une interprétation de rêve accordée à Yûsuf."],
  },
  {
    id: "quran-yusuf-100",
    ref: "Coran 12:100",
    kind: "QURAN",
    label: "Yûsuf évoque l’accomplissement de sa vision ancienne.",
    supports: ["Le récit de Yûsuf comporte l’accomplissement d’une vision antérieure."],
  },
  {
    id: "muslim-2263a",
    ref: "Sahih Muslim 2263a",
    kind: "SAHIH_HADITH",
    label: "Trois catégories de rêves et conduite face au rêve déplaisant.",
    supports: [
      "Les rêves sont mentionnés en trois catégories.",
      "Une bonne vision peut être une bonne annonce venant d’Allah.",
      "Un rêve pénible peut venir de Shaytân.",
      "Certains rêves proviennent de ce que la personne se dit à elle-même.",
      "Après un rêve déplaisant, la Sunna recommande notamment de ne pas le raconter et mentionne la prière.",
    ],
  },
  {
    id: "bukhari-7044",
    ref: "Sahih al-Bukhari 7044",
    kind: "SAHIH_HADITH",
    label: "Conduite recommandée après un rêve déplaisant.",
    supports: [
      "Chercher refuge auprès d’Allah contre le mal du rêve et contre Shaytân.",
      "Souffler/crachoter légèrement à gauche trois fois.",
      "Ne pas raconter le rêve déplaisant.",
      "Une bonne vision peut être racontée à une personne aimée.",
    ],
  },
  {
    id: "bukhari-7007",
    ref: "Sahih al-Bukhari 7007",
    kind: "SAHIH_HADITH",
    label: "Dans une vision précise, le Prophète ﷺ interprète le lait bu comme la connaissance.",
    supports: ["Le lait bu a été interprété comme la connaissance dans cette vision prophétique précise."],
  },
  {
    id: "bukhari-7008",
    ref: "Sahih al-Bukhari 7008",
    kind: "SAHIH_HADITH",
    label: "Dans une vision précise, le Prophète ﷺ interprète les chemises portées comme la religion.",
    supports: ["Les chemises portées ont été interprétées comme la religion dans cette vision prophétique précise."],
  },
  {
    id: "bukhari-7014",
    ref: "Sahih al-Bukhari 7014",
    kind: "SAHIH_HADITH",
    label: "Le rêve de ‘Abd Allah ibn Salam : jardin, colonne et prise ferme.",
    supports: ["Dans ce rêve précis, le jardin et la prise ferme ont été reliés à l’Islam et à la fermeté dans l’Islam."],
  },
  {
    id: "bukhari-7046",
    ref: "Sahih al-Bukhari 7046",
    kind: "SAHIH_HADITH",
    label: "Abu Bakr interprète une vision ; le Prophète ﷺ lui indique qu’il a vu juste sur certains points et s’est trompé sur d’autres.",
    supports: ["Même un interprète éminent peut avoir partiellement raison et partiellement tort."],
  },
  {
    id: "baghawi-sharh-sunna-12-220",
    ref: "Al-Baghawi, Sharh al-Sunnah 12/220",
    kind: "CLASSICAL_SOURCE",
    label: "Principes classiques du ta‘bîr : Coran, Sunna, proverbes, noms/sens, opposition ; exemples comme corde, navire et pierre.",
    supports: [
      "Le ta‘bîr classique peut raisonner par le Coran, la Sunna, les usages de langue, les noms et les oppositions.",
      "Ces exemples sont des méthodes et analogies, pas un dictionnaire universel.",
    ],
  },
  {
    id: "nafrawi-fawakih-2-353",
    ref: "Al-Nafrawi, al-Fawakih al-Dawani 2/353",
    kind: "CLASSICAL_SOURCE",
    label: "Mise en garde contre l’interprétation mécanique par les livres : personnes, états, époques et caractéristiques du rêveur diffèrent.",
    supports: [
      "L’interprétation ne doit pas être tirée mécaniquement d’un livre.",
      "La personne, son état, l’époque et ses caractéristiques peuvent modifier l’interprétation.",
    ],
  },
  {
    id: "method-context",
    ref: "Principe méthodologique OUMMAH",
    kind: "METHODOLOGY",
    label: "L’application refuse tout dictionnaire automatique de symboles et toute conclusion non étayée.",
    supports: [
      "Un récit seul ne permet pas à l’application d’affirmer une interprétation certaine.",
      "Le contexte personnel est traité comme contexte, jamais comme preuve religieuse.",
      "L’absence de base vérifiée entraîne une absence d’interprétation.",
    ],
  },
];

export const getDreamSource = (id: string) => DREAM_EVIDENCE.find((source) => source.id === id);
