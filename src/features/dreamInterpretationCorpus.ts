import type { DreamEvidenceLevel } from "./dreamEvidence";

export type DreamInterpretationInput = {
  dreamText: string;
  emotion: "peace" | "neutral" | "fear";
};

export type DreamInterpretationMatch = {
  id: string;
  title: string;
  text: string;
  level: DreamEvidenceLevel;
  sourceIds: string[];
};

type Rule = {
  id: string;
  sourceIds: string[];
  level: Extract<DreamEvidenceLevel, "AUTHENTIC_SOURCE" | "CLASSICAL_INTERPRETATION">;
  matches: (text: string) => boolean;
  title: string;
  buildText: () => string;
};

const has = (text: string, pattern: RegExp) => pattern.test(text);

/**
 * Curated precedents and classical examples for the Dreams module.
 *
 * This is deliberately NOT a symbol dictionary. A match only means that a
 * reviewed source contains a comparable image or a classical interpretive
 * example. The wording always preserves context and uncertainty.
 */
const RULES: Rule[] = [
  {
    id: "milk-knowledge",
    sourceIds: ["bukhari-7007"],
    level: "AUTHENTIC_SOURCE",
    matches: (text) =>
      has(text, /\b(lait)\b/i) &&
      has(text, /\b(bois|boire|bu|buvais|buvait|buvons|buviez|buvaient|buvant|aval(?:e|é|ais|ait|er))\b/i),
    title: "Un précédent authentique proche : boire du lait",
    buildText: () =>
      "Dans une vision précise rapportée dans Sahih al-Bukhari, le Prophète ﷺ a interprété le lait qu’il avait bu comme la connaissance religieuse. C’est un précédent authentique, mais pas une équivalence universelle : OUMMAH ne peut donc pas affirmer que le lait de votre rêve signifie forcément la connaissance sans examiner le reste du récit et votre contexte.",
  },
  {
    id: "shirt-religion",
    sourceIds: ["bukhari-7008"],
    level: "AUTHENTIC_SOURCE",
    matches: (text) =>
      has(text, /\b(chemise|tunique|qamis|qam[iî]s)\b/i) &&
      has(text, /\b(port(?:e|ais|ait|er|ée|é)|vêtu|vêtue|habill[ée])\b/i),
    title: "Un précédent authentique proche : le vêtement porté",
    buildText: () =>
      "Dans une vision rapportée dans Sahih al-Bukhari, le Prophète ﷺ a interprété des chemises portées par des personnes comme représentant la religion, avec des longueurs différentes. Cela constitue un précédent authentique dans ce récit précis, et non une règle selon laquelle tout vêtement vu en rêve aurait automatiquement ce sens.",
  },
  {
    id: "garden-handhold-islam",
    sourceIds: ["bukhari-7014"],
    level: "AUTHENTIC_SOURCE",
    matches: (text) =>
      has(text, /\b(jardin|jardins|verger|prairie)\b/i) &&
      has(text, /\b(poign[ée]e|anse|anneau|prise|saisir|agripp|tenir|tenais|accroch)\b/i),
    title: "Un récit prophétique associe un jardin et une prise ferme à l’Islam",
    buildText: () =>
      "Dans le rêve de ‘Abd Allah ibn Salam, rapporté par Sahih al-Bukhari, le Prophète ﷺ a interprété le jardin comme le jardin de l’Islam et la prise ferme comme l’attachement solide à l’Islam jusqu’à la mort. Cette lecture appartient à une configuration de rêve très précise ; elle ne permet pas de transformer tout jardin ou toute poignée en symbole fixe.",
  },
  {
    id: "ship-deliverance-classical",
    sourceIds: ["baghawi-sharh-sunna-12-220"],
    level: "CLASSICAL_INTERPRETATION",
    matches: (text) => has(text, /\b(bateau|navire|vaisseau|barque)\b/i),
    title: "Piste classique documentée : le navire",
    buildText: () =>
      "Al-Baghawi cite, parmi les exemples de ta‘bîr tirés du Coran, le navire comme pouvant évoquer le salut ou la délivrance, en référence au récit où Allah sauve Nûh et les gens de l’arche. C’est une piste classique documentée, pas une conclusion automatique sur votre rêve : le déroulement du rêve, votre situation et les autres éléments restent déterminants.",
  },
  {
    id: "rope-covenant-classical",
    sourceIds: ["baghawi-sharh-sunna-12-220"],
    level: "CLASSICAL_INTERPRETATION",
    matches: (text) => has(text, /\b(corde|cordon|câble|cable|lien)\b/i),
    title: "Piste classique documentée : la corde",
    buildText: () =>
      "Dans Sharh al-Sunnah, al-Baghawi donne la corde comme exemple d’une interprétation possible par le Coran, pouvant renvoyer à un engagement, un lien ou une sécurité. Cette indication relève d’une méthode classique et ne vaut pas comme dictionnaire fixe : la même image peut prendre un autre sens selon la personne et le contexte.",
  },
  {
    id: "stone-hardness-classical",
    sourceIds: ["baghawi-sharh-sunna-12-220"],
    level: "CLASSICAL_INTERPRETATION",
    matches: (text) => has(text, /\b(pierre|pierres|rocher|rochers|caillou|cailloux)\b/i),
    title: "Piste classique documentée : la pierre",
    buildText: () =>
      "Al-Baghawi mentionne la pierre parmi les exemples d’interprétation par analogie coranique, où elle peut évoquer la dureté. OUMMAH présente uniquement cette possibilité classique : elle ne permet pas d’accuser une personne ni d’affirmer que c’est le sens de votre rêve sans éléments contextuels beaucoup plus forts.",
  },
];

function normalize(text: string) {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim();
}

/**
 * Returns only reviewed precedents that are relevant to the narrative.
 * A frightening/disliked dream does not suppress relevant reviewed precedents.
 * Matches remain explicitly contextual and non-universal; the guidance layer
 * still gives Prophetic conduct for a disliked dream priority.
 */
export function findDreamInterpretationMatches(input: DreamInterpretationInput): DreamInterpretationMatch[] {
  const text = normalize(input.dreamText);
  if (!text) return [];

  return RULES.filter((rule) => rule.matches(text))
    .slice(0, 2)
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      text: rule.buildText(),
      level: rule.level,
      sourceIds: rule.sourceIds,
    }));
}
