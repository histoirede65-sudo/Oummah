import type { EntityResolution } from "./EntityResolver.ts";
import type { KnowledgeDossier } from "./KnowledgeAggregator.ts";
import type { SkillPlan, WasilSkillId } from "./SkillPlanner.ts";

export type WasilResponseStyle =
  | "direct"
  | "pedagogical"
  | "comparative"
  | "supportive"
  | "action_oriented"
  | "programmatic";

export type WasilEvidencePolicy =
  | "local_sufficient"
  | "local_then_web"
  | "web_required"
  | "clarification_required";

export type WasilBrainStep = {
  order: number;
  skill: WasilSkillId;
  objective: string;
  required: boolean;
};

export type WasilBrainPlan = {
  version: "wasil-v4-brain-shadow-1";
  intent: SkillPlan["intent"];
  responseStyle: WasilResponseStyle;
  evidencePolicy: WasilEvidencePolicy;
  executionSteps: WasilBrainStep[];
  shouldAskClarification: boolean;
  canAnswerFromLocalKnowledge: boolean;
  requiresHumanOrProfessionalCaution: boolean;
  confidence: number;
  reasons: string[];
};


export type WasilReasoningDepth = "short" | "standard" | "detailed";

export type WasilProductionExecutionPlan = {
  version: "wasil-v4-execution-plan-1";
  category:
    | "quran_overview"
    | "prophet_biography"
    | "fiqh"
    | "aqidah"
    | "hadith"
    | "dua"
    | "wellbeing"
    | "general";
  reasoningDepth: WasilReasoningDepth;
  responseStyle: WasilResponseStyle;
  evidencePolicy: WasilEvidencePolicy;
  shouldUseWeb: boolean;
  shouldAskClarification: boolean;
  requiresHumanOrProfessionalCaution: boolean;
  confidence: number;
  fallbackReason: string | null;
};

export type WasilBrainInput = {
  question: string;
  entityResolution: EntityResolution | null;
  knowledgeDossier: KnowledgeDossier | null;
  skillPlan: SkillPlan | null;
};

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSensitivePersonalApplication(question: string): boolean {
  return /\b(?:divorce|heritage|succession|contrat|credit|riba|maladie|traitement|grossesse|jeune.*malade|takfir|suicide|automutilation|danger immediat)\b/u.test(
    normalize(question),
  );
}

function chooseResponseStyle(
  question: string,
  skillPlan: SkillPlan,
): WasilResponseStyle {
  const normalized = normalize(question);

  if (/\b(?:triste|angoisse|anxiete|peur|souffrance|deprime)\b/u.test(normalized)) {
    return "supportive";
  }
  if (skillPlan.intent === "comparison") return "comparative";
  if (skillPlan.intent === "planning") return "programmatic";
  if (skillPlan.intent === "action") return "action_oriented";
  if (skillPlan.intent === "explanation") return "pedagogical";
  return "direct";
}

function chooseEvidencePolicy(
  skillPlan: SkillPlan,
  dossier: KnowledgeDossier | null,
): WasilEvidencePolicy {
  if (skillPlan.shouldAskClarification) return "clarification_required";

  const requiredSkills = skillPlan.skills.filter((skill) => skill.required);
  const repositories = new Set(dossier?.repositoriesConsulted ?? []);
  const hasLocalEvidence = Boolean(
    dossier && dossier.completeness !== "empty" && dossier.references.length > 0,
  );

  const requiresHadith = requiredSkills.some((skill) => skill.id === "hadith");
  const requiresFiqh = requiredSkills.some((skill) => skill.id === "fiqh");
  const requiresScholar = requiredSkills.some((skill) => skill.id === "scholar");
  const requiresCompanion = requiredSkills.some((skill) => skill.id === "companion");

  if (requiresFiqh || requiresScholar) return "web_required";
  if (requiresHadith && !repositories.has("hadith")) return "web_required";
  if (requiresCompanion && !repositories.has("companions")) return "web_required";
  if (hasLocalEvidence && dossier?.completeness === "substantial") {
    return "local_sufficient";
  }
  return "local_then_web";
}

function objectiveForSkill(skill: WasilSkillId): string {
  const objectives: Record<WasilSkillId, string> = {
    quran: "Identifier et vérifier les passages coraniques directement utiles.",
    hadith: "Retrouver les hadiths pertinents avec leur recueil, référence et degré lorsqu’il est disponible.",
    tafsir: "Expliquer le passage à partir d’un tafsir fiable sans confondre texte révélé et commentaire.",
    companion: "Établir une biographie prudente à partir de faits largement attestés.",
    scholar: "Identifier le savant et vérifier les informations biographiques ou doctrinales nécessaires.",
    sirah: "Reconstituer les étapes utiles du récit prophétique dans un ordre clair.",
    dua: "Sélectionner une invocation authentifiée adaptée au besoin exprimé.",
    fiqh: "Présenter la règle générale, les preuves et les divergences reconnues sans transformer la réponse en fatwa personnelle.",
    prayer: "Déterminer les règles ou informations de prière réellement concernées.",
    qibla: "Préparer une orientation vers la fonctionnalité Qibla sans exécuter d’action en mode fantôme.",
    mosque: "Préparer une recherche de mosquée sans accéder à la position ni déclencher d’action en mode fantôme.",
    travel: "Identifier les besoins religieux liés au voyage.",
    goals: "Transformer la demande en objectif spirituel réaliste et progressif.",
    reminder: "Préparer un rappel descriptif sans le programmer en mode fantôme.",
    audio: "Préparer une recommandation ou une action audio sans lancer la lecture.",
    progress: "Définir les éléments mesurables du suivi et de la révision.",
  };
  return objectives[skill];
}

