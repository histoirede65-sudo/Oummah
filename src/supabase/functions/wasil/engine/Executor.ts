import type { WasilBrainPlan, WasilBrainStep } from "./Brain.ts";
import type {
  AggregatedKnowledgeFact,
  AggregatedKnowledgeReference,
  KnowledgeDossier,
} from "./KnowledgeAggregator.ts";
import type { WasilSkillId } from "./SkillPlanner.ts";

export type WasilExecutionStepStatus =
  | "fulfilled"
  | "missing_evidence"
  | "deferred_to_web"
  | "deferred_to_app"
  | "planning_only";

export type WasilExecutionStepResult = {
  order: number;
  skill: WasilSkillId;
  required: boolean;
  status: WasilExecutionStepStatus;
  evidenceCount: number;
  referenceIds: string[];
  note: string;
};

export type WasilExecutionContext = {
  subject: string | null;
  summaries: string[];
  facts: AggregatedKnowledgeFact[];
  references: AggregatedKnowledgeReference[];
  cautions: string[];
};

export type WasilExecutionResult = {
  version: "wasil-v4-executor-shadow-1";
  status: "ready" | "partial" | "blocked";
  executedSteps: WasilExecutionStepResult[];
  context: WasilExecutionContext;
  requiredSkillsSatisfied: boolean;
  shouldUseWeb: boolean;
  shouldAskClarification: boolean;
  parallelGroups: WasilSkillId[][];
  generatedAt: string;
};

export type WasilExecutorInput = {
  brainPlan: WasilBrainPlan | null;
  knowledgeDossier: KnowledgeDossier | null;
};

const APP_ACTION_SKILLS = new Set<WasilSkillId>([
  "qibla",
  "mosque",
  "reminder",
  "audio",
  "progress",
]);

const PLANNING_SKILLS = new Set<WasilSkillId>([
  "travel",
  "goals",
  "prayer",
]);

function referencesForSkill(
  skill: WasilSkillId,
  dossier: KnowledgeDossier | null,
): AggregatedKnowledgeReference[] {
  if (!dossier) return [];
  if (skill === "quran" || skill === "tafsir" || skill === "sirah") {
    return dossier.references.filter((reference) => reference.repository === "quran");
  }
  if (skill === "hadith" || skill === "dua") {
    return dossier.references.filter((reference) => reference.repository === "hadith");
  }
  if (skill === "companion") {
    return dossier.references.filter((reference) => reference.repository === "companions");
  }
  return [];
}

function factsForSkill(
  skill: WasilSkillId,
  dossier: KnowledgeDossier | null,
): AggregatedKnowledgeFact[] {
  if (!dossier) return [];
  if (skill === "quran" || skill === "tafsir" || skill === "sirah") {
    return dossier.facts.filter((fact) => fact.repository === "quran");
  }
  if (skill === "hadith" || skill === "dua") {
    return dossier.facts.filter((fact) => fact.repository === "hadith");
  }
  if (skill === "companion") {
    return dossier.facts.filter((fact) => fact.repository === "companions");
  }
  return [];
}

function executeStep(
  step: WasilBrainStep,
  brainPlan: WasilBrainPlan,
  dossier: KnowledgeDossier | null,
): WasilExecutionStepResult {
  const references = referencesForSkill(step.skill, dossier);
  const facts = factsForSkill(step.skill, dossier);
  const evidenceCount = references.length + facts.length;

  if (APP_ACTION_SKILLS.has(step.skill)) {
    return {
      order: step.order,
      skill: step.skill,
      required: step.required,
      status: "deferred_to_app",
      evidenceCount: 0,
      referenceIds: [],
      note: "Action applicative volontairement non exécutée en mode fantôme.",
    };
  }

  if (PLANNING_SKILLS.has(step.skill)) {
    return {
      order: step.order,
      skill: step.skill,
      required: step.required,
      status: "planning_only",
      evidenceCount,
      referenceIds: references.map((reference) => reference.id),
      note: "Étape conservée comme instruction de planification, sans effet de bord.",
    };
  }

  if (evidenceCount > 0) {
    return {
      order: step.order,
      skill: step.skill,
      required: step.required,
      status: "fulfilled",
      evidenceCount,
      referenceIds: references.map((reference) => reference.id),
      note: "Contexte local disponible pour cette compétence.",
    };
  }

  const shouldDeferToWeb =
    brainPlan.evidencePolicy === "web_required" ||
    brainPlan.evidencePolicy === "local_then_web";

  return {
    order: step.order,
    skill: step.skill,
    required: step.required,
    status: shouldDeferToWeb ? "deferred_to_web" : "missing_evidence",
    evidenceCount: 0,
    referenceIds: [],
    note: shouldDeferToWeb
      ? "Preuve locale absente; recherche externe requise lors d’une future activation production."
      : "Preuve locale absente pour cette compétence.",
  };
}

function createParallelGroups(steps: WasilBrainStep[]): WasilSkillId[][] {
  const retrieval: WasilSkillId[] = [];
  const planning: WasilSkillId[] = [];
  const appActions: WasilSkillId[] = [];

  for (const step of steps) {
    if (APP_ACTION_SKILLS.has(step.skill)) appActions.push(step.skill);
    else if (PLANNING_SKILLS.has(step.skill)) planning.push(step.skill);
    else retrieval.push(step.skill);
  }

  return [retrieval, planning, appActions].filter((group) => group.length > 0);
}

/**
 * Shadow executor for Wasil V4.
 * It consumes the Brain contract and the already-built knowledge dossier.
 * It never calls a repository, OpenAI, the web, or an application action.
 * Its role is to prove that the plan can be executed deterministically before
 * any production routing is enabled.
 */
export function executeWasilBrainPlan(
  input: WasilExecutorInput,
): WasilExecutionResult | null {
  const brainPlan = input.brainPlan;
  if (!brainPlan) return null;

  const executedSteps = brainPlan.executionSteps.map((step) =>
    executeStep(step, brainPlan, input.knowledgeDossier)
  );

  const requiredSteps = executedSteps.filter((step) => step.required);
  const requiredSkillsSatisfied = requiredSteps.every((step) =>
    step.status === "fulfilled" ||
    step.status === "planning_only" ||
    step.status === "deferred_to_app"
  );
  const shouldUseWeb = executedSteps.some((step) =>
    step.status === "deferred_to_web"
  );
  const shouldAskClarification = brainPlan.shouldAskClarification;

  const status: WasilExecutionResult["status"] = shouldAskClarification
    ? "blocked"
    : requiredSkillsSatisfied && !shouldUseWeb
    ? "ready"
    : "partial";

  return {
    version: "wasil-v4-executor-shadow-1",
    status,
    executedSteps,
    context: {
      subject: input.knowledgeDossier?.subject ?? null,
      summaries: input.knowledgeDossier?.summaries ?? [],
      facts: input.knowledgeDossier?.facts ?? [],
      references: input.knowledgeDossier?.references ?? [],
      cautions: input.knowledgeDossier?.cautions ?? [],
    },
    requiredSkillsSatisfied,
    shouldUseWeb,
    shouldAskClarification,
    parallelGroups: createParallelGroups(brainPlan.executionSteps),
    generatedAt: new Date().toISOString(),
  };
}
