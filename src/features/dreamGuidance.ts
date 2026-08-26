import type { DreamEvidenceLevel } from "./dreamEvidence";
import { findDreamInterpretationMatches } from "./dreamInterpretationCorpus";

export type DreamEmotion = "peace" | "neutral" | "fear";
export type EvidenceLevel = DreamEvidenceLevel;

export type DreamGuidanceInput = {
  dreamText: string;
  emotion: DreamEmotion;
  recentEcho: boolean;
  recurring: boolean;
  decisionLinked: boolean;
  contextNote?: string;
};

export type GuidanceSection = { title: string; text: string; level: EvidenceLevel; sourceIds?: string[] };
export type DreamGuidance = { headline: string; badge: string; sections: GuidanceSection[]; bottomLine: string };

type Detail = { label: string; patterns: RegExp[] };
const DETAILS: Detail[] = [
  { label: "une maison", patterns: [/\bmaison\b/i] },
  { label: "un appartement", patterns: [/\bappartement\b/i] },
  { label: "une chambre", patterns: [/\bchambre\b/i] },
  { label: "une pièce", patterns: [/\bpi[eè]ce\b/i] },
  { label: "un serpent", patterns: [/\bserpent(?:s)?\b/i] },
  { label: "un chien", patterns: [/\bchien(?:s)?\b/i] },
  { label: "un chat", patterns: [/\bchat(?:s)?\b/i] },
  { label: "un oiseau", patterns: [/\boiseau(?:x)?\b/i] },
  { label: "votre mère", patterns: [/\bm[eè]re\b/i] },
  { label: "votre père", patterns: [/\bp[eè]re\b/i] },
  { label: "votre frère", patterns: [/\bfr[eè]re\b/i] },
  { label: "votre sœur", patterns: [/\bs[oœ]ur\b/i] },
  { label: "de l’eau", patterns: [/\beau\b/i] },
  { label: "la mer", patterns: [/\bmer\b/i] },
  { label: "de la pluie", patterns: [/\bpluie\b/i] },
  { label: "une rivière", patterns: [/\brivi[eè]re\b/i] },
  { label: "une voiture", patterns: [/\bvoiture\b/i] },
  { label: "un train", patterns: [/\btrain\b/i] },
  { label: "un avion", patterns: [/\bavion\b/i] },
  { label: "un voyage", patterns: [/\bvoyage\b/i] },
  { label: "du lait", patterns: [/\blait\b/i] },
  { label: "du miel", patterns: [/\bmiel\b/i] },
  { label: "une chemise", patterns: [/\b(chemise|tunique|qamis|qam[iî]s)\b/i] },
  { label: "un jardin", patterns: [/\b(jardin|jardins|verger|prairie)\b/i] },
  { label: "une corde", patterns: [/\b(corde|cordon|câble|cable)\b/i] },
  { label: "un bateau", patterns: [/\b(bateau|navire|vaisseau|barque)\b/i] },
  { label: "une pierre", patterns: [/\b(pierre|pierres|rocher|rochers|caillou|cailloux)\b/i] },
];

function detectedDetails(text: string) {
  return DETAILS.filter((detail) => detail.patterns.some((pattern) => pattern.test(text)))
    .map((detail) => detail.label)
    .slice(0, 4);
}