/**
 * Deterministic decision layer for Wasil V4 shadow mode.
 * It never calls OpenAI, never performs an app action and never changes the
 * production response. It converts the existing skill plan and knowledge
 * dossier into an explicit execution contract that can be evaluated in logs.
 */
export function buildWasilBrainPlan(input: WasilBrainInput): WasilBrainPlan | null {
  if (!input.skillPlan) return null;

  const evidencePolicy = chooseEvidencePolicy(
    input.skillPlan,
    input.knowledgeDossier,
  );
  const shouldAskClarification =
    input.skillPlan.shouldAskClarification ||
    evidencePolicy === "clarification_required";
  const canAnswerFromLocalKnowledge =
    evidencePolicy === "local_sufficient" && !shouldAskClarification;

  const executionSteps = input.skillPlan.skills.map((skill, index) => ({
    order: index + 1,
    skill: skill.id,
    objective: objectiveForSkill(skill.id),
    required: skill.required,
  }));

  const reasons: string[] = [];
  if (input.entityResolution?.candidate) {
    reasons.push(
      `Entité résolue: ${input.entityResolution.candidate.displayText}`,
    );
  }
  if (input.knowledgeDossier) {
    reasons.push(
      `Dossier documentaire: ${input.knowledgeDossier.completeness}`,
    );
    reasons.push(
      `Référentiels disponibles: ${input.knowledgeDossier.repositoriesConsulted.join(", ") || "aucun"}`,
    );
  }
  reasons.push(`Politique documentaire: ${evidencePolicy}`);

  const evidenceConfidence = input.knowledgeDossier?.confidence ?? 0;
  const confidence = clamp(
    input.skillPlan.confidence * 0.65 + evidenceConfidence * 0.35,
  );

  return {
    version: "wasil-v4-brain-shadow-1",
    intent: input.skillPlan.intent,
    responseStyle: chooseResponseStyle(input.question, input.skillPlan),
    evidencePolicy,
    executionSteps,
    shouldAskClarification,
    canAnswerFromLocalKnowledge,
    requiresHumanOrProfessionalCaution:
      detectSensitivePersonalApplication(input.question),
    confidence,
    reasons,
  };
}


function categoryFromBrainPlan(
  plan: WasilBrainPlan,
): WasilProductionExecutionPlan["category"] {
  const skills = new Set(plan.executionSteps.map((step) => step.skill));
  if (skills.has("fiqh") || skills.has("prayer")) return "fiqh";
  if (skills.has("hadith")) return "hadith";
  if (skills.has("dua")) return "dua";
  if (skills.has("companion") || skills.has("sirah") || skills.has("scholar")) {
    return "prophet_biography";
  }
  if (skills.has("quran") || skills.has("tafsir")) return "quran_overview";
  if (plan.responseStyle === "supportive") return "wellbeing";
  return "general";
}

function reasoningDepthFromBrainPlan(
  question: string,
  mode: "standard" | "deep",
  plan: WasilBrainPlan,
): WasilReasoningDepth {
  const normalized = normalize(question);
  if (/\b(?:bref|rapidement|en une phrase|resume|court)\b/u.test(normalized)) {
    return "short";
  }
  if (
    mode === "deep" ||
    plan.responseStyle === "comparative" ||
    plan.responseStyle === "programmatic" ||
    /\b(?:en detail|detaille|complet|approfondi|tout savoir|explique-moi tout)\b/u.test(normalized)
  ) {
    return "detailed";
  }
  return "standard";
}

/**
 * Converts the deterministic Brain plan into the small production contract
 * consumed by index.ts. It performs no I/O and is safe to bypass entirely.
 */
export function buildWasilProductionExecutionPlan(input: {
  question: string;
  mode: "standard" | "deep";
  brainPlan: WasilBrainPlan | null;
}): WasilProductionExecutionPlan | null {
  const plan = input.brainPlan;
  if (!plan) return null;

  return {
    version: "wasil-v4-execution-plan-1",
    category: categoryFromBrainPlan(plan),
    reasoningDepth: reasoningDepthFromBrainPlan(
      input.question,
      input.mode,
      plan,
    ),
    responseStyle: plan.responseStyle,
    evidencePolicy: plan.evidencePolicy,
    shouldUseWeb:
      plan.evidencePolicy === "web_required" ||
      plan.evidencePolicy === "local_then_web",
    shouldAskClarification: plan.shouldAskClarification,
    requiresHumanOrProfessionalCaution:
      plan.requiresHumanOrProfessionalCaution,
    confidence: plan.confidence,
    fallbackReason: null,
  };
}
