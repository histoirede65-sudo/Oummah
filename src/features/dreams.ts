import { DREAM_EVIDENCE } from "./dreamEvidence";

export const DREAM_TYPES = [
  {
    icon: "sparkles-outline" as const,
    title: "La bonne vision",
    arabic: "الرؤيا الصالحة",
    text: "Une bonne vision peut être une bonne annonce venant d’Allah. Elle n’est pourtant ni une révélation ni une certitude sur l’avenir.",
    source: "Sahih Muslim 2263a",
  },
  {
    icon: "moon-outline" as const,
    title: "Le rêve troublant",
    arabic: "الحلم",
    text: "Le rêve qui effraie ou attriste peut relever de Shaytân. La Sunna enseigne surtout comment y réagir, plutôt que d’en chercher chaque symbole.",
    source: "Sahih al-Bukhari 7044",
  },
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Ce qui vient de soi",
    arabic: "حديث النفس",
    text: "Certains rêves reflètent ce qui occupe l’esprit : préoccupations, événements, pensées ou émotions vécues.",
    source: "Sahih Muslim 2263a",
  },
];

export const BAD_DREAM_STEPS = [
  "Chercher refuge auprès d’Allah contre son mal et contre Shaytân.",
  "Souffler légèrement à gauche trois fois.",
  "Ne pas raconter ce rêve aux gens.",
  "Se lever et prier si l’on en ressent le besoin.",
];

export const DREAM_CONTEXT = [
  "La situation actuelle de la personne",
  "Ses préoccupations et événements récents",
  "Ses émotions avant et après le rêve",
  "Les éléments réellement présents dans le rêve",
  "Ce qui relève peut-être simplement de ses pensées",
];

export const DREAM_SOURCES = DREAM_EVIDENCE.filter((source) => source.kind !== "METHODOLOGY").map((source) => ({
  ref: source.ref,
  label: source.label,
}));