function joinFrench(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function detectedMilkQualifiers(text: string) {
  if (!/\blait\b/i.test(text)) return [];

  const qualifiers: string[] = [];
  if (/\b(amer|am[eè]re|amers|am[eè]res|amertume)\b/i.test(text)) {
    qualifiers.push("le goût amer du lait");
  }
  if (/(?:n['’ ]?(?:arrivais|arrivait|arrive|arrivons|arrivez|arrivaient)\s+pas\s+[àa]\s+(?:le\s+)?finir|impossible\s+(?:de|[àa])\s+(?:le\s+)?finir|ne\s+(?:pouvais|pouvait|peux|peut|pouvions|pouviez|pouvaient)\s+pas\s+(?:le\s+)?finir)/i.test(text)) {
    qualifiers.push("le fait de ne pas parvenir à le finir");
  }
  return qualifiers;
}

function narrativeOpening(input: DreamGuidanceInput, details: string[]) {
  const emotion = input.emotion === "fear"
    ? "Vous précisez que ce rêve vous a laissé inquiet, troublé ou effrayé au réveil."
    : input.emotion === "peace"
      ? "Vous précisez vous être réveillé dans un état plutôt apaisé."
      : "Vous décrivez un réveil plutôt neutre.";

  if (!details.length) {
    return `Votre récit a bien été pris en compte dans son ensemble. ${emotion}`;
  }
  return `Dans votre rêve, vous évoquez notamment ${joinFrench(details)}. ${emotion}`;
}

/**
 * Local, bounded reading engine. It reads the narrative to personalize the
 * explanation, but never maps a symbol to a religious meaning. Religious claims
 * remain limited to the reviewed corpus; narrative details are observations only.
 */
export function analyzeDreamContext(input: DreamGuidanceInput): DreamGuidance {
  const sections: GuidanceSection[] = [];
  const details = detectedDetails(input.dreamText);
  const milkQualifiers = detectedMilkQualifiers(input.dreamText);
  const interpretationMatches = findDreamInterpretationMatches({ dreamText: input.dreamText, emotion: input.emotion });

  sections.push({
    title: "Lecture de votre récit",
    text: narrativeOpening(input, details),
    level: "CONTEXT_DEPENDENT",
  });

  if (input.recentEcho) {
    sections.push({
      title: "Votre vécu récent compte ici",
      text: `Vous indiquez qu’une préoccupation ou un événement récent fait écho à ce rêve${input.contextNote?.trim() ? ", et vous avez ajouté un contexte personnel" : ""}. Sahih Muslim mentionne parmi les trois catégories de rêves ce qui provient de ce que la personne se dit à elle-même. Vos préoccupations peuvent donc avoir influencé le rêve, sans qu’on puisse l’affirmer avec certitude ni en déduire un message à suivre.`,
      level: "AUTHENTIC_SOURCE",
      sourceIds: ["muslim-2263a"],
    });
  } else if (input.contextNote?.trim()) {
    sections.push({
      title: "Votre situation actuelle",
      text: "Le contexte que vous avez donné aide à éviter une lecture déconnectée de votre situation. Il reste toutefois un élément de contexte : ce n’est ni une preuve religieuse ni une clé automatique d’interprétation.",
      level: "CONTEXT_DEPENDENT",
    });
  }

  if (interpretationMatches.length) {
    interpretationMatches.forEach((match) => {
      sections.push({
        title: match.title,
        text: match.text,
        level: match.level,
        sourceIds: match.sourceIds,
      });
    });

    if (milkQualifiers.length && interpretationMatches.some((match) => match.id === "milk-knowledge")) {
      sections.push({
        title: "Les détails particuliers de votre récit",
        text: `OUMMAH a également pris en compte ${joinFrench(milkQualifiers)}. Le précédent authentique cité concerne le fait de boire du lait dans une vision précise ; les sources retenues dans ce module ne permettent pas d’attribuer une signification établie à ${joinFrench(milkQualifiers)}. Ces détails restent donc des éléments de votre récit et de votre contexte, sans interprétation ajoutée.`,
        level: "CONTEXT_DEPENDENT",
      });
    }

    if (details.length) {
      sections.push({
        title: "Ce qui reste dépendant de votre contexte",
        text: `Le fait qu’une source contienne un précédent ou une piste classique ne transforme pas ${joinFrench(details)} en symboles fixes. OUMMAH les confronte à votre récit et à votre situation ; s’il manque des éléments, aucune conclusion supplémentaire n’est ajoutée.`,
        level: "CONTEXT_DEPENDENT",
        sourceIds: ["nafrawi-fawakih-2-353", "bukhari-7046"],
      });
    }
  } else if (details.length) {
    sections.push({
      title: "Ce qu’on peut — et ne peut pas — en déduire",
      text: `Concernant ${joinFrench(details)}, le corpus vérifié actuellement intégré à OUMMAH ne fournit pas de base suffisamment solide pour leur attribuer une signification précise dans votre situation. Il serait donc trompeur de transformer ces éléments en symboles fixes ou en prédiction.`,
      level: "INSUFFICIENT_BASIS",
    });
  }

  if (input.emotion === "fear") {
    sections.push({
      title: "La conduite la mieux établie",
      text: "Puisque ce rêve vous a effrayé ou fortement troublé, la Sunna recommande de chercher refuge auprès d’Allah contre son mal et contre Shaytân, de souffler/crachoter légèrement à gauche trois fois et de ne pas raconter le rêve déplaisant. Sahih Muslim mentionne aussi le fait de se lever pour prier.",
      level: "AUTHENTIC_SOURCE",
      sourceIds: ["bukhari-7044", "muslim-2263a"],
    });
  } else if (input.emotion === "peace") {
    sections.push({
      title: "À propos de votre ressenti",
      text: "La Sunna reconnaît l’existence de bonnes visions et indique qu’une vision appréciée peut être racontée à une personne aimée. Un réveil apaisé ne suffit toutefois pas, à lui seul, à déclarer que votre rêve est une bonne vision ni à lui fixer un sens.",
      level: "AUTHENTIC_SOURCE",
      sourceIds: ["bukhari-7044", "muslim-2263a"],
    });
  } else {
    sections.push({
      title: "À propos de votre ressenti",
      text: "La Sunna distingue trois catégories générales de rêves. Un réveil neutre ne permet pas, à lui seul, de classer avec certitude votre récit dans l’une d’elles.",
      level: "AUTHENTIC_SOURCE",
      sourceIds: ["muslim-2263a"],
    });
  }

  if (input.recurring) {
    sections.push({
      title: "Si ce rêve revient",
      text: "Le caractère récurrent mérite d’être noté, mais sa répétition ne suffit pas à établir une signification précise. OUMMAH n’augmente donc pas artificiellement la certitude d’une interprétation parce qu’un rêve se répète.",
      level: "CONTEXT_DEPENDENT",
    });
  }

  if (input.decisionLinked) {
    sections.push({
      title: "Pour votre décision",
      text: "Ce rêve ne constitue pas une preuve permettant de choisir une option, d’établir une obligation ou une interdiction, ni de connaître l’avenir. Une décision importante doit être évaluée sur ses raisons réelles et, lorsqu’elle est religieuse, à partir des sources et d’un avis qualifié approprié.",
      level: "INSUFFICIENT_BASIS",
    });
  }

  const headline = input.emotion === "fear"
    ? "Votre récit est pris en compte, sans lui imposer un sens"
    : input.recentEcho
      ? "Votre rêve se lit d’abord à la lumière de votre contexte"
      : input.emotion === "peace"
        ? "Un rêve apaisant, sans signification imposée"
        : "Une lecture contextualisée, sans décodage automatique";

  const bottomLine = input.decisionLinked
    ? "En bref : votre récit et votre contexte sont pris en compte, mais ce rêve ne doit pas décider à votre place."
    : details.length
      ? "En bref : votre ressenti et votre situation actuelle sont à prendre en compte, mais aucune signification certaine ne peut être attribuée aux éléments de ce rêve à partir des sources retenues."
      : "En bref : votre récit, votre ressenti et votre contexte sont pris en compte, sans inventer de signification lorsque les sources ne permettent pas d’en établir une.";

  return {
    headline,
    badge: input.emotion === "fear" ? "REPÈRE AUTHENTIQUE" : input.recentEcho ? "RÉCIT + CONTEXTE" : "LECTURE ENCADRÉE",
    sections,
    bottomLine,
  };
}
